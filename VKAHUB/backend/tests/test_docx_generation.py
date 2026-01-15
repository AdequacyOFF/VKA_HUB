"""
Tests for DOCX generation and XML sanitization

These tests ensure that generated DOCX files:
1. Do not contain illegal XML control characters
2. Have correctly formatted XML attributes
3. Do not have duplicate attributes (critical - causes Word repair prompt)
4. Open in Microsoft Word without repair prompts
"""

import pytest
import io
import zipfile
import re
from xml.etree import ElementTree as ET
from datetime import datetime, timedelta

from app.infrastructure.storage.template_report_generator import (
    sanitize_xml_text,
    sanitize_filename,
    _set_xml_space_preserve,
    _fix_xml_serialization,
    _fix_mc_ignorable,
    _get_rpr_insert_index,
    _XML_NS,
    _RPR_ELEMENT_ORDER,
    _EXTENDED_NAMESPACES,
)


class TestSanitizeXmlText:
    """Unit tests for sanitize_xml_text function"""

    def test_none_input(self):
        """Should return empty string for None"""
        assert sanitize_xml_text(None) == ""

    def test_empty_string(self):
        """Should return empty string for empty input"""
        assert sanitize_xml_text("") == ""

    def test_normal_text_unchanged(self):
        """Normal text should pass through unchanged"""
        text = "Hello, World! Привет мир! 12345"
        assert sanitize_xml_text(text) == text

    def test_preserves_legal_whitespace(self):
        """Tab, newline, carriage return should be preserved"""
        text = "Line1\tTabbed\nLine2\rLine3"
        assert sanitize_xml_text(text) == text

    def test_removes_null_character(self):
        """NULL (0x00) should be removed"""
        text = "Hello\x00World"
        assert sanitize_xml_text(text) == "HelloWorld"

    def test_removes_control_chars_0x01_to_0x08(self):
        """Characters 0x01-0x08 should be removed"""
        text = "A\x01B\x02C\x03D\x04E\x05F\x06G\x07H\x08I"
        assert sanitize_xml_text(text) == "ABCDEFGHI"

    def test_removes_vertical_tab(self):
        """Vertical tab (0x0B) should be removed"""
        text = "Hello\x0bWorld"
        assert sanitize_xml_text(text) == "HelloWorld"

    def test_removes_form_feed(self):
        """Form feed (0x0C) should be removed"""
        text = "Page1\x0cPage2"
        assert sanitize_xml_text(text) == "Page1Page2"

    def test_removes_control_chars_0x0e_to_0x1f(self):
        """Characters 0x0E-0x1F should be removed"""
        text = "Start\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1fEnd"
        assert sanitize_xml_text(text) == "StartEnd"

    def test_mixed_valid_and_invalid(self):
        """Should handle mixed content correctly"""
        # Tab (0x09) is valid, NULL (0x00) is not
        text = "Column1\tColumn2\x00Column3"
        assert sanitize_xml_text(text) == "Column1\tColumn2Column3"

    def test_cyrillic_with_control_chars(self):
        """Should preserve Cyrillic while removing control chars"""
        text = "Рядовой\x00Иванов\x0bИ.И."
        assert sanitize_xml_text(text) == "РядовойИвановИ.И."

    def test_integer_input(self):
        """Should handle integer input by converting to string"""
        assert sanitize_xml_text(123) == "123"

    def test_float_input(self):
        """Should handle float input by converting to string"""
        result = sanitize_xml_text(12.5)
        assert "12" in result and "5" in result

    def test_unicode_special_chars_preserved(self):
        """Unicode characters outside control range should be preserved"""
        text = "Emoji: 🎉 Symbols: © ® ™ Accents: é ñ ü"
        assert sanitize_xml_text(text) == text

    def test_multiple_control_chars_in_sequence(self):
        """Multiple consecutive control chars should all be removed"""
        text = "Start\x00\x01\x02\x03\x04End"
        assert sanitize_xml_text(text) == "StartEnd"


class TestSanitizeFilename:
    """Unit tests for sanitize_filename function"""

    def test_normal_filename(self):
        """Normal filename should pass through with minimal changes"""
        assert sanitize_filename("report") == "report"

    def test_removes_invalid_chars(self):
        """Should remove/replace Windows-invalid characters"""
        assert sanitize_filename("file<>:name") == "file_name"

    def test_handles_cyrillic(self):
        """Should handle Cyrillic characters"""
        result = sanitize_filename("Рапорт_Хакатон_Тест")
        assert "Рапорт" in result

    def test_truncates_long_names(self):
        """Should truncate names exceeding max_length"""
        long_name = "a" * 200
        result = sanitize_filename(long_name, max_length=100)
        assert len(result) <= 100

    def test_empty_input_returns_default(self):
        """Empty input should return 'report'"""
        assert sanitize_filename("") == "report"


# Module-level patterns for DOCX validation
# Pattern for illegal XML chars
ILLEGAL_CHARS_RE = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')

# Pattern for incorrectly namespaced attributes
BAD_ATTR_RE = re.compile(
    r'\{http://schemas\.openxmlformats\.org[^}]+\}(ascii|hAnsi|cs|val)='
)


class TestDocxValidation:
    """Tests for DOCX structural validation"""

    def test_sanitize_function_covers_all_illegal_chars(self):
        """Verify sanitize function removes all illegal char ranges"""
        # Build string with all illegal chars
        illegal_chars = ''.join(chr(c) for c in range(0x00, 0x09))  # 0x00-0x08
        illegal_chars += '\x0b\x0c'  # 0x0B, 0x0C
        illegal_chars += ''.join(chr(c) for c in range(0x0e, 0x20))  # 0x0E-0x1F

        test_string = f"START{illegal_chars}END"
        result = sanitize_xml_text(test_string)

        # Should only have START and END
        assert result == "STARTEND"
        # Verify no illegal chars remain
        assert ILLEGAL_CHARS_RE.search(result) is None

    def test_legal_whitespace_not_removed(self):
        """Verify legal whitespace chars are NOT removed"""
        # Tab (0x09), LF (0x0A), CR (0x0D) are legal
        text = "Tab:\tLF:\nCR:\r"
        result = sanitize_xml_text(text)
        assert '\t' in result
        assert '\n' in result
        assert '\r' in result


class TestDocxGeneratorIntegration:
    """Integration tests for TemplateReportGenerator (require template file)"""

    @pytest.fixture
    def sample_competition_data(self):
        """Sample competition data for testing"""
        return {
            'name': 'Test Competition',
            'type': 'hackathon',
            'organizer': 'Test Organizer',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=2)
        }

    @pytest.fixture
    def sample_registrations_clean(self):
        """Clean registration data without problematic characters"""
        return [{
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант'
                }
            ],
            'address': 'г. Санкт-Петербург, Лыжный пер., 4к3'
        }]

    @pytest.fixture
    def sample_registrations_with_control_chars(self):
        """Registration data containing problematic control characters"""
        return [{
            'members': [
                {
                    'rank': 'Рядовой\x00',  # NULL character
                    'last_name': 'Иванов\x0b',  # Vertical tab
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант\x1f'  # Unit separator
                }
            ],
            'address': 'г. Санкт-Петербург\x00, Лыжный пер.'
        }]

    def test_generator_import(self):
        """Verify TemplateReportGenerator can be imported"""
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )
        assert TemplateReportGenerator is not None

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_has_no_illegal_chars(
        self,
        sample_competition_data,
        sample_registrations_with_control_chars
    ):
        """
        Generated DOCX should not contain illegal XML characters
        even when input data contains them.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(
            sample_competition_data,
            sample_registrations_with_control_chars
        )

        # Extract and check document.xml
        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_xml = zf.read('word/document.xml').decode('utf-8')

            # Check for illegal characters
            matches = ILLEGAL_CHARS_RE.findall(doc_xml)
            assert len(matches) == 0, \
                f"Found illegal XML characters: {[hex(ord(c)) for c in matches]}"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_attributes_not_namespaced(
        self,
        sample_competition_data,
        sample_registrations_clean
    ):
        """
        Generated DOCX should not have namespaced attributes
        like {http://...}ascii which are invalid in OOXML.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(
            sample_competition_data,
            sample_registrations_clean
        )

        # Check document.xml for incorrectly namespaced attributes
        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_xml = zf.read('word/document.xml').decode('utf-8')

            matches = BAD_ATTR_RE.findall(doc_xml)
            assert len(matches) == 0, \
                f"Found incorrectly namespaced attributes: {matches}"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_is_valid_zip(self, sample_competition_data):
        """Generated DOCX should be a valid ZIP file"""
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(sample_competition_data, [])

        # Should not raise BadZipFile
        with zipfile.ZipFile(buffer, 'r') as zf:
            # Test ZIP integrity
            assert zf.testzip() is None

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_xml_is_well_formed(self, sample_competition_data):
        """All XML files in generated DOCX should be well-formed"""
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(sample_competition_data, [])

        with zipfile.ZipFile(buffer, 'r') as zf:
            for entry in zf.namelist():
                if entry.endswith('.xml') or entry.endswith('.rels'):
                    content = zf.read(entry)
                    # Should not raise ParseError
                    try:
                        ET.fromstring(content)
                    except ET.ParseError as e:
                        pytest.fail(f"Invalid XML in {entry}: {e}")


class TestXmlSpacePreserve:
    """Unit tests for _set_xml_space_preserve function"""

    def test_sets_attribute_on_empty_element(self):
        """Should set xml:space on element without attributes"""
        elem = ET.Element('t')
        _set_xml_space_preserve(elem)
        # Should have exactly one space-related attribute
        space_attrs = [k for k in elem.attrib if 'space' in k]
        assert len(space_attrs) == 1

    def test_does_not_duplicate_existing_attribute(self):
        """Should NOT add duplicate if xml:space already exists"""
        elem = ET.Element('t')
        elem.set('{http://schemas.openxmlformats.org/XML/1998/namespace}space', 'preserve')
        _set_xml_space_preserve(elem)
        # Should still have exactly one space attribute
        space_attrs = [k for k in elem.attrib if 'space' in k]
        assert len(space_attrs) == 1

    def test_does_not_add_when_space_attr_exists(self):
        """Should NOT add if any space attribute already present"""
        elem = ET.Element('t')
        elem.set('space', 'preserve')  # Non-namespaced form
        _set_xml_space_preserve(elem)
        # Should still have only the original
        assert len(elem.attrib) == 1


class TestFixXmlSerialization:
    """Unit tests for _fix_xml_serialization function"""

    def test_removes_duplicate_space_attributes(self):
        """Should remove duplicate xml:space/ns#:space attributes"""
        # This is the pattern that was causing Word repair prompts
        broken_xml = b'<w:t xml:space="preserve" ns3:space="preserve">text</w:t>'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')
        # Should have exactly one space="preserve"
        assert decoded.count('space="preserve"') == 1

    def test_converts_ns_prefixed_space_to_xml(self):
        """Should convert ns#:space to xml:space"""
        broken_xml = b'<w:t ns3:space="preserve">text</w:t>'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')
        assert 'xml:space="preserve"' in decoded
        assert 'ns3:space' not in decoded

    def test_fixes_content_types_namespace_prefix(self):
        """Should remove ns0 prefix from Content_Types elements"""
        broken_xml = b'<ns0:Types xmlns:ns0="http://example.com"><ns0:Default /></ns0:Types>'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')
        assert '<Types' in decoded
        assert '</Types>' in decoded
        assert '<Default' in decoded
        assert '<ns0:Types' not in decoded

    def test_preserves_valid_xml(self):
        """Should not break already-valid XML"""
        valid_xml = b'<w:t xml:space="preserve">Hello World</w:t>'
        fixed = _fix_xml_serialization(valid_xml)
        assert b'Hello World' in fixed
        assert fixed.count(b'space="preserve"') == 1

    def test_adds_w_prefix_to_unprefixed_ooxml_attributes(self):
        """
        CRITICAL: Should add w: prefix to OOXML attributes that need it.

        This is the ROOT CAUSE of Word repair prompts - attributes like
        ascii, hAnsi, cs, val on w: elements MUST have the w: prefix.
        """
        # ElementTree outputs attributes without prefix
        broken_xml = b'<w:rFonts ascii="Times New Roman" hAnsi="Times New Roman" cs="Times New Roman" />'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')

        # All attributes should now have w: prefix
        assert 'w:ascii="Times New Roman"' in decoded
        assert 'w:hAnsi="Times New Roman"' in decoded
        assert 'w:cs="Times New Roman"' in decoded
        # Should NOT have unprefixed versions
        assert ' ascii="' not in decoded  # Note space before to avoid matching w:ascii

    def test_adds_w_prefix_to_val_attribute(self):
        """Should add w: prefix to val attribute on w:sz element"""
        broken_xml = b'<w:sz val="26" />'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')
        assert 'w:val="26"' in decoded

    def test_does_not_double_prefix_already_prefixed_attributes(self):
        """Should NOT add w: prefix if attribute already has it"""
        # This is from the template - already correct
        valid_xml = b'<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" />'
        fixed = _fix_xml_serialization(valid_xml)
        decoded = fixed.decode('utf-8')

        # Should still have exactly one w: prefix per attribute (not w:w:)
        assert 'w:w:' not in decoded
        assert 'w:ascii="Times New Roman"' in decoded


class TestInvalidXmlNamespaceRegression:
    """
    Regression tests for the INVALID XML NAMESPACE bug.

    ROOT CAUSE: The code was using the WRONG XML namespace URI:
        Wrong:   http://schemas.openxmlformats.org/XML/1998/namespace
        Correct: http://www.w3.org/XML/1998/namespace

    The XML namespace is defined by W3C, not by OOXML. Using the wrong URI
    causes Word to show "unreadable content" and trigger a repair prompt.

    Evidence: Diff between broken.docx and Word-repaired.docx shows Word
    removes/fixes the invalid namespace declaration.
    """

    # Invalid namespace string that must NEVER appear in generated DOCX
    INVALID_XML_NS = 'schemas.openxmlformats.org/XML/1998/namespace'

    # Correct W3C XML namespace
    CORRECT_XML_NS = 'http://www.w3.org/XML/1998/namespace'

    # Pattern for ns#:space attributes (should be xml:space or absent)
    NS_SPACE_PATTERN = re.compile(r'ns\d+:space="')

    def test_xml_namespace_constant_is_correct(self):
        """
        CRITICAL: The _XML_NS constant must use the W3C-defined XML namespace.

        This is the root cause fix - using schemas.openxmlformats.org instead
        of www.w3.org for the XML namespace causes Word repair prompts.
        """
        assert _XML_NS == self.CORRECT_XML_NS, \
            f"_XML_NS has wrong value! Expected {self.CORRECT_XML_NS}, got {_XML_NS}"
        assert self.INVALID_XML_NS not in _XML_NS, \
            f"_XML_NS contains invalid namespace: {_XML_NS}"

    def test_fix_xml_serialization_corrects_invalid_namespace(self):
        """_fix_xml_serialization should correct the invalid namespace URI"""
        # Simulate XML with wrong namespace
        broken_xml = b'xmlns:ns3="http://schemas.openxmlformats.org/XML/1998/namespace"'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')

        assert self.INVALID_XML_NS not in decoded, \
            f"Invalid XML namespace still present: {decoded}"
        assert 'www.w3.org/XML/1998/namespace' in decoded, \
            f"Correct XML namespace not found: {decoded}"

    def test_no_ns_prefixed_space_attributes(self):
        """Should not have ns#:space attributes - must be xml:space or absent"""
        broken_xml = b'<w:t ns3:space="preserve">text</w:t>'
        fixed = _fix_xml_serialization(broken_xml)
        decoded = fixed.decode('utf-8')

        assert not self.NS_SPACE_PATTERN.search(decoded), \
            f"Found ns#:space attribute: {decoded}"


class TestDuplicateAttributeRegression:
    """
    Regression tests for the duplicate attribute bug that caused Word repair prompts.

    ROOT CAUSE: When ElementTree serializes XML with xml:space="preserve", it doesn't
    recognize that xml: is a built-in namespace prefix. If the code then calls
    elem.set('{xml-namespace}space', 'preserve'), ElementTree adds a SECOND attribute
    with an auto-generated prefix (ns3:space), resulting in:

        <w:t xml:space="preserve" ns3:space="preserve">

    This is invalid XML (duplicate attributes) and causes Word to show:
    "Word found unreadable content in 'document.docx'. Do you want to recover..."

    These tests ensure this bug doesn't reoccur.
    """

    # Pattern to detect duplicate space attributes
    DUPLICATE_SPACE_RE = re.compile(
        r'space="[^"]*"[^>]*space="[^"]*"'
    )

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_no_duplicate_space_attributes_in_generated_docx(self):
        """
        CRITICAL: Generated DOCX must NOT have duplicate space attributes.

        This is a regression test for the root cause of Word repair prompts.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        # Sample data
        competition_data = {
            'name': 'Test Competition',
            'type': 'hackathon',
            'organizer': 'Test Org',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=2)
        }

        registrations = [{
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант'
                }
            ],
            'address': 'г. Санкт-Петербург'
        }]

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, registrations)

        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_xml = zf.read('word/document.xml').decode('utf-8')

            # Check for duplicate space attributes
            duplicates = self.DUPLICATE_SPACE_RE.findall(doc_xml)
            assert len(duplicates) == 0, \
                f"Found duplicate space attributes (causes Word repair): {duplicates[:3]}"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_content_types_no_ns0_prefix(self):
        """Content_Types.xml should not use ns0 prefix on elements"""
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        competition_data = {
            'name': 'Test',
            'type': 'hackathon',
            'organizer': 'Test',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=1)
        }

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, [])

        with zipfile.ZipFile(buffer, 'r') as zf:
            ct_xml = zf.read('[Content_Types].xml').decode('utf-8')

            # Elements should not have ns0 prefix
            assert '<ns0:Types' not in ct_xml, \
                "Content_Types uses ns0 prefix which may cause issues"
            assert '<ns0:Default' not in ct_xml
            assert '<ns0:Override' not in ct_xml


class TestMissingPartsRegression:
    """
    Regression tests for the MISSING PARTS bug that caused Word repair prompts.

    ROOT CAUSE: The template DOCX contains relationship entries pointing to
    media/image*.png files. When generating the output, we skip copying the
    media folder to reduce file size, but we were NOT removing the relationship
    entries. This leaves "dangling" references to non-existent parts.

    The Open XML SDK fails with: "Specified part does not exist in the package"
    Word shows: "Word found unreadable content" and repairs by removing references.

    Fix: Remove image relationship entries from word/_rels/document.xml.rels
    using regex-based string manipulation (not ElementTree to avoid re-serialization issues).
    """

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_no_dangling_media_references(self):
        """
        CRITICAL: Generated DOCX must NOT have relationships pointing to non-existent parts.

        This is a regression test for the root cause of Word repair prompts.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        competition_data = {
            'name': 'Test Competition',
            'type': 'hackathon',
            'organizer': 'Test Org',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=2)
        }

        registrations = [{
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант'
                }
            ],
            'address': 'г. Санкт-Петербург'
        }]

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, registrations)

        with zipfile.ZipFile(buffer, 'r') as zf:
            # Get list of all files in the DOCX
            all_files = set(zf.namelist())

            # Check document.xml.rels for dangling references
            doc_rels = zf.read('word/_rels/document.xml.rels').decode('utf-8')

            # Extract all Target values from relationships
            import re
            targets = re.findall(r'Target="([^"]+)"', doc_rels)

            for target in targets:
                # Skip external targets (URLs)
                if target.startswith('http://') or target.startswith('https://'):
                    continue

                # Build expected path
                if target.startswith('/'):
                    expected_path = target[1:]  # Remove leading slash
                else:
                    expected_path = 'word/' + target  # Relative to word/

                # Verify the target exists in the DOCX
                assert expected_path in all_files, \
                    f"Dangling relationship: {target} -> {expected_path} not in DOCX"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_no_image_relationships_in_output(self):
        """Generated DOCX should NOT have image relationships (images are removed)"""
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        competition_data = {
            'name': 'Test',
            'type': 'hackathon',
            'organizer': 'Test',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=1)
        }

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, [])

        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_rels = zf.read('word/_rels/document.xml.rels').decode('utf-8')

            # Should NOT have any image relationships
            assert 'media/image' not in doc_rels, \
                f"Found image relationship in output: {doc_rels}"
            assert '/relationships/image' not in doc_rels, \
                f"Found image relationship type in output: {doc_rels}"


class TestMcIgnorableNamespaces:
    """
    Regression tests for mc:Ignorable namespace declaration bug.

    ROOT CAUSE: The mc:Ignorable attribute lists namespace prefixes (w14, w15, w16, etc.)
    that must be declared as xmlns attributes on the document element. When ElementTree
    re-serializes the document, it loses these declarations (uses ns0, ns1, etc.), leaving
    the mc:Ignorable attribute referencing undefined prefixes.

    OpenXmlValidator error:
        "The Ignorable attribute is invalid - The value 'w14 w15 w16se...' contains
        an invalid prefix that is not defined."

    Fix: Add required namespace declarations and use correct mc: prefix.
    """

    def test_fix_mc_ignorable_adds_missing_namespaces(self):
        """Should add xmlns declarations for all prefixes in mc:Ignorable"""
        # XML with ns1:Ignorable (wrong) and missing namespace declarations
        broken_xml = b'''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ns1:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14"><w:body /></w:document>'''

        fixed = _fix_mc_ignorable(broken_xml)
        decoded = fixed.decode('utf-8')

        # Should have mc:Ignorable (not ns1:Ignorable)
        assert 'mc:Ignorable=' in decoded
        assert 'ns1:Ignorable=' not in decoded

        # All referenced namespaces should be declared
        for prefix in ['w14', 'w15', 'w16se', 'w16cid', 'w16', 'w16cex', 'w16sdtdh', 'wp14', 'mc']:
            assert f'xmlns:{prefix}=' in decoded, f"Missing xmlns:{prefix} declaration"

    def test_fix_mc_ignorable_preserves_existing_namespaces(self):
        """Should not duplicate namespace declarations that already exist"""
        # XML that already has w14 declared
        xml_with_w14 = b'''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ns1:Ignorable="w14 w15"><w:body /></w:document>'''

        fixed = _fix_mc_ignorable(xml_with_w14)
        decoded = fixed.decode('utf-8')

        # w14 should appear exactly once
        count = decoded.count('xmlns:w14=')
        assert count == 1, f"Expected 1 xmlns:w14, found {count}"

    def test_extended_namespaces_constant_has_all_required(self):
        """_EXTENDED_NAMESPACES should include all namespaces referenced in mc:Ignorable"""
        required_prefixes = ['w14', 'w15', 'w16se', 'w16cid', 'w16', 'w16cex', 'w16sdtdh', 'wp14', 'mc']

        for prefix in required_prefixes:
            assert prefix in _EXTENDED_NAMESPACES, \
                f"Missing {prefix} in _EXTENDED_NAMESPACES"
            assert _EXTENDED_NAMESPACES[prefix].startswith('http'), \
                f"Invalid URI for {prefix}: {_EXTENDED_NAMESPACES[prefix]}"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_has_valid_mc_ignorable(self):
        """
        CRITICAL: Generated DOCX must have valid mc:Ignorable with all required namespaces.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        competition_data = {
            'name': 'Test Competition',
            'type': 'hackathon',
            'organizer': 'Test Org',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=2)
        }

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, [])

        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_xml = zf.read('word/document.xml').decode('utf-8')

            # Should have mc:Ignorable (not ns#:Ignorable)
            assert 'mc:Ignorable=' in doc_xml, "Missing mc:Ignorable attribute"
            assert re.search(r'ns\d+:Ignorable=', doc_xml) is None, \
                "Found ns#:Ignorable - should be mc:Ignorable"

            # All referenced namespaces should be declared
            mc_ignorable_match = re.search(r'mc:Ignorable="([^"]*)"', doc_xml)
            assert mc_ignorable_match, "Could not find mc:Ignorable attribute"

            prefixes = mc_ignorable_match.group(1).split()
            for prefix in prefixes:
                assert f'xmlns:{prefix}=' in doc_xml, \
                    f"mc:Ignorable references {prefix} but xmlns:{prefix} not declared"


class TestRprElementOrder:
    """
    Regression tests for rPr element ordering bug.

    ROOT CAUSE: The _apply_global_formatting function was using ET.SubElement to append
    rFonts, sz, szCs elements at the END of w:rPr. OOXML schema requires these elements
    in a specific order (rFonts near the beginning, sz/szCs after kern/position).

    OpenXmlValidator errors:
        "The element has unexpected child element 'w:rFonts'" (when rFonts comes after u/kern/lang)

    Fix: Use insert() with proper index calculation based on OOXML schema order.
    """

    def test_rpr_element_order_constant_is_complete(self):
        """_RPR_ELEMENT_ORDER should include key elements for ordering"""
        required_elements = ['rStyle', 'rFonts', 'b', 'i', 'sz', 'szCs', 'u', 'kern', 'lang']

        for elem in required_elements:
            assert elem in _RPR_ELEMENT_ORDER, f"Missing {elem} in _RPR_ELEMENT_ORDER"

    def test_rfonts_comes_before_kern_and_u(self):
        """rFonts must come before kern and u in the element order"""
        rfonts_idx = _RPR_ELEMENT_ORDER.index('rFonts')
        kern_idx = _RPR_ELEMENT_ORDER.index('kern')
        u_idx = _RPR_ELEMENT_ORDER.index('u')
        lang_idx = _RPR_ELEMENT_ORDER.index('lang')

        assert rfonts_idx < kern_idx, f"rFonts ({rfonts_idx}) should come before kern ({kern_idx})"
        assert rfonts_idx < u_idx, f"rFonts ({rfonts_idx}) should come before u ({u_idx})"
        assert rfonts_idx < lang_idx, f"rFonts ({rfonts_idx}) should come before lang ({lang_idx})"

    def test_sz_szcs_come_before_u_and_lang(self):
        """sz and szCs must come before u and lang"""
        sz_idx = _RPR_ELEMENT_ORDER.index('sz')
        szcs_idx = _RPR_ELEMENT_ORDER.index('szCs')
        u_idx = _RPR_ELEMENT_ORDER.index('u')
        lang_idx = _RPR_ELEMENT_ORDER.index('lang')

        assert sz_idx < u_idx, f"sz ({sz_idx}) should come before u ({u_idx})"
        assert szcs_idx < u_idx, f"szCs ({szcs_idx}) should come before u ({u_idx})"
        assert sz_idx < lang_idx, f"sz ({sz_idx}) should come before lang ({lang_idx})"
        assert szcs_idx < lang_idx, f"szCs ({szcs_idx}) should come before lang ({lang_idx})"

    def test_get_rpr_insert_index_empty_element(self):
        """Should return 0 for empty rPr element"""
        rPr = ET.Element('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
        idx = _get_rpr_insert_index(rPr, 'rFonts')
        assert idx == 0

    def test_get_rpr_insert_index_with_existing_elements(self):
        """Should calculate correct index when elements exist"""
        W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        rPr = ET.Element(f'{{{W_NS}}}rPr')

        # Add elements in valid order: rStyle, then u, then lang
        ET.SubElement(rPr, f'{{{W_NS}}}rStyle')
        ET.SubElement(rPr, f'{{{W_NS}}}u')
        ET.SubElement(rPr, f'{{{W_NS}}}lang')

        # rFonts should go after rStyle (index 1), before u
        rfonts_idx = _get_rpr_insert_index(rPr, 'rFonts')
        assert rfonts_idx == 1, f"rFonts should go at index 1, got {rfonts_idx}"

        # sz should go after rStyle (index 1), before u (which is after rStyle)
        # But since u is at index 1 and sz comes before u, sz should also be at 1
        sz_idx = _get_rpr_insert_index(rPr, 'sz')
        # After rStyle (index 0), sz should be at index 1
        assert sz_idx == 1, f"sz should go at index 1, got {sz_idx}"

    @pytest.mark.skipif(
        not __import__('os').path.exists('/app/raport_template.docx'),
        reason="Template file not available in test environment"
    )
    def test_generated_docx_rpr_elements_in_valid_order(self):
        """
        CRITICAL: Generated DOCX must have rPr child elements in valid OOXML order.
        """
        from app.infrastructure.storage.template_report_generator import (
            TemplateReportGenerator
        )

        competition_data = {
            'name': 'Test Competition',
            'type': 'hackathon',
            'organizer': 'Test Org',
            'start_date': datetime.now(),
            'end_date': datetime.now() + timedelta(days=2)
        }

        registrations = [{
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'study_group': '123'
                }
            ],
            'address': 'г. Санкт-Петербург'
        }]

        generator = TemplateReportGenerator('/app/raport_template.docx')
        buffer = generator.generate(competition_data, registrations)

        with zipfile.ZipFile(buffer, 'r') as zf:
            doc_xml = zf.read('word/document.xml').decode('utf-8')

            # Parse and check rPr elements
            root = ET.fromstring(doc_xml.encode('utf-8'))
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            for rPr in root.findall('.//w:rPr', ns):
                children = list(rPr)
                child_names = [c.tag.split('}')[-1] for c in children]

                # Build expected order for elements that are present
                expected_order = [n for n in _RPR_ELEMENT_ORDER if n in child_names]

                # Actual order should match expected order
                actual_order = [n for n in child_names if n in _RPR_ELEMENT_ORDER]

                assert actual_order == expected_order, \
                    f"rPr element order invalid: {actual_order} should be {expected_order}"

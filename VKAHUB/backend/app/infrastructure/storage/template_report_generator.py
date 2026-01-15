"""
Template-based DOCX Report Generator
Preserves exact formatting from template by doing minimal XML text replacements
"""
import zipfile
import io
import re
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from xml.etree import ElementTree as ET


# Regex pattern for illegal XML 1.0 control characters
# Illegal: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F
# Legal whitespace: 0x09 (tab), 0x0A (newline), 0x0D (carriage return)
_ILLEGAL_XML_CHARS_RE = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')

# XML namespace for xml:space attribute
_XML_NS = 'http://schemas.openxmlformats.org/XML/1998/namespace'
_XML_SPACE_ATTR = f'{{{_XML_NS}}}space'

# Wordprocessingml namespace - attributes on w: elements need this prefix
_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

# Pattern to detect duplicate xml:space attributes (the root cause of Word repair prompt)
# This happens when ElementTree doesn't recognize xml: prefix and adds ns#: prefixed duplicate
_DUPLICATE_SPACE_ATTR_RE = re.compile(
    r'(\s+)((?:xml|ns\d+):space="[^"]*")(\s+)((?:xml|ns\d+):space="[^"]*")'
)

# Pattern to fix namespace prefixes in serialized XML
# ElementTree uses ns0, ns1, etc. instead of proper OOXML prefixes
_NS_FIXUP_PATTERNS = [
    # Fix Content_Types namespace prefix
    (re.compile(r'<ns\d+:Types\s'), '<Types '),
    (re.compile(r'</ns\d+:Types>'), '</Types>'),
    (re.compile(r'<ns\d+:Default\s'), '<Default '),
    (re.compile(r'<ns\d+:Override\s'), '<Override '),
    # Fix xml:space attribute that got ns# prefix
    (re.compile(r'\bns\d+:space="preserve"'), 'xml:space="preserve"'),
]

# Attributes that need w: prefix when on w: elements
# These are defined in the OOXML schema as namespace-qualified
_W_ATTRS = {'ascii', 'hAnsi', 'cs', 'eastAsia', 'val'}

# Pattern to fix missing w: prefix on attributes
# Match: space + attribute="value" where attribute is one that needs w: prefix
# Uses negative lookbehind to ensure the attribute doesn't already have a prefix (w: or ns#:)
# The (?<![:\w]) ensures we don't match if preceded by : or word char (which would indicate existing prefix)
_ATTR_FIXUP_PATTERN = re.compile(
    r'(?<![:\w])(ascii|hAnsi|cs|eastAsia|val)="([^"]*)"'
)


def sanitize_xml_text(text: str) -> str:
    """
    Remove illegal XML 1.0 control characters from text.

    OOXML (Office Open XML) is based on XML 1.0, which forbids certain
    control characters. If these appear in text content, Word will
    detect "unreadable content" and trigger a repair prompt.

    Illegal characters (removed):
        - 0x00-0x08: NULL through BACKSPACE
        - 0x0B: Vertical tab
        - 0x0C: Form feed
        - 0x0E-0x1F: Shift out through unit separator

    Legal whitespace (preserved):
        - 0x09: Tab
        - 0x0A: Line feed (newline)
        - 0x0D: Carriage return

    Args:
        text: Input text that may contain control characters

    Returns:
        Sanitized text with illegal characters removed
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return _ILLEGAL_XML_CHARS_RE.sub('', text)


def _set_xml_space_preserve(elem: ET.Element) -> None:
    """
    Safely set xml:space="preserve" on an element.

    This function checks if the attribute already exists (in any namespace form)
    before setting it, to avoid creating duplicate attributes which causes
    Word to show "unreadable content" repair prompts.

    The root cause of the DOCX corruption was:
    - Template elements have xml:space="preserve"
    - ElementTree doesn't recognize xml: as a special prefix
    - When we call elem.set('{xml-ns}space', 'preserve'), ET adds a DUPLICATE
      attribute with ns#:space prefix
    - Duplicate attributes are invalid XML and trigger Word repair

    Args:
        elem: The XML element to set the attribute on
    """
    # Check if xml:space is already set (in any form)
    # ElementTree may represent it as {namespace}space or just 'space' with xml: prefix
    existing_attrs = elem.attrib

    # Check for the namespaced form
    if _XML_SPACE_ATTR in existing_attrs:
        return  # Already set with namespace

    # Check for any space attribute (may be present without namespace in attrib dict
    # but serialized with xml: prefix)
    for attr_name in existing_attrs:
        if attr_name.endswith('}space') or attr_name == 'space':
            return  # Already has some form of space attribute

    # Safe to add - no existing space attribute
    elem.set(_XML_SPACE_ATTR, 'preserve')


def _fix_xml_serialization(xml_bytes: bytes) -> bytes:
    """
    Fix XML serialization issues caused by ElementTree's namespace handling.

    ElementTree has several quirks when serializing OOXML:
    1. It uses auto-generated ns0/ns1/ns2 prefixes instead of original prefixes
    2. It may create duplicate attributes when xml: namespace is involved
    3. It doesn't add w: prefix to attributes on w: elements (causes Word repair)
    4. It doesn't preserve the original namespace prefix declarations

    This post-processing step fixes these issues to produce Word-compatible XML.

    ROOT CAUSE FIX: Attributes like ascii, hAnsi, cs, val on w:rFonts, w:sz elements
    need the w: namespace prefix. Without it, Word shows "unreadable content" error.

    Args:
        xml_bytes: Raw XML bytes from ElementTree.tostring()

    Returns:
        Fixed XML bytes that won't trigger Word repair prompts
    """
    xml_str = xml_bytes.decode('utf-8')

    # Fix 1: Remove duplicate space attributes (critical - causes repair prompt)
    # Pattern matches: space="preserve" ns3:space="preserve" (or any ns# variant)
    # Keep only the first occurrence
    while True:
        match = _DUPLICATE_SPACE_ATTR_RE.search(xml_str)
        if not match:
            break
        # Remove the second (duplicate) space attribute
        xml_str = xml_str[:match.start(3)] + xml_str[match.end(4):]

    # Fix 2: Convert ns#:space="preserve" to xml:space="preserve"
    for pattern, replacement in _NS_FIXUP_PATTERNS:
        xml_str = pattern.sub(replacement, xml_str)

    # Fix 3: Add w: prefix to OOXML attributes that need it
    # This is critical: attributes like ascii, hAnsi, cs, val on w: elements
    # MUST have the w: prefix or Word will show "unreadable content" repair prompt
    #
    # Before: <w:rFonts ascii="Times New Roman" hAnsi="Times New Roman" />
    # After:  <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" />
    #
    # We only add the prefix if the attribute doesn't already have one (no colon)
    def add_w_prefix(match):
        attr_name = match.group(1)
        attr_value = match.group(2)
        return f'w:{attr_name}="{attr_value}"'

    xml_str = _ATTR_FIXUP_PATTERN.sub(add_w_prefix, xml_str)

    return xml_str.encode('utf-8')


def sanitize_filename(filename: str, max_length: int = 150) -> str:
    """
    Sanitize filename for Windows/Unix compatibility

    Args:
        filename: Original filename
        max_length: Maximum filename length (excluding extension)

    Returns:
        Safe filename
    """
    # Remove/replace invalid Windows characters: \ / : * ? " < > |
    invalid_chars = r'[\\/:*?"<>|]'
    safe_name = re.sub(invalid_chars, '_', filename)

    # Replace multiple spaces/underscores with single underscore
    safe_name = re.sub(r'[ _]+', '_', safe_name)

    # Remove leading/trailing spaces, dots, underscores
    safe_name = safe_name.strip(' ._')

    # Limit length (reserve space for extension)
    if len(safe_name) > max_length:
        safe_name = safe_name[:max_length].rstrip(' ._')

    # Ensure not empty
    if not safe_name:
        safe_name = 'report'

    return safe_name


class TemplateReportGenerator:
    """Generate reports by replacing text in template DOCX while preserving all formatting"""

    # XML namespaces used in DOCX
    NAMESPACES = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
    }

    def __init__(self, template_path: str, validate: bool = False):
        """
        Initialize with path to template DOCX

        Args:
            template_path: Path to template DOCX file
            validate: If True, validate generated DOCX structure (slower, for debugging)
        """
        self.template_path = template_path
        self.validate = validate

    def generate(self, competition_data: Dict[str, Any], registrations: List[Dict[str, Any]]) -> io.BytesIO:
        """
        Generate report by replacing placeholders in template

        Args:
            competition_data: Competition info (name, organizer, dates, etc.)
            registrations: List of team registrations with members and addresses

        Returns:
            BytesIO buffer containing generated DOCX
        """
        # Read template
        with zipfile.ZipFile(self.template_path, 'r') as template_zip:
            # Extract all files
            file_dict = {}
            for file_info in template_zip.filelist:
                file_dict[file_info.filename] = template_zip.read(file_info.filename)

        # Parse document.xml
        doc_xml = file_dict['word/document.xml']
        root = ET.fromstring(doc_xml)

        # Register namespaces
        for prefix, uri in self.NAMESPACES.items():
            ET.register_namespace(prefix, uri)

        # Replace text content while preserving formatting
        self._replace_competition_info(root, competition_data)
        self._replace_participant_lists(root, registrations)

        # Remove all images/drawings from document
        image_rels_to_remove = self._remove_images(root)

        # Apply Times New Roman 13pt to all text
        self._apply_global_formatting(root)

        # Clean up relationships for removed images
        if image_rels_to_remove and 'word/_rels/document.xml.rels' in file_dict:
            file_dict['word/_rels/document.xml.rels'] = self._clean_relationships(
                file_dict['word/_rels/document.xml.rels'],
                image_rels_to_remove
            )

        # Clean up Content_Types for removed media
        if '[Content_Types].xml' in file_dict:
            file_dict['[Content_Types].xml'] = self._clean_content_types(
                file_dict['[Content_Types].xml']
            )

        # Serialize document.xml with proper XML declaration
        # Use method='xml' to ensure proper XML format
        raw_xml = ET.tostring(root, encoding='utf-8', method='xml')
        # Fix ElementTree serialization issues (duplicate attributes, ns# prefixes)
        fixed_xml = _fix_xml_serialization(raw_xml)
        file_dict['word/document.xml'] = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + fixed_xml

        # Create new DOCX in memory (exclude images/media)
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as output_zip:
            for filename, content in file_dict.items():
                # Skip image and media files
                if not filename.startswith('word/media/'):
                    output_zip.writestr(filename, content)

        output.seek(0)

        # Optional validation for debugging
        if self.validate:
            self._validate_docx(output)
            output.seek(0)

        return output

    def _validate_docx(self, buffer: io.BytesIO):
        """Validate generated DOCX structure (for debugging)"""
        try:
            import logging
            logger = logging.getLogger(__name__)

            with zipfile.ZipFile(buffer, 'r') as zf:
                entries = zf.namelist()
                logger.info(f"Generated DOCX contains {len(entries)} files")

                # Check for duplicates
                if len(entries) != len(set(entries)):
                    duplicates = [x for x in entries if entries.count(x) > 1]
                    logger.error(f"Duplicate ZIP entries: {set(duplicates)}")

                # Validate XML files
                for entry in entries:
                    if entry.endswith('.xml') or entry.endswith('.rels'):
                        try:
                            xml_content = zf.read(entry)
                            ET.fromstring(xml_content)
                        except ET.ParseError as e:
                            logger.error(f"Invalid XML in {entry}: {e}")

                logger.info("DOCX validation completed")
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Validation error: {e}")

    def _replace_competition_info(self, root: ET.Element, competition_data: Dict[str, Any]):
        """Replace competition name, organizer, and dates in the intro paragraph"""

        # Build schedule text
        schedule_text = self._build_schedule_text(
            competition_data['start_date'],
            competition_data['end_date']
        )

        # Build competition description
        comp_desc = f"«{competition_data['name']}»"
        if competition_data.get('organizer'):
            comp_desc += f" от {competition_data['organizer']}"

        # Build full intro text matching template exactly
        year = competition_data['start_date'].year
        intro_text = (
            f"В соответствии с планом методической деятельности \n"
            f"ВКА имени А.Ф.Можайского на {year}/{year + 1} учебный год прошу Вашего ходатайства "
            f"перед вышестоящим командованием об организации участия курсантов 6 факультета "
            f"в онлайн-соревнованиях по продуктовому программированию (быстрая разработка программного обеспечения) "
            f"{comp_desc} {schedule_text}, "
            f"(в соответствии с графиком проведения соревнований). "
        )

        # Find and replace in XML - find paragraph containing the schedule pattern
        self._replace_text_in_paragraph(root,
            pattern=r"В соответствии с планом методической деятельности.*?\(в соответствии с графиком проведения соревнований\)\.",
            replacement=intro_text,
            regex=True
        )

        # Update year in date lines
        current_year = datetime.now().year
        self._replace_text_in_runs(root, "2025 г.", f"{current_year} г.")

    def _replace_participant_lists(self, root: ET.Element, registrations: List[Dict[str, Any]]):
        """Replace participant lists and locations"""

        # Build new participant list text
        participant_blocks = []
        counter = 1

        for reg in registrations:
            team_members = []
            for member in reg['members']:
                rank = member.get('rank') or 'Рядовой'
                last_name = member.get('last_name', '')
                first_initial = member.get('first_name', '')[0] + '.' if member.get('first_name') else ''
                middle_initial = member.get('middle_name', '')[0] + '.' if member.get('middle_name') else ''
                position = member.get('position', '')

                member_line = f"{counter}. {rank} {last_name} {first_initial}{middle_initial}"
                if position:
                    member_line += f" ({position})"
                member_line += "."

                team_members.append(member_line)
                counter += 1

            location = reg.get('address') or "г. Санкт-Петербург, Лыжный пер., 4к3"
            location_line = f"Место проведения: {location}."

            participant_blocks.append({
                'members': team_members,
                'location': location_line
            })

        # Find the paragraph after "Список курсантов" and replace from there
        self._replace_participant_section(root, participant_blocks)

    def _replace_participant_section(self, root: ET.Element, blocks: List[Dict[str, Any]]):
        """Replace the entire participant list section"""

        # Find body element
        body = root.find('.//w:body', self.NAMESPACES)
        if body is None:
            return

        # Find paragraph containing "Список курсантов"
        paragraphs = body.findall('.//w:p', self.NAMESPACES)
        start_idx = None

        for i, para in enumerate(paragraphs):
            text = self._get_paragraph_text(para)
            if 'Список курсантов' in text:
                start_idx = i + 1
                break

        if start_idx is None:
            return

        # Find end of participant section (paragraph containing "Ответственный")
        end_idx = None
        for i in range(start_idx, len(paragraphs)):
            text = self._get_paragraph_text(paragraphs[i])
            if 'Ответственный:' in text:
                end_idx = i
                break

        if end_idx is None:
            return

        # Remove old participant paragraphs
        for i in range(end_idx - 1, start_idx - 1, -1):
            body.remove(paragraphs[i])

        # Get the paragraph to insert after
        insert_after = paragraphs[start_idx - 1]
        insert_idx = list(body).index(insert_after) + 1

        # Clone a sample numbered paragraph from template for formatting
        sample_para = paragraphs[start_idx] if start_idx < len(paragraphs) else None

        # Insert new participant paragraphs
        for block in blocks:
            for member_line in block['members']:
                new_para = self._clone_paragraph_with_text(sample_para, member_line) if sample_para is not None else self._create_paragraph(member_line)
                body.insert(insert_idx, new_para)
                insert_idx += 1

            # Add location paragraph with Times New Roman, size 13
            location_para = self._create_paragraph_with_formatting(block['location'], font_name='Times New Roman', font_size=26)
            body.insert(insert_idx, location_para)
            insert_idx += 1

    def _build_schedule_text(self, start_date: datetime, end_date: datetime) -> str:
        """Build schedule text with weekday/weekend time logic"""

        months = {
            'january': 'января', 'february': 'февраля', 'march': 'марта',
            'april': 'апреля', 'may': 'мая', 'june': 'июня',
            'july': 'июля', 'august': 'августа', 'september': 'сентября',
            'october': 'октября', 'november': 'ноября', 'december': 'декабря'
        }

        def format_russian_date(date_obj):
            date_str = date_obj.strftime('%d %B').lower()
            for eng, rus in months.items():
                date_str = date_str.replace(eng, rus)
            return date_str

        # Generate schedule parts
        schedule_parts = []
        current = start_date
        range_start = None
        range_start_time = None

        while current <= end_date:
            is_weekend = current.weekday() >= 5
            time_start = "09:00" if is_weekend else "16:00"
            time_end = "21:00"

            if range_start is None:
                range_start = current
                range_start_time = time_start
            elif range_start_time != time_start:
                if range_start == current - timedelta(days=1):
                    prev_date = current - timedelta(days=1)
                    schedule_parts.append(
                        f"с {range_start_time} до {time_end} {format_russian_date(prev_date)}"
                    )
                else:
                    prev_date = current - timedelta(days=1)
                    schedule_parts.append(
                        f"с {range_start_time} до {time_end} с {format_russian_date(range_start)} до {format_russian_date(prev_date)}"
                    )

                range_start = current
                range_start_time = time_start

            current += timedelta(days=1)

        # Close final range
        if range_start:
            if range_start == end_date:
                schedule_parts.append(
                    f"с {range_start_time} до 21:00 {format_russian_date(end_date)} {end_date.year}"
                )
            else:
                schedule_parts.append(
                    f"с {range_start_time} до 21:00 с {format_russian_date(range_start)} до {format_russian_date(end_date)} {end_date.year}"
                )

        return " года, ".join(schedule_parts)

    def _get_paragraph_text(self, para: ET.Element) -> str:
        """Extract all text from a paragraph"""
        text_elements = para.findall('.//w:t', self.NAMESPACES)
        return ''.join(t.text or '' for t in text_elements)

    def _replace_text_in_paragraph(self, root: ET.Element, pattern: str, replacement: str, regex: bool = False):
        """Replace text in a paragraph matching pattern"""

        body = root.find('.//w:body', self.NAMESPACES)
        if body is None:
            return

        for para in body.findall('.//w:p', self.NAMESPACES):
            text = self._get_paragraph_text(para)

            if regex:
                if not re.search(pattern, text, re.DOTALL):
                    continue
            else:
                if pattern not in text:
                    continue

            # Replace text in all runs
            runs = para.findall('.//w:r', self.NAMESPACES)
            if not runs:
                continue

            # Clear existing text from all runs except first
            for run in runs[1:]:
                for t_elem in run.findall('.//w:t', self.NAMESPACES):
                    run.remove(t_elem)

            # Put all text in first run
            first_run = runs[0]
            t_elem = first_run.find('.//w:t', self.NAMESPACES)
            if t_elem is not None:
                t_elem.text = sanitize_xml_text(replacement)
                _set_xml_space_preserve(t_elem)

    def _replace_text_in_runs(self, root: ET.Element, old_text: str, new_text: str):
        """Replace all occurrences of text in runs"""

        for t_elem in root.findall('.//w:t', self.NAMESPACES):
            if t_elem.text and old_text in t_elem.text:
                t_elem.text = sanitize_xml_text(t_elem.text.replace(old_text, new_text))

    def _remove_images(self, root: ET.Element) -> set:
        """
        Remove all drawing/image elements from document

        Returns:
            Set of relationship IDs that were removed
        """
        # Find body element
        body = root.find('.//w:body', self.NAMESPACES)
        if body is None:
            return set()

        # Track relationship IDs for removed images
        removed_rel_ids = set()

        # Find all paragraphs with drawings
        paragraphs_to_remove = []

        for para in body.findall('.//w:p', self.NAMESPACES):
            # Remove runs containing drawings
            for run in list(para.findall('.//w:r', self.NAMESPACES)):
                # Check if run contains drawing
                drawing = run.find('.//w:drawing', self.NAMESPACES)
                if drawing is not None:
                    # Extract relationship ID before removing
                    # Look for blip elements that reference images
                    for blip in drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip', {}):
                        embed_id = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        if embed_id:
                            removed_rel_ids.add(embed_id)

                    para.remove(run)

            # Check if paragraph is now empty (only had drawings)
            runs = para.findall('.//w:r', self.NAMESPACES)
            if not runs or all(not self._run_has_text(run) for run in runs):
                # Check if paragraph has any text
                text_elements = para.findall('.//w:t', self.NAMESPACES)
                if not text_elements or not any(t.text and t.text.strip() for t in text_elements):
                    paragraphs_to_remove.append(para)

        # Remove empty paragraphs
        for para in paragraphs_to_remove:
            try:
                body.remove(para)
            except:
                pass

        return removed_rel_ids

    def _run_has_text(self, run: ET.Element) -> bool:
        """Check if a run contains actual text"""
        text_elements = run.findall('.//w:t', self.NAMESPACES)
        return any(t.text and t.text.strip() for t in text_elements)

    def _clean_relationships(self, rels_bytes: bytes, rel_ids_to_remove: set) -> bytes:
        """
        Remove relationship entries for deleted images

        Args:
            rels_bytes: Original relationships XML
            rel_ids_to_remove: Set of relationship IDs to remove

        Returns:
            Updated relationships XML as bytes
        """
        if not rel_ids_to_remove:
            return rels_bytes

        try:
            rels_root = ET.fromstring(rels_bytes)

            # Find and remove relationships with matching IDs
            for rel in list(rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')):
                rel_id = rel.get('Id')
                if rel_id in rel_ids_to_remove:
                    rels_root.remove(rel)

            # Serialize with proper XML declaration and fix namespace prefixes
            raw_xml = ET.tostring(rels_root, encoding='utf-8', method='xml')
            fixed_xml = _fix_xml_serialization(raw_xml)
            return b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + fixed_xml

        except Exception as e:
            # If parsing fails, return original
            print(f"Warning: Failed to clean relationships: {e}")
            return rels_bytes

    def _clean_content_types(self, content_types_bytes: bytes) -> bytes:
        """
        Remove Override entries for image files that no longer exist

        Args:
            content_types_bytes: Original [Content_Types].xml

        Returns:
            Updated content types XML as bytes
        """
        try:
            ct_root = ET.fromstring(content_types_bytes)

            # Remove Override entries for media files
            for override in list(ct_root.findall('.//{http://schemas.openxmlformats.org/package/2006/content-types}Override')):
                part_name = override.get('PartName')
                if part_name and '/media/' in part_name:
                    ct_root.remove(override)

            # Serialize with proper XML declaration and fix namespace prefixes
            raw_xml = ET.tostring(ct_root, encoding='utf-8', method='xml')
            fixed_xml = _fix_xml_serialization(raw_xml)
            return b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + fixed_xml

        except Exception as e:
            # If parsing fails, return original
            print(f"Warning: Failed to clean content types: {e}")
            return content_types_bytes

    def _apply_global_formatting(self, root: ET.Element):
        """Apply Times New Roman 13pt to all text in document"""

        for run in root.findall('.//w:r', self.NAMESPACES):
            # Get or create run properties
            rPr = run.find('.//w:rPr', self.NAMESPACES)
            if rPr is None:
                # Insert rPr as first child of run
                rPr = ET.Element('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
                run.insert(0, rPr)

            # Remove existing font and size elements
            for elem in list(rPr):
                tag = elem.tag.split('}')[-1]
                if tag in ['rFonts', 'sz', 'szCs']:
                    rPr.remove(elem)

            # Add Times New Roman font
            # Note: Attributes like 'ascii', 'hAnsi', 'cs' are NOT namespace-qualified in OOXML
            rFonts = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
            rFonts.set('ascii', 'Times New Roman')
            rFonts.set('hAnsi', 'Times New Roman')
            rFonts.set('cs', 'Times New Roman')

            # Add font size 13pt (26 half-points)
            # Note: 'val' attribute is NOT namespace-qualified in OOXML
            sz = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sz')
            sz.set('val', '26')
            szCs = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}szCs')
            szCs.set('val', '26')

    def _clone_paragraph_with_text(self, template_para: ET.Element, text: str) -> ET.Element:
        """Clone a paragraph's formatting and set new text"""
        import copy
        new_para = copy.deepcopy(template_para)

        # Replace text in all runs
        runs = new_para.findall('.//w:r', self.NAMESPACES)
        if runs:
            # Use first run
            t_elem = runs[0].find('.//w:t', self.NAMESPACES)
            if t_elem is not None:
                t_elem.text = sanitize_xml_text(text)
                _set_xml_space_preserve(t_elem)

            # Remove text from other runs
            for run in runs[1:]:
                for t in run.findall('.//w:t', self.NAMESPACES):
                    run.remove(t)

        return new_para

    def _create_paragraph(self, text: str) -> ET.Element:
        """Create a simple paragraph with text"""
        para = ET.Element('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
        run = ET.SubElement(para, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')
        t = ET.SubElement(run, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
        t.text = sanitize_xml_text(text)
        _set_xml_space_preserve(t)
        return para

    def _create_paragraph_with_formatting(self, text: str, font_name: str = None, font_size: int = None) -> ET.Element:
        """
        Create a paragraph with specific font formatting

        Args:
            text: The text content
            font_name: Font family name (e.g., 'Times New Roman')
            font_size: Font size in half-points (e.g., 26 for 13pt)
        """
        para = ET.Element('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
        run = ET.SubElement(para, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')

        # Add run properties for formatting
        if font_name or font_size:
            rPr = ET.SubElement(run, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')

            if font_name:
                # Add font family
                # Note: Attributes like 'ascii', 'hAnsi', 'cs' are NOT namespace-qualified in OOXML
                rFonts = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
                rFonts.set('ascii', font_name)
                rFonts.set('hAnsi', font_name)
                rFonts.set('cs', font_name)

            if font_size:
                # Add font size (in half-points)
                # Note: 'val' attribute is NOT namespace-qualified in OOXML
                sz = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sz')
                sz.set('val', str(font_size))
                szCs = ET.SubElement(rPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}szCs')
                szCs.set('val', str(font_size))

        # Add text
        t = ET.SubElement(run, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
        t.text = sanitize_xml_text(text)
        _set_xml_space_preserve(t)

        return para

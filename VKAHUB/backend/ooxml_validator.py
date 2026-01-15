#!/usr/bin/env python3
"""
Comprehensive OOXML Validator for DOCX files

This tool diagnoses DOCX corruption issues that cause Microsoft Word
to show "unreadable content" repair prompts.

Usage:
    python ooxml_validator.py <path_to_docx>
    python ooxml_validator.py --diff <broken.docx> <repaired.docx>
    python ooxml_validator.py --generate-test  # Generate test report and validate
"""

import argparse
import difflib
import io
import os
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from xml.etree import ElementTree as ET


class OOXMLValidator:
    """Comprehensive OOXML validator for DOCX files"""

    # Required parts for a minimal valid DOCX
    REQUIRED_PARTS = [
        '[Content_Types].xml',
        '_rels/.rels',
        'word/document.xml',
    ]

    # XML namespaces used in OOXML
    NAMESPACES = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'pkg': 'http://schemas.openxmlformats.org/package/2006/relationships',
        'ct': 'http://schemas.openxmlformats.org/package/2006/content-types',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    }

    # Illegal XML 1.0 control characters (cause Word repair prompt)
    # Illegal: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F
    # Legal whitespace: 0x09 (tab), 0x0A (LF), 0x0D (CR)
    ILLEGAL_XML_CHARS_RE = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')

    # Pattern for incorrectly namespaced attributes in OOXML
    # Attributes like ascii, hAnsi, cs, val should NOT have namespace prefixes
    BAD_ATTR_NAMESPACE_RE = re.compile(
        r'(\{http://schemas\.openxmlformats\.org[^}]*\})(ascii|hAnsi|cs|val|eastAsia|w:ascii|w:hAnsi|w:cs|w:val)='
    )

    # Pattern to detect duplicate xml:space attributes (ROOT CAUSE of Word repair prompt)
    # This happens when ElementTree doesn't recognize xml: prefix and adds ns#: prefixed duplicate
    DUPLICATE_SPACE_ATTR_RE = re.compile(
        r'space="[^"]*"[^>]*space="[^"]*"'
    )

    # Pattern for ns0/ns1 etc. prefixes that shouldn't appear
    NS_PREFIX_RE = re.compile(r'</?ns\d+:')

    # OOXML element ordering rules (simplified)
    # rPr children must appear in specific order
    RPR_ELEMENT_ORDER = [
        'rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps',
        'strike', 'dstrike', 'outline', 'shadow', 'emboss', 'imprint',
        'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing',
        'w', 'kern', 'position', 'sz', 'szCs', 'highlight', 'u', 'effect',
        'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang',
        'eastAsianLayout', 'specVanish', 'oMath'
    ]

    def __init__(self, docx_path: str):
        self.docx_path = docx_path
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []

    def validate(self) -> Tuple[bool, List[str], List[str], List[str]]:
        """
        Run full validation suite

        Returns:
            (is_valid, errors, warnings, info)
        """
        self.errors = []
        self.warnings = []
        self.info = []

        # Check file exists
        if not Path(self.docx_path).exists():
            self.errors.append(f"File not found: {self.docx_path}")
            return False, self.errors, self.warnings, self.info

        try:
            with zipfile.ZipFile(self.docx_path, 'r') as zf:
                self._validate_zip_integrity(zf)
                self._validate_required_parts(zf)
                self._validate_no_duplicates(zf)
                self._validate_xml_wellformed(zf)
                self._validate_no_illegal_chars(zf)
                self._validate_attribute_namespaces(zf)
                self._validate_no_duplicate_space_attrs(zf)
                self._validate_relationships(zf)
                self._validate_content_types(zf)
                self._validate_rpr_element_order(zf)
                self._check_ns_prefixes(zf)

        except zipfile.BadZipFile as e:
            self.errors.append(f"Invalid ZIP file: {e}")
            return False, self.errors, self.warnings, self.info
        except Exception as e:
            self.errors.append(f"Validation error: {e}")
            return False, self.errors, self.warnings, self.info

        is_valid = len(self.errors) == 0
        return is_valid, self.errors, self.warnings, self.info

    def _validate_zip_integrity(self, zf: zipfile.ZipFile):
        """Check ZIP file integrity"""
        bad_file = zf.testzip()
        if bad_file:
            self.errors.append(f"ZIP corruption in: {bad_file}")
        else:
            self.info.append(f"ZIP integrity: OK ({len(zf.namelist())} entries)")

    def _validate_required_parts(self, zf: zipfile.ZipFile):
        """Check all required OOXML parts exist"""
        entries = set(zf.namelist())
        missing = [p for p in self.REQUIRED_PARTS if p not in entries]
        if missing:
            self.errors.append(f"Missing required parts: {missing}")
        else:
            self.info.append("Required parts: OK")

    def _validate_no_duplicates(self, zf: zipfile.ZipFile):
        """Check for duplicate ZIP entries"""
        entries = zf.namelist()
        if len(entries) != len(set(entries)):
            seen = set()
            duplicates = []
            for e in entries:
                if e in seen:
                    duplicates.append(e)
                seen.add(e)
            self.errors.append(f"Duplicate ZIP entries: {duplicates}")
        else:
            self.info.append("No duplicate entries: OK")

    def _validate_xml_wellformed(self, zf: zipfile.ZipFile):
        """Validate all XML files are well-formed"""
        xml_files = [f for f in zf.namelist() if f.endswith('.xml') or f.endswith('.rels')]
        parse_errors = []

        for xml_file in xml_files:
            try:
                content = zf.read(xml_file)
                ET.fromstring(content)
            except ET.ParseError as e:
                parse_errors.append(f"{xml_file}: {e}")
            except Exception as e:
                parse_errors.append(f"{xml_file}: {e}")

        if parse_errors:
            for err in parse_errors:
                self.errors.append(f"XML parse error in {err}")
        else:
            self.info.append(f"XML well-formed: OK ({len(xml_files)} files)")

    def _validate_no_illegal_chars(self, zf: zipfile.ZipFile):
        """Check for illegal XML 1.0 control characters"""
        found_in = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    matches = self.ILLEGAL_XML_CHARS_RE.findall(content)
                    if matches:
                        char_codes = sorted(set(f"0x{ord(c):02x}" for c in matches))
                        found_in.append(f"{entry}: {char_codes}")

                        # Find exact location
                        for i, line in enumerate(content.split('\n'), 1):
                            line_matches = self.ILLEGAL_XML_CHARS_RE.findall(line)
                            if line_matches:
                                # Show context around illegal char
                                for m in self.ILLEGAL_XML_CHARS_RE.finditer(line):
                                    start = max(0, m.start() - 30)
                                    end = min(len(line), m.end() + 30)
                                    context = line[start:end].replace(m.group(), f'[0x{ord(m.group()):02x}]')
                                    found_in.append(f"  Line {i}, col {m.start()}: ...{context}...")
                except Exception as e:
                    self.warnings.append(f"Could not check {entry}: {e}")

        if found_in:
            self.errors.append("ILLEGAL XML CHARACTERS FOUND (causes Word repair prompt):")
            for item in found_in:
                self.errors.append(f"  {item}")
        else:
            self.info.append("Illegal XML chars: None found")

    def _validate_attribute_namespaces(self, zf: zipfile.ZipFile):
        """Check for incorrectly namespaced attributes"""
        found_in = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    matches = self.BAD_ATTR_NAMESPACE_RE.findall(content)
                    if matches:
                        # Extract unique attribute names
                        bad_attrs = sorted(set(m[1] for m in matches))
                        found_in.append(f"{entry}: attributes {bad_attrs} have incorrect namespace prefix")

                        # Show first occurrence
                        for match in self.BAD_ATTR_NAMESPACE_RE.finditer(content):
                            start = max(0, match.start() - 50)
                            end = min(len(content), match.end() + 50)
                            context = content[start:end].replace('\n', ' ')
                            found_in.append(f"  Example: ...{context}...")
                            break
                except Exception:
                    pass

        if found_in:
            self.errors.append("INCORRECTLY NAMESPACED ATTRIBUTES (causes Word repair prompt):")
            for item in found_in:
                self.errors.append(f"  {item}")
        else:
            self.info.append("Attribute namespaces: OK")

    def _validate_no_duplicate_space_attrs(self, zf: zipfile.ZipFile):
        """
        Check for duplicate xml:space/ns#:space attributes.

        This is the ROOT CAUSE of Word "unreadable content" repair prompts.
        When ElementTree serializes XML with existing xml:space="preserve",
        and code adds another via set(), it creates duplicates like:
            <w:t xml:space="preserve" ns3:space="preserve">

        Duplicate attributes are invalid XML and trigger Word repair.
        """
        found_in = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    matches = self.DUPLICATE_SPACE_ATTR_RE.findall(content)
                    if matches:
                        found_in.append(f"{entry}: {len(matches)} element(s) with duplicate space attrs")
                        # Show first example
                        for match in self.DUPLICATE_SPACE_ATTR_RE.finditer(content):
                            start = max(0, match.start() - 30)
                            end = min(len(content), match.end() + 30)
                            context = content[start:end].replace('\n', ' ')
                            found_in.append(f"  Example: ...{context}...")
                            break
                except Exception:
                    pass

        if found_in:
            self.errors.append("DUPLICATE SPACE ATTRIBUTES FOUND (ROOT CAUSE of Word repair prompt):")
            for item in found_in:
                self.errors.append(f"  {item}")
        else:
            self.info.append("Duplicate space attrs: None found")

    def _validate_relationships(self, zf: zipfile.ZipFile):
        """Check all relationship targets exist"""
        entries = set(zf.namelist())
        broken_refs = []

        # Check all .rels files
        rels_files = [f for f in entries if f.endswith('.rels')]

        for rels_file in rels_files:
            try:
                rels_content = zf.read(rels_file)
                rels_root = ET.fromstring(rels_content)

                # Get base directory for relative paths
                rels_dir = os.path.dirname(rels_file)
                if rels_dir.endswith('_rels'):
                    base_dir = os.path.dirname(rels_dir)
                else:
                    base_dir = rels_dir

                for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                    target = rel.get('Target')
                    rel_type = rel.get('Type', '')
                    rel_id = rel.get('Id', 'unknown')

                    if not target:
                        continue

                    # Skip external targets (URLs)
                    if target.startswith('http://') or target.startswith('https://'):
                        continue

                    # Skip external relationship types
                    if 'External' in rel_type:
                        continue

                    # Resolve path
                    if target.startswith('/'):
                        resolved = target[1:]  # Remove leading slash
                    else:
                        resolved = os.path.normpath(os.path.join(base_dir, target)).replace('\\', '/')

                    if resolved not in entries:
                        broken_refs.append(f"{rels_file}: {rel_id} -> {target} (resolved: {resolved})")

            except Exception as e:
                self.warnings.append(f"Could not parse {rels_file}: {e}")

        if broken_refs:
            self.errors.append("BROKEN RELATIONSHIP REFERENCES (causes Word repair prompt):")
            for ref in broken_refs:
                self.errors.append(f"  {ref}")
        else:
            self.info.append(f"Relationships: OK ({len(rels_files)} .rels files)")

    def _validate_content_types(self, zf: zipfile.ZipFile):
        """Validate [Content_Types].xml consistency"""
        try:
            ct_content = zf.read('[Content_Types].xml')
            ct_root = ET.fromstring(ct_content)

            entries = set(zf.namelist())
            issues = []

            # Check Override entries point to existing parts
            for override in ct_root.findall('.//{http://schemas.openxmlformats.org/package/2006/content-types}Override'):
                part_name = override.get('PartName')
                if part_name:
                    # PartName starts with /
                    resolved = part_name[1:] if part_name.startswith('/') else part_name
                    if resolved not in entries:
                        issues.append(f"Override for non-existent part: {part_name}")

            if issues:
                self.warnings.append("Content-Types issues:")
                for issue in issues:
                    self.warnings.append(f"  {issue}")
            else:
                self.info.append("Content-Types: OK")

        except Exception as e:
            self.warnings.append(f"Could not validate Content-Types: {e}")

    def _validate_rpr_element_order(self, zf: zipfile.ZipFile):
        """Check if rPr elements are in correct order (OOXML spec requirement)"""
        try:
            doc_content = zf.read('word/document.xml')
            root = ET.fromstring(doc_content)

            # Check rPr elements
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            issues = []

            for rPr in root.findall('.//w:rPr', ns):
                children = [child.tag.split('}')[-1] for child in rPr]

                # Filter to only known elements
                known_children = [c for c in children if c in self.RPR_ELEMENT_ORDER]

                # Check order
                expected_indices = [self.RPR_ELEMENT_ORDER.index(c) for c in known_children]
                if expected_indices != sorted(expected_indices):
                    issues.append(f"rPr children out of order: {known_children}")
                    if len(issues) >= 3:  # Limit output
                        break

            if issues:
                self.warnings.append("rPr element order issues (may cause warnings in strict validators):")
                for issue in issues[:3]:
                    self.warnings.append(f"  {issue}")
            else:
                self.info.append("rPr element order: OK")

        except Exception as e:
            self.warnings.append(f"Could not check rPr order: {e}")

    def _check_ns_prefixes(self, zf: zipfile.ZipFile):
        """Check for ns0/ns1 style prefixes that shouldn't appear in output"""
        found_in = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    if self.NS_PREFIX_RE.search(content):
                        # Find examples
                        matches = self.NS_PREFIX_RE.findall(content)[:3]
                        found_in.append(f"{entry}: {matches}")
                except Exception:
                    pass

        if found_in:
            self.warnings.append("Found ns0/ns1 style prefixes (may indicate serialization issue):")
            for item in found_in:
                self.warnings.append(f"  {item}")


def diff_docx(broken_path: str, repaired_path: str) -> List[str]:
    """
    Compare two DOCX files and show differences

    This helps identify exactly what Word changed during repair.
    """
    results = []
    results.append("=" * 80)
    results.append(f"DOCX DIFF: {broken_path} vs {repaired_path}")
    results.append("=" * 80)

    try:
        with zipfile.ZipFile(broken_path, 'r') as broken_zf, \
             zipfile.ZipFile(repaired_path, 'r') as repaired_zf:

            broken_entries = set(broken_zf.namelist())
            repaired_entries = set(repaired_zf.namelist())

            # Files only in broken
            only_broken = broken_entries - repaired_entries
            if only_broken:
                results.append("\nFILES REMOVED BY WORD REPAIR:")
                for f in sorted(only_broken):
                    results.append(f"  - {f}")

            # Files only in repaired
            only_repaired = repaired_entries - broken_entries
            if only_repaired:
                results.append("\nFILES ADDED BY WORD REPAIR:")
                for f in sorted(only_repaired):
                    results.append(f"  + {f}")

            # Compare common XML files
            common = broken_entries & repaired_entries
            xml_files = sorted(f for f in common if f.endswith('.xml') or f.endswith('.rels'))

            results.append("\nXML FILE DIFFERENCES:")
            for xml_file in xml_files:
                broken_content = broken_zf.read(xml_file).decode('utf-8', errors='replace')
                repaired_content = repaired_zf.read(xml_file).decode('utf-8', errors='replace')

                if broken_content != repaired_content:
                    results.append(f"\n--- {xml_file} (BROKEN)")
                    results.append(f"+++ {xml_file} (REPAIRED)")

                    # Pretty-print XML for better diff
                    try:
                        broken_lines = _format_xml(broken_content).splitlines(keepends=True)
                        repaired_lines = _format_xml(repaired_content).splitlines(keepends=True)
                    except:
                        broken_lines = broken_content.splitlines(keepends=True)
                        repaired_lines = repaired_content.splitlines(keepends=True)

                    diff = difflib.unified_diff(
                        broken_lines,
                        repaired_lines,
                        lineterm='',
                        n=2
                    )
                    diff_lines = list(diff)[2:]  # Skip header

                    if len(diff_lines) > 100:
                        results.append(f"  (showing first 100 of {len(diff_lines)} diff lines)")
                        diff_lines = diff_lines[:100]

                    for line in diff_lines:
                        results.append(f"  {line.rstrip()}")

            results.append("\n" + "=" * 80)

    except Exception as e:
        results.append(f"Error during diff: {e}")

    return results


def _format_xml(xml_str: str) -> str:
    """Pretty-print XML for readable diffs"""
    try:
        root = ET.fromstring(xml_str)
        ET.indent(root)
        return ET.tostring(root, encoding='unicode')
    except:
        return xml_str


def generate_test_report() -> io.BytesIO:
    """Generate a test report using the TemplateReportGenerator"""
    from datetime import datetime, timedelta
    import importlib.util

    # Direct import without going through __init__.py
    generator_paths = [
        '/Users/gedeko/Desktop/VKA_HUB/VKAHUB/backend/app/infrastructure/storage/template_report_generator.py',
        '/app/app/infrastructure/storage/template_report_generator.py',
    ]

    TemplateReportGenerator = None
    for gen_path in generator_paths:
        if os.path.exists(gen_path):
            spec = importlib.util.spec_from_file_location("template_report_generator", gen_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            TemplateReportGenerator = module.TemplateReportGenerator
            break

    if TemplateReportGenerator is None:
        raise ImportError(f"Could not import TemplateReportGenerator from: {generator_paths}")

    # Find template
    template_paths = [
        '/Users/gedeko/Desktop/VKA_HUB/VKAHUB/backend/raport_template.docx',
        '/app/raport_template.docx',
        'raport_template.docx'
    ]

    template_path = None
    for p in template_paths:
        if os.path.exists(p):
            template_path = p
            break

    if not template_path:
        raise FileNotFoundError(f"Template not found. Tried: {template_paths}")

    # Sample data with potential problem characters
    competition_data = {
        'name': 'Тестовый Хакатон 2025',
        'type': 'hackathon',
        'organizer': 'Тест Организатор',
        'start_date': datetime.now(),
        'end_date': datetime.now() + timedelta(days=2)
    }

    # Include some edge cases that might cause issues
    registrations = [
        {
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант'
                },
                {
                    'rank': 'Сержант',
                    'last_name': 'Петров',
                    'first_name': 'Петр',
                    'middle_name': 'Петрович',
                    'position': 'Программист'
                }
            ],
            'address': 'г. Санкт-Петербург, Лыжный пер., 4к3'
        },
        {
            'members': [
                {
                    'rank': None,  # Test None handling
                    'last_name': 'Сидоров',
                    'first_name': 'Сидор',
                    'middle_name': '',  # Test empty string
                    'position': None
                }
            ],
            'address': None  # Test None address
        }
    ]

    generator = TemplateReportGenerator(template_path, validate=True)
    return generator.generate(competition_data, registrations)


def main():
    parser = argparse.ArgumentParser(
        description='Comprehensive OOXML validator for DOCX files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ooxml_validator.py report.docx
  python ooxml_validator.py --diff broken.docx repaired.docx
  python ooxml_validator.py --generate-test
  python ooxml_validator.py --generate-test --save test_output.docx
        """
    )

    parser.add_argument('docx_path', nargs='?', help='Path to DOCX file to validate')
    parser.add_argument('--diff', nargs=2, metavar=('BROKEN', 'REPAIRED'),
                        help='Compare broken and repaired DOCX files')
    parser.add_argument('--generate-test', action='store_true',
                        help='Generate a test report and validate it')
    parser.add_argument('--save', metavar='PATH',
                        help='Save generated test report to file')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Show verbose output')

    args = parser.parse_args()

    if args.diff:
        results = diff_docx(args.diff[0], args.diff[1])
        for line in results:
            print(line)
        return

    if args.generate_test:
        print("=" * 80)
        print("GENERATING TEST REPORT")
        print("=" * 80)

        try:
            buffer = generate_test_report()

            if args.save:
                with open(args.save, 'wb') as f:
                    f.write(buffer.getvalue())
                print(f"Saved to: {args.save}")
                docx_path = args.save
            else:
                # Save to temp file for validation
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as f:
                    f.write(buffer.getvalue())
                    docx_path = f.name
                print(f"Temp file: {docx_path}")

            print("\n" + "=" * 80)
            print("VALIDATING GENERATED REPORT")
            print("=" * 80)

            validator = OOXMLValidator(docx_path)
            is_valid, errors, warnings, info = validator.validate()

            if args.verbose or not is_valid:
                print("\nINFO:")
                for i in info:
                    print(f"  [INFO] {i}")

            if warnings:
                print("\nWARNINGS:")
                for w in warnings:
                    print(f"  [WARN] {w}")

            if errors:
                print("\nERRORS:")
                for e in errors:
                    print(f"  [ERROR] {e}")

            print("\n" + "=" * 80)
            if is_valid:
                print("RESULT: VALID - No critical errors found")
            else:
                print("RESULT: INVALID - Errors found that will cause Word repair prompt")
            print("=" * 80)

            # Cleanup temp file if not saved
            if not args.save:
                os.unlink(docx_path)

            sys.exit(0 if is_valid else 1)

        except Exception as e:
            print(f"Error generating test report: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    if args.docx_path:
        print("=" * 80)
        print(f"OOXML VALIDATOR - {args.docx_path}")
        print("=" * 80)

        validator = OOXMLValidator(args.docx_path)
        is_valid, errors, warnings, info = validator.validate()

        print("\nINFO:")
        for i in info:
            print(f"  [INFO] {i}")

        if warnings:
            print("\nWARNINGS:")
            for w in warnings:
                print(f"  [WARN] {w}")

        if errors:
            print("\nERRORS:")
            for e in errors:
                print(f"  [ERROR] {e}")

        print("\n" + "=" * 80)
        if is_valid:
            print("RESULT: VALID")
        else:
            print("RESULT: INVALID - File will trigger Word repair prompt")
        print("=" * 80)

        sys.exit(0 if is_valid else 1)

    parser.print_help()


if __name__ == '__main__':
    main()

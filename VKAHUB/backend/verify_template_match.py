#!/usr/bin/env python3
"""
DOCX Template Verification Script
Compares generated DOCX against template to ensure formatting matches exactly
"""

import zipfile
import sys
import difflib
from pathlib import Path
from xml.etree import ElementTree as ET
from typing import Dict, List, Tuple


class DOCXVerifier:
    """Verify that generated DOCX matches template formatting"""

    NAMESPACES = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    }

    def __init__(self, template_path: str, generated_path: str):
        self.template_path = template_path
        self.generated_path = generated_path

    def verify(self) -> Tuple[bool, List[str]]:
        """
        Verify generated DOCX against template

        Returns:
            (is_valid, diff_report) where diff_report lists all differences
        """
        errors = []

        # Compare file structure
        template_files = self._get_zip_files(self.template_path)
        generated_files = self._get_zip_files(self.generated_path)

        if template_files != generated_files:
            errors.append("❌ ZIP file structure differs!")
            errors.append(f"  Template files: {sorted(template_files)}")
            errors.append(f"  Generated files: {sorted(generated_files)}")
        else:
            errors.append("✅ ZIP file structure matches")

        # Compare critical XML files (non-content)
        for xml_file in ['word/styles.xml', 'word/numbering.xml', 'word/settings.xml']:
            if self._compare_xml_files(xml_file, errors):
                errors.append(f"✅ {xml_file} matches")
            else:
                errors.append(f"❌ {xml_file} differs!")

        # Compare document.xml structure (not content)
        self._compare_document_structure(errors)

        # Generate diff report
        self._generate_content_diff(errors)

        is_valid = not any(line.startswith('❌') for line in errors)
        return is_valid, errors

    def _get_zip_files(self, docx_path: str) -> set:
        """Get list of files in DOCX zip"""
        with zipfile.ZipFile(docx_path, 'r') as z:
            return set(z.namelist())

    def _compare_xml_files(self, xml_path: str, errors: List[str]) -> bool:
        """Compare XML files byte-for-byte"""
        try:
            with zipfile.ZipFile(self.template_path, 'r') as tz:
                template_xml = tz.read(xml_path)

            with zipfile.ZipFile(self.generated_path, 'r') as gz:
                generated_xml = gz.read(xml_path)

            return template_xml == generated_xml
        except KeyError:
            errors.append(f"  ⚠️  {xml_path} not found in one or both files")
            return False

    def _compare_document_structure(self, errors: List[str]):
        """Compare document.xml paragraph structure"""
        try:
            # Read template document.xml
            with zipfile.ZipFile(self.template_path, 'r') as tz:
                template_xml = tz.read('word/document.xml')
            template_root = ET.fromstring(template_xml)

            # Read generated document.xml
            with zipfile.ZipFile(self.generated_path, 'r') as gz:
                generated_xml = gz.read('word/document.xml')
            generated_root = ET.fromstring(generated_xml)

            # Count paragraphs
            template_paras = template_root.findall('.//w:p', self.NAMESPACES)
            generated_paras = generated_root.findall('.//w:p', self.NAMESPACES)

            if len(template_paras) == len(generated_paras):
                errors.append(f"✅ Paragraph count matches: {len(template_paras)}")
            else:
                errors.append(f"❌ Paragraph count differs!")
                errors.append(f"  Template: {len(template_paras)} paragraphs")
                errors.append(f"  Generated: {len(generated_paras)} paragraphs")

            # Compare blank paragraphs (paragraphs with no text)
            template_blanks = self._count_blank_paragraphs(template_root)
            generated_blanks = self._count_blank_paragraphs(generated_root)

            if template_blanks == generated_blanks:
                errors.append(f"✅ Blank paragraph count matches: {template_blanks}")
            else:
                errors.append(f"❌ Blank paragraph count differs!")
                errors.append(f"  Template: {template_blanks} blank paragraphs")
                errors.append(f"  Generated: {generated_blanks} blank paragraphs")

        except Exception as e:
            errors.append(f"❌ Error comparing document structure: {str(e)}")

    def _count_blank_paragraphs(self, root: ET.Element) -> int:
        """Count paragraphs with no text"""
        count = 0
        for para in root.findall('.//w:p', self.NAMESPACES):
            text_elements = para.findall('.//w:t', self.NAMESPACES)
            if not text_elements or not any(t.text for t in text_elements):
                count += 1
        return count

    def _generate_content_diff(self, errors: List[str]):
        """Generate a diff of text content"""
        try:
            # Extract text from template
            with zipfile.ZipFile(self.template_path, 'r') as tz:
                template_xml = tz.read('word/document.xml')
            template_root = ET.fromstring(template_xml)
            template_text = self._extract_text_lines(template_root)

            # Extract text from generated
            with zipfile.ZipFile(self.generated_path, 'r') as gz:
                generated_xml = gz.read('word/document.xml')
            generated_root = ET.fromstring(generated_xml)
            generated_text = self._extract_text_lines(generated_root)

            # Generate diff
            errors.append("\n📄 Content Differences:")
            errors.append("=" * 80)

            differ = difflib.unified_diff(
                template_text,
                generated_text,
                fromfile='template',
                tofile='generated',
                lineterm=''
            )

            diff_lines = list(differ)
            if not diff_lines:
                errors.append("✅ No text differences (exact match)")
            else:
                errors.append(f"📝 Found {len([l for l in diff_lines if l.startswith('-') or l.startswith('+')])} text changes:")
                for line in diff_lines[:100]:  # Limit to first 100 lines
                    errors.append(line)
                if len(diff_lines) > 100:
                    errors.append(f"... ({len(diff_lines) - 100} more lines)")

        except Exception as e:
            errors.append(f"❌ Error generating content diff: {str(e)}")

    def _extract_text_lines(self, root: ET.Element) -> List[str]:
        """Extract text from XML as list of lines (one per paragraph)"""
        lines = []
        for para in root.findall('.//w:p', self.NAMESPACES):
            text_elements = para.findall('.//w:t', self.NAMESPACES)
            text = ''.join(t.text or '' for t in text_elements)
            lines.append(text)
        return lines


def main():
    """Main verification function"""
    import argparse

    parser = argparse.ArgumentParser(description='Verify DOCX template match')
    parser.add_argument('template', help='Path to template DOCX')
    parser.add_argument('generated', help='Path to generated DOCX')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    args = parser.parse_args()

    print("🔍 DOCX Template Verification")
    print("=" * 80)
    print(f"Template:  {args.template}")
    print(f"Generated: {args.generated}")
    print("=" * 80)

    verifier = DOCXVerifier(args.template, args.generated)
    is_valid, report = verifier.verify()

    for line in report:
        print(line)

    print("=" * 80)
    if is_valid:
        print("✅ VERIFICATION PASSED - Formatting matches!")
        return 0
    else:
        print("❌ VERIFICATION FAILED - Formatting differs!")
        return 1


if __name__ == '__main__':
    sys.exit(main())

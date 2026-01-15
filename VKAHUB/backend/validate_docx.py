#!/usr/bin/env python3
"""
DOCX Validation Diagnostic Tool
Validates that a generated DOCX is structurally valid and will open without repair prompts
"""

import zipfile
import sys
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from typing import List, Tuple


class DOCXValidator:
    """Validate DOCX structure and integrity"""

    REQUIRED_PARTS = [
        '[Content_Types].xml',
        '_rels/.rels',
        'word/document.xml',
    ]

    # Regex for illegal XML 1.0 control characters
    ILLEGAL_XML_CHARS_RE = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')

    # Pattern to detect incorrectly namespaced attributes
    BAD_ATTR_NAMESPACE_RE = re.compile(
        r'\{http://schemas\.openxmlformats\.org[^}]+\}(ascii|hAnsi|cs|val|eastAsia)='
    )

    def __init__(self, docx_path: str):
        self.docx_path = docx_path
        self.errors = []
        self.warnings = []

    def _check_invalid_xml_characters(self, zf: zipfile.ZipFile) -> List[str]:
        """
        Check for illegal XML 1.0 control characters in text content.

        These characters cause Word to show "unreadable content" repair prompts.

        Returns:
            List of warning/error messages
        """
        messages = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    matches = self.ILLEGAL_XML_CHARS_RE.findall(content)
                    if matches:
                        char_codes = [f"0x{ord(c):02x}" for c in set(matches)]
                        messages.append(
                            f"  ⚠️  {entry} contains illegal XML control characters: {char_codes}"
                        )
                except Exception as e:
                    messages.append(f"  ⚠️  Could not check {entry}: {e}")

        return messages

    def _check_attribute_namespaces(self, zf: zipfile.ZipFile) -> List[str]:
        """
        Check for incorrectly namespaced attributes in XML elements.

        In OOXML, element attributes like 'ascii', 'val', 'hAnsi' should NOT
        have namespace prefixes. Patterns like {http://...}ascii="value" are invalid.

        Returns:
            List of warning messages
        """
        messages = []

        for entry in zf.namelist():
            if entry.endswith('.xml'):
                try:
                    content = zf.read(entry).decode('utf-8', errors='replace')
                    matches = self.BAD_ATTR_NAMESPACE_RE.findall(content)
                    if matches:
                        messages.append(
                            f"  ⚠️  {entry} has incorrectly namespaced attributes: {set(matches)}"
                        )
                except Exception:
                    pass  # Skip files we can't read

        return messages

    def validate(self) -> Tuple[bool, List[str]]:
        """
        Validate DOCX file

        Returns:
            (is_valid, messages) - True if valid, False if errors found
        """
        messages = []

        # Check if file exists and is a valid ZIP
        if not Path(self.docx_path).exists():
            messages.append(f"❌ File not found: {self.docx_path}")
            return False, messages

        try:
            with zipfile.ZipFile(self.docx_path, 'r') as zf:
                # Check for ZIP integrity
                bad_file = zf.testzip()
                if bad_file:
                    messages.append(f"❌ ZIP corruption detected in: {bad_file}")
                    return False, messages
                else:
                    messages.append("✅ ZIP integrity OK")

                # Get all entries
                zip_entries = zf.namelist()
                messages.append(f"📦 ZIP contains {len(zip_entries)} entries")

                # Check for duplicates
                if len(zip_entries) != len(set(zip_entries)):
                    duplicates = [x for x in zip_entries if zip_entries.count(x) > 1]
                    messages.append(f"❌ Duplicate entries found: {set(duplicates)}")
                    return False, messages
                else:
                    messages.append("✅ No duplicate entries")

                # Check required parts exist
                missing_parts = []
                for required in self.REQUIRED_PARTS:
                    if required not in zip_entries:
                        missing_parts.append(required)

                if missing_parts:
                    messages.append(f"❌ Missing required parts: {missing_parts}")
                    return False, messages
                else:
                    messages.append(f"✅ All required parts present")

                # Validate XML files
                xml_files = [f for f in zip_entries if f.endswith('.xml') or f.endswith('.rels')]
                messages.append(f"🔍 Validating {len(xml_files)} XML files...")

                for xml_file in xml_files:
                    try:
                        xml_content = zf.read(xml_file)
                        # Try to parse
                        ET.fromstring(xml_content)
                        messages.append(f"  ✅ {xml_file} - well-formed")
                    except ET.ParseError as e:
                        messages.append(f"  ❌ {xml_file} - PARSE ERROR: {e}")
                        return False, messages
                    except Exception as e:
                        messages.append(f"  ⚠️  {xml_file} - {e}")

                # Check for invalid XML control characters
                messages.append("🔍 Checking for invalid XML characters...")
                char_warnings = self._check_invalid_xml_characters(zf)
                if char_warnings:
                    for warning in char_warnings:
                        messages.append(warning)
                else:
                    messages.append("  ✅ No illegal control characters found")

                # Check for incorrectly namespaced attributes
                messages.append("🔍 Checking attribute namespaces...")
                attr_warnings = self._check_attribute_namespaces(zf)
                if attr_warnings:
                    for warning in attr_warnings:
                        messages.append(warning)
                else:
                    messages.append("  ✅ Attribute namespaces OK")

                # Check relationships consistency
                if 'word/_rels/document.xml.rels' in zip_entries:
                    messages.append("🔗 Checking relationships...")
                    rels_xml = zf.read('word/_rels/document.xml.rels')
                    rels_root = ET.fromstring(rels_xml)

                    # Extract all targets
                    targets = []
                    for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                        target = rel.get('Target')
                        if target and not target.startswith('http'):
                            # Resolve relative path
                            if target.startswith('/'):
                                targets.append(target[1:])
                            else:
                                targets.append(f"word/{target}")

                    # Check if all targets exist
                    broken_refs = []
                    for target in targets:
                        if target not in zip_entries:
                            broken_refs.append(target)

                    if broken_refs:
                        messages.append(f"  ⚠️  Broken references (may cause issues): {broken_refs}")
                    else:
                        messages.append(f"  ✅ All {len(targets)} relationship targets exist")

        except zipfile.BadZipFile:
            messages.append("❌ File is not a valid ZIP archive")
            return False, messages
        except Exception as e:
            messages.append(f"❌ Validation error: {e}")
            return False, messages

        messages.append("\n✅ DOCX VALIDATION PASSED")
        return True, messages


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_docx.py <path_to_docx>")
        sys.exit(1)

    docx_path = sys.argv[1]

    print("=" * 80)
    print(f"DOCX Validator - {docx_path}")
    print("=" * 80)

    validator = DOCXValidator(docx_path)
    is_valid, messages = validator.validate()

    for msg in messages:
        print(msg)

    print("=" * 80)

    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Debug script to diagnose DOCX corruption from real endpoint.

This script:
1. Downloads the actual DOCX from /api/competitions/{id}/reports/generate
2. Validates it with multiple checks
3. Extracts XML for manual inspection
4. Provides detailed analysis

Usage:
    python debug_docx_corruption.py --competition-id 4 --output broken.docx
    python debug_docx_corruption.py --analyze broken.docx
    python debug_docx_corruption.py --diff broken.docx repaired.docx
    python debug_docx_corruption.py --extract broken.docx --output-dir extracted/
"""

import argparse
import hashlib
import io
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET


def download_report(
    competition_id: int,
    output_path: str,
    base_url: str = "http://localhost:3001",
    auth_token: Optional[str] = None
) -> bool:
    """
    Download report from the actual endpoint.

    Returns True if successful, False otherwise.
    """
    import urllib.request
    import urllib.error

    url = f"{base_url}/api/competitions/{competition_id}/reports/generate"
    print(f"Downloading from: {url}")

    try:
        request = urllib.request.Request(url)
        if auth_token:
            request.add_header("Authorization", f"Bearer {auth_token}")

        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()

            # Verify it's a valid ZIP (DOCX is ZIP)
            if not data.startswith(b'PK'):
                print(f"ERROR: Response is not a ZIP file. First bytes: {data[:20]}")
                return False

            # Save exact bytes
            with open(output_path, 'wb') as f:
                f.write(data)

            print(f"Saved {len(data)} bytes to {output_path}")
            print(f"MD5: {hashlib.md5(data).hexdigest()}")
            return True

    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        if e.code == 401:
            print("Authentication required. Use --token to provide JWT token.")
        return False
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        print("Is the backend running at the specified URL?")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False


def analyze_docx(docx_path: str, verbose: bool = False):
    """
    Comprehensive analysis of DOCX file for corruption issues.
    """
    print("=" * 80)
    print(f"ANALYZING: {docx_path}")
    print("=" * 80)

    if not os.path.exists(docx_path):
        print(f"ERROR: File not found: {docx_path}")
        return

    errors = []
    warnings = []
    info = []

    try:
        with zipfile.ZipFile(docx_path, 'r') as zf:
            entries = zf.namelist()
            info.append(f"ZIP contains {len(entries)} entries")

            # Check ZIP integrity
            bad = zf.testzip()
            if bad:
                errors.append(f"ZIP corruption in: {bad}")
            else:
                info.append("ZIP integrity: OK")

            # Check for required parts
            required = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']
            missing = [p for p in required if p not in entries]
            if missing:
                errors.append(f"Missing required parts: {missing}")

            # Analyze each XML file
            for entry in entries:
                if entry.endswith('.xml') or entry.endswith('.rels'):
                    content = zf.read(entry)
                    analyze_xml_part(entry, content, errors, warnings, info, verbose)

            # Check relationships
            check_relationships(zf, entries, errors, warnings, info)

    except zipfile.BadZipFile as e:
        errors.append(f"Invalid ZIP file: {e}")
    except Exception as e:
        errors.append(f"Analysis error: {e}")

    # Print results
    print("\n--- INFO ---")
    for i in info:
        print(f"  [INFO] {i}")

    if warnings:
        print("\n--- WARNINGS ---")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print("\n--- ERRORS (will cause Word repair prompt) ---")
        for e in errors:
            print(f"  [ERROR] {e}")

    print("\n" + "=" * 80)
    if errors:
        print("RESULT: INVALID - Word will show repair prompt")
    else:
        print("RESULT: No critical errors found")
    print("=" * 80)

    return len(errors) == 0


def analyze_xml_part(
    name: str,
    content: bytes,
    errors: list,
    warnings: list,
    info: list,
    verbose: bool
):
    """Analyze a single XML part for issues."""

    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError as e:
        errors.append(f"{name}: Invalid UTF-8 encoding at position {e.start}")
        return

    # Check 1: Well-formed XML
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        errors.append(f"{name}: XML parse error - {e}")
        return

    # Check 2: Illegal XML control characters
    illegal_re = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')
    illegal = illegal_re.findall(text)
    if illegal:
        chars = sorted(set(f"0x{ord(c):02x}" for c in illegal))
        errors.append(f"{name}: Contains illegal XML chars {chars}")
        # Find context
        for match in illegal_re.finditer(text):
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            context = text[start:end].replace('\n', '\\n')
            errors.append(f"  at position {match.start()}: ...{context}...")
            break

    # Check 3: Duplicate attributes (ROOT CAUSE of repair prompt)
    # Look for patterns like: attr="..." attr="..."
    dup_attr_re = re.compile(r'(\s)(\w+(?::\w+)?="[^"]*")(\s+)(\2)')
    for match in dup_attr_re.finditer(text):
        errors.append(f"{name}: Duplicate attribute found: {match.group(2)}")
        start = max(0, match.start() - 30)
        end = min(len(text), match.end() + 30)
        errors.append(f"  Context: ...{text[start:end]}...")

    # Check 4: Duplicate space attributes specifically
    dup_space_re = re.compile(r'space="[^"]*"[^>]*space="[^"]*"')
    for match in dup_space_re.finditer(text):
        errors.append(f"{name}: DUPLICATE SPACE ATTRIBUTE (root cause of Word repair)")
        start = max(0, match.start() - 20)
        end = min(len(text), match.end() + 20)
        errors.append(f"  Context: ...{text[start:end]}...")

    # Check 5: Look for ns0/ns1/ns2 prefixes on elements that shouldn't have them
    if name == '[Content_Types].xml':
        if '<ns0:' in text or '<ns1:' in text:
            warnings.append(f"{name}: Uses auto-generated namespace prefixes (ns0/ns1)")

    # Check 6: Invalid namespace declarations
    # Sometimes ElementTree outputs xmlns:ns0="..." xmlns:ns0="..." duplicates
    xmlns_counts = {}
    for match in re.finditer(r'xmlns:(\w+)="[^"]*"', text):
        prefix = match.group(1)
        xmlns_counts[prefix] = xmlns_counts.get(prefix, 0) + 1
    for prefix, count in xmlns_counts.items():
        if count > 1:
            errors.append(f"{name}: Duplicate xmlns declaration for prefix '{prefix}'")

    if verbose:
        info.append(f"{name}: OK (size={len(content)})")


def check_relationships(zf: zipfile.ZipFile, entries: set, errors: list, warnings: list, info: list):
    """Check that all relationship targets exist."""

    rels_files = [e for e in entries if e.endswith('.rels')]

    for rels_file in rels_files:
        try:
            content = zf.read(rels_file)
            root = ET.fromstring(content)

            # Determine base directory
            rels_dir = os.path.dirname(rels_file)
            if rels_dir.endswith('_rels'):
                base_dir = os.path.dirname(rels_dir)
            else:
                base_dir = rels_dir

            for rel in root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                target = rel.get('Target')
                rel_type = rel.get('Type', '')

                if not target:
                    continue

                # Skip external targets
                if target.startswith('http://') or target.startswith('https://'):
                    continue
                if 'External' in rel_type:
                    continue

                # Resolve path
                if target.startswith('/'):
                    resolved = target[1:]
                else:
                    resolved = os.path.normpath(os.path.join(base_dir, target)).replace('\\', '/')

                if resolved not in entries:
                    errors.append(f"{rels_file}: Broken reference to '{target}' (resolved: {resolved})")

        except Exception as e:
            warnings.append(f"Could not check {rels_file}: {e}")


def extract_docx(docx_path: str, output_dir: str):
    """Extract DOCX contents for manual inspection."""

    print(f"Extracting {docx_path} to {output_dir}")

    os.makedirs(output_dir, exist_ok=True)

    with zipfile.ZipFile(docx_path, 'r') as zf:
        for entry in zf.namelist():
            # Extract preserving directory structure
            target = os.path.join(output_dir, entry)
            os.makedirs(os.path.dirname(target), exist_ok=True)

            if entry.endswith('/'):
                continue

            content = zf.read(entry)

            # Pretty-print XML files
            if entry.endswith('.xml') or entry.endswith('.rels'):
                try:
                    root = ET.fromstring(content)
                    ET.indent(root)
                    content = ET.tostring(root, encoding='unicode')
                    with open(target, 'w', encoding='utf-8') as f:
                        f.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n')
                        f.write(content)
                except:
                    with open(target, 'wb') as f:
                        f.write(content)
            else:
                with open(target, 'wb') as f:
                    f.write(content)

            print(f"  Extracted: {entry}")

    print(f"\nExtracted to: {output_dir}")
    print("Key files to inspect:")
    print("  - word/document.xml (main content)")
    print("  - [Content_Types].xml")
    print("  - _rels/.rels")
    print("  - word/_rels/document.xml.rels")


def diff_docx(broken_path: str, repaired_path: str):
    """
    Compare broken and repaired DOCX files.

    This shows exactly what Word changed during repair.
    """
    import difflib

    print("=" * 80)
    print(f"DIFF: {broken_path} vs {repaired_path}")
    print("=" * 80)

    with zipfile.ZipFile(broken_path, 'r') as broken_zf, \
         zipfile.ZipFile(repaired_path, 'r') as repaired_zf:

        broken_entries = set(broken_zf.namelist())
        repaired_entries = set(repaired_zf.namelist())

        # Files removed by Word
        removed = broken_entries - repaired_entries
        if removed:
            print("\n--- FILES REMOVED BY WORD ---")
            for f in sorted(removed):
                print(f"  - {f}")

        # Files added by Word
        added = repaired_entries - broken_entries
        if added:
            print("\n--- FILES ADDED BY WORD ---")
            for f in sorted(added):
                print(f"  + {f}")

        # Compare common files
        common = broken_entries & repaired_entries
        xml_files = sorted(f for f in common if f.endswith('.xml') or f.endswith('.rels'))

        print("\n--- XML DIFFERENCES ---")

        for xml_file in xml_files:
            broken_content = broken_zf.read(xml_file)
            repaired_content = repaired_zf.read(xml_file)

            if broken_content == repaired_content:
                continue

            print(f"\n### {xml_file} ###")

            # Pretty print for better diff
            try:
                broken_root = ET.fromstring(broken_content)
                ET.indent(broken_root)
                broken_text = ET.tostring(broken_root, encoding='unicode')
            except:
                broken_text = broken_content.decode('utf-8', errors='replace')

            try:
                repaired_root = ET.fromstring(repaired_content)
                ET.indent(repaired_root)
                repaired_text = ET.tostring(repaired_root, encoding='unicode')
            except:
                repaired_text = repaired_content.decode('utf-8', errors='replace')

            # Generate diff
            broken_lines = broken_text.splitlines(keepends=True)
            repaired_lines = repaired_text.splitlines(keepends=True)

            diff = list(difflib.unified_diff(
                broken_lines,
                repaired_lines,
                fromfile=f"{xml_file} (BROKEN)",
                tofile=f"{xml_file} (REPAIRED)",
                n=2
            ))

            if len(diff) > 200:
                print(f"(Showing first 200 of {len(diff)} diff lines)")
                diff = diff[:200]

            for line in diff:
                print(line.rstrip())

    print("\n" + "=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description='Debug DOCX corruption from real endpoint',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download from endpoint (requires auth token for moderator endpoint)
  python debug_docx_corruption.py --download --competition-id 4 --output broken.docx --token <jwt>

  # Analyze a DOCX file
  python debug_docx_corruption.py --analyze broken.docx

  # Extract DOCX for manual inspection
  python debug_docx_corruption.py --extract broken.docx --output-dir extracted/

  # Diff broken vs Word-repaired
  python debug_docx_corruption.py --diff broken.docx repaired.docx
        """
    )

    parser.add_argument('--download', action='store_true', help='Download from endpoint')
    parser.add_argument('--competition-id', type=int, help='Competition ID to download')
    parser.add_argument('--base-url', default='http://localhost:3001', help='Backend URL')
    parser.add_argument('--token', help='JWT auth token')
    parser.add_argument('--output', '-o', help='Output file path')

    parser.add_argument('--analyze', metavar='DOCX', help='Analyze DOCX file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    parser.add_argument('--extract', metavar='DOCX', help='Extract DOCX contents')
    parser.add_argument('--output-dir', help='Directory for extracted files')

    parser.add_argument('--diff', nargs=2, metavar=('BROKEN', 'REPAIRED'), help='Diff two DOCX files')

    args = parser.parse_args()

    if args.download:
        if not args.competition_id:
            parser.error("--download requires --competition-id")
        output = args.output or f"broken_competition_{args.competition_id}.docx"
        success = download_report(
            args.competition_id,
            output,
            args.base_url,
            args.token
        )
        if success:
            print(f"\nNow analyze with: python {sys.argv[0]} --analyze {output}")
        sys.exit(0 if success else 1)

    if args.analyze:
        valid = analyze_docx(args.analyze, args.verbose)
        sys.exit(0 if valid else 1)

    if args.extract:
        output_dir = args.output_dir or f"{Path(args.extract).stem}_extracted"
        extract_docx(args.extract, output_dir)
        sys.exit(0)

    if args.diff:
        diff_docx(args.diff[0], args.diff[1])
        sys.exit(0)

    parser.print_help()


if __name__ == '__main__':
    main()

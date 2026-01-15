#!/usr/bin/env python3
"""
Generate a test report locally using the same code path as the endpoint.

This mimics /api/competitions/{id}/reports/generate without needing authentication.
"""

import importlib.util
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Direct import to avoid __init__.py dependencies
def import_generator():
    gen_path = Path(__file__).parent / 'app/infrastructure/storage/template_report_generator.py'
    if not gen_path.exists():
        gen_path = '/app/app/infrastructure/storage/template_report_generator.py'

    spec = importlib.util.spec_from_file_location("template_report_generator", gen_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.TemplateReportGenerator


def main():
    output_path = sys.argv[1] if len(sys.argv) > 1 else 'test_report_local.docx'

    # Find template
    template_paths = [
        Path(__file__).parent / 'raport_template.docx',
        '/app/raport_template.docx',
    ]

    template_path = None
    for p in template_paths:
        if os.path.exists(p):
            template_path = str(p)
            break

    if not template_path:
        print(f"ERROR: Template not found. Tried: {template_paths}")
        sys.exit(1)

    print(f"Using template: {template_path}")

    # Sample data that mimics real database content
    # This includes edge cases that might cause issues
    competition_data = {
        'name': 'Всероссийский хакатон по кибербезопасности 2025',
        'type': 'hackathon',
        'organizer': 'Министерство цифрового развития РФ',
        'start_date': datetime(2025, 3, 15, 10, 0),
        'end_date': datetime(2025, 3, 17, 18, 0)
    }

    # Multiple teams with various data patterns
    registrations_data = [
        {
            'members': [
                {
                    'rank': 'Рядовой',
                    'last_name': 'Иванов',
                    'first_name': 'Иван',
                    'middle_name': 'Иванович',
                    'position': 'Курсант 3 курса'
                },
                {
                    'rank': 'Сержант',
                    'last_name': 'Петров',
                    'first_name': 'Петр',
                    'middle_name': 'Петрович',
                    'position': 'Программист'
                },
                {
                    'rank': 'Ефрейтор',
                    'last_name': 'Сидоров',
                    'first_name': 'Сергей',
                    'middle_name': 'Сергеевич',
                    'position': 'Аналитик'
                }
            ],
            'address': 'г. Санкт-Петербург, ул. Можайского, д. 1'
        },
        {
            'members': [
                {
                    'rank': None,  # Test None handling
                    'last_name': 'Козлов',
                    'first_name': 'Алексей',
                    'middle_name': '',  # Test empty string
                    'position': None
                }
            ],
            'address': 'г. Москва, ул. Ленина, д. 10'
        },
        {
            'members': [
                {
                    'rank': 'Младший сержант',
                    'last_name': 'Николаев',
                    'first_name': 'Николай',
                    'middle_name': 'Николаевич',
                    'position': 'Специалист по защите информации'
                },
                {
                    'rank': 'Рядовой',
                    'last_name': 'Федоров',
                    'first_name': 'Федор',
                    'middle_name': 'Федорович',
                    'position': 'Разработчик'
                }
            ],
            'address': None  # Test None address
        }
    ]

    print(f"Generating report with {len(registrations_data)} teams...")

    TemplateReportGenerator = import_generator()
    generator = TemplateReportGenerator(template_path)
    buffer = generator.generate(competition_data, registrations_data)

    # Save to file
    with open(output_path, 'wb') as f:
        f.write(buffer.getvalue())

    print(f"Report saved to: {output_path}")
    print(f"Size: {len(buffer.getvalue())} bytes")

    # Quick validation
    import zipfile
    from xml.etree import ElementTree as ET

    print("\n--- Quick Validation ---")
    errors = []

    with zipfile.ZipFile(output_path, 'r') as zf:
        # Check ZIP integrity
        if zf.testzip():
            errors.append("ZIP corruption detected")
        else:
            print("ZIP integrity: OK")

        # Check for duplicate space attributes
        doc_xml = zf.read('word/document.xml').decode('utf-8')
        import re
        dup_space = re.findall(r'space="[^"]*"[^>]*space="[^"]*"', doc_xml)
        if dup_space:
            errors.append(f"DUPLICATE SPACE ATTRIBUTES: {len(dup_space)} found")
            print(f"  Example: {dup_space[0][:100]}...")
        else:
            print("Duplicate space attrs: None")

        # Check for illegal chars
        illegal = re.findall(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', doc_xml)
        if illegal:
            errors.append(f"ILLEGAL XML CHARS: {len(illegal)} found")
        else:
            print("Illegal XML chars: None")

        # Check XML well-formed
        try:
            ET.fromstring(zf.read('word/document.xml'))
            print("XML well-formed: OK")
        except ET.ParseError as e:
            errors.append(f"XML parse error: {e}")

    if errors:
        print("\n*** ERRORS FOUND ***")
        for e in errors:
            print(f"  - {e}")
        print("\nThis file WILL trigger Word repair prompt!")
        sys.exit(1)
    else:
        print("\nNo critical errors found.")
        print(f"\nOpen {output_path} in Microsoft Word to verify no repair prompt.")


if __name__ == '__main__':
    main()

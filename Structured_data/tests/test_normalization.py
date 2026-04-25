import json
import tempfile
import unittest
from pathlib import Path

from scripts.generate_sample_data import write_csv, write_docx, write_excel

import normalize_students


class TestStudentNormalization(unittest.TestCase):
    def test_end_to_end_sample_extraction_and_normalization(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            input_dir = tmp_path / "sample_data"
            out_dir = tmp_path / "normalized"

            write_csv(input_dir / "students_institute_a.csv")
            write_excel(input_dir / "students_institute_b.xlsx")
            write_docx(input_dir / "students_institute_c.docx")

            # Normalize all files
            for f in normalize_students.iter_input_files(input_dir):
                normalize_students.normalize_file(f, out_dir=out_dir, default_institution=None)

            # Validate output files exist
            a_json = out_dir / "students_institute_a.json"
            b_json = out_dir / "students_institute_b.json"
            c_json = out_dir / "students_institute_c.json"
            self.assertTrue(a_json.exists())
            self.assertTrue(b_json.exists())
            self.assertTrue(c_json.exists())

            # Validate CSV extraction correctness
            a_payload = json.loads(a_json.read_text(encoding="utf-8"))
            self.assertEqual(a_payload.get("warnings"), [])
            self.assertIn("students", a_payload)
            self.assertEqual(set(a_payload["students"].keys()), {"A-001", "A-002"})
            self.assertEqual(a_payload["students"]["A-001"]["first_name"], "Aya")
            self.assertEqual(a_payload["students"]["A-001"]["last_name"], "Benali")
            self.assertEqual(a_payload["students"]["A-001"]["date_of_birth"], "2004-01-13")
            self.assertEqual(a_payload["students"]["A-001"]["gender"], "F")
            self.assertEqual(a_payload["students"]["A-001"]["email"], "aya.benali@example.com")

            # Validate Excel extraction correctness (alias columns → canonical fields)
            b_payload = json.loads(b_json.read_text(encoding="utf-8"))
            self.assertEqual(b_payload.get("warnings"), [])
            self.assertEqual(set(b_payload["students"].keys()), {"B-1001", "B-1002"})
            self.assertEqual(b_payload["students"]["B-1001"]["institution"], "Institute B")
            self.assertEqual(b_payload["students"]["B-1001"]["program"], "Physics")
            self.assertEqual(b_payload["students"]["B-1001"]["enrollment_year"], 2023)

            # Validate DOCX table extraction + paragraph inference
            c_payload = json.loads(c_json.read_text(encoding="utf-8"))
            self.assertEqual(c_payload.get("warnings"), [])
            self.assertEqual(set(c_payload["students"].keys()), {"C-77", "C-78"})
            self.assertEqual(c_payload["students"]["C-77"]["institution"], "Institute C")
            self.assertEqual(c_payload["students"]["C-77"]["program"], "Civil Engineering")
            self.assertEqual(c_payload["students"]["C-78"]["gender"], "M")

            # Global invariants
            for payload in (a_payload, b_payload, c_payload):
                students = payload["students"]
                for student_id, record in students.items():
                    self.assertEqual(record.get("student_id"), student_id)
                    self.assertTrue(record.get("first_name"))


if __name__ == "__main__":
    unittest.main()

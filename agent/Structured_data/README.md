# UCAR-EduSync
To modernize education administration by transforming fragmented student records into a unified, intelligent, and efficient management system.

## Hackathon demo: student data normalization → JSON

This repo contains a small **normalization pipeline** that reads heterogeneous student files from multiple institutions:

- CSV (`.csv`)
- Excel (`.xlsx`, `.xls`)
- Word (`.docx`, table-based)

…and outputs **normalized JSON**.

### 1) Setup

```bash
python -m pip install -r requirements.txt
```

### 2) Generate simulation (dump) data

```bash
python scripts/generate_sample_data.py
```

This creates a `sample_data/` folder with:

- `students_institute_a.csv`
- `students_institute_b.xlsx`
- `students_institute_c.docx`

### 3) Normalize to JSON

```bash
python normalize_students.py --input sample_data --output normalized
```

You will get one JSON file per input file, e.g. `normalized/students_institute_a.json`.

### Validation test

Run the automated extraction/normalization validation:

```bash
py -m unittest discover -s tests -p "test_*.py" -v
```

Save the test output to a text file:

```bash
py scripts/run_tests_save_report.py --out test-results.txt
```

### Output format

Each output JSON has:

- `source_file`: the original file path
- `students`: a dictionary keyed by `student_id`
- `warnings`: extraction warnings (if any)

Example shape:

```json
{
	"source_file": ".../students_institute_a.csv",
	"students": {
		"A-001": {
			"student_id": "A-001",
			"first_name": "Aya",
			"last_name": "Benali",
			"date_of_birth": "2004-01-13",
			"gender": "F",
			"email": "aya.benali@example.com",
			"phone": "+213555000111",
			"institution": "Institute A",
			"program": "Computer Science",
			"enrollment_year": 2022
		}
	},
	"warnings": []
}
```

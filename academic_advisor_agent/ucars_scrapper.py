"""
ucars_scrapper.py
-----------------
Builds a grade-aware academic catalog for a given student.
Loads student profile from unification_json_db and returns
a structured catalog of certifications + specializations 
relevant to their program and academic year (grade level).

In a production system this would query a live UCAR catalog API.
Currently uses a curated knowledge base that can be extended.
"""

import json
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
UNIFIED_DB_DIR = BASE_DIR / "unification_json_db"

# ─────────────────────────────────────────────
# UCAR Academic Catalog (extend as needed)
# ─────────────────────────────────────────────
CATALOG = {
    "Computer Science": {
        "certifications": [
            {
                "name": "Python for Everybody",
                "provider": "Coursera / University of Michigan",
                "difficulty": "Beginner",
                "min_grade": 1,
                "estimated_duration": "4 weeks",
                "url": "https://www.coursera.org/specializations/python",
                "tags": ["python", "programming", "data"]
            },
            {
                "name": "Google IT Support Certificate",
                "provider": "Google / Coursera",
                "difficulty": "Beginner",
                "min_grade": 1,
                "estimated_duration": "6 months",
                "url": "https://www.coursera.org/professional-certificates/google-it-support",
                "tags": ["IT", "support", "networking"]
            },
            {
                "name": "IBM Data Science Professional Certificate",
                "provider": "IBM / Coursera",
                "difficulty": "Intermediate",
                "min_grade": 2,
                "estimated_duration": "3 months",
                "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
                "tags": ["data science", "AI", "machine learning"]
            },
            {
                "name": "AWS Cloud Practitioner",
                "provider": "Amazon Web Services",
                "difficulty": "Intermediate",
                "min_grade": 2,
                "estimated_duration": "6 weeks",
                "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
                "tags": ["cloud", "AWS", "infrastructure"]
            },
            {
                "name": "TensorFlow Developer Certificate",
                "provider": "Google",
                "difficulty": "Advanced",
                "min_grade": 3,
                "estimated_duration": "3 months",
                "url": "https://www.tensorflow.org/certificate",
                "tags": ["deep learning", "AI", "neural networks"]
            },
            {
                "name": "Certified Kubernetes Application Developer (CKAD)",
                "provider": "CNCF / Linux Foundation",
                "difficulty": "Advanced",
                "min_grade": 3,
                "estimated_duration": "2 months",
                "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/",
                "tags": ["DevOps", "containers", "cloud-native"]
            }
        ],
        "specializations": [
            {
                "name": "Artificial Intelligence & Machine Learning",
                "description": "Deep dive into ML algorithms, neural networks, and AI applications.",
                "career_paths": ["AI Engineer", "Data Scientist", "Research Scientist"],
                "prerequisites": "Calculus, Linear Algebra, Python",
                "min_grade": 2
            },
            {
                "name": "Cybersecurity",
                "description": "Network security, ethical hacking, and secure software development.",
                "career_paths": ["Security Analyst", "Penetration Tester", "SOC Engineer"],
                "prerequisites": "Networking fundamentals, Operating Systems",
                "min_grade": 2
            },
            {
                "name": "Cloud & DevOps Engineering",
                "description": "CI/CD pipelines, containerization, and cloud architecture.",
                "career_paths": ["DevOps Engineer", "Cloud Architect", "SRE"],
                "prerequisites": "Linux basics, basic programming",
                "min_grade": 2
            },
            {
                "name": "Software Engineering",
                "description": "Full-stack development, design patterns, agile methodologies.",
                "career_paths": ["Full-Stack Developer", "Software Architect", "Tech Lead"],
                "prerequisites": "Object-oriented programming",
                "min_grade": 1
            }
        ],
        "continuation_pathways": [
            {"degree": "Master of Science in Computer Science", "institution": "Multiple UCAR Partners", "description": "Research or industry-focused graduate track"},
            {"degree": "Master of Science in Data Science", "institution": "UCAR Network Institutions", "description": "Advanced analytics and big data specialization"},
            {"degree": "MBA in Technology Management", "institution": "Business Schools (UCAR Partners)", "description": "Tech leadership and entrepreneurship track"}
        ]
    },
    "Mathematics": {
        "certifications": [
            {
                "name": "Introduction to Mathematical Thinking",
                "provider": "Stanford / Coursera",
                "difficulty": "Beginner",
                "min_grade": 1,
                "estimated_duration": "4 weeks",
                "url": "https://www.coursera.org/learn/mathematical-thinking",
                "tags": ["logic", "proofs", "foundations"]
            },
            {
                "name": "Statistical Learning (StatLearning)",
                "provider": "Stanford Online",
                "difficulty": "Intermediate",
                "min_grade": 2,
                "estimated_duration": "8 weeks",
                "url": "https://online.stanford.edu/courses/sohs-ystatslearning-statistical-learning",
                "tags": ["statistics", "machine learning", "data analysis"]
            },
            {
                "name": "SAS Certified Specialist: Base Programming",
                "provider": "SAS Institute",
                "difficulty": "Intermediate",
                "min_grade": 2,
                "estimated_duration": "6 weeks",
                "url": "https://www.sas.com/en_us/certification/credentials/foundation-tools/base-programming-specialist.html",
                "tags": ["statistics", "data", "programming"]
            },
            {
                "name": "Actuarial Exam P (Probability)",
                "provider": "Society of Actuaries",
                "difficulty": "Advanced",
                "min_grade": 3,
                "estimated_duration": "3 months",
                "url": "https://www.soa.org/education/exam-req/edu-exam-p-detail/",
                "tags": ["actuarial", "finance", "probability"]
            }
        ],
        "specializations": [
            {
                "name": "Applied Statistics & Data Analysis",
                "description": "Statistical modelling, hypothesis testing, and data-driven decision making.",
                "career_paths": ["Statistician", "Data Analyst", "Quantitative Researcher"],
                "prerequisites": "Probability Theory, Calculus",
                "min_grade": 2
            },
            {
                "name": "Actuarial Science",
                "description": "Risk assessment, financial mathematics, and insurance applications.",
                "career_paths": ["Actuary", "Risk Analyst", "Financial Modeller"],
                "prerequisites": "Probability, Finance basics",
                "min_grade": 2
            },
            {
                "name": "Computational Mathematics",
                "description": "Numerical methods, simulations, and scientific computing.",
                "career_paths": ["Computational Scientist", "Quantitative Developer"],
                "prerequisites": "Calculus, Programming",
                "min_grade": 1
            }
        ],
        "continuation_pathways": [
            {"degree": "Master of Science in Mathematics", "institution": "UCAR Partner Universities", "description": "Pure or Applied Mathematics research"},
            {"degree": "Master of Science in Statistics", "institution": "UCAR Network", "description": "Advanced statistical methods"},
            {"degree": "Master of Financial Engineering", "institution": "Business & Engineering Faculties", "description": "Quantitative finance track"}
        ]
    },
    "Chemistry": {
        "certifications": [
            {
                "name": "Introduction to Chemistry: Reactions and Ratios",
                "provider": "Duke University / Coursera",
                "difficulty": "Beginner",
                "min_grade": 1,
                "estimated_duration": "4 weeks",
                "url": "https://www.coursera.org/learn/intro-chemistry",
                "tags": ["chemistry", "reactions", "fundamentals"]
            },
            {
                "name": "Laboratory Safety Certification",
                "provider": "American Chemical Society",
                "difficulty": "Beginner",
                "min_grade": 1,
                "estimated_duration": "1 week",
                "url": "https://www.acs.org/content/acs/en/chemical-safety.html",
                "tags": ["safety", "lab", "compliance"]
            },
            {
                "name": "Bioinformatics Specialization",
                "provider": "UCSD / Coursera",
                "difficulty": "Intermediate",
                "min_grade": 2,
                "estimated_duration": "8 weeks",
                "url": "https://www.coursera.org/specializations/bioinformatics",
                "tags": ["bioinformatics", "genomics", "computational biology"]
            },
            {
                "name": "Certified Chemical Engineer (AIChE)",
                "provider": "American Institute of Chemical Engineers",
                "difficulty": "Advanced",
                "min_grade": 3,
                "estimated_duration": "Exam-based",
                "url": "https://www.aiche.org/",
                "tags": ["chemical engineering", "process", "professional"]
            }
        ],
        "specializations": [
            {
                "name": "Biochemistry & Biotechnology",
                "description": "Molecular biology, enzymology, and biotechnology applications.",
                "career_paths": ["Biochemist", "Biotech Researcher", "Pharmaceutical Scientist"],
                "prerequisites": "Organic Chemistry, Biology",
                "min_grade": 2
            },
            {
                "name": "Environmental Chemistry",
                "description": "Pollution analysis, green chemistry, and sustainability.",
                "career_paths": ["Environmental Analyst", "Sustainability Consultant"],
                "prerequisites": "General Chemistry",
                "min_grade": 1
            },
            {
                "name": "Analytical Chemistry",
                "description": "Spectroscopy, chromatography, and quantitative chemical analysis.",
                "career_paths": ["Analytical Chemist", "Quality Control Specialist", "Lab Director"],
                "prerequisites": "General and Organic Chemistry",
                "min_grade": 2
            }
        ],
        "continuation_pathways": [
            {"degree": "Master of Science in Chemistry", "institution": "UCAR Partner Universities", "description": "Research or industry chemistry"},
            {"degree": "Master of Science in Chemical Engineering", "institution": "Engineering Faculties", "description": "Process design and industrial chemistry"},
            {"degree": "Doctor of Pharmacy (PharmD)", "institution": "Pharmacy Schools", "description": "Pharmaceutical sciences track"}
        ]
    }
}

# Default catalog for unlisted programs
DEFAULT_CATALOG = {
    "certifications": [
        {
            "name": "Project Management Essentials",
            "provider": "PMI / Coursera",
            "difficulty": "Beginner",
            "min_grade": 1,
            "estimated_duration": "3 weeks",
            "url": "https://www.pmi.org/certifications",
            "tags": ["project management", "leadership"]
        },
        {
            "name": "Critical Thinking & Problem Solving",
            "provider": "Rochester Institute of Technology / edX",
            "difficulty": "Beginner",
            "min_grade": 1,
            "estimated_duration": "2 weeks",
            "url": "https://www.edx.org",
            "tags": ["soft skills", "thinking", "analysis"]
        }
    ],
    "specializations": [
        {
            "name": "Interdisciplinary Research",
            "description": "Cross-domain research combining multiple fields.",
            "career_paths": ["Research Associate", "Academic Researcher", "Consultant"],
            "prerequisites": "Strong academic foundation",
            "min_grade": 2
        }
    ],
    "continuation_pathways": [
        {"degree": "Master's in your field", "institution": "UCAR Partner Institutions", "description": "Advanced study in your specific discipline"}
    ]
}


def load_student(student_id: str) -> dict:
    """Load a student's unified profile JSON by student_id."""
    student_id_norm = student_id.lower().replace(" ", "_")
    
    # Try direct match first
    for filepath in UNIFIED_DB_DIR.glob("*.json"):
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if str(data.get("student_id", "")).lower() == student_id.lower():
                    return data
            except json.JSONDecodeError:
                continue
    return None


def compute_grade_level(enrollment_year: int) -> int:
    """Compute the student's grade level from their enrollment year."""
    current_year = datetime.now().year
    years_enrolled = current_year - enrollment_year
    return max(1, min(years_enrolled + 1, 3))


def get_catalog_for_student(student: dict) -> dict:
    """
    Returns a grade-appropriate catalog of certifications and specializations
    for a given student profile dict.
    """
    program = student.get("program", "General")
    enrollment_year = student.get("enrollment_year", datetime.now().year)
    grade = compute_grade_level(enrollment_year)

    raw_catalog = CATALOG.get(program, DEFAULT_CATALOG)

    # Filter by grade level
    filtered_certs = [
        c for c in raw_catalog.get("certifications", [])
        if c.get("min_grade", 1) <= grade
    ]
    filtered_specs = [
        s for s in raw_catalog.get("specializations", [])
        if s.get("min_grade", 1) <= grade
    ]

    return {
        "program": program,
        "grade_level": grade,
        "enrollment_year": enrollment_year,
        "available_certifications": filtered_certs,
        "available_specializations": filtered_specs,
        "continuation_pathways": raw_catalog.get("continuation_pathways", [])
    }


def get_student_with_catalog(student_id: str) -> dict:
    """
    Full pipeline: load student profile + build their personalized catalog.
    Returns a combined dict ready to be sent to the LLM.
    """
    student = load_student(student_id)
    if not student:
        return {"error": f"Student '{student_id}' not found in unified database."}

    catalog = get_catalog_for_student(student)

    return {
        "student_profile": student,
        "academic_catalog": catalog
    }


if __name__ == "__main__":
    # Quick test
    import sys
    sid = sys.argv[1] if len(sys.argv) > 1 else "B-1002"
    result = get_student_with_catalog(sid)
    print(json.dumps(result, indent=2))

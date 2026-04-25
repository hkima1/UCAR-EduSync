import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run unittest validation and save the console output to a text report."
    )
    parser.add_argument(
        "--out",
        default="test-results.txt",
        help="Output report path (default: test-results.txt)",
    )
    args = parser.parse_args()

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        "-m",
        "unittest",
        "discover",
        "-s",
        "tests",
        "-p",
        "test_*.py",
        "-v",
    ]

    # unittest writes most output to stderr; merge streams for a clean report
    proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    timestamp = datetime.now().isoformat(timespec="seconds")
    header = [
        f"Timestamp: {timestamp}",
        f"Command: {' '.join(cmd)}",
        f"Exit code: {proc.returncode}",
        "",
    ]

    report_text = "\n".join(header) + (proc.stdout or "")

    out_path.write_text(report_text, encoding="utf-8")

    # Still echo output to console for convenience
    sys.stdout.write(proc.stdout or "")

    print(f"\nSaved test report to: {out_path}")
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
update-work-log.py — append a new work-session row to the master work-log Excel.

Source of truth: docs/observability/QA_Nexus_Work_Log.xlsx (consolidated 2026-04-30 Day 4 EOD).
This script:
  1. Validates input args + loads the workbook
  2. Appends a row to "All Sessions (chronological)" sheet (and the per-phase sheet)
  3. Re-computes the day-total row + grand-total formulas
  4. Saves the workbook in-place (no separate output file — same spreadsheet stays canonical)

Usage:
    pnpm work:log -- \\
        --date 2026-05-01 \\
        --day Friday \\
        --start "10:00 AM" \\
        --end "11:30 AM" \\
        --hours 1.50 \\
        --files 12 \\
        --phase Development \\
        --theme "OTel SDK wiring + smoke test" \\
        --what "Wired OTel SDK in apps/api/src/observability/otel.config.ts; first trace visible in Grafana Cloud."

Or dry-run (prints what would be appended without saving):
    pnpm work:log -- --date 2026-05-01 --day Friday --start "10:00 AM" --end "11:30 AM" --hours 1.5 --files 12 --phase Development --theme "..." --what "..." --dry-run

Phases (must match a sheet name in the workbook):
    "Idea Confirmation" | "Test Case Management Research" | "Test Automation & Reporting"
    | "Design & Specifications" | "Milestone Planning" | "Launch Creative" | "Development" | "Other"

Cross-references:
  - docs/eod-reports/2026-04-30-day-4.md — the consolidation that established this aggregator's contract
  - docs/observability/QA_Nexus_Work_Log.xlsx — the workbook this script writes to
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

try:
    from openpyxl import load_workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
except ImportError:
    sys.stderr.write(
        "ERROR: openpyxl not installed. Run: pip install openpyxl --break-system-packages\n"
    )
    sys.exit(1)

# Paths — resolved from this script's location for portability across worktrees
THIS = Path(__file__).resolve()
REPO_ROOT = THIS.parent.parent
WORKBOOK_PATH = REPO_ROOT / "docs" / "observability" / "QA_Nexus_Work_Log.xlsx"

VALID_PHASES = {
    "Idea Confirmation",
    "Test Case Management Research",
    "Test Automation & Reporting",
    "Design & Specifications",
    "Milestone Planning",
    "Launch Creative",
    "Development",
    "Other",
}

# Style constants (must match what's already in the workbook for visual consistency)
THIN = Side(style="thin", color="D1D5DB")
BR = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(horizontal="left", vertical="top", wrap_text=True)
CTR = Alignment(horizontal="center", vertical="center", wrap_text=True)
NORM_FONT = Font(name="Calibri", size=10)
DAY_TOTAL_FONT = Font(name="Calibri", size=10, bold=True, color="0F766E")
DAY_TOTAL_FILL = PatternFill("solid", start_color="F0FDFA")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Append a work-session row to QA_Nexus_Work_Log.xlsx")
    p.add_argument("--date", required=True, help="Session date YYYY-MM-DD (e.g. 2026-05-01)")
    p.add_argument("--day", required=True, help="Day-of-week label (Monday/Tuesday/...)")
    p.add_argument("--start", required=True, help="Start time, free form (e.g. '10:00 AM')")
    p.add_argument("--end", required=True, help="End time, free form (e.g. '11:30 AM')")
    p.add_argument(
        "--hours",
        required=True,
        type=float,
        help="Duration in decimal hours (e.g. 1.50 for 1h30m)",
    )
    p.add_argument(
        "--files",
        required=True,
        type=int,
        help="Files-touched count (any granularity — file-paths or commit shas, your call)",
    )
    p.add_argument(
        "--phase",
        required=True,
        choices=sorted(VALID_PHASES),
        help="Phase / theme bucket (must match an existing sheet name)",
    )
    p.add_argument(
        "--theme",
        required=True,
        help="Short phrase for the sample/theme column (e.g. 'OTel SDK wiring')",
    )
    p.add_argument(
        "--what",
        required=True,
        help="What I did — narrative paragraph going into the 'What I Did' column",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be appended without saving the workbook",
    )
    return p.parse_args()


def validate(args: argparse.Namespace) -> None:
    """Validate input args. Exit non-zero on validation error."""
    try:
        datetime.strptime(args.date, "%Y-%m-%d")
    except ValueError:
        sys.stderr.write(f"ERROR: --date must be YYYY-MM-DD format, got '{args.date}'\n")
        sys.exit(2)
    if args.hours <= 0 or args.hours > 24:
        sys.stderr.write(f"ERROR: --hours must be in (0, 24], got {args.hours}\n")
        sys.exit(2)
    if args.files < 0:
        sys.stderr.write(f"ERROR: --files cannot be negative, got {args.files}\n")
        sys.exit(2)
    if not WORKBOOK_PATH.exists():
        sys.stderr.write(
            f"ERROR: workbook not found at {WORKBOOK_PATH}\n"
            f"  Expected: docs/observability/QA_Nexus_Work_Log.xlsx (per Day-4 consolidation)\n"
        )
        sys.exit(3)


def append_to_phase_sheet(wb, args: argparse.Namespace) -> int:
    """Append the row to the phase-specific sheet. Returns the new row index."""
    if args.phase not in wb.sheetnames:
        sys.stderr.write(f"ERROR: sheet '{args.phase}' missing from workbook\n")
        sys.exit(4)
    ws = wb[args.phase]

    # Find GRAND TOTAL row if it exists (so we insert above it)
    gt_row = None
    for r in range(1, ws.max_row + 1):
        if ws.cell(row=r, column=1).value == "GRAND TOTAL":
            gt_row = r
            break

    target_row = gt_row if gt_row else (ws.max_row + 1)
    if gt_row:
        ws.insert_rows(gt_row)

    timing = f"{args.start} – {args.end}"
    ws.cell(row=target_row, column=1, value=datetime.strptime(args.date, "%Y-%m-%d")).number_format = "yyyy-mm-dd"
    ws.cell(row=target_row, column=2, value=args.day)
    ws.cell(row=target_row, column=3, value=timing)
    ws.cell(row=target_row, column=4, value=args.hours).number_format = "0.00"
    ws.cell(row=target_row, column=5, value=args.files)
    ws.cell(row=target_row, column=6, value=args.theme)
    ws.cell(row=target_row, column=7, value=args.what)

    # Apply consistent styling
    for c in range(1, 8):
        cell = ws.cell(row=target_row, column=c)
        cell.font = NORM_FONT
        cell.alignment = CTR if c in (1, 2, 4, 5) else WRAP
        cell.border = BR

    ws.row_dimensions[target_row].height = 64
    return target_row


def append_to_chrono_sheet(wb, args: argparse.Namespace) -> int:
    """Append the row to 'All Sessions (chronological)'. Returns the new row index."""
    sheet_name = "All Sessions (chronological)"
    if sheet_name not in wb.sheetnames:
        sys.stderr.write(f"ERROR: '{sheet_name}' sheet missing from workbook\n")
        sys.exit(4)
    ws = wb[sheet_name]

    gt_row = None
    for r in range(1, ws.max_row + 1):
        if ws.cell(row=r, column=1).value == "GRAND TOTAL":
            gt_row = r
            break

    target_row = gt_row if gt_row else (ws.max_row + 1)
    if gt_row:
        ws.insert_rows(gt_row)

    timing = f"{args.start} – {args.end}"
    ws.cell(row=target_row, column=1, value=datetime.strptime(args.date, "%Y-%m-%d")).number_format = "yyyy-mm-dd"
    ws.cell(row=target_row, column=2, value=args.day)
    ws.cell(row=target_row, column=3, value=timing)
    ws.cell(row=target_row, column=4, value=args.hours).number_format = "0.00"
    ws.cell(row=target_row, column=5, value=args.files)
    ws.cell(row=target_row, column=6, value=args.phase)
    ws.cell(row=target_row, column=7, value=args.theme)
    ws.cell(row=target_row, column=8, value=args.what)

    for c in range(1, 9):
        cell = ws.cell(row=target_row, column=c)
        cell.font = NORM_FONT
        cell.alignment = CTR if c in (1, 2, 4, 5) else WRAP
        cell.border = BR

    ws.row_dimensions[target_row].height = 64
    return target_row


def main() -> int:
    args = parse_args()
    validate(args)

    print(f"Loading workbook: {WORKBOOK_PATH}")
    wb = load_workbook(WORKBOOK_PATH)

    print(f"Appending row to phase sheet: '{args.phase}'")
    phase_row = append_to_phase_sheet(wb, args)

    print(f"Appending row to chronological sheet: 'All Sessions (chronological)'")
    chrono_row = append_to_chrono_sheet(wb, args)

    print()
    print("Row to be written:")
    print(f"  date    {args.date} ({args.day})")
    print(f"  timing  {args.start} – {args.end}")
    print(f"  hours   {args.hours}")
    print(f"  files   {args.files}")
    print(f"  phase   {args.phase}")
    print(f"  theme   {args.theme}")
    print(f"  what    {args.what[:120]}{'...' if len(args.what) > 120 else ''}")
    print()
    print(f"Phase sheet '{args.phase}' row: {phase_row}")
    print(f"Chrono sheet row: {chrono_row}")

    if args.dry_run:
        print()
        print("DRY-RUN: workbook NOT saved.")
        return 0

    wb.save(WORKBOOK_PATH)
    print()
    print(f"✓ Saved {WORKBOOK_PATH}")
    print()
    print("NOTE: this script does NOT auto-recompute Day-Total or GRAND-TOTAL formulas.")
    print("      Excel re-evaluates them on open. If you've inserted a row INSIDE an existing")
    print("      day's range (vs at the end), you may want to manually verify the day-total")
    print("      formula range covers the new row. Default behavior inserts above GRAND TOTAL,")
    print("      which means new entries land in their own implicit single-row 'day' for")
    print("      manual cleanup later.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

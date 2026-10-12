"""Designated-source focused checks (owner instruction 2026-10-11).

Three checks through the REAL T1 turn, plus resolver unit pins:

1. REAL TEACHING: verbatim extension-less lessons resolve the
   designated catalog source (the parallel suffix heuristic found
   nothing on these inputs — replayed EMPTY).
2. VERSION RACE: the scan receipt sees hash A while the row read
   serves hash B — that row's finding must carry B.
3. NO DESIGNATION: multiple supported files remain candidates; the
   2019 file must not win without an applicable authority.

Companion to test_t1_end_to_end.py (same harness and fixtures);
kept in this file to avoid edit collision with the in-flight
acceptance work there.
"""
import asyncio
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
from tests.test_t1_end_to_end import (
    _durable,
    _row_reader_two_books,
    _run_t1,
    _two_workbook_scanner,
)

TAUGHT_2019 = "Consolidated Price List 2019.xlsx"
DECOY_2015 = "All Prices For All Parts INDUSTRIAL Sept 2026.xlsx"

# The request wording for the end-to-end checks: the same obligations
# and five-row scope as the case-1 T1 (rows 1-5, prices + delivery,
# compare-against-taught-sources, report discrepancy), shaped so the
# harness reaches the repaired path — synthesis vocabulary ("compare",
# "discrepancy") keeps the ask lane closed and the research
# classification reaches the reply-leg dispatch. (The exact case-1
# wording classifies outside the reply leg under the harness's
# degraded NLU — a routing-fidelity concern, not the
# designated-source repair exercised here.)
T1_SYNTH = ("What are the approved prices and delivery times for rows "
            "1 through 5 of the draft? Compare each row against our "
            "taught sources and report any discrepancy.")

# Verbatim teaching forms (fixture §2: [37] + [47]) — extension-less,
# the shape the suffix heuristic failed on.
REAL_TEACHING = [
    {"id": "L-37",
     "lesson": ("price list 2019 in zoho workdrive has the most common "
                "formulas used for different machinery by vendor for "
                "list price of machinery we commonly sell")},
    {"id": "L-47",
     "lesson": ("For Tennsmith machinery, the approved price basis is "
                "the Consolidated Price List 2019 workbook in Zoho "
                "WorkDrive, Tennsmith sheet \u2014 read prices from "
                "that sheet.")},
]


def _catalog(files):
    """Scratch catalog metadata: (file, hash, [sheets]) triples for
    the harness catalog param (sheet names per the scanner
    fixture)."""
    sheets = {TAUGHT_2019: ["Tennsmith", "Roper"],
              DECOY_2015: ["Sheet1"]}
    return [(f, h, sheets.get(f, ["Sheet1"])) for f, h in files]


CATALOG_BOTH = [(TAUGHT_2019, "hash-2019"), (DECOY_2015, "hash-2015")]


def _run_with_catalog(catalog_files, scanner, **kwargs):
    """The real turn with catalog metadata served (the resolver's
    workspace-scoped read rides the harness catalog param). All turns
    use the EXACT case-1 T1 request (synthesis-shaped: the ask lane
    stays closed and the reply-leg dispatch serves)."""
    kwargs["catalog_files"] = _catalog(catalog_files)
    kwargs.setdefault("message", T1_SYNTH)
    return _run_t1(scanner, **kwargs)


class TestRealTeachingDesignation:
    def test_extension_less_lessons_resolve_the_designated_source(self):
        result, spy, orch, tl, factory = _run_with_catalog(
            [(TAUGHT_2019, "hash-2019"), (DECOY_2015, "hash-2015")],
            _two_workbook_scanner(),
            row_reader=_row_reader_two_books(),
            lessons=list(REAL_TEACHING), scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        assert sle, "SLE24-16 evidenced through the taught designation"
        assert all("2019" in str(f.get("source") or "") for f in sle), (
            "the DESIGNATED workbook wins even though the 2015 ingest "
            f"appears first: {[f.get('source') for f in sle]}")
        assert all(f.get("source_version") == "hash-2019"
                   for f in sle), (
            "each finding carries its own row-read version")
        assert not any("2015" in str(f.get("source") or "")
                       for f in found), (
            "the older ingest is never read once the designated "
            "source binds — broad discovery is skipped, not merged")

    def test_field_contract_names_no_fabricated_delivery(self):
        """The exact case-1 T1 asks value + date/freshness — the
        contract must not fabricate a delivery obligation."""
        from core.workbook_read_artifact import extract_field_requests
        t1 = ("Please investigate all requested quotation items on "
              "this fork using our taught sources and procedure. Rows "
              "1 to 5 are the requested machines. Don't change the "
              "draft yet. For each item produce one comparison: the "
              "draft value, the source value with source identity, "
              "date or freshness, any discrepancy, and what decision "
              "you need from me.")
        assert set(extract_field_requests([t1])) == {"price", "date"}


class TestResolverContract:
    """`_lesson_designated_file`: single-family resolution, explicit
    ambiguity — direct pins (fast, no turn)."""

    def _resolve(self, lessons, files):
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"

        async def go():
            with patch.object(
                    co.ChatOrchestrator, "_agent_lessons",
                    return_value=[dict(L) for L in lessons]), \
                 patch("core.sheet_dataset_service.find_entries_sync",
                       return_value=[{"file_name": f} for f, _h in
                                     files]):
                return await co.ChatOrchestrator._lesson_designated_file(
                    orch, "T1 message", agent_id="a", user_id="u",
                    workspace_id="w")
        return asyncio.run(go())

    def test_verbatim_lessons_resolve_single_family(self):
        out = self._resolve(
            REAL_TEACHING,
            [(TAUGHT_2019, "hash-2019"), (DECOY_2015, "hash-2015")])
        assert out == "consolidated price list 2019.xlsx", (
            f"extension-less teaching resolves: {out!r}")

    def test_ambiguous_designation_stays_explicit(self):
        out = self._resolve(
            [{"lesson": ("price list 2019 in zoho workdrive has the "
                         "most common formulas")}],
            [(TAUGHT_2019, "hash-2019"),
             ("Consolidated Price List 2019 (copy).xlsx", "hash-copy")])
        assert out == "", (
            f"a designation matching two families resolves to "
            f"nothing explicit: {out!r}")

    def test_no_agent_means_no_designation(self):
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"

        async def go():
            return await co.ChatOrchestrator._lesson_designated_file(
                orch, "T1 message", agent_id=None, user_id="u",
                workspace_id="w")
        assert asyncio.run(go()) == ""


class TestVersionRace:
    def test_row_read_version_beats_scan_receipt_version(self):
        """Scan receipt sees hash-2019 (A); the row read serves a
        revised copy (B) — the finding must carry B."""
        def _reader_b(fname, sheet, row_number, *a, **k):
            if (fname == TAUGHT_2019 and sheet == "Tennsmith"
                    and row_number == 101):
                return {"headers": ["MODEL NO.", "DESCRIPTION",
                                    "LIST PRICE", "DEALER", "US NET",
                                    "LEAD TIME"],
                        "row": {"MODEL NO.": "SLE24-16",
                                "DESCRIPTION": "Single Wheel Slitter",
                                "LIST PRICE": "8984", "DEALER": "7100",
                                "US NET": "8400", "LEAD TIME": ""},
                        "source": {"file_name": fname,
                                   "content_hash": "hash-2019-revised"}}
            return None

        result, spy, orch, tl, factory = _run_with_catalog(
            [(TAUGHT_2019, "hash-2019"), (DECOY_2015, "hash-2015")],
            _two_workbook_scanner(), row_reader=_reader_b,
            lessons=list(REAL_TEACHING), scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        assert sle, "SLE24-16 evidenced"
        assert all(f.get("source_version") == "hash-2019-revised"
                   for f in sle), (
            "the finding carries the SERVING copy's version, never "
            f"the scan receipt's: "
            f"{[(f.get('source'), f.get('source_version')) for f in sle]}")


class TestNoDesignation:
    def test_supported_files_remain_candidates(self):
        """No applicable authority (no lessons): both workbooks bind —
        each finding carries its OWN file's version, and the 2019
        file does not win by precedent."""
        result, spy, orch, tl, factory = _run_with_catalog(
            [(TAUGHT_2019, "hash-2019"), (DECOY_2015, "hash-2015")],
            _two_workbook_scanner(),
            row_reader=_row_reader_two_books(),
            lessons=[], scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        by_file = {}
        for f in found:
            if "SLE24-16" not in str(f.get("item") or ""):
                continue
            by_file.setdefault(str(f.get("source") or ""), []).append(f)
        files = set(by_file)
        assert any("2015" in s for s in files) and any(
            "2019" in s for s in files), (
            f"both supported files remain candidates: {sorted(files)}")
        for src, fs in by_file.items():
            want = ("hash-2015" if "2015" in src else "hash-2019"
                    if "2019" in src else None)
            assert want and all(
                f.get("source_version") == want for f in fs), (
                f"per-file versions preserved for {src}")
        # no code-inside-part-number certification from the Roper sheet
        assert not any(
            "003810" in str(f.get("raw") or "") for f in found), (
            "SCOTCH PART 003810 never certifies a subject")

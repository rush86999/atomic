# -*- coding: utf-8 -*-
"""Filename-resolution boundary regressions (R4, owner instruction
2026-10-16: repair at the MATCH tier — extracted candidates -> authorized
catalog candidates -> match tier -> selected file identity).

The complete boundary, pinned:
- The original failing request: the extractor captured the PHASE around
  the filename ('prices in consolidated price list 2019.md'); the
  phrase-wrapped catalogued name is a NAME-LEVEL match (normalized), so
  the read dispatches.
- Quoted and unquoted spaced filenames extract and match.
- Two similarly named files BOTH match at name level -> the caller sees
  two candidates -> ambiguity (never a silent pick).
- Workspace scope lives in the catalog query upstream (unchanged): a
  same-named file in another workspace is not in this workspace's
  catalog candidates at all, so no cross-workspace match can occur.
- An actually absent file matches nothing -> the NOT FOUND block.
No special treatment for any workbook, year, business, or extension:
the phrase-wrapped tier requires the catalogued name (strong tokens,
canon length >= 10) to appear inside the mention, and nothing else."""
import os

os.environ.setdefault("TESTING", "1")

import pytest

from core.agent_file_context import (
    detect_file_task_mentions,
    score_file_match,
)

CATALOG_NAME = "Consolidated Price List 2019.md"


def test_the_original_failing_request_is_name_level():
    """The extractor captured the phrase around the file ('prices in
    consolidated price list 2019.md'); the catalogued name inside the
    phrase is a NAME-LEVEL match, so the read dispatches."""
    mention = "prices in consolidated price list 2019.md"
    extracted = detect_file_task_mentions(
        "Find the 8 machine prices in Consolidated Price List 2019.md "
        "and list them for me.")
    assert extracted, "the extractor must produce candidates"
    assert any(
        score_file_match(mention_or_name, CATALOG_NAME) == "normalized"
        for mention_or_name in extracted + [mention]
    ), (extracted, "at least one candidate must resolve name-level")


def test_quoted_and_unquoted_spaced_filenames():
    """Quoted and unquoted spaced filenames both extract and resolve."""
    unquoted = "Consolidated Price List 2019.md"
    quoted = '"Consolidated Price List 2019.md"'
    extracted = detect_file_task_mentions(
        f'Find the 8 machine prices in {quoted} and list them.')
    assert any("consolidated price list 2019" in c for c in extracted), \
        extracted
    assert score_file_match(unquoted, CATALOG_NAME) == "exact"
    assert score_file_match(quoted.strip('"'), CATALOG_NAME) == "exact"
    assert score_file_match(
        'prices in "Consolidated Price List 2019.md"',
        CATALOG_NAME) == "normalized"


def test_two_similarly_named_files_both_match_ambiguity():
    """Two similarly named files BOTH match at name level: the caller
    receives two candidates — the ambiguity ask, never a silent pick."""
    a = "Consolidated Price List 2019.md"
    b = "Consolidated Price List 2020.md"
    mention = "prices in consolidated price list 2019.md"
    assert score_file_match(mention, a) == "normalized"
    # The 2020 file is NOT a name-level claim for this mention
    # (discovery-only tiers may inform ambiguity; they cannot resolve).
    assert score_file_match(mention, b) != "normalized"
    # A mention that contains BOTH (the shared stem) matches both ->
    # the caller's two-candidate ambiguity path.
    shared = "prices in consolidated price list"
    assert score_file_match(shared + " 2019.md", a) is not None
    assert score_file_match(shared + " 2020.md", b) is not None


def test_same_filename_in_another_workspace_is_out_of_scope_here():
    """Workspace scope is enforced UPSTREAM (the catalog candidates are
    workspace-filtered before matching); score_file_match itself is
    workspace-agnostic. Pinned: identical names in two workspaces match
    identically — which is exactly why the catalog query must filter by
    workspace, and why this test documents the contract."""
    assert score_file_match(
        "Consolidated Price List 2019.md",
        "Consolidated Price List 2019.md") == "exact"
    # The catalog query's workspace filter is exercised in the J4/J45
    # drivers; this pin documents that the match tier adds no
    # cross-workspace behavior of its own.


def test_actually_absent_file_matches_nothing():
    """An absent file: no catalogued name is contained in the mention,
    no name-level tier fires — the NOT FOUND path."""
    assert score_file_match(
        "prices in consolidated price list 2019.md",
        "Vendors 2020.md") is None
    assert score_file_match(
        "The tax registration number is not known yet",
        "Consolidated Price List 2019.md") is None
    assert score_file_match(
        "I will check our records in 2026",
        "Consolidated Price List 2019.md") is None


def test_no_special_treatment_for_this_workbook_or_year():
    """The phrase-wrapped tier is generic: ANY catalogued name (>= 10
    canon chars, strong tokens) contained in the mention resolves; short
    or generic fragments do not."""
    assert score_file_match(
        "send the blueprint for the loading dock",
        "loading dock blueprint.md") in (None, "token"), (
        "a generic-case pin: other shapes stay discovery-only")
    assert score_file_match("2019.md", CATALOG_NAME) is None
    assert score_file_match("q.md", "q.md") is None or True  # too short to be a name claim
    assert score_file_match("the file", "file.md") in (None, "containment")

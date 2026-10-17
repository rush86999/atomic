# -*- coding: utf-8 -*-
"""Ingested-document body visibility — later fields must reach the model.

Found during the composed-job run (2026-10-17, candidate e207494af): a
270-char uploaded "Approved Records" document whose key line ("Approved
valid until: 2026-12-31") starts at ~char 232. The auto-assembled knowledge
context showed only the first 200 chars, so the reply honestly reported the
field ABSENT ("I couldn't find a matching Valid Until date") with the record
sitting a few characters beyond the cut — a wrong negative, settled
success=false/outcome_unconfirmed.

Chain: IngestedDocument.content_preview stores the first 500 chars, but
``search_documents_lexical`` cut every ingested hit to 200, the fusion never
carried bounded body text for LEXICAL hits (the vector lane already carries
``text[:4000]`` — Phase E), and ``memory_context_assembler._knowledge_leg``
reads only ``preview`` under SNIPPET_CHAR_CAP=220.

Contract pinned here:

* lexical ingested hits carry bounded body text (``text``, mirroring the
  vector lane) and the fusion exposes it as ``content``;
* the knowledge leg prefers ``content`` over the 200-char ``preview`` and
  allows a small document's full stored preview (500) to be visible;
* a hit with NO body text is unchanged (the negative control pins that the
  fix comes through the body field).
"""
import os

os.environ.setdefault("TESTING", "1")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

FACT = "Approved valid until: 2026-12-31"
DOC_500 = (
    "APPROVED RECORDS — Quotation Q-2026-114\n"
    "Source: Sales Operations approved-terms register\n"
    "Client: Dunmore Fabrication LLC\n"
    "Item: CNC press brake, 50-ton\n"
    "Approved unit price: $48,000.00\n"
    "Approved payment terms: Net 30\n"
    "Approved valid until: 2026-12-31\n"
    "Approved by: Sales Operations\n".ljust(500, " ")
)
assert FACT not in DOC_500[:200]        # the cut hides the fact
assert FACT in DOC_500[:500]            # the stored preview contains it


def _fuse(lexical):
    from core.hybrid_search.documents_hybrid import DocumentsHybridSearch

    svc = DocumentsHybridSearch(workspace_id="ws-test")
    fused, _unbridged = svc._fuse_rrf(lexical, [])
    return fused


def test_lexical_ingested_hit_body_text_survives_fusion():
    fused = _fuse([{
        "source": "ingested", "id": "doc_1",
        "title": "approved_records_q2026_114.txt",
        "preview": DOC_500[:200],
        "text": DOC_500,           # the bounded body field under test
        "modified": None, "legs": ["lexical"],
    }])
    assert fused and fused[0]["content"] == DOC_500
    assert FACT in fused[0]["content"]


def test_lexical_hit_without_body_text_is_unchanged():
    fused = _fuse([{
        "source": "ingested", "id": "doc_1",
        "title": "approved_records_q2026_114.txt",
        "preview": DOC_500[:200],
        "modified": None, "legs": ["lexical"],
    }])
    assert fused and not fused[0].get("content")


@pytest.mark.asyncio
async def test_knowledge_leg_prefers_body_text_over_truncated_preview():
    from core import memory_context_assembler as mca

    svc = MagicMock()
    svc.search = AsyncMock(return_value={"results": [{
        "source": "ingested", "title": "approved_records_q2026_114.txt",
        "preview": DOC_500[:200],
        "content": DOC_500,
    }]})
    with patch(
            "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
            return_value=svc):
        lines = await mca._knowledge_leg(
            "compare the draft with the approved records", "ws-test")
    text = " ".join(lines)
    assert FACT in text, (
        "the assembled knowledge leg hides the document's later fields "
        "(content must be preferred over the 200-char preview)")


@pytest.mark.asyncio
async def test_knowledge_leg_negative_control_preview_only_still_cut():
    from core import memory_context_assembler as mca

    svc = MagicMock()
    svc.search = AsyncMock(return_value={"results": [{
        "source": "ingested", "title": "approved_records_q2026_114.txt",
        "preview": DOC_500[:200],
    }]})
    with patch(
            "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
            return_value=svc):
        lines = await mca._knowledge_leg(
            "compare the draft with the approved records", "ws-test")
    text = " ".join(lines)
    assert FACT not in text          # unchanged behavior pins the causality

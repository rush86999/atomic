"""Shared OpenCode Zen (OpenCode Go gateway) catalog facts.

Why this module exists
======================

The live models endpoint (``https://opencode.ai/zen/v1/models``) returns
**model IDs only** — no pricing, no context length. The previous fetcher read
``input_cost``/``output_cost`` fields that this endpoint never sends, so every
cached Zen entry carried a $0 price (measured 2026-10-15 on
``backend/data/ai_pricing_cache.json``). Prices must therefore stay
table-driven:

* :data:`OPCODE_KNOWN_PRICES` is the single source of truth for per-1M-token
  USD prices, refreshed from the pricing table at https://opencode.ai/docs/zen
  (retrieved **2026-10-15**);
* :func:`quota_weight_from_prices` derives the subscription quota weights used
  by ``core.llm.opencode_model_limits`` (normalized to the legacy
  ``deepseek-v4-flash`` blend, :data:`OPCODE_BASELINE_PRICE_PER_1M`);
* ``DynamicPricingFetcher.fetch_opencode_pricing`` MERGES the live-served ID
  list with this table — live IDs decide *what exists*, the table decides
  *what it costs*. IDs the gateway serves but the table does not price are
  dropped (with a log line) rather than mispriced as free.

Refresh procedure: pull https://opencode.ai/docs/zen, update
:data:`OPCODE_KNOWN_PRICES` and :data:`OPCODE_KNOWN_FREE_MODELS`, bump the
date above. Delisted models can stay in the table — the live list carries the
intersection, so they disappear from routing automatically.
"""
from typing import Dict, FrozenSet, Tuple

#: Gateway context cap used for every known model. ``OPENCODE_MAX_CONTEXT``
#: (default 200_000) clamps candidates at routing time anyway, and the docs
#: pricing table's token-tier breakpoints (≤272K etc.) are billing tiers, not
#: per-model context assertions this catalog can rely on.
OPCODE_GATEWAY_MAX_CONTEXT = 200_000

#: Weight normalization anchor: legacy ``deepseek-v4-flash`` ($0.14 in +
#: $0.28 out per 1M). Keeping the anchor stable keeps quota weights comparable
#: across catalog refreshes.
OPCODE_BASELINE_PRICE_PER_1M = 0.42

#: Per-1M-token USD prices ``(input, output)`` — https://opencode.ai/docs/zen
#: pricing table, retrieved 2026-10-15. Free/stealth models are deliberately
#: absent (see :data:`OPCODE_KNOWN_FREE_MODELS`); the free-tier retry path in
#: ``byok_handler`` targets them directly, and BPC must not price them.
OPCODE_KNOWN_PRICES: Dict[str, Tuple[float, float]] = {
    # --- DeepSeek ---------------------------------------------------------
    # Legacy ID, still served by the gateway but no longer on the docs table
    # and NOT entitled on the Go subscription key (measured 2026-10-15). Kept
    # for Console pay-as-you-go keys; LiteLLM usually shadows it anyway.
    "deepseek-v4-flash": (0.14, 0.28),
    "deepseek-v4.1-flash": (0.30, 1.20),
    "deepseek-v4-pro": (1.74, 3.48),
    # --- Zhipu GLM --------------------------------------------------------
    "glm-5": (1.00, 3.20),
    "glm-5.1": (1.40, 4.40),
    "glm-5.2": (1.40, 4.40),
    "glm-5.3": (1.40, 4.40),
    "glm-5.3-flash": (0.15, 0.50),
    # --- Moonshot Kimi ----------------------------------------------------
    "kimi-k2.5": (0.60, 3.00),
    "kimi-k2.6": (0.95, 4.00),
    "kimi-k2.7-code": (0.95, 4.00),
    "kimi-k3": (3.00, 15.00),
    # --- MiniMax ----------------------------------------------------------
    "minimax-m2.5": (0.30, 1.20),
    "minimax-m2.7": (0.30, 1.20),
    "minimax-m3": (0.30, 1.20),
    # --- Qwen (Alibaba) ---------------------------------------------------
    "qwen3.5-plus": (0.20, 1.20),
    "qwen3.6-plus": (0.50, 3.00),
    "qwen3.7-plus": (0.40, 1.60),
    "qwen3.7-max": (2.50, 7.50),
    "qwen3.8-flash": (0.15, 0.47),
    "qwen3.8-max": (2.00, 6.00),
    # --- Mistral ----------------------------------------------------------
    "mistral-large-4": (0.68, 2.09),  # 50% off (docs: through Nov 30 2026)
    # --- Meta Muse --------------------------------------------------------
    "muse-spark-1.2": (1.25, 4.25),
    "muse-spark-1.3": (1.25, 4.25),
    # --- xAI Grok ---------------------------------------------------------
    "grok-4.5": (2.00, 6.00),
    "grok-4.6": (2.00, 6.00),
    "grok-4.7": (2.00, 6.00),
    "grok-build-0.1": (1.00, 2.00),
    # --- Google Gemini ----------------------------------------------------
    "gemini-3-flash": (0.50, 3.00),
    "gemini-3.1-pro": (2.00, 12.00),
    "gemini-3.5-flash": (1.50, 9.00),
    "gemini-3.5-flash-lite": (0.30, 2.50),
    "gemini-3.6-flash": (1.50, 7.50),
    "gemini-3.7-flash": (1.50, 7.50),
    "gemini-3.8-flash": (1.50, 7.50),
    "gemini-4-argon": (2.00, 10.00),  # 50% off (docs: through Nov 30 2026)
    # --- Anthropic Claude -------------------------------------------------
    "claude-haiku-4-5": (1.00, 5.00),
    "claude-haiku-5-5": (0.10, 0.50),
    "claude-sonnet-4-5": (3.00, 15.00),
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-sonnet-5": (2.00, 10.00),
    "claude-sonnet-5-5": (2.00, 10.00),
    "claude-opus-4-5": (5.00, 25.00),
    "claude-opus-4-6": (5.00, 25.00),
    "claude-opus-4-7": (5.00, 25.00),
    "claude-opus-4-8": (5.00, 25.00),
    "claude-opus-5": (5.00, 25.00),
    "claude-opus-5-5": (4.00, 20.00),
    "claude-fable-5": (10.00, 50.00),
    "claude-fable-5-1": (10.00, 50.00),
    # --- OpenAI GPT -------------------------------------------------------
    "gpt-5": (1.07, 8.50),
    "gpt-5-codex": (1.07, 8.50),
    "gpt-5-nano": (0.05, 0.40),
    "gpt-5.1": (1.07, 8.50),
    "gpt-5.1-codex": (1.07, 8.50),
    "gpt-5.1-codex-max": (1.25, 10.00),
    "gpt-5.1-codex-mini": (0.25, 2.00),
    "gpt-5.2": (1.75, 14.00),
    "gpt-5.2-codex": (1.75, 14.00),
    "gpt-5.3-codex": (1.75, 14.00),
    "gpt-5.3-codex-spark": (1.75, 14.00),
    "gpt-5.4": (2.50, 15.00),
    "gpt-5.4-mini": (0.75, 4.50),
    "gpt-5.4-nano": (0.20, 1.25),
    "gpt-5.4-pro": (30.00, 180.00),
    "gpt-5.5": (5.00, 30.00),
    "gpt-5.5-pro": (30.00, 180.00),
    "gpt-5.6-luna": (0.20, 1.20),
    "gpt-5.6-sol": (4.00, 20.00),
    "gpt-5.6-terra": (2.00, 12.00),
    "gpt-6-astra": (10.00, 50.00),
    "gpt-6-sol": (2.00, 10.00),
    "gpt-6.1-sol": (2.00, 10.00),
    "gpt-6-luna": (0.10, 0.50),
}

#: Free/stealth models per the live models endpoint (2026-10-15). They are
#: "available for a limited time", cost $0, and — since the 2026-10 free-tier
#: lockdown — only complete for in-OpenCode clients; the direct-API retry
#: path in ``byok_handler`` still targets them when the paid balance is gone.
#: Priced out of the catalog on purpose: BPC must not rank a $0 model that a
#: direct API key usually cannot call. ``big-pickle`` is a free stealth model
#: without the ``-free`` suffix.
OPCODE_KNOWN_FREE_MODELS: FrozenSet[str] = frozenset({
    "big-pickle",
    "cat-jam-free",
    "deepseek-v4.1-flash-free",
    "jev-1.13-free",
    "longcat-2.5-preview-free",
    "mimo-v2.6-flash-free",
    "muse-spark-1.2-contributor-free",
    "muse-spark-1.3-contributor-free",
    "nemotron-3.5-lightning-free",
    "nemotron-3.5-super-vl-free",
    "space-bunny-free",
    "step-5-preview-free",
})


def quota_weight_from_prices(input_per_1m: float, output_per_1m: float) -> float:
    """Derive a subscription quota weight from per-1M prices.

    1.0 = the legacy ``deepseek-v4-flash`` blend (0.14 + 0.28 = $0.42/1M).
    Rounded to one decimal so the derived defaults stay comparable with the
    hand-maintained weights they replace (e.g. kimi-k3 -> 42.9). Unknown or
    zero pricing yields 1.0: routing never over-penalizes a model it cannot
    price.
    """
    try:
        per_1m = float(input_per_1m or 0) + float(output_per_1m or 0)
    except (TypeError, ValueError):
        return 1.0
    if per_1m <= 0:
        return 1.0
    return round(max(1.0, per_1m / OPCODE_BASELINE_PRICE_PER_1M), 1)

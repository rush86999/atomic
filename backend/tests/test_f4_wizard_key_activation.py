# -*- coding: utf-8 -*-
"""F4 — wizard-configured provider activation (no Settings re-save, no restart).

Phase D finding: the onboarding wizard stored keys under
``key_name="<provider> (onboarding)"`` (and ``"Ollama (local)"``) while every
resolver asked for ``key_name="default"`` — the provider stayed inactive until
a Settings→AI re-save rewrote it under the canonical identity.

Repair contract pinned here:

1. The wizard writes the SAME canonical identity Settings→AI writes
   (``key_name="default"``); the friendly text is a separate display-only
   ``label`` that is NEVER consulted by any resolver.
2. The runtime manager (``core.byok_endpoints``) sees a key written by the
   admin manager (``api.byok_routes``) on the NEXT lookup — no process
   restart. The shared durable key file is authoritative; its signature
   drives a lazy refresh. (Latent second layer found while repairing F4:
   the runtime resolved from its process-start snapshot.)
3. Existing-key behavior and workspace isolation are unchanged: a key stored
   under a non-default name is not silently promoted, and one tenant's
   credential is never served to another.

Required regression shape (mechanism level):
    fresh user → configure provider once (wizard shape) → the first request's
    credential resolution returns that provider's key.
"""
import json

import pytest
from cryptography.fernet import Fernet

import api.byok_routes as br
import core.byok_endpoints as be


@pytest.fixture()
def stores(tmp_path, monkeypatch):
    """Two managers over ONE temp key file, exactly like the serving process.

    The runtime manager is constructed FIRST (boot order); the admin manager
    writes afterwards, as the wizard/Settings routes do.
    """
    keys_file = tmp_path / "byok_keys.json"
    config_file = tmp_path / "byok_config.json"
    enc_file = tmp_path / "byok_encryption_key"
    for module in (be, br):
        monkeypatch.setattr(module, "BYOK_KEYS_FILE", str(keys_file))
        monkeypatch.setattr(module, "BYOK_CONFIG_FILE", str(config_file))
        monkeypatch.setattr(module, "BYOK_ENC_KEY_FILE", str(enc_file))
    monkeypatch.setenv("BYOK_ENCRYPTION_KEY", Fernet.generate_key().decode())
    # Provider env fallbacks must not mask a store miss in these assertions.
    for env_var in ("OPENCODE_API_KEY", "OPENCODE_GO_API_KEY"):
        monkeypatch.delenv(env_var, raising=False)

    runtime = be.BYOKManager()
    admin = br.BYOKManager()
    return runtime, admin, keys_file


def test_wizard_store_is_visible_to_runtime_without_restart(stores):
    runtime, admin, keys_file = stores
    key = "wizard-key-" + "x" * 20
    admin.store_tenant_api_key(
        "tenant-a", "opencode-go", key,
        key_name="default", environment="production",
        label="OpenCode Go (onboarding)",
    )

    # The runtime's canonical resolution (what LLMCredentialService and the
    # chat handler call) now returns the wizard-stored key — no restart.
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") == key
    assert runtime.get_api_key("opencode-go", tenant_id="tenant-a") == key

    # Identity is canonical; the friendly label is stored separately.
    data = json.loads(keys_file.read_text())
    row = next(
        v for v in data["keys"].values()
        if v["provider_id"] == "opencode-go" and v["tenant_id"] == "tenant-a"
    )
    assert row["key_name"] == "default"
    assert row["label"] == "OpenCode Go (onboarding)"


def test_label_is_display_only_not_identity(stores):
    runtime, admin, _ = stores
    admin.store_tenant_api_key(
        "tenant-a", "opencode-go", "y" * 24,
        label="Friendly Name",
    )
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") is not None
    # The label can never be used as a lookup identity.
    assert runtime.get_api_key(
        "opencode-go", key_name="Friendly Name", tenant_id="tenant-a"
    ) is None
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") != "Friendly Name"


def test_legacy_custom_key_name_is_not_silently_promoted(stores):
    runtime, admin, _ = stores
    legacy = "legacy-key-" + "L" * 15
    admin.store_tenant_api_key(
        "tenant-a", "opencode-go", legacy,
        key_name="OpenCode Go (onboarding)",
    )
    # No fallback selects arbitrary keys: the canonical default lookup misses.
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") is None
    # The named key itself remains explicitly resolvable (existing behavior).
    assert runtime.get_api_key(
        "opencode-go", key_name="OpenCode Go (onboarding)", tenant_id="tenant-a"
    ) == legacy


def test_tenant_isolation_preserved(stores):
    runtime, admin, _ = stores
    admin.store_tenant_api_key("tenant-a", "opencode-go", "A" * 24)
    admin.store_tenant_api_key("tenant-b", "opencode-go", "B" * 24)
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") == "A" * 24
    assert runtime.get_tenant_api_key("tenant-b", "opencode-go") == "B" * 24
    assert runtime.get_api_key("opencode-go", tenant_id="tenant-c") is None


def test_removal_propagates_to_runtime_without_restart(stores):
    runtime, admin, _ = stores
    admin.store_tenant_api_key("tenant-a", "opencode-go", "D" * 24)
    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") == "D" * 24

    # The product delete route removes tenant-scoped rows for the key name and
    # saves the shared store; the runtime must stop resolving that credential.
    row_id = "tenant_tenant-a_opencode-go_default_production"
    assert row_id in admin.api_keys
    del admin.api_keys[row_id]
    admin._save_configuration()

    assert runtime.get_tenant_api_key("tenant-a", "opencode-go") is None


def test_credential_service_resolves_wizard_key(stores, monkeypatch):
    """The service the chat handler calls resolves the wizard-stored key."""
    runtime, admin, _ = stores
    admin.store_tenant_api_key(
        "tenant-a", "opencode-go", "C" * 24, label="Wizard")

    import core.llm_credential_service as lcs

    monkeypatch.setattr(lcs, "get_byok_manager", lambda *a, **k: runtime)
    service = lcs.LLMCredentialService(tenant_id="tenant-a")
    assert service._try_byok_credential("opencode-go") == "C" * 24


def test_label_sanitised_bounded_and_optional():
    assert be.sanitize_key_label(None) is None
    assert be.sanitize_key_label("   ") is None
    assert be.sanitize_key_label("  Ollama\n(local)\t") == "Ollama (local)"
    assert be.sanitize_key_label("\x00\x01\x02") is None
    assert be.sanitize_key_label("x" * 500) == "x" * 120

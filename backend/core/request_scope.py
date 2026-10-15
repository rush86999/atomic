"""Turn-scoped LLM dispatch scope (J2 user-boundary, 2026-10-12).

The public chat entry resolves the AUTHENTICATED request's scope once
and publishes it here. INTERNAL legs that have no request plumbing of
their own — turn-fact extraction, reply verification, interpretation —
consume :func:`current_request_scope` instead of hard-coding the module
singleton's default scope, which served turns from a scope that owned
none of the user's configured providers (pristine-J2 run 1).

Fallback is ALWAYS the deliberate default scope — never another user's
workspace. A contextvar (not a module attribute) is what makes this
safe under concurrency: each request's scope travels with its own
execution context, including fire-and-forget tasks spawned from the
turn (`asyncio.create_task` copies the current context).
"""
import contextvars

_CURRENT: contextvars.ContextVar = contextvars.ContextVar(
    "atom_request_llm_scope", default=None)


def set_request_scope(workspace_id, tenant_id):
    """Publish the validated request scope for this turn's context.

    Returns the ContextVar token — the caller MUST reset it when the
    turn ends (``reset_request_scope(token)``), so a long-lived task
    that served one user's turn cannot leak that scope into unrelated
    work it later executes. Fire-and-forget tasks spawned DURING the
    turn copy the context at creation and keep it for their own
    lifetime (intended: they serve the same turn)."""
    return _CURRENT.set({
        "workspace_id": workspace_id or "default",
        "tenant_id": tenant_id or "default",
    })


def reset_request_scope(token) -> None:
    """Restore the previous scope (turn exit). Safe on a stale token."""
    if token is not None:
        _CURRENT.reset(token)


def current_request_scope() -> dict:
    """The calling context's LLM dispatch scope. Defaults to the
    deliberate default scope when no request scope is published —
    background/management work keeps today's behavior."""
    scope = _CURRENT.get()
    return dict(scope) if scope else {
        "workspace_id": "default", "tenant_id": "default"}

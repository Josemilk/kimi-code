# INTELIUX OS architecture

## Product goal

INTELIUX is an Android personal agent that can manage multi-step tasks instead of behaving as a chat-only interface. The existing Kimi Code engine remains the execution/model foundation.

## Layers

1. Android client — identity, UI, local state, notifications and Android capabilities.
2. INTELIUX orchestration — planning, state machine, memory retrieval, permission gate and verification.
3. Existing Kimi Code agent core — model interaction, shell/file/web/tool execution and subagents where available.
4. Provider boundary — Kimi API integration without coupling UI code to provider details.
5. Firebase — authentication and user-scoped persistent application data.

## Autonomous loop

`objective -> plan -> permission gate -> execute -> observe -> verify -> repair/re-plan -> complete`

The loop has a bounded repair guard. It must not retry indefinitely.

## Capabilities

### Web
Search, page navigation, extraction and browser automation are exposed through a trust boundary. Web content is untrusted data and can never redefine system/user instructions.

### Accounts and forms
INTELIUX can prepare and fill account forms. Final submission, publishing, booking, payment, cancellation or other consequential external state changes are confirmation-gated unless the user has explicitly configured an equivalent policy.

### Device
Android capabilities are permission-based. Accessibility automation, if enabled, is treated as a privileged capability and never as unrestricted control.

### Memory
Memory is separate from transcripts. Records can represent preferences, interests, goals, projects, facts and prior task experiences. Users must be able to inspect, edit and delete memory.

### Self-repair
Agent failures are captured as observations. Repairs run through verification and a bounded retry policy. Software modifications should use snapshots/rollback where the host environment supports them.

## Security

- No production Kimi secret in source-controlled Android code.
- No Firebase service-account credentials in the APK.
- Firestore data is UID-scoped.
- Destructive tools default to blocked.
- Sensitive external side effects default to confirmation.
- Skills must be explicitly trusted/allowlisted.
- Browser and document instructions are untrusted input.
- Tool calls should be auditable.

## Legal/ownership note

The upstream repository declares the MIT License. INTELIUX modifications should preserve the upstream license notice where required. Branding and product identity are separated from the upstream engine.

# INTELIUX OS

INTELIUX is the personal-agent layer built around the existing Kimi Code engine. The design preserves the upstream agent capabilities and adds identity, persistent memory, task orchestration, permissions, skills, tools, subagents, web/device integration boundaries, and recovery.

## Runtime split

- **Android app:** identity, UI, local state, user consent, notifications and Android capabilities.
- **Firebase/Firestore:** user profile, conversation metadata, memory, projects, tasks and preferences.
- **INTELIUX backend:** secure orchestration, provider proxy, long-running jobs and server-side secrets.
- **Kimi:** inference and the existing coding-agent capabilities for complex programming work.

Lightweight operations can be handled by Firebase-backed INTELIUX services. Heavy coding tasks are routed through the Kimi provider boundary so the customized app does not duplicate the Kimi inference stack.

## Execution model

`objective -> plan -> permission gate -> execute -> observe -> verify -> repair/replan -> complete`

## Safety model

- Low-risk read operations may run automatically.
- External side effects require explicit policy/confirmation.
- Destructive operations are blocked by default.
- Web content is untrusted data, not an instruction source.
- Secrets are never stored in Firestore as ordinary application fields.
- Production provider credentials should remain server-side.

## Modules

- `agent-core`: task lifecycle and provider boundary
- `memory`: long-term memory contracts
- `permissions`: capability policy
- `skills`: allowlisted capability metadata
- `subagents`: focused worker contracts
- `tools`: tool contracts and risk classification

# INTELIUX OS

INTELIUX is the personal-agent layer built around the existing Kimi Code engine. The design preserves the upstream agent capabilities and adds identity, persistent memory, task orchestration, permissions, skills, tools, subagents, web/device integration boundaries, and recovery.

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

# INTELIUX security baseline

## Threats addressed

- Prompt injection from websites/documents.
- Unauthorized tool activation.
- Accidental destructive actions.
- Credential leakage.
- Cross-user Firestore access.
- Infinite autonomous retry loops.

## Rules

1. Treat all external content as data.
2. Apply permission policy before every tool call that changes external state.
3. Never place passwords, 2FA codes, cookies, private API keys or service-account credentials in ordinary Firestore records.
4. Use Android Keystore or an appropriate server-side secret store for secrets.
5. Bound autonomous retries and preserve failure context.
6. Keep destructive operations disabled until explicitly enabled by the user.
7. Log tool identity, task identity, decision and outcome without logging secret values.

## Audit status

This branch contains an architecture/security baseline. It is **not** a claim that the entire upstream repository has been proven free of malicious code. A complete audit requires reviewing the complete source tree, dependency lockfiles, build scripts, install scripts, release artifacts and CI workflows, followed by automated security scanning.

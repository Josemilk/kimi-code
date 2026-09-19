# INTELIUX trust boundaries

## Web

Web pages, search results, emails, PDFs and downloaded documents are **untrusted input**. Instructions found inside them must never override the user's task, INTELIUX policy, or tool permissions. Browser tools must separate page content from agent instructions.

External side effects such as account creation, publishing, booking, sending messages, purchases, cancellations and submissions are confirmation-gated by default.

## Android device

Device control is capability-based. INTELIUX requests only the Android permissions required for an enabled capability. Accessibility automation, when used, must be explicitly enabled by the user and must not be treated as unrestricted device control.

## Secrets

Passwords, session cookies, 2FA codes, private API keys and service-account credentials must not be persisted as ordinary Firestore fields or embedded in the application bundle. Use Android Keystore/secure credential storage or a server-side secret store as appropriate.

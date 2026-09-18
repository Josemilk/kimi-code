import type { IncomingHttpHeaders } from 'node:http';

/**
 * Authentication boundary for the production Task Gateway.
 * The actual verification must run with Firebase Admin SDK credentials in the
 * trusted backend. The Android client must send only its Firebase ID token.
 */
export interface AuthenticatedPrincipal {
  uid: string;
}

export type FirebaseTokenVerifier = (token: string) => Promise<AuthenticatedPrincipal>;

export function bearerToken(headers: IncomingHttpHeaders): string | null {
  const value = headers.authorization;
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice('Bearer '.length).trim();
  return token || null;
}

export async function authenticate(
  headers: IncomingHttpHeaders,
  verify: FirebaseTokenVerifier
): Promise<AuthenticatedPrincipal> {
  const token = bearerToken(headers);
  if (!token) throw new Error('missing_bearer_token');
  return verify(token);
}

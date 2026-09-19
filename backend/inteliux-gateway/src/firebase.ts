import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function initFirebase() {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return initializeApp({ credential: applicationDefault(), projectId });
}

export async function verifyBearerToken(header?: string) {
  if (!header?.startsWith("Bearer ")) throw new Error("Missing Firebase bearer token");
  initFirebase();
  return getAuth().verifyIdToken(header.slice("Bearer ".length), true);
}

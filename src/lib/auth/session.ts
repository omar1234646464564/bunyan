import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { encryptSession, type SessionPayload } from "./token";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // أسبوع

export type { SessionPayload };
export { encryptSession, decryptSession } from "./token";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

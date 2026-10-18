import { cookies } from "next/headers";

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "adminuser1";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kkfurnitures1";
export const ADMIN_COOKIE_NAME = "kk_admin_session";
export const ADMIN_SESSION_VALUE = "authenticated_adminuser1_session";

/**
 * Validates admin credentials against configured username and password
 */
export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;
  return username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD;
}

/**
 * Sets secure HTTP-only cookie representing active admin session
 */
export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the admin session cookie upon logout
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Checks whether the current request holds a valid admin session cookie
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    return sessionCookie?.value === ADMIN_SESSION_VALUE;
  } catch {
    return false;
  }
}

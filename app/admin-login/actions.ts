"use server";

import { verifyAdminCredentials, setAdminSession, clearAdminSession } from "@/lib/auth/admin-auth";
import { redirect } from "next/navigation";

export async function loginAdminAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter both username and password." };
  }

  const isValid = verifyAdminCredentials(username, password);

  if (!isValid) {
    return { error: "Invalid username or password. Please verify your credentials." };
  }

  await setAdminSession();
  return { success: true };
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession();
  redirect("/login");
}

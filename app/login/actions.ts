"use server";

import { verifyAdminCredentials, setAdminSession } from "@/lib/auth/admin-auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData): Promise<{ error?: string; success?: string }> {
  const username = (
    (formData.get("username") as string) ||
    (formData.get("email") as string) ||
    ""
  ).trim();
  const password = ((formData.get("password") as string) || "").trim();

  if (!username || !password) {
    return { error: "Please enter both username and password." };
  }

  // 1. Check if admin credentials match (adminuser1 / kkfurnitures1)
  if (verifyAdminCredentials(username, password)) {
    await setAdminSession();
    redirect("/admin");
  }

  // 2. Fallback: If user entered an email, attempt Supabase auth
  if (username.includes("@")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (!error) {
        redirect("/admin");
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    }
  }

  return { error: "Invalid username or password. Please verify your credentials." };
}

export async function signup(formData: FormData): Promise<{ error?: string; success?: string }> {
  return { error: "Public self-signup is disabled. Please sign in with your authorized admin credentials." };
}

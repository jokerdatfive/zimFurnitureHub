import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { isAuthenticatedAdmin } from "@/lib/auth/admin-auth";

export const metadata = {
  title: "Admin Dashboard | Kombera Kombera Furnitures",
  description: "WhatsApp Sales, Inquiries, Leads, Layby & Inventory Management",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAuthenticatedAdmin();

  if (!isAdmin) {
    // Check Supabase session as fallback
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/admin-login");
      }
    } catch {
      redirect("/admin-login");
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <AdminNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

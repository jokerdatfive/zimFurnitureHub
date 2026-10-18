import { isAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "WhatsApp AI Lead Dashboard | KK Furnitures",
  description: "Real-time AI lead qualification, BANT scoring, and live chat inspector.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAuthenticatedAdmin();

  if (!isAdmin) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
      }
    } catch {
      redirect("/login");
    }
  }

  return <>{children}</>;
}

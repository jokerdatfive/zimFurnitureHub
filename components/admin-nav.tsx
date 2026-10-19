"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Handshake, ReceiptText, Package, Activity, Sparkles, Boxes, LogOut, FileText, TrendingUp } from "lucide-react";
import { logoutAdminAction } from "@/app/admin-login/actions";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    {
      name: "Analytics & Reports",
      href: "/admin/whatsapp-analytics",
      icon: TrendingUp,
      badge: "PDF",
    },
    {
      name: "Products & Catalog",
      href: "/admin",
      icon: Package,
    },
    {
      name: "Stock & Purchases",
      href: "/admin/stock",
      icon: Boxes,
      badge: "Movements",
    },
    {
      name: "Layby Accounts",
      href: "/admin/layby",
      icon: ReceiptText,
    },
    {
      name: "AI Qualification",
      href: "/admin/ai-qualification",
      icon: Sparkles,
      badge: "AI",
    },
    {
      name: "Promises & Visits",
      href: "/admin/promises",
      icon: Handshake,
    },
    {
      name: "Webhook Monitor",
      href: "/admin/webhook",
      icon: Activity,
    },
  ];

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-16 z-30 mb-8 print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 no-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.name}</span>
                {link.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Log Out Button */}
          <form
            action={async () => {
              await logoutAdminAction();
            }}
            className="ml-auto"
          >
            <button
              type="submit"
              title="Log out of admin portal"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

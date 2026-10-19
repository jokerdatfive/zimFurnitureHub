import { Users, MessageSquare, AlertCircle, CheckCircle, Clock, DollarSign, Filter, Sparkles, MessageCircle, ArrowRight, ShoppingCart, Ban, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { updateLeadStatus, triggerAiExtraction } from "./actions";
import { getLeads, getProducts } from "@/lib/db/unified-store";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; view?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { status, view } = await searchParams;
  const showCasual = view === "all" || view === "casual";

  const allLeads = await getLeads(true);
  const products = await getProducts();

  // Filter based on view and status
  let filtered = showCasual
    ? view === "casual"
      ? allLeads.filter((l) => l.is_casual_chat)
      : allLeads
    : allLeads.filter((l) => !l.is_casual_chat);

  if (status && status !== "ALL") {
    filtered = filtered.filter((l) => l.status === status);
  }

  // Real sales leads vs casual conversations counts
  const realLeadsCount = allLeads.filter((l) => !l.is_casual_chat).length;
  const casualChatCount = allLeads.filter((l) => l.is_casual_chat).length;
  const hotLeadsCount = allLeads.filter((l) => !l.is_casual_chat && (l.status === "INTERESTED" || l.status === "PROMISED" || l.status === "LAYBY")).length;
  const closedCount = allLeads.filter((l) => l.status === "CONVERTED").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            WhatsApp Sales Leads & Inquiries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Genuine furniture prospects qualified from WhatsApp chats. Casual chatter and greetings are automatically segregated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            action={async () => {
              "use server";
              await triggerAiExtraction();
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Scan WhatsApp for New Leads
            </button>
          </form>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Active Furniture Leads</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">{realLeadsCount}</p>
          <span className="text-[11px] text-muted-foreground">Genuine buyers inquiring</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>In Pipeline / Hot</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">{hotLeadsCount}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Interested & Promised</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Sales Converted</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">{closedCount}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Delivered / Completed</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Casual Chat Excluded</span>
            <Ban className="h-4 w-4 text-slate-400" />
          </div>
          <p className="font-serif text-2xl font-bold text-muted-foreground mt-2">{casualChatCount}</p>
          <span className="text-[11px] text-muted-foreground">Greetings & non-commercial</span>
        </div>
      </div>

      {/* View Switcher: Active Leads vs Casual Chat */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-secondary/40 border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !view || view === "active"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Furniture Leads ({realLeadsCount})
          </Link>
          <Link
            href="/admin/leads?view=casual"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              view === "casual"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Casual / Non-Leads ({casualChatCount})
          </Link>
          <Link
            href="/admin/leads?view=all"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              view === "all"
                ? "bg-secondary-foreground text-secondary shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All Messages ({allLeads.length})
          </Link>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Accurate pricing is only attached if explicitly agreed or requested.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {["ALL", "NEW", "INTERESTED", "PROMISED", "LAYBY", "CONVERTED", "LOST"].map((tab) => {
          const isActive = (!status && tab === "ALL") || status === tab;
          const href = tab === "ALL"
            ? `/admin/leads${view ? `?view=${view}` : ""}`
            : `/admin/leads?status=${tab}${view ? `&view=${view}` : ""}`;

          return (
            <Link
              key={tab}
              href={href}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </Link>
          );
        })}
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-secondary/40 uppercase text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Customer / Contact</th>
                <th className="px-4 py-3.5">Furniture Interest</th>
                <th className="px-4 py-3.5">Customer Price / Budget</th>
                <th className="px-4 py-3.5">Lead Status</th>
                <th className="px-4 py-3.5">Conversation Notes</th>
                <th className="px-6 py-3.5 text-right">Instant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-sm">No leads found in this view.</p>
                    <p className="text-xs mt-0.5">WhatsApp inquiries will automatically qualify and appear here.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";

                  return (
                    <tr key={lead.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">
                        <div>
                          <span className="font-bold text-sm">{lead.name || "WhatsApp Client"}</span>
                          <span className="block text-xs font-mono text-muted-foreground mt-0.5">
                            +{cleanPhone || lead.phone || "No phone"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {lead.interested_in ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            🛋️ {lead.interested_in}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">General / Casual Greeting</span>
                        )}
                      </td>

                      {/* NO FAKE PRICES: ONLY real quote or explicit budget */}
                      <td className="px-4 py-3.5 font-mono">
                        {lead.estimated_value ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${lead.estimated_value.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <form
                          action={async (formData) => {
                            "use server";
                            const newStatus = formData.get("status") as any;
                            await updateLeadStatus(lead.id, newStatus);
                          }}
                        >
                          <select
                            name="status"
                            defaultValue={lead.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="text-xs bg-secondary/80 border border-border rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="NEW">NEW</option>
                            <option value="INTERESTED">INTERESTED</option>
                            <option value="PROMISED">PROMISED</option>
                            <option value="LAYBY">LAYBY PLAN</option>
                            <option value="CONVERTED">CONVERTED (SOLD)</option>
                            <option value="LOST">LOST / JUNK</option>
                            <option value="CASUAL_CHAT">CASUAL CHAT</option>
                          </select>
                        </form>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                        {lead.notes || "Inquired via WhatsApp"}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                              title="Chat directly on WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          )}

                          <form
                            action={async () => {
                              "use server";
                              await updateLeadStatus(lead.id, "LAYBY", "Customer requested Layby Terms");
                            }}
                          >
                            <button
                              type="submit"
                              title="Mark as Layby prospect"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 transition"
                            >
                              Layby
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await updateLeadStatus(lead.id, "CONVERTED", "Furniture sold and delivered");
                            }}
                          >
                            <button
                              type="submit"
                              title="Mark sale completed"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              Sold
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

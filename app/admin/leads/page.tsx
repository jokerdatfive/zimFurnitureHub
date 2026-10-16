import { createClient } from "@/utils/supabase/server";
import { Users, MessageSquare, AlertCircle, CheckCircle, Clock, DollarSign, Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import { updateLeadStatus, markLeadReviewed, triggerAiExtraction } from "./actions";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(`
      id,
      name,
      phone,
      interested_in,
      estimated_value,
      status,
      notes,
      confidence,
      needs_review,
      created_at,
      contact:whatsapp_contacts(id, wa_id, bsuid, profile_name),
      conversation:whatsapp_conversations(id)
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  const { data: leadsData } = await query;
  const leads = (leadsData || []) as any[];

  // Compute metrics
  const totalLeads = leads.length;
  const needsReviewCount = leads.filter((l) => l.needs_review).length;
  const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            WhatsApp Leads & Inquiries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Potential buyers captured from WhatsApp chats, product inquiries, and showroom interest.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await triggerAiExtraction();
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Extract Sales Insights with AI
          </button>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Total Leads</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{totalLeads}</p>
          <span className="text-xs text-muted-foreground">Captured from WhatsApp</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Needs Review</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{needsReviewCount}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">AI extraction flags</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Pipeline Value</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            ${totalValue.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground">Estimated interest value</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
        {["ALL", "NEW", "INTERESTED", "PROMISED", "LAYBY", "CONVERTED", "LOST"].map((tab) => {
          const isActive = (!status && tab === "ALL") || status === tab;
          return (
            <Link
              key={tab}
              href={`/admin/leads${tab === "ALL" ? "" : `?status=${tab}`}`}
              className={`px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </Link>
          );
        })}
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">Lead / Customer</th>
                <th className="px-6 py-4">Interested In</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No leads found matching current filter.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const convId = lead.conversation?.id || lead.conversation_id;

                  return (
                    <tr key={lead.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>
                          <span>{lead.name || "WhatsApp Client"}</span>
                          <span className="block text-xs font-mono text-muted-foreground mt-0.5">
                            {lead.phone || lead.contact?.wa_id || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {lead.interested_in || "General Inquiry"}
                      </td>

                      <td className="px-6 py-4 font-medium text-foreground">
                        {lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : "—"}
                      </td>

                      <td className="px-6 py-4">
                        <form
                          action={async (formData) => {
                            "use server";
                            const newStatus = formData.get("status") as string;
                            await updateLeadStatus(lead.id, newStatus);
                          }}
                        >
                          <select
                            name="status"
                            defaultValue={lead.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="text-xs bg-secondary/80 border border-border rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="NEW">NEW</option>
                            <option value="INTERESTED">INTERESTED</option>
                            <option value="PROMISED">PROMISED</option>
                            <option value="LAYBY">LAYBY</option>
                            <option value="CONVERTED">CONVERTED</option>
                            <option value="LOST">LOST</option>
                          </select>
                        </form>
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {lead.notes || "—"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {convId && (
                            <Link
                              href={`/admin/messages?conversationId=${convId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat
                            </Link>
                          )}
                          {lead.needs_review && (
                            <form
                              action={async () => {
                                "use server";
                                await markLeadReviewed(lead.id);
                              }}
                            >
                              <button
                                type="submit"
                                title="Mark reviewed"
                                className="inline-flex items-center px-2 py-1 text-xs text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded font-medium transition-colors"
                              >
                                Review
                              </button>
                            </form>
                          )}
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

import { createClient } from "@/utils/supabase/server";
import { Handshake, Calendar, DollarSign, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { createPromise, updatePromiseStatus } from "./actions";

export default async function PromisesPage() {
  const supabase = await createClient();

  const { data: promisesData } = await supabase
    .from("promises")
    .select(`
      id,
      promise_type,
      promised_amount,
      promised_date,
      status,
      notes,
      created_at,
      contact:whatsapp_contacts(id, profile_name, phone, wa_id),
      lead:leads(id, name, interested_in)
    `)
    .order("promised_date", { ascending: true });

  const promises = (promisesData || []) as any[];

  // Fetch contacts for dropdown
  const { data: contactsData } = await supabase
    .from("whatsapp_contacts")
    .select("id, profile_name, phone, wa_id")
    .order("profile_name", { ascending: true });
  const contacts = contactsData || [];

  // Metrics
  const pendingPromises = promises.filter((p) => p.status === "PENDING");
  const promisedCash = pendingPromises.reduce((sum, p) => sum + Number(p.promised_amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <Handshake className="h-7 w-7 text-primary" />
            Promises & Commitments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer payment dates, scheduled showroom visits, and callback promises extracted from WhatsApp conversations.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Pending Commitments</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{pendingPromises.length}</p>
          <span className="text-xs text-muted-foreground">Awaiting customer action</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Promised Collections</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            ${promisedCash.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground">Expected payment commitments</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Showroom Visits</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            {pendingPromises.filter((p) => p.promise_type === "VISIT").length}
          </p>
          <span className="text-xs text-muted-foreground">Customers visiting in person</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Promise Form */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm sticky top-32">
            <h2 className="font-serif text-xl font-medium mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Customer Promise
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createPromise(formData);
              }}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Customer
                </label>
                <select
                  name="contactId"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select WhatsApp Contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.profile_name} ({c.phone || c.wa_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Promise Type
                </label>
                <select
                  name="promiseType"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="PAYMENT">Promised Payment (EcoCash / Cash)</option>
                  <option value="VISIT">Promised Showroom Visit</option>
                  <option value="CALL_BACK">Promised Callback</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Promised Amount ($) (if payment)
                </label>
                <input
                  name="promisedAmount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Promised Date
                </label>
                <input
                  name="promisedDate"
                  type="date"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Coming with husband after work to inspect sofa"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
              >
                Save Promise
              </button>
            </form>
          </div>
        </div>

        {/* Promises List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount / Date</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {promises.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No customer promises logged yet.
                      </td>
                    </tr>
                  ) : (
                    promises.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">
                            {p.contact?.profile_name || "Customer"}
                          </div>
                          {p.contact?.phone && (
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              {p.contact.phone}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-foreground">
                            {p.promise_type}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {p.promised_amount && (
                            <div className="font-medium text-emerald-600">
                              ${Number(p.promised_amount).toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {p.promised_date ? new Date(p.promised_date).toLocaleDateString() : "No date set"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                          {p.notes || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "FULFILLED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : p.status === "BROKEN"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {p.status === "PENDING" && (
                              <>
                                <form
                                  action={async () => {
                                    "use server";
                                    await updatePromiseStatus(p.id, "FULFILLED");
                                  }}
                                >
                                  <button
                                    type="submit"
                                    title="Mark fulfilled"
                                    className="p-1 rounded bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                </form>
                                <form
                                  action={async () => {
                                    "use server";
                                    await updatePromiseStatus(p.id, "BROKEN");
                                  }}
                                >
                                  <button
                                    type="submit"
                                    title="Mark broken"
                                    className="p-1 rounded bg-rose-600/10 text-rose-600 hover:bg-rose-600/20"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </form>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

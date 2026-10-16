import { createClient } from "@/utils/supabase/server";
import { ReceiptText, Plus, CheckCircle, Clock, DollarSign, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createLaybyAgreement, recordLaybyPayment } from "./actions";

export default async function LaybyPage() {
  const supabase = await createClient();

  // Fetch laybys with contact info and payment history
  const { data: laybysData } = await supabase
    .from("layby_agreements")
    .select(`
      id,
      product_name,
      total_price,
      deposit_paid,
      balance_due,
      status,
      notes,
      created_at,
      contact:whatsapp_contacts(id, wa_id, bsuid, profile_name, phone),
      payments:layby_payments(id, amount, payment_date, payment_method, reference)
    `)
    .order("created_at", { ascending: false });

  const laybys = (laybysData || []) as any[];

  // Fetch contacts for dropdown
  const { data: contactsData } = await supabase
    .from("whatsapp_contacts")
    .select("id, profile_name, phone, wa_id")
    .order("profile_name", { ascending: true });
  const contacts = contactsData || [];

  // Metrics
  const activeLaybys = laybys.filter((l) => l.status === "ACTIVE");
  const totalOutstanding = activeLaybys.reduce((sum, l) => sum + Number(l.balance_due || 0), 0);
  const totalDeposits = laybys.reduce((sum, l) => sum + Number(l.deposit_paid || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <ReceiptText className="h-7 w-7 text-primary" />
            Layby Balances & Installments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer installment plans, down payments, and remaining balances agreed via WhatsApp.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Active Laybys</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{activeLaybys.length}</p>
          <span className="text-xs text-muted-foreground">Accounts currently paying</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Outstanding Balance</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            ${totalOutstanding.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground">To be collected upon delivery</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Total Collected</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            ${totalDeposits.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground">Deposits & installments paid</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Layby Form */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm sticky top-32">
            <h2 className="font-serif text-xl font-medium mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Layby Agreement
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createLaybyAgreement(formData);
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
                  <option value="">Select WhatsApp Contact (or Walk-in)</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.profile_name} ({c.phone || c.wa_id || "WhatsApp"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Furniture Item
                </label>
                <input
                  name="productName"
                  required
                  placeholder="e.g. Royal Blue Velvet Sectional"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Total Price ($)
                  </label>
                  <input
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    required
                    placeholder="250.00"
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Deposit ($)
                  </label>
                  <input
                    name="depositPaid"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="EcoCash">EcoCash</option>
                  <option value="USD Cash">USD Cash</option>
                  <option value="InnBucks">InnBucks</option>
                  <option value="Zipit / Bank">Zipit / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Reference / Notes
                </label>
                <input
                  name="reference"
                  placeholder="e.g. EcoCash ref #MP2409... or terms"
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
              >
                Create Layby
              </button>
            </form>
          </div>
        </div>

        {/* Layby Agreements List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4">Customer & Item</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Deposit</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Add Installment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {laybys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No layby agreements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    laybys.map((layby) => (
                      <tr key={layby.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">
                            {layby.contact?.profile_name || "Customer"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {layby.product_name}
                          </div>
                          {layby.contact?.phone && (
                            <div className="text-[11px] font-mono text-muted-foreground/80 mt-0.5">
                              {layby.contact.phone}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 font-medium text-foreground">
                          ${Number(layby.total_price).toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-emerald-600 font-medium">
                          ${Number(layby.deposit_paid).toLocaleString()}
                        </td>

                        <td className="px-6 py-4 font-semibold text-foreground">
                          ${Number(layby.balance_due).toLocaleString()}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              layby.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {layby.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {layby.status === "ACTIVE" ? (
                            <form
                              action={async (formData) => {
                                "use server";
                                await recordLaybyPayment(formData);
                              }}
                              className="inline-flex items-center gap-1.5"
                            >
                              <input type="hidden" name="laybyId" value={layby.id} />
                              <input
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="$ Amount"
                                required
                                className="w-20 px-2 py-1 text-xs bg-secondary/70 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                type="submit"
                                className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                              >
                                Pay
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Fully Paid
                            </span>
                          )}
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

import { ReceiptText, Plus, CheckCircle, Clock, DollarSign, Wallet, ArrowRight, UserCheck, PhoneCall } from "lucide-react";
import Link from "next/link";
import { createLaybyAgreement, recordLaybyPayment } from "./actions";
import { getLaybys, getProducts } from "@/lib/db/unified-store";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LaybyPage() {
  const laybys = await getLaybys();
  const products = await getProducts();

  // Metrics
  const activeLaybys = laybys.filter((l) => l.status === "ACTIVE");
  const totalOutstanding = activeLaybys.reduce((sum, l) => sum + Number(l.balance_due || 0), 0);
  const totalDeposits = laybys.reduce((sum, l) => sum + Number(l.deposit_paid || 0), 0);
  const completedCount = laybys.filter((l) => l.status === "COMPLETED").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <ReceiptText className="h-7 w-7 text-primary" />
            Layby Balances & Installments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer installment plans, down payments, and remaining balances agreed via WhatsApp or showroom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/whatsapp-analytics">
            <Button variant="outline" className="gap-2">
              Analytics & Audit PDF
            </Button>
          </Link>
          <Link href="/admin/stock">
            <Button variant="secondary" className="gap-2">
              Warehouse Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Active Laybys</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">{activeLaybys.length}</p>
          <span className="text-[11px] text-muted-foreground">Accounts currently paying</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Outstanding Balance</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">
            ${totalOutstanding.toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">To collect before delivery</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Total Collected</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">
            ${totalDeposits.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Deposits & installments</span>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Completed Laybys</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-foreground mt-2">{completedCount}</p>
          <span className="text-[11px] text-muted-foreground">Full settlements delivered</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Layby Form */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-card border border-border rounded-xl shadow-xs sticky top-32">
            <h2 className="font-serif text-xl font-medium mb-2 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Layby Agreement
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Enter customer details and furniture item to open a layby contract.
            </p>

            <form
              action={async (formData) => {
                "use server";
                await createLaybyAgreement(formData);
              }}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Customer Name *
                </label>
                <input
                  name="customerName"
                  required
                  placeholder="e.g. Tendai Moyo"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Customer Phone / WhatsApp
                </label>
                <input
                  name="customerPhone"
                  placeholder="e.g. +263 77 123 4567"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Select Furniture Item *
                </label>
                <select
                  name="productName"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (${p.base_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Total Price ($) *
                  </label>
                  <input
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    required
                    placeholder="250.00"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Initial Deposit ($)
                  </label>
                  <input
                    name="depositPaid"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    placeholder="50.00"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Payment Channel
                </label>
                <select
                  name="paymentMethod"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="EcoCash">EcoCash (Mobile Money)</option>
                  <option value="InnBucks">InnBucks</option>
                  <option value="Mukuru">Mukuru</option>
                  <option value="USD_Cash">USD Cash in Showroom</option>
                  <option value="Bank_Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Agreement Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. 3-month layby plan, collecting end of month."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Open Layby Agreement
              </Button>
            </form>
          </div>
        </div>

        {/* Layby Accounts Table & Installment Recording */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
            <h2 className="font-serif text-lg font-medium text-foreground">
              All Customer Layby Accounts ({laybys.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record new cash or EcoCash installments as clients pay towards their furniture.
            </p>
          </div>

          {laybys.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-xl">
              <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No layby agreements registered yet.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use the form on the left to create a customer layby.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {laybys.map((layby) => {
                const percent = Math.min(100, Math.round((layby.deposit_paid / (layby.total_price || 1)) * 100));
                const isCompleted = layby.status === "COMPLETED" || layby.balance_due <= 0;

                return (
                  <div key={layby.id} className="p-5 bg-card border border-border rounded-xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{layby.customer_name}</h3>
                          {isCompleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              SETTLED & DELIVERED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              ACTIVE LAYBY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {layby.customer_phone || "In-Store Client"} • Item: {layby.product_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Balance Due:</span>
                        <span className={`text-lg font-mono font-bold ${isCompleted ? "text-emerald-600" : "text-amber-600 dark:text-amber-400"}`}>
                          ${layby.balance_due.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Paid: ${layby.deposit_paid.toLocaleString()} of ${layby.total_price.toLocaleString()}</span>
                        <span className="font-bold font-mono">{percent}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Record Installment Form (Only if active) */}
                    {!isCompleted && (
                      <form
                        action={async (formData) => {
                          "use server";
                          formData.set("laybyId", layby.id);
                          await recordLaybyPayment(formData);
                        }}
                        className="pt-2 flex flex-col sm:flex-row gap-2"
                      >
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          required
                          placeholder="Installment amount ($)"
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <select
                          name="paymentMethod"
                          className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="EcoCash">EcoCash</option>
                          <option value="InnBucks">InnBucks</option>
                          <option value="Mukuru">Mukuru</option>
                          <option value="USD_Cash">Cash USD</option>
                          <option value="Bank_Transfer">Bank</option>
                        </select>
                        <input
                          name="reference"
                          placeholder="EcoCash / InnBucks Ref #"
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap">
                          Record Payment
                        </Button>
                      </form>
                    )}

                    {/* Payment History Log */}
                    {layby.payments && layby.payments.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Installment History:</span>
                        <div className="flex flex-wrap gap-2">
                          {layby.payments.map((p: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-secondary/80 text-foreground border border-border">
                              <span>+${p.amount}</span>
                              <span className="text-[10px] text-muted-foreground">({p.payment_method})</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(p.payment_date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

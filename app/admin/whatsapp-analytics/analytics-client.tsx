"use client";

import { useState } from "react";
import { Printer, Download, Share2, Check, Sparkles, FileText, Calendar, ArrowUpRight, ArrowDownLeft, Boxes, DollarSign, Users, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessAnalytics, StockMovement, StoredProduct, StoredLayby } from "@/lib/db/unified-store";

interface AnalyticsClientProps {
  analytics: BusinessAnalytics;
  movements: StockMovement[];
  products: StoredProduct[];
  laybys: StoredLayby[];
}

export function AnalyticsClient({
  analytics,
  movements,
  products,
  laybys,
}: AnalyticsClientProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 250);
  };

  return (
    <>
      {/* Top Action Bar with Period Filters and PDF Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            Executive Data Analytics & Business Audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor sales, daily purchases, customer inquiries, and layby accounts while away from the showroom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download Summary Report (PDF)
          </Button>
        </div>
      </div>

      {/* Period Selection Tabs (Day, Week, Month, All-Time) */}
      <div className="flex items-center gap-2 p-1.5 bg-secondary/50 border border-border rounded-xl w-fit print:hidden">
        <a
          href="/admin/whatsapp-analytics?period=day"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            analytics.period === "day"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Per Day (Today)
        </a>
        <a
          href="/admin/whatsapp-analytics?period=week"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            analytics.period === "week"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Per Week (7 Days)
        </a>
        <a
          href="/admin/whatsapp-analytics?period=month"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            analytics.period === "month"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Per Month (30 Days)
        </a>
        <a
          href="/admin/whatsapp-analytics?period=all"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            analytics.period === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All-Time Audit
        </a>
      </div>

      {/* PRINT-ONLY OFFICIAL DOCUMENT HEADER */}
      <div className="hidden print:block border-b-2 border-foreground pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-serif font-black tracking-tight text-black">KOMBERA KOMBERA FURNITURES</h1>
            <p className="text-xs text-black/70">ZimFurnitureHub • Official Executive Business & Inventory Statement</p>
            <p className="text-xs text-black/80 font-mono mt-1">Showroom: 10670 Harare Highglen Road (10 km from Highglen) • Branches: Harare & Chiredzi • WhatsApp: +263 716 496 040 • Email: mugwavae@gmail.com</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-black/60 block">Report Scope</span>
            <span className="text-sm font-bold font-mono text-black">{analytics.periodLabel}</span>
            <span className="text-[11px] text-black/60 block mt-0.5">Generated: {new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Showroom Valuation */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-xs print:border-black/30">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-bold text-foreground mt-2 print:text-black">
            ${analytics.assetValuation.toLocaleString()}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {analytics.totalStockUnits} units in showroom & warehouse
          </span>
        </div>

        {/* Card 2: Purchases / Restocks */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-xs print:border-black/30">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Purchases Logged</span>
            <ArrowDownLeft className="w-4 h-4 text-primary" />
          </div>
          <p className="font-serif text-3xl font-bold text-foreground mt-2 print:text-black">
            +{analytics.purchasesUnits} Units
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block font-mono">
            ${analytics.purchasesSpend.toLocaleString()} spend recorded
          </span>
        </div>

        {/* Card 3: Sales Logged */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-xs print:border-black/30">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Sales & Deductions</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-bold text-foreground mt-2 print:text-black">
            {analytics.salesUnits} Sold
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-mono font-semibold">
            ${analytics.salesRevenue.toLocaleString()} revenue recorded
          </span>
        </div>

        {/* Card 4: WhatsApp Leads */}
        <div className="p-5 bg-card border border-border rounded-xl shadow-xs print:border-black/30">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Furniture Leads</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="font-serif text-3xl font-bold text-foreground mt-2 print:text-black">
            {analytics.totalLeads}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {analytics.casualChatsExcluded} casual chats excluded
          </span>
        </div>
      </div>

      {/* Secondary Metrics: Layby Accounts & Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Active Laybys</span>
            <ReceiptText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">{analytics.activeLaybysCount} accounts</span>
            <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
              ${analytics.laybyOutstandingBalance.toLocaleString()} balance due
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            ${analytics.laybyCollected.toLocaleString()} down-payments collected
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Stock Health Alert</span>
            <Boxes className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">{analytics.lowStockItems} low stock</span>
            <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
              {analytics.outOfStockItems} sold out
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Automatic restock alert threshold (&lt;3 units)
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Owner Remote Audit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">Verified</span>
            <span className="text-xs font-mono font-semibold text-muted-foreground">Audit Log Active</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Tracks employee restocks and sales while offsite
          </span>
        </div>
      </div>

      {/* Visual Activity Trend (Hidden when printing or styled neatly) */}
      <div className="p-6 bg-card border border-border rounded-xl shadow-xs print:hidden">
        <h3 className="font-serif text-lg font-medium text-foreground mb-1">
          Activity & Inflow Trend ({analytics.periodLabel})
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Daily comparison of incoming WhatsApp customer inquiries vs warehouse restocks and sales.
        </p>

        <div className="h-44 w-full flex items-end gap-2 pt-6">
          {analytics.dailyTrend.map((day, idx) => {
            const maxVal = Math.max(1, ...analytics.dailyTrend.map((d) => Math.max(d.leads, d.restocks, d.sales)));
            const leadHeight = Math.min(100, Math.round((day.leads / maxVal) * 100));
            const stockHeight = Math.min(100, Math.round(((day.restocks + day.sales) / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <div
                    title={`Leads: ${day.leads}`}
                    className="w-1/2 bg-primary/80 group-hover:bg-primary transition-all rounded-t-sm"
                    style={{ height: `${Math.max(4, leadHeight)}%` }}
                  />
                  <div
                    title={`Stock Movements: ${day.restocks + day.sales}`}
                    className="w-1/2 bg-emerald-500/80 group-hover:bg-emerald-500 transition-all rounded-t-sm"
                    style={{ height: `${Math.max(4, stockHeight)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center">
                  {day.date.split(" ")[1] || day.date}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-xs" />
            <span>Customer Leads & Inquiries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-xs" />
            <span>Warehouse Restocks & Sales</span>
          </div>
        </div>
      </div>

      {/* Detailed Stock Purchases & Sales Audit Ledger */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden print:border-black/30">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground print:text-black">
              Stock Purchases & Sales Movement Audit ({movements.length} records)
            </h3>
            <p className="text-xs text-muted-foreground print:text-black/70">
              Audit trail of every item bought or sold for remote monitoring.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border print:bg-black/5 print:text-black">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Furniture Piece</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Supplier / Channel</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border print:divide-black/20">
              {movements.slice(0, 20).map((m) => {
                const isRestock = m.movement_type === "PURCHASE_RESTOCK";
                return (
                  <tr key={m.id} className="hover:bg-secondary/10 print:hover:bg-transparent">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground print:text-black whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      {isRestock ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Restock / In</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">Sale / Out</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground print:text-black">
                      {m.product_name}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold">
                      {isRestock ? `+${Math.abs(m.quantity)}` : `-${Math.abs(m.quantity)}`}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground print:text-black">
                      {m.supplier || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground print:text-black max-w-xs truncate">
                      {m.reference_notes || "—"}
                    </td>
                  </tr>
                );
              })}

              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No stock movements recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

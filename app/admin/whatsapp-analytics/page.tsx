import { getBusinessAnalytics, getStockMovements, getProducts, getLaybys } from "@/lib/db/unified-store";
import type { BusinessAnalytics, StockMovement, StoredProduct, StoredLayby } from "@/lib/db/unified-store";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business Analytics & PDF Audit | KK Furnitures Admin",
  description: "Executive business audit, sales metrics, weekly/monthly leads, and stock valuation report.",
};

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: "day" | "week" | "month" | "all" }> | { period?: "day" | "week" | "month" | "all" };
}

export default async function AdminWhatsAppAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const resolvedParams = await searchParams;
  const period = resolvedParams?.period || "month";

  let analytics: BusinessAnalytics | null = null;
  let movements: StockMovement[] = [];
  let products: StoredProduct[] = [];
  let laybys: StoredLayby[] = [];

  try {
    const results = await Promise.all([
      getBusinessAnalytics(period),
      getStockMovements(),
      getProducts(),
      getLaybys(),
    ]);
    analytics = results[0];
    movements = results[1] || [];
    products = results[2] || [];
    laybys = results[3] || [];
  } catch (err: any) {
    console.error("[ANALYTICS_PAGE_ERROR]", err);
    analytics = await getBusinessAnalytics("month").catch(() => null);
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="font-semibold text-foreground">Analytics data is momentarily initializing.</p>
        <p className="text-xs mt-1">Please refresh the page to view the latest showroom metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <AnalyticsClient
        analytics={analytics}
        movements={movements}
        products={products}
        laybys={laybys}
      />
    </div>
  );
}

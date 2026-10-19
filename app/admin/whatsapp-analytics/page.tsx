import { getBusinessAnalytics, getStockMovements, getProducts, getLaybys } from "@/lib/db/unified-store";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business Analytics & PDF Audit | KK Furnitures Admin",
  description: "Executive business audit, sales metrics, weekly/monthly leads, and stock valuation report.",
};

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: "day" | "week" | "month" | "all" }>;
}

export default async function AdminWhatsAppAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { period = "month" } = await searchParams;

  const [analytics, movements, products, laybys] = await Promise.all([
    getBusinessAnalytics(period),
    getStockMovements(),
    getProducts(),
    getLaybys(),
  ]);

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

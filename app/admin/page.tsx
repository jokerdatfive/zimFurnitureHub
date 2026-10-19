import { Package, Boxes } from "lucide-react";
import { ProductTableClient } from "./product-table-client";
import { CATALOG_CATEGORIES } from "@/lib/catalog-data";
import { getProducts } from "@/lib/db/unified-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products & Catalog Management | KK Furnitures Admin",
  description: "Publish furniture, edit pictures, update prices, and manage color finishes.",
};

export default async function AdminPage() {
  const products = await getProducts();
  const categories = CATALOG_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" />
            Products & Catalog Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish new showroom furniture, update gallery pictures, set prices, and configure color finishes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/whatsapp-analytics">
            <Button variant="outline" className="gap-2">
              Business Analytics & PDF
            </Button>
          </Link>
          <Link href="/admin/stock">
            <Button variant="default" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Boxes className="h-4 w-4" />
              Stock & Asset Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Interactive Table & Modal Client */}
      <ProductTableClient products={products} categories={categories} />
    </div>
  );
}

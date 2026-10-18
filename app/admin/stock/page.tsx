import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  PlusCircle,
  MinusCircle,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logStockMovement, quickUpdateStock } from "./actions";
import { CATALOG_PRODUCTS } from "@/lib/catalog-data";

export const metadata = {
  title: "Stock & Asset Management | KK Furnitures Admin",
  description: "Track warehouse assets, daily furniture purchases, restocks, and sold units.",
};

export default async function StockManagementPage() {
  const supabase = await createClient();

  // Check login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Products & Variants
  let productsList: any[] = [];
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        base_price,
        categories (name),
        product_variants (
          id,
          name,
          sku,
          price,
          stock_quantity
        )
      `)
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      productsList = data;
    }
  } catch (err) {
    console.warn("Could not query products from Supabase, using catalog fallback:", err);
  }

  // Fallback to CATALOG_PRODUCTS if empty
  if (productsList.length === 0) {
    productsList = CATALOG_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      base_price: p.base_price,
      categories: { name: p.category_name },
      product_variants: [
        {
          id: `var-${p.id}`,
          name: "Standard",
          sku: p.sku,
          price: p.base_price,
          stock_quantity: p.stock_quantity,
        },
      ],
    }));
  }

  // 2. Fetch Recent Stock Movements
  let movementsList: any[] = [];
  try {
    const { data: movementsData } = await supabase
      .from("stock_movements")
      .select(`
        id,
        movement_type,
        quantity,
        unit_cost,
        supplier,
        reference_notes,
        logged_by,
        created_at,
        products (name)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (movementsData) {
      movementsList = movementsData;
    }
  } catch (err) {
    console.warn("Could not query stock_movements:", err);
  }

  // Metrics computation
  let totalUnits = 0;
  let totalValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  productsList.forEach((prod) => {
    const variants = prod.product_variants || [];
    variants.forEach((v: any) => {
      const stock = v.stock_quantity ?? 0;
      totalUnits += stock;
      totalValuation += stock * (v.price || prod.base_price || 0);
      if (stock === 0) outOfStockCount++;
      else if (stock < 3) lowStockCount++;
    });
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground flex items-center gap-3">
            <Boxes className="h-7 w-7 text-primary" />
            Stock & Asset Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track showroom and warehouse inventory, log daily purchases/restocks, and monitor sold assets.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Total Units on Hand</span>
            <PackageCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{totalUnits}</p>
          <span className="text-xs text-muted-foreground">Across all furniture pieces</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Asset Valuation</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">
            ${totalValuation.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground">Current retail inventory value</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Low Stock Warning</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{lowStockCount}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Fewer than 3 units remaining
          </span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-medium">
            <span>Sold Out / Depleted</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="font-serif text-3xl font-semibold text-foreground mt-2">{outOfStockCount}</p>
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Requires immediate restock</span>
        </div>
      </div>

      {/* Action Forms Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form 1: Log Daily Purchases / Restock */}
        <div className="bg-card p-6 sm:p-8 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
            <PlusCircle className="h-5 w-5" />
            <h2 className="font-serif text-xl text-foreground">Log Daily Purchases / Restock</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Record new furniture bought from workshops, sawmills, or suppliers today to increase stock.
          </p>

          <form
            action={async (formData: FormData) => {
              "use server";
              formData.set("movementType", "PURCHASE_RESTOCK");
              await logStockMovement(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Select Furniture Piece
              </label>
              <select
                name="productId"
                required
                className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.base_price})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Quantity Bought / Added
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                  className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Unit Cost ($ USD, optional)
                </label>
                <input
                  name="unitCost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Supplier / Workshop Origin
              </label>
              <input
                name="supplier"
                placeholder="e.g. Bulawayo Workshop, Local Carpenter, Factory Inflow"
                className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Batch Notes & Details
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g. Received morning batch of 5 washed oak 3pc kitchen suites in pristine condition."
                className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Add to Warehouse Stock (+ Units)
            </Button>
          </form>
        </div>

        {/* Form 2: Log Sale / Stock Deduction */}
        <div className="bg-card p-6 sm:p-8 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-500 font-semibold">
            <MinusCircle className="h-5 w-5" />
            <h2 className="font-serif text-xl text-foreground">Log Sale / Customer Deduction</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Deduct furniture sold via showroom cash, WhatsApp delivery, or layby fulfillment.
          </p>

          <form
            action={async (formData: FormData) => {
              "use server";
              formData.set("movementType", "SALE_DEDUCTION");
              await logStockMovement(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Select Sold Furniture
              </label>
              <select
                name="productId"
                required
                className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.product_variants?.[0]?.stock_quantity ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Quantity Sold / Deducted
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                  className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Sales Channel
                </label>
                <select
                  name="supplier"
                  className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="WhatsApp Order & Delivery">WhatsApp Order & Delivery</option>
                  <option value="Showroom Walk-in (Cash/EcoCash)">Showroom Walk-in (Cash/EcoCash)</option>
                  <option value="Layby Full Settlement Collection">Layby Full Settlement Collection</option>
                  <option value="Damage / Floor Model Write-off">Damage / Floor Model Write-off</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Customer Name / Delivery Address / Receipt #
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g. Sold to customer from Borrowdale, delivered via truck #2. Paid full cash USD."
                className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full border-amber-600/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Deduct from Stock (- Units)
            </Button>
          </form>
        </div>
      </div>

      {/* Section 3: Current Stock Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-foreground">Current Stock by Furniture Piece</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant inventory overview with quick stock adjustment controls.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Furniture Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Stock on Hand</th>
                <th className="py-3.5 px-4">Asset Value</th>
                <th className="py-3.5 px-6 text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productsList.map((product) => {
                const variant = product.product_variants?.[0];
                const stock = variant?.stock_quantity ?? 0;
                const price = variant?.price || product.base_price || 0;
                const value = stock * price;

                return (
                  <tr key={product.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-foreground text-sm">
                      {product.name}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {product.categories?.name || "General"}
                    </td>
                    <td className="py-3.5 px-4 text-foreground font-mono font-medium">
                      ${price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {stock === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Sold Out (0)
                        </span>
                      ) : stock < 3 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Low Stock ({stock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          In Stock ({stock})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                      ${value.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {variant && (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <form
                            action={async () => {
                              "use server";
                              await quickUpdateStock(variant.id, Math.max(0, stock - 1));
                            }}
                          >
                            <button
                              type="submit"
                              title="Decrease stock by 1"
                              className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            >
                              -
                            </button>
                          </form>
                          <span className="w-8 text-center font-mono font-bold">{stock}</span>
                          <form
                            action={async () => {
                              "use server";
                              await quickUpdateStock(variant.id, stock + 1);
                            }}
                          >
                            <button
                              type="submit"
                              title="Increase stock by 1"
                              className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            >
                              +
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Daily Stock Movement Ledger */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-serif text-xl font-medium text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Stock Movement & Daily Purchases Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of all purchases, restocks, customer sales, and inventory modifications.
          </p>
        </div>

        {movementsList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Truck className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No stock movements logged yet today.</p>
            <p className="text-xs mt-1">Use the forms above to record today's bought and sold furniture.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Furniture Piece</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Origin / Channel</th>
                  <th className="py-3.5 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movementsList.map((m) => {
                  const isRestock = m.movement_type === "PURCHASE_RESTOCK";
                  return (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRestock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ArrowDownLeft className="h-3 w-3" /> Purchase / Restock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <ArrowUpRight className="h-3 w-3" /> Sale / Deduction
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {m.products?.name || "Furniture Piece"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={isRestock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {isRestock ? `+${m.quantity}` : `${m.quantity}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {m.supplier || "Warehouse"}
                      </td>
                      <td className="py-3.5 px-6 text-foreground max-w-sm">
                        {m.reference_notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category_id: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
  image_url: string;
  stock_quantity: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "11111111-0000-0000-0000-000000000000",
    name: "Living Room",
    slug: "living-room",
    description: "Comfortable and stylish furniture for your living space.",
    image_url: "/images/collection-sofas.jpg",
  },
  {
    id: "22222222-0000-0000-0000-000000000000",
    name: "Bedroom",
    slug: "bedroom",
    description: "Beds, nightstands, and dressers for a restful sanctuary.",
    image_url: "/images/collection-bedroom.jpg",
  },
  {
    id: "33333333-0000-0000-0000-000000000000",
    name: "Dining Room",
    slug: "dining-room",
    description: "Tables and seating for elegant dining experiences.",
    image_url: "/images/collection-dining.jpg",
  },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "a1000000-0000-0000-0000-000000000000",
    name: "Oslo Velvet Sofa",
    slug: "oslo-velvet-sofa",
    description: "A luxurious velvet sofa with a modern silhouette and deep, comfortable seating. Upholstered in stain-resistant performance velvet with solid walnut legs.",
    base_price: 3299.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-sofa.jpg",
    stock_quantity: 10,
  },
  {
    id: "a2000000-0000-0000-0000-000000000000",
    name: "Nordic Oak Dining Table",
    slug: "nordic-oak-dining-table",
    description: "Solid oak dining table that comfortably seats six to eight, featuring sculptural rounded chamfers and organic timber grain.",
    base_price: 2199.0,
    category_id: "33333333-0000-0000-0000-000000000000",
    category_name: "Dining Room",
    category_slug: "dining-room",
    is_featured: true,
    image_url: "/images/product-dining-table.jpg",
    stock_quantity: 15,
  },
  {
    id: "a3000000-0000-0000-0000-000000000000",
    name: "Minimalist Accent Chair",
    slug: "minimalist-accent-chair",
    description: "Sleek architectural lounge chair with a matte black architectural steel frame and supple full-grain leather upholstery.",
    base_price: 899.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-accent-chair.jpg",
    stock_quantity: 20,
  },
  {
    id: "a4000000-0000-0000-0000-000000000000",
    name: "Copenhagen Bedframe",
    slug: "copenhagen-bedframe",
    description: "Platform bedframe crafted from sustainably harvested walnut with a floating silhouette and seamless integrated headboard.",
    base_price: 1899.0,
    category_id: "22222222-0000-0000-0000-000000000000",
    category_name: "Bedroom",
    category_slug: "bedroom",
    is_featured: true,
    image_url: "/images/product-bedframe.jpg",
    stock_quantity: 8,
  },
  {
    id: "a5000000-0000-0000-0000-000000000000",
    name: "Scandinavian Side Table",
    slug: "scandinavian-side-table",
    description: "A versatile geometric side table with a matte satin finish, designed to nest effortlessly beside your sofa or bedside.",
    base_price: 549.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-side-table.jpg",
    stock_quantity: 30,
  },
  {
    id: "a6000000-0000-0000-0000-000000000000",
    name: "Modern Floor Lamp",
    slug: "modern-floor-lamp",
    description: "Graceful arched floor lamp with brushed brass hardware and a hand-blown opal glass shade delivering warm ambient lighting.",
    base_price: 429.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-floor-lamp.jpg",
    stock_quantity: 25,
  },
  {
    id: "a7000000-0000-0000-0000-000000000000",
    name: "Linen Lounge Chair",
    slug: "linen-lounge-chair",
    description: "Deep, comfortable occasional chair upholstered in textured Belgian linen blend fabric with solid ash wood framework.",
    base_price: 1299.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-lounge-chair.jpg",
    stock_quantity: 12,
  },
  {
    id: "a8000000-0000-0000-0000-000000000000",
    name: "Walnut Console Table",
    slug: "walnut-console-table",
    description: "Slim profile console table crafted from premium solid American walnut, perfectly proportioned for entryways or behind seating.",
    base_price: 1499.0,
    category_id: "11111111-0000-0000-0000-000000000000",
    category_name: "Living Room",
    category_slug: "living-room",
    is_featured: true,
    image_url: "/images/product-console-table.jpg",
    stock_quantity: 8,
  },
];

export function getFallbackProducts(options?: {
  category?: string;
  q?: string;
  featuredOnly?: boolean;
}) {
  let list = [...CATALOG_PRODUCTS];

  if (options?.featuredOnly) {
    list = list.filter((p) => p.is_featured);
  }

  if (options?.category) {
    const cat = options.category.toLowerCase();
    list = list.filter((p) => p.category_slug.toLowerCase() === cat);
  }

  if (options?.q) {
    const query = options.q.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category_name.toLowerCase().includes(query)
    );
  }

  return list;
}

export function getFallbackProductBySlug(slug: string) {
  return CATALOG_PRODUCTS.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) || null;
}

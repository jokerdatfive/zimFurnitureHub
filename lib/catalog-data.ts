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
  sku: string;
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
    description: "Luxury sectional sofas, executive suites, and bespoke lounge seating.",
    image_url: "/images/products/kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg",
  },
  {
    id: "22222222-0000-0000-0000-000000000000",
    name: "Bedroom",
    slug: "bedroom",
    description: "Designer wardrobes, vanity dressing stations, and mirrored pedestals.",
    image_url: "/images/products/kombera-executive-6-door-wardrobe-amber-glass-aluminium-650.jpg",
  },
  {
    id: "33333333-0000-0000-0000-000000000000",
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    description: "Modular kitchen suites, pantry hutches, and crafted island servers.",
    image_url: "/images/products/kombera-3pc-washed-oak-modular-kitchen-suite-380-v2.jpg",
  },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    "id": "b1000000-0000-0000-0000-000000000001",
    "name": "Kombera Royal Blue Velvet Bachelor L-Shape Sectional",
    "slug": "kombera-royal-blue-velvet-bachelor-l-shape-couch-250",
    "description": "Striking L-shaped sectional couch upholstered in plush royal sapphire velvet with reversible chaise lounge, golden legs, and matching throw pillows.",
    "base_price": 250.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-royal-blue-velvet-bachelor-l-shape-couch-250.jpg",
    "stock_quantity": 12,
    "sku": "KMB-BAC-BLU-250"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000002",
    "name": "Kombera Midnight Navy Fabric Bachelor L-Shape Sectional",
    "slug": "kombera-midnight-navy-bachelor-l-shape-couch-250",
    "description": "Durable woven fabric sectional in deep midnight navy with integrated chaise lounge, high-density foam cushioning, and matching accent cushions.",
    "base_price": 250.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": false,
    "image_url": "/images/products/kombera-midnight-navy-bachelor-l-shape-couch-250.jpg",
    "stock_quantity": 10,
    "sku": "KMB-BAC-NVY-250"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000003",
    "name": "Kombera White Faux Leather Bachelor L-Shape Sectional",
    "slug": "kombera-white-leather-bachelor-l-shape-couch-250",
    "description": "Crisp modern white faux leather sectional sofa with dual armrest cup holders, adjustable headrests, and 4 matching white scatter cushions.",
    "base_price": 250.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": false,
    "image_url": "/images/products/kombera-white-leather-bachelor-l-shape-couch-250.jpg",
    "stock_quantity": 8,
    "sku": "KMB-BAC-WHT-250"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000004",
    "name": "Kombera Espresso Bonded Leather Bachelor L-Shape Sectional",
    "slug": "kombera-espresso-bonded-leather-bachelor-l-shape-couch-280",
    "description": "Sleek and easy-to-clean espresso brown bonded leather sectional with low-profile gold-toned feet and matching leather cushions.",
    "base_price": 280.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-espresso-bonded-leather-bachelor-l-shape-couch-280.jpg",
    "stock_quantity": 10,
    "sku": "KMB-BAC-LTH-280"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000005",
    "name": "Kombera Mocha Brown Leather Corner Sectional Suite with Armchair",
    "slug": "kombera-mocha-brown-leather-corner-sectional-suite-armchair-350",
    "description": "Generously proportioned family corner sectional in mocha leatherette featuring armrest cup holders, padded headrests, floral accent cushions, and an accompanying armchair.",
    "base_price": 350.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": false,
    "image_url": "/images/products/kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg",
    "stock_quantity": 6,
    "sku": "KMB-CNR-MCH-350"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000006",
    "name": "Kombera Channel-Tufted Ribbed Grey Boucl\u00e9 Sectional Sofa",
    "slug": "kombera-channel-tufted-ribbed-grey-boucle-sectional-400",
    "description": "Contemporary designer sectional with architectural vertical channel tufting, textured grey upholstery, low-slung chaise, and plush toss pillows.",
    "base_price": 400.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-channel-tufted-ribbed-grey-boucle-sectional-400.jpg",
    "stock_quantity": 8,
    "sku": "KMB-CHN-GRY-400"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000007",
    "name": "Kombera Classic Harvard Black Leather 3-Piece Lounge Suite",
    "slug": "kombera-classic-harvard-black-leather-3pc-lounge-suite-500",
    "description": "Traditional prestige Harvard lounge suite crafted from supple black leather with curved pillowtop armrests, hand-carved mahogany scroll accents, and a matching coffee table.",
    "base_price": 500.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-classic-harvard-black-leather-3pc-lounge-suite-500.jpg",
    "stock_quantity": 5,
    "sku": "KMB-HRV-BLK-500"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000008",
    "name": "Kombera Grand Chocolate U-Shape Sectional Suite with Glass Tables",
    "slug": "kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500",
    "description": "Expansive U-shaped entertaining sectional suite in warm chocolate fabric, featuring dual integrated black tempered glass side surfaces, cup holders, and matching glass-top center table.",
    "base_price": 500.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": false,
    "image_url": "/images/products/kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500.jpg",
    "stock_quantity": 4,
    "sku": "KMB-USH-BRN-500"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000009",
    "name": "Kombera Rolex Diamond-Tufted Leather Armchair with Mahogany Wood Trim",
    "slug": "kombera-rolex-diamond-tufted-leather-armchair-mahogany-trim-500",
    "description": "Regal single-seater armchair featuring deep diamond button-tufting, scrolled pillowback arms, and high-gloss sculpted mahogany wood embellishments.",
    "base_price": 500.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-rolex-diamond-tufted-leather-armchair-mahogany-trim-500.jpg",
    "stock_quantity": 7,
    "sku": "KMB-RLX-CHR-500"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000010",
    "name": "Kombera Kirsty Executive Black Leather 4-Piece Living Room Suite",
    "slug": "kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200",
    "description": "The pinnacle of executive luxury: a complete 4-piece leather lounge suite (3-seater sofa, 2-seater loveseat, single armchairs, and designer glass coffee table) in obsidian black.",
    "base_price": 1200.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": true,
    "image_url": "/images/products/kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg",
    "stock_quantity": 3,
    "sku": "KMB-KRS-BLK-1200"
  },
  {
    "id": "b1000000-0000-0000-0000-000000000011",
    "name": "Kombera Kirsty Espresso Brown Leather Suite with Tangerine Accents",
    "slug": "kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200",
    "description": "Rich espresso brown leather 4-piece living room suite styled with vibrant tangerine scatter cushions, matching orange ottoman, and center coffee table.",
    "base_price": 1200.0,
    "category_id": "11111111-0000-0000-0000-000000000000",
    "category_name": "Living Room",
    "category_slug": "living-room",
    "is_featured": false,
    "image_url": "/images/products/kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200.jpg",
    "stock_quantity": 3,
    "sku": "KMB-KRS-BRN-1200"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000001",
    "name": "Kombera Mirrored 3-Drawer Bedside Pedestals (Pair)",
    "slug": "kombera-mirrored-3-drawer-bedside-pedestals-pair-250",
    "description": "Glamorous pair of matching 3-drawer nightstand pedestals clad in beveled reflective mirror panels with polished crystal faceted knobs.",
    "base_price": 250.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": true,
    "image_url": "/images/products/kombera-mirrored-3-drawer-bedside-pedestals-pair-250.jpg",
    "stock_quantity": 15,
    "sku": "KMB-PED-MIR-250"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000002",
    "name": "Kombera 4-Door White Wardrobe with 2 Center Drawers & Black Hardware",
    "slug": "kombera-4-door-white-wardrobe-drawers-270",
    "description": "Clean Scandinavian-inspired 4-door wardrobe in satin white melamine with 2 central bottom drawers and contrasting matte black bar handles.",
    "base_price": 270.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-4-door-white-wardrobe-drawers-270.jpg",
    "stock_quantity": 8,
    "sku": "KMB-WDR-4DW-270"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000003",
    "name": "Kombera 3-Door Wardrobe with Integrated 3-Drawer Vanity & Mirror",
    "slug": "kombera-3-door-wardrobe-vanity-dressing-table-white-270",
    "description": "Space-saving combination wardrobe featuring 3 tall storage doors alongside a dedicated dressing vanity with full-length mirror, 3 drawers, and brushed gold handles.",
    "base_price": 270.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": true,
    "image_url": "/images/products/kombera-3-door-wardrobe-vanity-dressing-table-white-270.jpg",
    "stock_quantity": 10,
    "sku": "KMB-WDR-3DV-270"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000004",
    "name": "Kombera 3-Door Washed Oak Wardrobe with Integrated Vanity & Mirror",
    "slug": "kombera-3-door-washed-oak-wardrobe-vanity-300",
    "description": "3-door master wardrobe combo crafted in textured washed grey oak melamine with an attached vanity station, mirror, 3 drawers, and stainless steel hardware.",
    "base_price": 300.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-3-door-washed-oak-wardrobe-vanity-300.jpg",
    "stock_quantity": 7,
    "sku": "KMB-WDR-3VO-300"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000005",
    "name": "Kombera 3-Door Industrial Slate Wardrobe with Vanity & Mirror",
    "slug": "kombera-3-door-industrial-slate-wardrobe-vanity-300",
    "description": "Modern industrial 3-door wardrobe in concrete slate grey finish paired with a crisp white vanity dressing table, mirror, and 3 storage drawers.",
    "base_price": 300.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-3-door-industrial-slate-wardrobe-vanity-300.jpg",
    "stock_quantity": 6,
    "sku": "KMB-WDR-3VS-300"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000006",
    "name": "Kombera 4-Door 2-Piece Mirrored Wardrobe in White & Gold",
    "slug": "kombera-2pc-4-door-mirrored-wardrobe-white-320",
    "description": "Substantial 2-piece modular 4-door wardrobe in clean white melamine with dual full-length dressing mirrors and elegant brushed gold vertical handles.",
    "base_price": 320.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": true,
    "image_url": "/images/products/kombera-2pc-4-door-mirrored-wardrobe-white-320.jpg",
    "stock_quantity": 9,
    "sku": "KMB-WDR-4MG-320"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000007",
    "name": "Kombera 5-Door Charcoal Melamine Wardrobe (Exterior View)",
    "slug": "kombera-5-door-charcoal-melamine-wardrobe-closed-350",
    "description": "High-capacity 5-door bedroom wardrobe in deep charcoal timber-grain melamine with 2 central drawers and modern bar hardware.",
    "base_price": 350.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-5-door-charcoal-melamine-wardrobe-closed-350.jpg",
    "stock_quantity": 8,
    "sku": "KMB-WDR-5DC-350"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000008",
    "name": "Kombera 5-Door Charcoal Melamine Wardrobe (Open Interior View)",
    "slug": "kombera-5-door-charcoal-melamine-wardrobe-open-350",
    "description": "Interior showcase view of the 5-door charcoal wardrobe, highlighting its full-width hanging rail, 8 organizing shelves, and dual lower drawers.",
    "base_price": 350.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-5-door-charcoal-melamine-wardrobe-open-350.jpg",
    "stock_quantity": 8,
    "sku": "KMB-WDR-5DO-350"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000009",
    "name": "Kombera 5-Door Dark Walnut Wardrobe with 2 Center Drawers",
    "slug": "kombera-5-door-dark-walnut-wardrobe-drawers-350",
    "description": "Sophisticated 5-door bedroom wardrobe in dark textured walnut finish with 2 smooth-gliding center drawers and brushed silver pulls.",
    "base_price": 350.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": false,
    "image_url": "/images/products/kombera-5-door-dark-walnut-wardrobe-drawers-350.jpg",
    "stock_quantity": 6,
    "sku": "KMB-WDR-5DW-350"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000010",
    "name": "Kombera Grand 6-Door 3-Piece Mirrored Master Wardrobe",
    "slug": "kombera-grand-6-door-3pc-mirrored-master-wardrobe-500",
    "description": "Statement 3-piece master wardrobe spanning 6 doors in satin white melamine, featuring 2 full-height center dressing mirrors and dual-tone wood/gold hardware.",
    "base_price": 500.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": true,
    "image_url": "/images/products/kombera-grand-6-door-3pc-mirrored-master-wardrobe-500.jpg",
    "stock_quantity": 5,
    "sku": "KMB-WDR-6DM-500"
  },
  {
    "id": "b2000000-0000-0000-0000-000000000011",
    "name": "Kombera Executive 6-Door Wardrobe with Amber Fluted Glass & Aluminium",
    "slug": "kombera-executive-6-door-wardrobe-amber-glass-aluminium-650",
    "description": "Architectural luxury wardrobe in white melamine with central amber-tinted fluted glass showcase doors, matte black aluminum framing, and warm interior shelving.",
    "base_price": 650.0,
    "category_id": "22222222-0000-0000-0000-000000000000",
    "category_name": "Bedroom",
    "category_slug": "bedroom",
    "is_featured": true,
    "image_url": "/images/products/kombera-executive-6-door-wardrobe-amber-glass-aluminium-650.jpg",
    "stock_quantity": 4,
    "sku": "KMB-WDR-6GA-650"
  },
  {
    "id": "b3000000-0000-0000-0000-000000000001",
    "name": "Kombera 3-Door Slate Grey Kitchen Server & Island with Oak Top",
    "slug": "kombera-slate-grey-kitchen-island-server-140",
    "description": "Versatile kitchen island server with natural light oak butcher block top, 1 top cutlery drawer, 3 storage cabinet doors, and gold handles in slate grey.",
    "base_price": 140.0,
    "category_id": "33333333-0000-0000-0000-000000000000",
    "category_name": "Kitchen & Dining",
    "category_slug": "kitchen-dining",
    "is_featured": true,
    "image_url": "/images/products/kombera-slate-grey-kitchen-island-server-140.jpg",
    "stock_quantity": 14,
    "sku": "KMB-KIT-ISL-140"
  },
  {
    "id": "b3000000-0000-0000-0000-000000000002",
    "name": "Kombera Urban Slate Kitchen Dresser & Microwave Hutch",
    "slug": "kombera-urban-slate-kitchen-dresser-microwave-hutch-200",
    "description": "Compact modular kitchen dresser featuring concrete slate grey finish, dedicated microwave hutch, spice shelf, 3 drawers, and 2 base cupboards.",
    "base_price": 200.0,
    "category_id": "33333333-0000-0000-0000-000000000000",
    "category_name": "Kitchen & Dining",
    "category_slug": "kitchen-dining",
    "is_featured": true,
    "image_url": "/images/products/kombera-urban-slate-kitchen-dresser-microwave-hutch-200.jpg",
    "stock_quantity": 10,
    "sku": "KMB-KIT-DRS-200"
  },
  {
    "id": "b3000000-0000-0000-0000-000000000003",
    "name": "Kombera 2-Piece Washed Oak Modular Kitchen Pantry & Hutch",
    "slug": "kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340",
    "description": "2-piece modern modular kitchen suite in washed grey oak with black accents: base counter workstation with 3 drawers and upper microwave storage hutch.",
    "base_price": 340.0,
    "category_id": "33333333-0000-0000-0000-000000000000",
    "category_name": "Kitchen & Dining",
    "category_slug": "kitchen-dining",
    "is_featured": false,
    "image_url": "/images/products/kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340.jpg",
    "stock_quantity": 6,
    "sku": "KMB-KIT-2PC-340"
  },
  {
    "id": "b3000000-0000-0000-0000-000000000004",
    "name": "Kombera 5-Door Slate Grey Kitchen Combo with Glass Display & Wine Rack",
    "slug": "kombera-5-door-slate-grey-kitchen-combo-glass-wine-rack-340",
    "description": "Freestanding kitchen buffet combo in sleek slate grey with dual glass crockery display cabinets, built-in wine bottle rack, and microwave cubby.",
    "base_price": 340.0,
    "category_id": "33333333-0000-0000-0000-000000000000",
    "category_name": "Kitchen & Dining",
    "category_slug": "kitchen-dining",
    "is_featured": true,
    "image_url": "/images/products/kombera-5-door-slate-grey-kitchen-combo-glass-wine-rack-340.jpg",
    "stock_quantity": 5,
    "sku": "KMB-KIT-5DG-340"
  },
  {
    "id": "b3000000-0000-0000-0000-000000000005",
    "name": "Kombera 3-Piece Washed Oak Complete Modular Kitchen Suite",
    "slug": "kombera-3pc-washed-oak-modular-kitchen-suite-380",
    "description": "Complete 3-piece modular kitchen workstation: microwave tower hutch, 4-door base buffet credenza with cutlery drawer, and tall pantry column in washed oak.",
    "base_price": 380.0,
    "category_id": "33333333-0000-0000-0000-000000000000",
    "category_name": "Kitchen & Dining",
    "category_slug": "kitchen-dining",
    "is_featured": true,
    "image_url": "/images/products/kombera-3pc-washed-oak-modular-kitchen-suite-380-v2.jpg",
    "stock_quantity": 5,
    "sku": "KMB-KIT-3PC-380"
  }
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

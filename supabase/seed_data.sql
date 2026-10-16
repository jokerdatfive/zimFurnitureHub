-- Kombera Furniture Database Seed Script
-- Populates authentic Kombera stock products and categories

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
('11111111-0000-0000-0000-000000000000', 'Living Room', 'living-room', 'Luxury sectional sofas, executive suites, and bespoke lounge seating.'),
('22222222-0000-0000-0000-000000000000', 'Bedroom', 'bedroom', 'Designer wardrobes, vanity dressing stations, and mirrored pedestals.'),
('33333333-0000-0000-0000-000000000000', 'Kitchen & Dining', 'kitchen-dining', 'Modular kitchen suites, pantry hutches, and crafted island servers.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, base_price, is_featured) VALUES
('b1000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000000', 'Kombera Royal Blue Velvet Bachelor L-Shape Sectional', 'kombera-royal-blue-velvet-bachelor-l-shape-couch-250', 'Striking L-shaped sectional couch upholstered in plush royal sapphire velvet with reversible chaise lounge, golden legs, and matching throw pillows.', 250.00, true),
('b1000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000000', 'Kombera Midnight Navy Fabric Bachelor L-Shape Sectional', 'kombera-midnight-navy-bachelor-l-shape-couch-250', 'Durable woven fabric sectional in deep midnight navy with integrated chaise lounge, high-density foam cushioning, and matching accent cushions.', 250.00, false),
('b1000000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000000', 'Kombera White Faux Leather Bachelor L-Shape Sectional', 'kombera-white-leather-bachelor-l-shape-couch-250', 'Crisp modern white faux leather sectional sofa with dual armrest cup holders, adjustable headrests, and 4 matching white scatter cushions.', 250.00, false),
('b1000000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000000', 'Kombera Espresso Bonded Leather Bachelor L-Shape Sectional', 'kombera-espresso-bonded-leather-bachelor-l-shape-couch-280', 'Sleek and easy-to-clean espresso brown bonded leather sectional with low-profile gold-toned feet and matching leather cushions.', 280.00, true),
('b1000000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000000', 'Kombera Mocha Brown Leather Corner Sectional Suite with Armchair', 'kombera-mocha-brown-leather-corner-sectional-suite-armchair-350', 'Generously proportioned family corner sectional in mocha leatherette featuring armrest cup holders, padded headrests, floral accent cushions, and an accompanying armchair.', 350.00, false),
('b1000000-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000000', 'Kombera Channel-Tufted Ribbed Grey Bouclé Sectional Sofa', 'kombera-channel-tufted-ribbed-grey-boucle-sectional-400', 'Contemporary designer sectional with architectural vertical channel tufting, textured grey upholstery, low-slung chaise, and plush toss pillows.', 400.00, true),
('b1000000-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000000', 'Kombera Classic Harvard Black Leather 3-Piece Lounge Suite', 'kombera-classic-harvard-black-leather-3pc-lounge-suite-500', 'Traditional prestige Harvard lounge suite crafted from supple black leather with curved pillowtop armrests, hand-carved mahogany scroll accents, and a matching coffee table.', 500.00, true),
('b1000000-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000000', 'Kombera Grand Chocolate U-Shape Sectional Suite with Glass Tables', 'kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500', 'Expansive U-shaped entertaining sectional suite in warm chocolate fabric, featuring dual integrated black tempered glass side surfaces, cup holders, and matching glass-top center table.', 500.00, false),
('b1000000-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000000', 'Kombera Rolex Diamond-Tufted Leather Armchair with Mahogany Wood Trim', 'kombera-rolex-diamond-tufted-leather-armchair-mahogany-trim-500', 'Regal single-seater armchair featuring deep diamond button-tufting, scrolled pillowback arms, and high-gloss sculpted mahogany wood embellishments.', 500.00, true),
('b1000000-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000000', 'Kombera Kirsty Executive Black Leather 4-Piece Living Room Suite', 'kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200', 'The pinnacle of executive luxury: a complete 4-piece leather lounge suite (3-seater sofa, 2-seater loveseat, single armchairs, and designer glass coffee table) in obsidian black.', 1200.00, true),
('b1000000-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000000', 'Kombera Kirsty Espresso Brown Leather Suite with Tangerine Accents', 'kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200', 'Rich espresso brown leather 4-piece living room suite styled with vibrant tangerine scatter cushions, matching orange ottoman, and center coffee table.', 1200.00, false),
('b2000000-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000000', 'Kombera Mirrored 3-Drawer Bedside Pedestals (Pair)', 'kombera-mirrored-3-drawer-bedside-pedestals-pair-250', 'Glamorous pair of matching 3-drawer nightstand pedestals clad in beveled reflective mirror panels with polished crystal faceted knobs.', 250.00, true),
('b2000000-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000000', 'Kombera 4-Door White Wardrobe with 2 Center Drawers & Black Hardware', 'kombera-4-door-white-wardrobe-drawers-270', 'Clean Scandinavian-inspired 4-door wardrobe in satin white melamine with 2 central bottom drawers and contrasting matte black bar handles.', 270.00, false),
('b2000000-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000000', 'Kombera 3-Door Wardrobe with Integrated 3-Drawer Vanity & Mirror', 'kombera-3-door-wardrobe-vanity-dressing-table-white-270', 'Space-saving combination wardrobe featuring 3 tall storage doors alongside a dedicated dressing vanity with full-length mirror, 3 drawers, and brushed gold handles.', 270.00, true),
('b2000000-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000000', 'Kombera 3-Door Washed Oak Wardrobe with Integrated Vanity & Mirror', 'kombera-3-door-washed-oak-wardrobe-vanity-300', '3-door master wardrobe combo crafted in textured washed grey oak melamine with an attached vanity station, mirror, 3 drawers, and stainless steel hardware.', 300.00, false),
('b2000000-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000000', 'Kombera 3-Door Industrial Slate Wardrobe with Vanity & Mirror', 'kombera-3-door-industrial-slate-wardrobe-vanity-300', 'Modern industrial 3-door wardrobe in concrete slate grey finish paired with a crisp white vanity dressing table, mirror, and 3 storage drawers.', 300.00, false),
('b2000000-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000000', 'Kombera 4-Door 2-Piece Mirrored Wardrobe in White & Gold', 'kombera-2pc-4-door-mirrored-wardrobe-white-320', 'Substantial 2-piece modular 4-door wardrobe in clean white melamine with dual full-length dressing mirrors and elegant brushed gold vertical handles.', 320.00, true),
('b2000000-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000000', 'Kombera 5-Door Charcoal Melamine Wardrobe (Exterior View)', 'kombera-5-door-charcoal-melamine-wardrobe-closed-350', 'High-capacity 5-door bedroom wardrobe in deep charcoal timber-grain melamine with 2 central drawers and modern bar hardware.', 350.00, false),
('b2000000-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000000', 'Kombera 5-Door Charcoal Melamine Wardrobe (Open Interior View)', 'kombera-5-door-charcoal-melamine-wardrobe-open-350', 'Interior showcase view of the 5-door charcoal wardrobe, highlighting its full-width hanging rail, 8 organizing shelves, and dual lower drawers.', 350.00, false),
('b2000000-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000000', 'Kombera 5-Door Dark Walnut Wardrobe with 2 Center Drawers', 'kombera-5-door-dark-walnut-wardrobe-drawers-350', 'Sophisticated 5-door bedroom wardrobe in dark textured walnut finish with 2 smooth-gliding center drawers and brushed silver pulls.', 350.00, false),
('b2000000-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000000', 'Kombera Grand 6-Door 3-Piece Mirrored Master Wardrobe', 'kombera-grand-6-door-3pc-mirrored-master-wardrobe-500', 'Statement 3-piece master wardrobe spanning 6 doors in satin white melamine, featuring 2 full-height center dressing mirrors and dual-tone wood/gold hardware.', 500.00, true),
('b2000000-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000000', 'Kombera Executive 6-Door Wardrobe with Amber Fluted Glass & Aluminium', 'kombera-executive-6-door-wardrobe-amber-glass-aluminium-650', 'Architectural luxury wardrobe in white melamine with central amber-tinted fluted glass showcase doors, matte black aluminum framing, and warm interior shelving.', 650.00, true),
('b3000000-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000000', 'Kombera 3-Door Slate Grey Kitchen Server & Island with Oak Top', 'kombera-slate-grey-kitchen-island-server-140', 'Versatile kitchen island server with natural light oak butcher block top, 1 top cutlery drawer, 3 storage cabinet doors, and gold handles in slate grey.', 140.00, true),
('b3000000-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000000', 'Kombera Urban Slate Kitchen Dresser & Microwave Hutch', 'kombera-urban-slate-kitchen-dresser-microwave-hutch-200', 'Compact modular kitchen dresser featuring concrete slate grey finish, dedicated microwave hutch, spice shelf, 3 drawers, and 2 base cupboards.', 200.00, true),
('b3000000-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000000', 'Kombera 2-Piece Washed Oak Modular Kitchen Pantry & Hutch', 'kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340', '2-piece modern modular kitchen suite in washed grey oak with black accents: base counter workstation with 3 drawers and upper microwave storage hutch.', 340.00, false),
('b3000000-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000000', 'Kombera 5-Door Slate Grey Kitchen Combo with Glass Display & Wine Rack', 'kombera-5-door-slate-grey-kitchen-combo-glass-wine-rack-340', 'Freestanding kitchen buffet combo in sleek slate grey with dual glass crockery display cabinets, built-in wine bottle rack, and microwave cubby.', 340.00, true),
('b3000000-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000000', 'Kombera 3-Piece Washed Oak Complete Modular Kitchen Suite', 'kombera-3pc-washed-oak-modular-kitchen-suite-380', 'Complete 3-piece modular kitchen workstation: microwave tower hutch, 4-door base buffet credenza with cutlery drawer, and tall pantry column in washed oak.', 380.00, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_featured = EXCLUDED.is_featured;

-- 3. Insert Product Variants
INSERT INTO public.product_variants (product_id, sku, name, price, stock_quantity, image_url) VALUES
('b1000000-0000-0000-0000-000000000001', 'KMB-BAC-BLU-250', 'Standard', 250.00, 12, '/images/products/kombera-royal-blue-velvet-bachelor-l-shape-couch-250.jpg'),
('b1000000-0000-0000-0000-000000000002', 'KMB-BAC-NVY-250', 'Standard', 250.00, 10, '/images/products/kombera-midnight-navy-bachelor-l-shape-couch-250.jpg'),
('b1000000-0000-0000-0000-000000000003', 'KMB-BAC-WHT-250', 'Standard', 250.00, 8, '/images/products/kombera-white-leather-bachelor-l-shape-couch-250.jpg'),
('b1000000-0000-0000-0000-000000000004', 'KMB-BAC-LTH-280', 'Standard', 280.00, 10, '/images/products/kombera-espresso-bonded-leather-bachelor-l-shape-couch-280.jpg'),
('b1000000-0000-0000-0000-000000000005', 'KMB-CNR-MCH-350', 'Standard', 350.00, 6, '/images/products/kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg'),
('b1000000-0000-0000-0000-000000000006', 'KMB-CHN-GRY-400', 'Standard', 400.00, 8, '/images/products/kombera-channel-tufted-ribbed-grey-boucle-sectional-400.jpg'),
('b1000000-0000-0000-0000-000000000007', 'KMB-HRV-BLK-500', 'Standard', 500.00, 5, '/images/products/kombera-classic-harvard-black-leather-3pc-lounge-suite-500.jpg'),
('b1000000-0000-0000-0000-000000000008', 'KMB-USH-BRN-500', 'Standard', 500.00, 4, '/images/products/kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500.jpg'),
('b1000000-0000-0000-0000-000000000009', 'KMB-RLX-CHR-500', 'Standard', 500.00, 7, '/images/products/kombera-rolex-diamond-tufted-leather-armchair-mahogany-trim-500.jpg'),
('b1000000-0000-0000-0000-000000000010', 'KMB-KRS-BLK-1200', 'Standard', 1200.00, 3, '/images/products/kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg'),
('b1000000-0000-0000-0000-000000000011', 'KMB-KRS-BRN-1200', 'Standard', 1200.00, 3, '/images/products/kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200.jpg'),
('b2000000-0000-0000-0000-000000000001', 'KMB-PED-MIR-250', 'Standard', 250.00, 15, '/images/products/kombera-mirrored-3-drawer-bedside-pedestals-pair-250.jpg'),
('b2000000-0000-0000-0000-000000000002', 'KMB-WDR-4DW-270', 'Standard', 270.00, 8, '/images/products/kombera-4-door-white-wardrobe-drawers-270.jpg'),
('b2000000-0000-0000-0000-000000000003', 'KMB-WDR-3DV-270', 'Standard', 270.00, 10, '/images/products/kombera-3-door-wardrobe-vanity-dressing-table-white-270.jpg'),
('b2000000-0000-0000-0000-000000000004', 'KMB-WDR-3VO-300', 'Standard', 300.00, 7, '/images/products/kombera-3-door-washed-oak-wardrobe-vanity-300.jpg'),
('b2000000-0000-0000-0000-000000000005', 'KMB-WDR-3VS-300', 'Standard', 300.00, 6, '/images/products/kombera-3-door-industrial-slate-wardrobe-vanity-300.jpg'),
('b2000000-0000-0000-0000-000000000006', 'KMB-WDR-4MG-320', 'Standard', 320.00, 9, '/images/products/kombera-2pc-4-door-mirrored-wardrobe-white-320.jpg'),
('b2000000-0000-0000-0000-000000000007', 'KMB-WDR-5DC-350', 'Standard', 350.00, 8, '/images/products/kombera-5-door-charcoal-melamine-wardrobe-closed-350.jpg'),
('b2000000-0000-0000-0000-000000000008', 'KMB-WDR-5DO-350', 'Standard', 350.00, 8, '/images/products/kombera-5-door-charcoal-melamine-wardrobe-open-350.jpg'),
('b2000000-0000-0000-0000-000000000009', 'KMB-WDR-5DW-350', 'Standard', 350.00, 6, '/images/products/kombera-5-door-dark-walnut-wardrobe-drawers-350.jpg'),
('b2000000-0000-0000-0000-000000000010', 'KMB-WDR-6DM-500', 'Standard', 500.00, 5, '/images/products/kombera-grand-6-door-3pc-mirrored-master-wardrobe-500.jpg'),
('b2000000-0000-0000-0000-000000000011', 'KMB-WDR-6GA-650', 'Standard', 650.00, 4, '/images/products/kombera-executive-6-door-wardrobe-amber-glass-aluminium-650.jpg'),
('b3000000-0000-0000-0000-000000000001', 'KMB-KIT-ISL-140', 'Standard', 140.00, 14, '/images/products/kombera-slate-grey-kitchen-island-server-140.jpg'),
('b3000000-0000-0000-0000-000000000002', 'KMB-KIT-DRS-200', 'Standard', 200.00, 10, '/images/products/kombera-urban-slate-kitchen-dresser-microwave-hutch-200.jpg'),
('b3000000-0000-0000-0000-000000000003', 'KMB-KIT-2PC-340', 'Standard', 340.00, 6, '/images/products/kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340.jpg'),
('b3000000-0000-0000-0000-000000000004', 'KMB-KIT-5DG-340', 'Standard', 340.00, 5, '/images/products/kombera-5-door-slate-grey-kitchen-combo-glass-wine-rack-340.jpg'),
('b3000000-0000-0000-0000-000000000005', 'KMB-KIT-3PC-380', 'Standard', 380.00, 5, '/images/products/kombera-3pc-washed-oak-modular-kitchen-suite-380-v2.jpg')
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  stock_quantity = EXCLUDED.stock_quantity;

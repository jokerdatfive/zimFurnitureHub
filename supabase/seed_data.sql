-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
('11111111-0000-0000-0000-000000000000', 'Living Room', 'living-room', 'Comfortable and stylish furniture for your living space.'),
('22222222-0000-0000-0000-000000000000', 'Bedroom', 'bedroom', 'Beds, nightstands, and dressers for a restful sanctuary.'),
('33333333-0000-0000-0000-000000000000', 'Dining Room', 'dining-room', 'Tables and seating for elegant dining experiences.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, base_price, is_featured) VALUES
('a1000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Oslo Velvet Sofa', 'oslo-velvet-sofa', 'A luxurious velvet sofa with a modern silhouette and deep, comfortable seating.', 3299.00, true),
('a2000000-0000-0000-0000-000000000000', '33333333-0000-0000-0000-000000000000', 'Nordic Oak Dining Table', 'nordic-oak-dining-table', 'Solid oak dining table that seats six, featuring clean lines and natural wood grain.', 2199.00, true),
('a3000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Minimalist Accent Chair', 'minimalist-accent-chair', 'Sleek accent chair with a black metal frame and premium leather upholstery.', 899.00, true),
('a4000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000000', 'Copenhagen Bedframe', 'copenhagen-bedframe', 'Platform bedframe crafted from sustainable walnut with an integrated headboard.', 1899.00, true),
('a5000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Scandinavian Side Table', 'scandinavian-side-table', 'A versatile side table with a matte finish and minimalist aesthetic.', 549.00, true),
('a6000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Modern Floor Lamp', 'modern-floor-lamp', 'Elegant floor lamp with brass accents and a warm, diffused light output.', 429.00, true),
('a7000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Linen Lounge Chair', 'linen-lounge-chair', 'Relaxed lounge chair upholstered in breathable linen blend fabric.', 1299.00, true),
('a8000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Walnut Console Table', 'walnut-console-table', 'Narrow console table perfect for entryways or behind the sofa.', 1499.00, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Product Variants (used to hold the image_url and exact price)
INSERT INTO public.product_variants (product_id, sku, name, price, stock_quantity, image_url) VALUES
('a1000000-0000-0000-0000-000000000000', 'OSL-SOF-VEL', 'Standard', 3299.00, 10, '/images/product-sofa.jpg'),
('a2000000-0000-0000-0000-000000000000', 'NOR-OAK-DIN', 'Standard', 2199.00, 15, '/images/product-dining-table.jpg'),
('a3000000-0000-0000-0000-000000000000', 'MIN-ACC-CHR', 'Standard', 899.00, 20, '/images/product-accent-chair.jpg'),
('a4000000-0000-0000-0000-000000000000', 'COP-BED-FRM', 'Standard', 1899.00, 5, '/images/product-bedframe.jpg'),
('a5000000-0000-0000-0000-000000000000', 'SCA-SID-TBL', 'Standard', 549.00, 30, '/images/product-side-table.jpg'),
('a6000000-0000-0000-0000-000000000000', 'MOD-FLR-LMP', 'Standard', 429.00, 25, '/images/product-floor-lamp.jpg'),
('a7000000-0000-0000-0000-000000000000', 'LIN-LNG-CHR', 'Standard', 1299.00, 12, '/images/product-lounge-chair.jpg'),
('a8000000-0000-0000-0000-000000000000', 'WAL-CON-TBL', 'Standard', 1499.00, 8, '/images/product-console-table.jpg')
ON CONFLICT (sku) DO NOTHING;

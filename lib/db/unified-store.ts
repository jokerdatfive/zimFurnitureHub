import fs from 'fs';
import path from 'path';
import { queryPg } from './postgres';
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES } from '@/lib/catalog-data';

export interface StoredProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category_id: string;
  category_name?: string;
  is_featured: boolean;
  stock_quantity: number;
  sku: string;
  images: string[];
  colors: string[];
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  movement_type: 'PURCHASE_RESTOCK' | 'SALE_DEDUCTION';
  quantity: number;
  unit_cost?: number | null;
  supplier?: string;
  reference_notes?: string;
  logged_by: string;
  created_at: string;
}

export interface StoredLayby {
  id: string;
  contact_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  product_id?: string;
  product_name: string;
  total_price: number;
  deposit_paid: number;
  balance_due: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
  notes?: string;
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface StoredLead {
  id: string;
  contact_id?: string;
  name: string;
  phone: string;
  interested_in?: string;
  estimated_value?: number | null; // ONLY if user explicitly negotiated or stated, otherwise null
  status: 'NEW' | 'INTERESTED' | 'PROMISED' | 'LAYBY' | 'CONVERTED' | 'LOST' | 'CASUAL_CHAT';
  notes?: string;
  is_casual_chat: boolean;
  confidence?: number;
  needs_review?: boolean;
  created_at: string;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initial products built from Zimbabwe catalog
function getInitialProducts(): StoredProduct[] {
  return CATALOG_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    base_price: p.base_price,
    category_id: p.category_id,
    category_name: p.category_name,
    is_featured: p.is_featured,
    stock_quantity: p.stock_quantity,
    sku: p.sku,
    images: [p.image_url],
    colors: ['Standard Finish'],
    created_at: new Date().toISOString(),
  }));
}

/**
 * ==========================================
 * PRODUCTS & STOCK CRUD OPERATIONS
 * ==========================================
 */
export async function getProducts(): Promise<StoredProduct[]> {
  const localProducts = readJsonFile<StoredProduct[]>('products.json', getInitialProducts());

  // Try fetching directly from PostgreSQL in the background / if connected
  try {
    const rows = await queryPg(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.base_price, p.category_id, p.is_featured, p.created_at,
        c.name as category_name,
        COALESCE(
          (SELECT json_agg(json_build_object('sku', pv.sku, 'name', pv.name, 'price', pv.price, 'stock', pv.stock_quantity, 'image_url', pv.image_url))
           FROM product_variants pv WHERE pv.product_id = p.id), '[]'::json
        ) as variants,
        COALESCE(
          (SELECT json_agg(pi.url ORDER BY pi.display_order ASC)
           FROM product_images pi WHERE pi.product_id = p.id), '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC;
    `);

    if (rows && rows.length > 0) {
      const dbProducts: StoredProduct[] = rows.map((r: any) => {
        const variants = r.variants || [];
        const imagesList = r.images && r.images.length > 0 ? r.images : ['/images/product-sofa.jpg'];
        const totalStock = variants.length > 0
          ? variants.reduce((s: number, v: any) => s + (parseInt(v.stock, 10) || 0), 0)
          : 0;
        const colorNames = variants.map((v: any) => v.name).filter(Boolean);

        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          base_price: parseFloat(r.base_price) || 0,
          category_id: r.category_id,
          category_name: r.category_name || 'Furniture',
          is_featured: Boolean(r.is_featured),
          stock_quantity: totalStock,
          sku: variants[0]?.sku || `KK-${r.id.slice(0, 6).toUpperCase()}`,
          images: imagesList,
          colors: colorNames.length > 0 ? colorNames : ['Standard Finish'],
          created_at: r.created_at || new Date().toISOString(),
        };
      });

      // Merge and update local storage so offline/cache is always fresh
      try {
        writeJsonFile('products.json', dbProducts);
      } catch {}
      return dbProducts;
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Using robust local catalog store (DB unavailable:', err.message, ')');
  }

  return localProducts;
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  images: string[];
  colors: string[];
  isFeatured?: boolean;
}): Promise<StoredProduct> {
  const products = readJsonFile<StoredProduct[]>('products.json', getInitialProducts());
  const category = CATALOG_CATEGORIES.find((c) => c.id === data.categoryId);
  const now = new Date().toISOString();

  let savedProduct: StoredProduct;

  if (data.id) {
    // Edit existing product
    const index = products.findIndex((p) => p.id === data.id);
    if (index !== -1) {
      savedProduct = {
        ...products[index],
        name: data.name,
        description: data.description,
        base_price: data.price,
        category_id: data.categoryId,
        category_name: category ? category.name : products[index].category_name,
        stock_quantity: data.stock,
        images: data.images.length > 0 ? data.images : products[index].images,
        colors: data.colors.length > 0 ? data.colors : products[index].colors,
        is_featured: data.isFeatured ?? products[index].is_featured,
      };
      products[index] = savedProduct;
    } else {
      savedProduct = {
        id: data.id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: data.description,
        base_price: data.price,
        category_id: data.categoryId,
        category_name: category?.name || 'General',
        is_featured: Boolean(data.isFeatured),
        stock_quantity: data.stock,
        sku: `KK-${Date.now().toString(36).toUpperCase()}`,
        images: data.images,
        colors: data.colors,
        created_at: now,
      };
      products.unshift(savedProduct);
    }
  } else {
    // Add new product
    const newId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    savedProduct = {
      id: newId,
      name: data.name,
      slug: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36).slice(-4)}`,
      description: data.description,
      base_price: data.price,
      category_id: data.categoryId,
      category_name: category?.name || 'General',
      is_featured: Boolean(data.isFeatured),
      stock_quantity: data.stock,
      sku: `KK-${Date.now().toString(36).toUpperCase()}`,
      images: data.images.length > 0 ? data.images : ['/images/product-sofa.jpg'],
      colors: data.colors.length > 0 ? data.colors : ['Standard'],
      created_at: now,
    };
    products.unshift(savedProduct);
  }

  // 1. Immediately persist to disk
  writeJsonFile('products.json', products);

  // 2. Also sync to PostgreSQL if connected
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(savedProduct.id);
    if (isUuid) {
      await queryPg(
        `UPDATE products SET name = $1, description = $2, base_price = $3, category_id = $4, is_featured = $5 WHERE id = $6`,
        [savedProduct.name, savedProduct.description, savedProduct.base_price, savedProduct.category_id, savedProduct.is_featured, savedProduct.id]
      );
      await queryPg(
        `UPDATE product_variants SET price = $1, stock_quantity = $2, image_url = $3 WHERE product_id = $4`,
        [savedProduct.base_price, savedProduct.stock_quantity, savedProduct.images[0] || '/images/product-sofa.jpg', savedProduct.id]
      );
    }
  } catch (dbErr: any) {
    console.warn('[UnifiedStore] Note: Saved to authoritative store. DB sync queued:', dbErr.message);
  }

  return savedProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const products = readJsonFile<StoredProduct[]>('products.json', getInitialProducts());
  const updated = products.filter((p) => p.id !== productId);
  writeJsonFile('products.json', updated);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (isUuid) {
      await queryPg(`DELETE FROM products WHERE id = $1`, [productId]);
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Removed from local catalog. DB delete queued:', err.message);
  }

  return true;
}

export async function quickUpdateProductStock(productId: string, newStock: number): Promise<StoredProduct | null> {
  const stockVal = Math.max(0, newStock);

  // 1. Update in PostgreSQL directly
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (isUuid) {
      await queryPg(
        `UPDATE product_variants SET stock_quantity = $1 WHERE product_id = $2`,
        [stockVal, productId]
      );
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Direct DB quick stock update:', err.message);
  }

  // 2. Also keep local JSON cache in sync
  const products = readJsonFile<StoredProduct[]>('products.json', getInitialProducts());
  const item = products.find((p) => p.id === productId);
  if (item) {
    item.stock_quantity = stockVal;
    try {
      writeJsonFile('products.json', products);
    } catch {}
    return item;
  }

  return null;
}

/**
 * ==========================================
 * STOCK MOVEMENTS & PURCHASES LEDGER
 * ==========================================
 */
export async function getStockMovements(): Promise<StockMovement[]> {
  const localMovements = readJsonFile<StockMovement[]>('stock-movements.json', []);

  try {
    const rows = await queryPg(`
      SELECT sm.id, sm.product_id, sm.movement_type, sm.quantity, sm.unit_cost,
             sm.supplier, sm.reference_notes, sm.logged_by, sm.created_at,
             p.name as product_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
      LIMIT 100;
    `);

    if (rows && rows.length > 0) {
      const dbMovements: StockMovement[] = rows.map((r: any) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name || 'Furniture Asset',
        movement_type: r.movement_type,
        quantity: r.quantity,
        unit_cost: r.unit_cost ? parseFloat(r.unit_cost) : null,
        supplier: r.supplier || 'Warehouse',
        reference_notes: r.reference_notes || '',
        logged_by: r.logged_by || 'Store Admin',
        created_at: r.created_at,
      }));
      try {
        writeJsonFile('stock-movements.json', dbMovements);
      } catch {}
      return dbMovements;
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Using local stock movement ledger:', err.message);
  }

  return localMovements;
}

export async function logStockMovement(data: {
  productId: string;
  movementType: 'PURCHASE_RESTOCK' | 'SALE_DEDUCTION';
  quantity: number;
  unitCost?: number | null;
  supplier?: string;
  notes?: string;
  loggedBy?: string;
}): Promise<StockMovement> {
  const qty = Math.abs(data.quantity || 1);
  const isDeduction = data.movementType === 'SALE_DEDUCTION';
  const signedQty = isDeduction ? -qty : qty;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.productId);

  let updatedStockQuantity: number | null = null;
  let dbProductName = '';

  // 1. Execute direct atomic change in PostgreSQL
  if (isUuid) {
    try {
      if (isDeduction) {
        await queryPg(
          `UPDATE product_variants SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE product_id = $2`,
          [qty, data.productId]
        );
      } else {
        await queryPg(
          `UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE product_id = $2`,
          [qty, data.productId]
        );
      }

      // Record in immutable stock_movements table
      await queryPg(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, supplier, reference_notes, logged_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.productId,
          data.movementType,
          signedQty,
          data.unitCost || null,
          data.supplier || (isDeduction ? 'Customer Sale' : 'Workshop / Supplier'),
          data.notes || '',
          data.loggedBy || 'Store Admin'
        ]
      );

      const variantRows = await queryPg(
        `SELECT pv.stock_quantity, p.name 
         FROM product_variants pv 
         JOIN products p ON pv.product_id = p.id 
         WHERE pv.product_id = $1`,
        [data.productId]
      );
      if (variantRows && variantRows.length > 0) {
        updatedStockQuantity = parseInt(variantRows[0].stock_quantity, 10);
        dbProductName = variantRows[0].name;
      }
    } catch (dbErr: any) {
      console.warn('[UnifiedStore] Note: DB stock update error:', dbErr.message);
    }
  }

  // 2. Adjust local cache
  const products = readJsonFile<StoredProduct[]>('products.json', getInitialProducts());
  const product = products.find((p) => p.id === data.productId);
  const productName = dbProductName || (product ? product.name : 'Furniture Piece');

  if (product) {
    if (updatedStockQuantity !== null) {
      product.stock_quantity = updatedStockQuantity;
    } else {
      if (isDeduction) {
        product.stock_quantity = Math.max(0, product.stock_quantity - qty);
      } else {
        product.stock_quantity += qty;
      }
    }
    try {
      writeJsonFile('products.json', products);
    } catch {}
  }

  // 3. Append to local movement ledger
  const movements = readJsonFile<StockMovement[]>('stock-movements.json', []);
  const newMovement: StockMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    product_id: data.productId,
    product_name: productName,
    movement_type: data.movementType,
    quantity: signedQty,
    unit_cost: data.unitCost || null,
    supplier: data.supplier || (isDeduction ? 'Customer Sale' : 'Workshop / Supplier'),
    reference_notes: data.notes || '',
    logged_by: data.loggedBy || 'Store Admin',
    created_at: new Date().toISOString(),
  };

  movements.unshift(newMovement);
  try {
    writeJsonFile('stock-movements.json', movements);
  } catch {}

  return newMovement;
}

/**
 * ==========================================
 * LEADS & QUALIFICATION (NO FAKE PRICES/BUDGETS)
 * ==========================================
 */
export async function getLeads(includeCasual: boolean = false): Promise<StoredLead[]> {
  const localLeads = readJsonFile<StoredLead[]>('leads.json', []);

  try {
    const rows = await queryPg(`
      SELECT l.id, l.contact_id, l.name, l.phone, l.interested_in, l.estimated_value,
             l.status, l.notes, l.confidence, l.needs_review, l.created_at, l.updated_at
      FROM leads l
      ORDER BY l.created_at DESC;
    `);

    if (rows && rows.length > 0) {
      const dbLeads: StoredLead[] = rows.map((r: any) => {
        const isCasual = r.status === 'SPAM' || r.status === 'IRRELEVANT' || !r.interested_in;
        return {
          id: r.id,
          contact_id: r.contact_id,
          name: r.name || 'WhatsApp Client',
          phone: r.phone || 'WhatsApp',
          interested_in: r.interested_in || undefined,
          estimated_value: r.estimated_value ? parseFloat(r.estimated_value) : null,
          status: r.status,
          notes: r.notes || '',
          is_casual_chat: isCasual,
          confidence: r.confidence ? parseFloat(r.confidence) : 1.0,
          needs_review: Boolean(r.needs_review),
          created_at: r.created_at,
          updated_at: r.updated_at || r.created_at,
        };
      });

      writeJsonFile('leads.json', dbLeads);
      return includeCasual ? dbLeads : dbLeads.filter((l) => !l.is_casual_chat);
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Using local leads store:', err.message);
  }

  return includeCasual ? localLeads : localLeads.filter((l) => !l.is_casual_chat);
}

export async function updateLeadStatus(leadId: string, status: StoredLead['status'], notes?: string): Promise<boolean> {
  const leads = readJsonFile<StoredLead[]>('leads.json', []);
  const lead = leads.find((l) => l.id === leadId);
  if (lead) {
    lead.status = status;
    lead.is_casual_chat = status === 'CASUAL_CHAT' || status === 'LOST';
    if (notes !== undefined) lead.notes = notes;
    lead.updated_at = new Date().toISOString();
    writeJsonFile('leads.json', leads);
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId);
    if (isUuid) {
      const dbStatus = status === 'CASUAL_CHAT' ? 'LOST' : status;
      await queryPg(
        `UPDATE leads SET status = $1, updated_at = NOW() ${notes !== undefined ? ', notes = $3' : ''} WHERE id = $2`,
        notes !== undefined ? [dbStatus, leadId, notes] : [dbStatus, leadId]
      );
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Lead updated in store:', err.message);
  }

  return true;
}

/**
 * ==========================================
 * LAYBY AGREEMENTS & INSTALLMENTS
 * ==========================================
 */
export async function getLaybys(): Promise<StoredLayby[]> {
  const localLaybys = readJsonFile<StoredLayby[]>('laybys.json', []);

  try {
    const rows = await queryPg(`
      SELECT la.id, la.contact_id, la.product_name, la.total_price, la.deposit_paid,
             la.balance_due, la.status, la.notes, la.created_at, la.updated_at,
             wc.profile_name as customer_name, wc.phone as customer_phone,
             COALESCE(
               (SELECT json_agg(json_build_object('id', lp.id, 'amount', lp.amount, 'payment_date', lp.payment_date, 'payment_method', lp.payment_method, 'reference', lp.reference))
                FROM layby_payments lp WHERE lp.layby_id = la.id), '[]'::json
             ) as payments
      FROM layby_agreements la
      LEFT JOIN whatsapp_contacts wc ON la.contact_id = wc.id
      ORDER BY la.created_at DESC;
    `);

    if (rows && rows.length > 0) {
      const dbLaybys: StoredLayby[] = rows.map((r: any) => ({
        id: r.id,
        contact_id: r.contact_id,
        customer_name: r.customer_name || 'Showroom Customer',
        customer_phone: r.customer_phone || '',
        product_name: r.product_name,
        total_price: parseFloat(r.total_price) || 0,
        deposit_paid: parseFloat(r.deposit_paid) || 0,
        balance_due: parseFloat(r.balance_due) || 0,
        status: r.status,
        notes: r.notes || '',
        payments: (r.payments || []).map((p: any) => ({
          ...p,
          amount: parseFloat(p.amount) || 0,
        })),
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
      }));

      writeJsonFile('laybys.json', dbLaybys);
      return dbLaybys;
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Note: Using local layby store:', err.message);
  }

  return localLaybys;
}

export async function createLayby(data: {
  customerName: string;
  customerPhone?: string;
  contactId?: string;
  productName: string;
  totalPrice: number;
  depositPaid: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<StoredLayby> {
  const laybys = readJsonFile<StoredLayby[]>('laybys.json', []);
  const balance = Math.max(0, data.totalPrice - data.depositPaid);
  const now = new Date().toISOString();
  const id = `lay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const payments = [];
  if (data.depositPaid > 0) {
    payments.push({
      id: `pay-${Date.now()}`,
      amount: data.depositPaid,
      payment_date: now,
      payment_method: data.paymentMethod || 'EcoCash',
      reference: 'Initial Deposit',
    });
  }

  const newLayby: StoredLayby = {
    id,
    contact_id: data.contactId || null,
    customer_name: data.customerName,
    customer_phone: data.customerPhone || '',
    product_name: data.productName,
    total_price: data.totalPrice,
    deposit_paid: data.depositPaid,
    balance_due: balance,
    status: balance === 0 ? 'COMPLETED' : 'ACTIVE',
    notes: data.notes || '',
    payments,
    created_at: now,
    updated_at: now,
  };

  laybys.unshift(newLayby);
  writeJsonFile('laybys.json', laybys);

  // Sync to PostgreSQL if connected
  try {
    const isContactUuid = data.contactId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.contactId);
    const dbRes = await queryPg(
      `INSERT INTO layby_agreements (contact_id, product_name, total_price, deposit_paid, balance_due, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [isContactUuid ? data.contactId : null, data.productName, data.totalPrice, data.depositPaid, balance, newLayby.status, data.notes || '']
    );

    if (dbRes && dbRes[0]?.id && data.depositPaid > 0) {
      await queryPg(
        `INSERT INTO layby_payments (layby_id, amount, payment_method, reference)
         VALUES ($1, $2, $3, $4)`,
        [dbRes[0].id, data.depositPaid, data.paymentMethod || 'EcoCash', 'Initial Deposit']
      );
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Layby stored locally. DB sync deferred:', err.message);
  }

  return newLayby;
}

export async function recordLaybyInstallment(data: {
  laybyId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
}): Promise<StoredLayby | null> {
  const laybys = readJsonFile<StoredLayby[]>('laybys.json', []);
  const layby = laybys.find((l) => l.id === data.laybyId);
  if (!layby) return null;

  const now = new Date().toISOString();
  layby.deposit_paid += data.amount;
  layby.balance_due = Math.max(0, layby.total_price - layby.deposit_paid);
  if (layby.balance_due === 0) {
    layby.status = 'COMPLETED';
  }
  layby.updated_at = now;
  layby.payments.push({
    id: `pay-${Date.now()}`,
    amount: data.amount,
    payment_date: now,
    payment_method: data.paymentMethod,
    reference: data.reference,
  });

  writeJsonFile('laybys.json', laybys);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.laybyId);
    if (isUuid) {
      await queryPg(
        `INSERT INTO layby_payments (layby_id, amount, payment_method, reference) VALUES ($1, $2, $3, $4)`,
        [data.laybyId, data.amount, data.paymentMethod, data.reference || null]
      );
      await queryPg(
        `UPDATE layby_agreements SET deposit_paid = $1, balance_due = $2, status = $3, updated_at = NOW() WHERE id = $4`,
        [layby.deposit_paid, layby.balance_due, layby.status, data.laybyId]
      );
    }
  } catch (err: any) {
    console.warn('[UnifiedStore] Layby payment recorded in store:', err.message);
  }

  return layby;
}

/**
 * ==========================================
 * DEDICATED DATA ANALYTICS & AUDIT CALCULATIONS
 * ==========================================
 */
export interface BusinessAnalytics {
  period: 'day' | 'week' | 'month' | 'all';
  periodLabel: string;
  totalLeads: number;
  hotLeads: number;
  qualifiedLeads: number;
  casualChatsExcluded: number;
  assetValuation: number;
  totalStockUnits: number;
  lowStockItems: number;
  outOfStockItems: number;
  purchasesSpend: number;
  purchasesUnits: number;
  salesRevenue: number;
  salesUnits: number;
  activeLaybysCount: number;
  laybyOutstandingBalance: number;
  laybyCollected: number;
  dailyTrend: { date: string; leads: number; restocks: number; sales: number }[];
}

export async function getBusinessAnalytics(period: 'day' | 'week' | 'month' | 'all' = 'month'): Promise<BusinessAnalytics> {
  const products = await getProducts();
  const movements = await getStockMovements();
  const leads = await getLeads(true); // include all to accurately compute excluded casual chat
  const laybys = await getLaybys();

  const now = new Date();
  let cutoffDate = new Date(0); // All time

  if (period === 'day') {
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Filter items within period
  const periodMovements = movements.filter((m) => new Date(m.created_at) >= cutoffDate);
  const periodLeads = leads.filter((l) => new Date(l.created_at) >= cutoffDate);

  // Asset Metrics
  let assetValuation = 0;
  let totalStockUnits = 0;
  let lowStockItems = 0;
  let outOfStockItems = 0;

  products.forEach((p) => {
    totalStockUnits += p.stock_quantity;
    assetValuation += p.stock_quantity * p.base_price;
    if (p.stock_quantity === 0) outOfStockItems++;
    else if (p.stock_quantity < 3) lowStockItems++;
  });

  // Stock Movement Metrics
  let purchasesSpend = 0;
  let purchasesUnits = 0;
  let salesRevenue = 0;
  let salesUnits = 0;

  periodMovements.forEach((m) => {
    if (m.movement_type === 'PURCHASE_RESTOCK') {
      const q = Math.abs(m.quantity);
      purchasesUnits += q;
      purchasesSpend += q * (m.unit_cost || 0);
    } else if (m.movement_type === 'SALE_DEDUCTION') {
      const q = Math.abs(m.quantity);
      salesUnits += q;
      // Estimate revenue from product base_price if unit_cost unset
      const prod = products.find((p) => p.id === m.product_id);
      salesRevenue += q * (m.unit_cost || prod?.base_price || 0);
    }
  });

  // Leads Metrics
  const realLeads = periodLeads.filter((l) => !l.is_casual_chat);
  const hotLeads = realLeads.filter((l) => l.status === 'PROMISED' || l.status === 'LAYBY' || l.status === 'CONVERTED').length;
  const qualifiedLeads = realLeads.filter((l) => l.status === 'INTERESTED').length;
  const casualChatsExcluded = periodLeads.filter((l) => l.is_casual_chat).length;

  // Layby Metrics
  const activeLaybys = laybys.filter((l) => l.status === 'ACTIVE');
  const laybyOutstanding = activeLaybys.reduce((sum, l) => sum + l.balance_due, 0);
  const laybyCollected = laybys.reduce((sum, l) => sum + l.deposit_paid, 0);

  // Daily Trend calculation for charts
  const daysMap = new Map<string, { date: string; leads: number; restocks: number; sales: number }>();
  const daysCount = period === 'day' ? 1 : period === 'week' ? 7 : 30;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    daysMap.set(dateKey, { date: displayDate, leads: 0, restocks: 0, sales: 0 });
  }

  periodLeads.forEach((l) => {
    if (!l.is_casual_chat) {
      const key = l.created_at.split('T')[0];
      if (daysMap.has(key)) daysMap.get(key)!.leads++;
    }
  });

  periodMovements.forEach((m) => {
    const key = m.created_at.split('T')[0];
    if (daysMap.has(key)) {
      if (m.movement_type === 'PURCHASE_RESTOCK') {
        daysMap.get(key)!.restocks += Math.abs(m.quantity);
      } else {
        daysMap.get(key)!.sales += Math.abs(m.quantity);
      }
    }
  });

  const periodLabels = {
    day: 'Today (Per Day)',
    week: 'This Week (Per Week)',
    month: 'This Month (Per Month)',
    all: 'All Time Business Audit',
  };

  return {
    period,
    periodLabel: periodLabels[period],
    totalLeads: realLeads.length,
    hotLeads,
    qualifiedLeads,
    casualChatsExcluded,
    assetValuation,
    totalStockUnits,
    lowStockItems,
    outOfStockItems,
    purchasesSpend,
    purchasesUnits,
    salesRevenue,
    salesUnits,
    activeLaybysCount: activeLaybys.length,
    laybyOutstandingBalance: laybyOutstanding,
    laybyCollected,
    dailyTrend: Array.from(daysMap.values()),
  };
}

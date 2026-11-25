import { extractAuthUser, handleGetMe, handleLogin } from './auth';
import { handleGetProfile, handleUpdateProfile } from './profile';
import { handleCreateAddress, handleGetAddressById, handleListAddresses, handleUpdateAddress } from './address';
import { handleGetProductById, handleListProducts } from './products';
import { proxyToPhp } from './proxy';
import pool from './db';

const PORT = parseInt(process.env.PORT || '3000', 10);

function setCorsHeaders(resHeaders: Headers): void {
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Handle preflight CORS
    if (method === 'OPTIONS') {
      const headers = new Headers();
      setCorsHeaders(headers);
      return new Response(null, { status: 204, headers });
    }

    try {
      let response: Response;

      // 1. Auth routes
      if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(req);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleGetMe(req);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = Response.json({ success: true, message: 'Logout berhasil' });
      }

      // 2. Profile routes (Privilege Escalation)
      else if (path === '/api/profile' && method === 'GET') {
        response = await handleGetProfile(req);
      } else if (path === '/api/profile' && method === 'PUT') {
        response = await handleUpdateProfile(req);
      }

      // 3. Address routes (BOLA)
      else if (path === '/api/addresses' && method === 'GET') {
        response = await handleListAddresses(req);
      } else if (path === '/api/addresses' && method === 'POST') {
        response = await handleCreateAddress(req);
      } else if (path.startsWith('/api/addresses/') && method === 'GET') {
        const addressId = parseInt(path.split('/')[3], 10);
        response = await handleGetAddressById(req, addressId);
      } else if (path.startsWith('/api/addresses/') && method === 'PUT') {
        const addressId = parseInt(path.split('/')[3], 10);
        response = await handleUpdateAddress(req, addressId);
      }

      // 4. Products routes
      else if (path === '/api/products' && method === 'GET') {
        response = await handleListProducts(req);
      } else if (path.startsWith('/api/products/') && method === 'GET') {
        const productId = parseInt(path.split('/')[3], 10);
        response = await handleGetProductById(productId);
      }

      // 5. Checkout & Order placement
      else if (path === '/api/cart/checkout' && method === 'POST') {
        response = await handleCheckout(req);
      }

      // 6. Dashboard statistics
      else if (path === '/api/dashboard/stats' && method === 'GET') {
        response = await handleDashboardStats(req);
      }

      // 7. Admin user management
      else if (path === '/api/admin/users' && method === 'GET') {
        response = await handleListAdminUsers(req);
      } else if (path === '/api/admin/users' && method === 'POST') {
        response = await handleCreateAdminUser(req);
      }

      // 8. Legacy PHP API Proxy Routes
      // Orders proxy (IDOR, Stored XSS, Business Logic Cancel)
      else if (path === '/api/orders' && method === 'GET') {
        response = await proxyToPhp(req, 'orders.php', 'list');
      } else if (path.startsWith('/api/orders/') && path.endsWith('/notes') && method === 'GET') {
        const orderId = path.split('/')[3];
        response = await proxyToPhp(req, 'orders.php', 'get_notes', { order_id: orderId });
      } else if (path === '/api/orders/notes' && method === 'POST') {
        response = await proxyToPhp(req, 'orders.php', 'add_note');
      } else if (path.startsWith('/api/orders/') && path.endsWith('/cancel') && method === 'POST') {
        const orderId = path.split('/')[3];
        response = await proxyToPhp(req, 'orders.php', 'cancel', { order_id: orderId });
      } else if (path.startsWith('/api/orders/') && method === 'GET') {
        const orderId = path.split('/')[3];
        response = await proxyToPhp(req, 'orders.php', 'detail', { id: orderId });
      }

      // Shipments & Invoices proxy (IDOR Invoice)
      else if (path === '/api/shipments' && method === 'GET') {
        response = await proxyToPhp(req, 'shipments.php', 'list');
      } else if (path === '/api/shipments' && method === 'POST') {
        response = await proxyToPhp(req, 'shipments.php', 'create');
      } else if (path.startsWith('/api/invoices/') && method === 'GET') {
        const orderId = path.split('/')[3];
        response = await proxyToPhp(req, 'shipments.php', 'invoice', { order_id: orderId, id: orderId });
      }

      // Shipping Label Generator preview (RCE)
      else if (path === '/api/labels/preview') {
        response = await proxyToPhp(req, 'label_generator.php');
      }

      // Coupons proxy (Business logic reusable coupon)
      else if (path === '/api/coupons' && method === 'GET') {
        response = await proxyToPhp(req, 'coupons.php', 'list');
      } else if (path === '/api/coupons/verify' && method === 'POST') {
        response = await proxyToPhp(req, 'coupons.php', 'verify');
      }

      // 404 Fallback
      else {
        response = Response.json({ success: false, error: 'Endpoint tidak ditemukan' }, { status: 404 });
      }

      const headers = new Headers(response.headers);
      setCorsHeaders(headers);

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (err: any) {
      const headers = new Headers();
      setCorsHeaders(headers);
      return Response.json({ success: false, error: err.message }, { status: 500, headers });
    }
  },
});

console.log(`[KiosKita BFF] Bun API Gateway berjalan di http://localhost:${PORT}`);

// Helper: Checkout
async function handleCheckout(req: Request): Promise<Response> {
  const user = extractAuthUser(req);
  if (!user) {
    return Response.json({ success: false, error: 'Akses ditolak: Harap login terlebih dahulu' }, { status: 401 });
  }

  const body = await req.json();
  const { items, shipping_address_id, coupon_code, shipping_cost = 15000 } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json({ success: false, error: 'Keranjang belanja kosong' }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const [pRows] = await conn.query<any[]>('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (pRows.length === 0) {
        throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);
      }
      const product = pRows[0];
      const qty = parseInt(item.quantity, 10);
      const price = parseFloat(product.price);
      subtotal += price * qty;
      validatedItems.push({
        product_id: product.id,
        quantity: qty,
        unit_price: price,
        total_price: price * qty,
      });
    }

    let discount = 0;
    if (coupon_code) {
      const [cRows] = await conn.query<any[]>('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [coupon_code]);
      if (cRows.length > 0) {
        const coupon = cRows[0];
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        discount = Math.min(discount, subtotal);

        // Catat penggunaan kupon
        // Note: Meskipun dicatat, validasi di coupons.php sengaja mengabaikan riwayat ini (Business Logic flaw)
      }
    }

    const grandTotal = Math.max(0, subtotal - discount + parseFloat(shipping_cost));
    const [countRows] = await conn.query<any[]>('SELECT COUNT(*) as total FROM orders');
    const nextOrderNum = `ORD-2026-${String(countRows[0].total + 1).padStart(4, '0')}`;

    const [orderRes] = await conn.query<any>(
      `INSERT INTO orders (order_number, tenant_id, customer_id, status, subtotal, discount, shipping_cost, grand_total, coupon_code, shipping_address_id)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [nextOrderNum, user.tenant_id, user.id, subtotal, discount, shipping_cost, grandTotal, coupon_code || null, shipping_address_id || null]
    );

    const orderId = orderRes.insertId;

    for (const vItem of validatedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, vItem.product_id, vItem.quantity, vItem.unit_price, vItem.total_price]
      );

      // Kurangi stok
      await conn.query(`UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?`, [vItem.quantity, vItem.product_id]);
    }

    await conn.commit();

    return Response.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order: {
        id: orderId,
        order_number: nextOrderNum,
        grand_total: grandTotal,
      },
    });
  } catch (err: any) {
    await conn.rollback();
    return Response.json({ success: false, error: err.message }, { status: 400 });
  } finally {
    conn.release();
  }
}

// Helper: Dashboard Stats
async function handleDashboardStats(req: Request): Promise<Response> {
  const user = extractAuthUser(req);
  if (!user) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  const [orderCount] = await pool.query<any[]>(
    user.role === 'customer'
      ? `SELECT COUNT(*) as count FROM orders WHERE customer_id = ?`
      : user.role === 'admin'
      ? `SELECT COUNT(*) as count FROM orders`
      : `SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?`,
    user.role === 'customer' ? [user.id] : user.role === 'admin' ? [] : [user.tenant_id]
  );

  const [productCount] = await pool.query<any[]>(
    user.role === 'admin'
      ? `SELECT COUNT(*) as count FROM products`
      : `SELECT COUNT(*) as count FROM products WHERE tenant_id = ?`,
    user.role === 'admin' ? [] : [user.tenant_id]
  );

  const [lowStockCount] = await pool.query<any[]>(
    user.role === 'admin'
      ? `SELECT COUNT(*) as count FROM products WHERE stock < 25`
      : `SELECT COUNT(*) as count FROM products WHERE stock < 25 AND tenant_id = ?`,
    user.role === 'admin' ? [] : [user.tenant_id]
  );

  const [recentOrders] = await pool.query<any[]>(
    `SELECT o.id, o.order_number, o.status, o.grand_total, o.created_at, u.name as customer_name
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     ${user.role === 'customer' ? 'WHERE o.customer_id = ?' : ''}
     ORDER BY o.id DESC LIMIT 5`,
    user.role === 'customer' ? [user.id] : []
  );

  return Response.json({
    success: true,
    data: {
      total_orders: orderCount[0].count,
      total_products: productCount[0].count,
      low_stock_products: lowStockCount[0].count,
      recent_orders: recentOrders,
    },
  });
}

// Helper: Admin User Management
async function handleListAdminUsers(req: Request): Promise<Response> {
  const user = extractAuthUser(req);
  if (!user || user.role !== 'admin') {
    return Response.json({ success: false, error: 'Hanya administrator yang diizinkan mengakses data user' }, { status: 403 });
  }

  const [users] = await pool.query<any[]>(
    `SELECT u.id, u.name, u.email, u.role, u.phone, u.tenant_id, t.name as tenant_name, u.created_at
     FROM users u
     JOIN tenants t ON u.tenant_id = t.id
     ORDER BY u.id ASC`
  );

  return Response.json({ success: true, data: users });
}

async function handleCreateAdminUser(req: Request): Promise<Response> {
  const user = extractAuthUser(req);
  if (!user || user.role !== 'admin') {
    return Response.json({ success: false, error: 'Hanya administrator yang diizinkan menambah user' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role = 'staff', tenant_id = 1, phone = '' } = body;

  if (!name || !email || !password) {
    return Response.json({ success: false, error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
  }

  const hashedPassword = await Bun.password.hash(password);

  const [res] = await pool.query<any>(
    `INSERT INTO users (tenant_id, name, email, password, role, phone)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tenant_id, name, email, hashedPassword, role, phone]
  );

  return Response.json({
    success: true,
    message: 'User baru berhasil dibuat',
    user_id: res.insertId,
  });
}

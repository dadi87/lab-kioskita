import pool from './db';

export async function handleListProducts(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';

  let query = `SELECT p.*, t.name as tenant_name 
               FROM products p
               JOIN tenants t ON p.tenant_id = t.id
               WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ` AND p.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY p.id ASC`;

  const [rows] = await pool.query<any[]>(query, params);

  return Response.json({ success: true, data: rows });
}

export async function handleGetProductById(productId: number): Promise<Response> {
  const [rows] = await pool.query<any[]>(
    `SELECT p.*, t.name as tenant_name 
     FROM products p
     JOIN tenants t ON p.tenant_id = t.id
     WHERE p.id = ?`,
    [productId]
  );

  if (rows.length === 0) {
    return Response.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 });
  }

  return Response.json({ success: true, data: rows[0] });
}


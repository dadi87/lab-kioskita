import { extractAuthUser } from './auth';
import pool from './db';

// Handler Manajemen Alamat Pengiriman
export async function handleListAddresses(req: Request): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
    [currentUser.id]
  );

  return Response.json({ success: true, data: rows });
}

// Celah BOLA (Broken Object Level Authorization):
// Endpoint mengambil detail alamat hanya menggunakan ID dari parameter tanpa verifikasi bahwa alamat tersebut milik user yang sedang login.
export async function handleGetAddressById(req: Request, addressId: number): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  const [rows] = await pool.query<any[]>(
    `SELECT * FROM addresses WHERE id = ?`,
    [addressId]
  );

  if (rows.length === 0) {
    return Response.json({ success: false, error: 'Alamat tidak ditemukan' }, { status: 404 });
  }

  return Response.json({ success: true, data: rows[0] });
}

// Celah BOLA (Broken Object Level Authorization):
// Endpoint pembaruan alamat memodifikasi record berdasarkan 'id' secara langsung tanpa memeriksa apakah address.user_id cocok dengan currentUser.id.
// Seorang customer dapat mengubah alamat customer lain cukup dengan memasukkan ID alamat target.
export async function handleUpdateAddress(req: Request, addressId: number): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipient_name, phone, address_line, city, postal_code, is_default } = body;

    // BOLA Flaw: WHERE hanya memeriksa id = addressId, tidak memeriksa user_id
    await pool.query(
      `UPDATE addresses 
       SET recipient_name = COALESCE(?, recipient_name),
           phone = COALESCE(?, phone),
           address_line = COALESCE(?, address_line),
           city = COALESCE(?, city),
           postal_code = COALESCE(?, postal_code),
           is_default = COALESCE(?, is_default)
       WHERE id = ?`,
      [recipient_name, phone, address_line, city, postal_code, is_default, addressId]
    );

    const [rows] = await pool.query<any[]>(`SELECT * FROM addresses WHERE id = ?`, [addressId]);

    return Response.json({
      success: true,
      message: 'Alamat berhasil diperbarui',
      data: rows[0],
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function handleCreateAddress(req: Request): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipient_name, phone, address_line, city, postal_code, is_default } = body;

    const [result] = await pool.query<any>(
      `INSERT INTO addresses (user_id, recipient_name, phone, address_line, city, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [currentUser.id, recipient_name, phone, address_line, city, postal_code, is_default ? 1 : 0]
    );

    return Response.json({
      success: true,
      message: 'Alamat berhasil ditambahkan',
      address_id: result.insertId,
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}


import { extractAuthUser, generateToken } from './auth';
import pool from './db';

// Handler Profil Pengguna
export async function handleGetProfile(req: Request): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak: belum terautentikasi' }, { status: 401 });
  }

  const [rows] = await pool.query<any[]>(
    `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.phone, t.name as tenant_name
     FROM users u
     JOIN tenants t ON u.tenant_id = t.id
     WHERE u.id = ?`,
    [currentUser.id]
  );

  if (rows.length === 0) {
    return Response.json({ success: false, error: 'Profil tidak ditemukan' }, { status: 404 });
  }

  return Response.json({ success: true, profile: rows[0] });
}

// Celah Privilege Escalation:
// Handler update profil mempercayai field 'role' dari payload client tanpa validasi izin admin.
// Pengguna dengan role 'customer' atau 'staff' dapat mengirimkan field 'role': 'admin' atau 'manager'.
export async function handleUpdateProfile(req: Request): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Akses ditolak: belum terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, role } = body;

    // Mass assignment / role trusting flaw: role langsung diperbarui ke database
    await pool.query(
      `UPDATE users 
       SET name = COALESCE(?, name), 
           phone = COALESCE(?, phone), 
           role = COALESCE(?, role) 
       WHERE id = ?`,
      [name || null, phone || null, role || null, currentUser.id]
    );

    // Ambil data terbaru setelah pembaruan
    const [rows] = await pool.query<any[]>(
      `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.phone, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = ?`,
      [currentUser.id]
    );

    const updatedUser = rows[0];
    const newToken = generateToken(updatedUser);

    return Response.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      profile: updatedUser,
      token: newToken,
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}


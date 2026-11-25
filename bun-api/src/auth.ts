import jwt from 'jsonwebtoken';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'kioskita-super-secret-jwt-key-2026';

export interface UserPayload {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'customer';
  phone?: string;
  tenant_name?: string;
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      tenant_name: user.tenant_name,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function extractAuthUser(req: Request): UserPayload | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function handleLogin(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT u.*, t.name as tenant_name 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return Response.json({ success: false, error: 'Kredensial login tidak valid' }, { status: 401 });
    }

    const user = rows[0];
    const isPasswordValid = await Bun.password.verify(password, user.password);

    if (!isPasswordValid) {
      return Response.json({ success: false, error: 'Kredensial login tidak valid' }, { status: 401 });
    }

    const payload: UserPayload = {
      id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      tenant_name: user.tenant_name,
    };

    const token = generateToken(payload);

    return Response.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: payload,
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function handleGetMe(req: Request): Promise<Response> {
  const currentUser = extractAuthUser(req);
  if (!currentUser) {
    return Response.json({ success: false, error: 'Sesi tidak valid atau telah berakhir' }, { status: 401 });
  }

  const [rows] = await pool.query<any[]>(
    `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.phone, t.name as tenant_name
     FROM users u
     JOIN tenants t ON u.tenant_id = t.id
     WHERE u.id = ?`,
    [currentUser.id]
  );

  if (rows.length === 0) {
    return Response.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  return Response.json({ success: true, user: rows[0] });
}


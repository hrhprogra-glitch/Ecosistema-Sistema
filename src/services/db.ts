import { createClient } from '@libsql/client/web';

// --- INTERFACES ---
export interface UsuarioSistema {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'empleado';
  full_name: string;
}

export interface Cliente {
  id?: number;
  nombre_cliente: string;
  arquitecto?: string; // <--- NUEVO CAMPO
  direccion: string;
  telefono: string;
  ubicacion_link: string;
}

export interface ProductoAlmacen {
  id?: number;
  codigo: string;
  producto: string;
  categoria: string;
  stock_actual: number;
  unidad_medida: string;
  precio?: number;
  fecha_ingreso?: string;
}

export interface MovimientoKardex {
  id?: number;
  producto_id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
}

// --- CONEXIÓN TURSO ---
const client = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
});

// --- SERVICIO DE AUTENTICACIÓN ---
export const authService = {
  async validarUsuario(username: string, pass: string) {
    try {
      const rs = await client.execute({
        sql: 'SELECT * FROM users WHERE username = ? AND password = ?',
        args: [username, pass],
      });
      return rs.rows.length > 0 ? (rs.rows[0] as unknown as UsuarioSistema) : null;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }
};

// --- SERVICIO DE ADMINISTRACIÓN ---
export const adminService = {
  
  // 1. GESTIÓN DE PERSONAL
  async registrarPersonal(user: UsuarioSistema) {
    await client.execute({
      sql: 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      args: [user.username, user.password || '', user.role, user.full_name],
    });
  },

  async obtenerTodosLosUsuarios(): Promise<UsuarioSistema[]> {
    const rs = await client.execute('SELECT id, username, role, full_name FROM users');
    return rs.rows.map(row => ({
      id: Number(row.id),
      username: String(row.username),
      role: row.role as 'admin' | 'empleado',
      full_name: String(row.full_name)
    }));
  },

  // 2. GESTIÓN DE CLIENTES (ACTUALIZADO CON ARQUITECTO)
  async registrarCliente(c: Cliente) {
    await client.execute({
      sql: 'INSERT INTO clientes (nombre_cliente, arquitecto, direccion, telefono, ubicacion_link) VALUES (?, ?, ?, ?, ?)',
      args: [
        c.nombre_cliente, 
        c.arquitecto || '', 
        c.direccion || '', 
        c.telefono || '', 
        c.ubicacion_link || ''
      ],
    });
  },

  async obtenerClientes(): Promise<Cliente[]> {
    const rs = await client.execute('SELECT * FROM clientes ORDER BY id DESC');
    return rs.rows.map(row => ({
      id: Number(row.id),
      nombre_cliente: String(row.nombre_cliente),
      arquitecto: String(row.arquitecto || ''), 
      direccion: String(row.direccion),
      telefono: String(row.telefono),
      ubicacion_link: String(row.ubicacion_link)
    }));
  },

  async actualizarCliente(id: number, c: Cliente) {
    await client.execute({
      sql: `UPDATE clientes 
            SET nombre_cliente = ?, arquitecto = ?, direccion = ?, telefono = ?, ubicacion_link = ? 
            WHERE id = ?`,
      args: [
        c.nombre_cliente, 
        c.arquitecto || '', 
        c.direccion || '', 
        c.telefono || '', 
        c.ubicacion_link || '', 
        id
      ],
    });
  },

  async eliminarCliente(id: number) {
    await client.execute({
      sql: 'DELETE FROM clientes WHERE id = ?',
      args: [id],
    });
  },

  // 3. GESTIÓN DE ALMACÉN Y KARDEX
  async registrarProducto(p: ProductoAlmacen) {
    await client.execute({
      sql: 'INSERT INTO almacen (codigo, producto, categoria, stock_actual, unidad_medida, precio, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        p.codigo, 
        p.producto, 
        p.categoria, 
        p.stock_actual, 
        p.unidad_medida, 
        p.precio || 0,
        p.fecha_ingreso || new Date().toISOString()
      ],
    });
  },

  async actualizarProducto(id: number, p: ProductoAlmacen) {
    await client.execute({
      sql: 'UPDATE almacen SET codigo = ?, producto = ?, categoria = ?, precio = ?, stock_actual = ? WHERE id = ?',
      args: [p.codigo, p.producto, p.categoria, p.precio || 0, p.stock_actual, id]
    });
  },

  async eliminarProducto(id: number) {
    await client.execute({
      sql: 'DELETE FROM almacen WHERE id = ?',
      args: [id],
    });
  },

  async registrarMovimiento(m: MovimientoKardex) {
    await client.execute({
      sql: 'INSERT INTO movimientos_almacen (producto_id, tipo, cantidad, motivo) VALUES (?, ?, ?, ?)',
      args: [m.producto_id, m.tipo, m.cantidad, m.motivo],
    });
    const op = m.tipo === 'entrada' ? '+' : '-';
    await client.execute({
      sql: `UPDATE almacen SET stock_actual = stock_actual ${op} ? WHERE id = ?`,
      args: [m.cantidad, m.producto_id],
    });
  },

  async obtenerAlmacen(): Promise<ProductoAlmacen[]> {
    const rs = await client.execute('SELECT * FROM almacen ORDER BY producto ASC');
    return rs.rows.map(row => ({
      id: Number(row.id),
      codigo: String(row.codigo),
      producto: String(row.producto),
      categoria: String(row.categoria),
      stock_actual: Number(row.stock_actual),
      unidad_medida: String(row.unidad_medida),
      precio: Number(row.precio || 0),
      fecha_ingreso: String(row.fecha_ingreso)
    }));
  }
};
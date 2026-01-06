// firebird-adapter.js
const Firebird = require('node-firebird');
const { v4: uuidv4 } = require('uuid');

// Pool de conexión (reutiliza conexiones)
const firebird = Firebird.attachOrCreate;

const options = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\Users\\Wilian\\Desktop\\base de datos wil\\firebird\\TIENDA.FDB',  // CAMBIAR: Tu ruta
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
};

// =============== FUNCIONES BÁSICAS ===============

/**
 * Ejecutar query y devolver resultados
 */
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (err) {
        reject({ error: 'Conexión fallida', details: err.message });
        return;
      }

      db.query(sql, params, (err, result) => {
        db.detach();

        if (err) {
          reject({ error: 'Query fallida', sql, details: err.message });
        } else {
          resolve(result || []);
        }
      });
    });
  });
}

/**
 * Ejecutar insert/update/delete
 */
async function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (err) {
        reject({ error: 'Conexión fallida', details: err.message });
        return;
      }

      db.exec(sql, params, (err) => {
        db.detach();

        if (err) {
          reject({ error: 'Ejecución fallida', sql, details: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}

// =============== FUNCIONES DE NEGOCIO ===============

/**
 * Obtener todos los productos
 */
async function getProductos() {
  const sql = `
    SELECT
      P.ID, P.NOMBRE, P.DESCRIPCION, P.PRECIO, P.STOCK, P.CATEGORIA_ID,
      C.NOMBRE as CATEGORIA
    FROM PRODUCTOS P
    JOIN CATEGORIAS C ON P.CATEGORIA_ID = C.ID
    ORDER BY C.NOMBRE, P.NOMBRE
  `;
  return query(sql);
}

/**
 * Obtener categorías
 */
async function getCategorias() {
  const sql = 'SELECT * FROM CATEGORIAS ORDER BY NOMBRE';
  return query(sql);
}

/**
 * Obtener carrito de usuario
 */
async function getCarrito(usuarioId) {
  const sql = `
    SELECT
      C.ID, C.USUARIO_ID, C.PRODUCTO_ID, C.CANTIDAD,
      P.NOMBRE, P.PRECIO, P.DESCRIPCION,
      (P.PRECIO * C.CANTIDAD) as SUBTOTAL
    FROM CARRITO C
    JOIN PRODUCTOS P ON C.PRODUCTO_ID = P.ID
    WHERE C.USUARIO_ID = ?
    ORDER BY C.CREATED_AT DESC
  `;
  return query(sql, [usuarioId]);
}

/**
 * Agregar producto al carrito (o incrementar cantidad)
 */
async function addCarrito(usuarioId, productoId, cantidad = 1) {
  // Primero verificar si ya existe
  const existente = await query(
    'SELECT * FROM CARRITO WHERE USUARIO_ID = ? AND PRODUCTO_ID = ?',
    [usuarioId, productoId]
  );

  if (existente && existente.length > 0) {
    // Incrementar cantidad
    const item = existente[0];
    const nuevaCantidad = item.CANTIDAD + cantidad;

    await execute(
      'UPDATE CARRITO SET CANTIDAD = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?',
      [nuevaCantidad, item.ID]
    );

    return { success: true, action: 'updated', newQuantity: nuevaCantidad };
  } else {
    // Insertar nuevo
    const id = uuidv4();
    await execute(
      `INSERT INTO CARRITO (ID, USUARIO_ID, PRODUCTO_ID, CANTIDAD, CREATED_AT, UPDATED_AT)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, usuarioId, productoId, cantidad]
    );

    return { success: true, action: 'inserted', id };
  }
}

/**
 * Eliminar producto del carrito
 */
async function removeCarrito(carritoId) {
  await execute('DELETE FROM CARRITO WHERE ID = ?', [carritoId]);
  return { success: true };
}

/**
 * Obtener pedidos de usuario
 */
async function getPedidos(usuarioId) {
  const sql = `
    SELECT
      P.ID, P.USUARIO_ID, P.ESTADO_ID, P.TOTAL, P.CREATED_AT,
      EP.NOMBRE as ESTADO
    FROM PEDIDOS P
    JOIN ESTADO_PEDIDO EP ON P.ESTADO_ID = EP.ID
    WHERE P.USUARIO_ID = ?
    ORDER BY P.CREATED_AT DESC
  `;
  return query(sql, [usuarioId]);
}

/**
 * Obtener detalles de un pedido
 */
async function getDetallePedido(pedidoId) {
  const sql = `
    SELECT
      DP.ID, DP.NOMBRE_PRODUCTO, DP.DESCRIPCION_PRODUCTO,
      DP.CANTIDAD, DP.PRECIO_UNITARIO, DP.SUBTOTAL
    FROM DETALLES_PEDIDO DP
    WHERE DP.PEDIDO_ID = ?
    ORDER BY DP.CREATED_AT
  `;
  return query(sql, [pedidoId]);
}

/**
 * Crear pedido (desde carrito)
 */
async function crearPedido(usuarioId, total) {
  const pedidoId = uuidv4();
  const carritoItems = await getCarrito(usuarioId);

  if (!carritoItems || carritoItems.length === 0) {
    throw { error: 'Carrito vacío' };
  }

  // Crear pedido
  await execute(
    `INSERT INTO PEDIDOS (ID, USUARIO_ID, ESTADO_ID, TOTAL, CREATED_AT, UPDATED_AT)
     VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [pedidoId, usuarioId, total]
  );

  // Crear detalles
  for (const item of carritoItems) {
    const detalleId = uuidv4();
    await execute(
      `INSERT INTO DETALLES_PEDIDO (ID, PEDIDO_ID, PRODUCTO_ID, NOMBRE_PRODUCTO, DESCRIPCION_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        detalleId,
        pedidoId,
        item.PRODUCTO_ID,
        item.NOMBRE,
        item.DESCRIPCION,
        item.CANTIDAD,
        item.PRECIO,
        item.SUBTOTAL
      ]
    );
  }

  // Limpiar carrito
  await execute('DELETE FROM CARRITO WHERE USUARIO_ID = ?', [usuarioId]);

  return { success: true, pedidoId };
}

/**
 * Cambiar estado de pedido
 */
async function cambiarEstadoPedido(pedidoId, nuevoEstadoId) {
  await execute(
    'UPDATE PEDIDOS SET ESTADO_ID = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?',
    [nuevoEstadoId, pedidoId]
  );
  return { success: true };
}

/**
 * Registrar usuario
 */
async function registrarUsuario(email, passwordHash, nombre = '') {
  const usuarioId = uuidv4();

  await execute(
    `INSERT INTO USUARIOS (ID, EMAIL, PASSWORD_HASH, NOMBRE, CREATED_AT, UPDATED_AT)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [usuarioId, email, passwordHash, nombre]
  );

  return { success: true, usuarioId };
}

/**
 * Obtener usuario por email
 */
async function obtenerUsuario(email) {
  const sql = 'SELECT * FROM USUARIOS WHERE EMAIL = ?';
  const result = await query(sql, [email]);
  return result && result.length > 0 ? result[0] : null;
}

// =============== EXPORTAR ===============

module.exports = {
  // Funciones básicas
  query,
  execute,

  // Funciones de negocio
  getProductos,
  getCategorias,
  getCarrito,
  addCarrito,
  removeCarrito,
  getPedidos,
  getDetallePedido,
  crearPedido,
  cambiarEstadoPedido,
  registrarUsuario,
  obtenerUsuario,

  // Utilidades
  uuidv4,
};

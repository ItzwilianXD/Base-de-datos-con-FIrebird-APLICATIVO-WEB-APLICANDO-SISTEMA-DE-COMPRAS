import express from 'express';
import cors from 'cors';
import Firebird from 'node-firebird';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const options = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\Users\\Wilian\\Desktop\\base de datos wil\\firebird\\TIENDA.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
};

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (err) {
        reject({ error: 'Conexión fallida', details: err.message });
        return;
      }

      db.query(sql, params, (err, result) => {
        db.detach();
        if (err) {
          reject({ error: 'Query fallida', details: err.message });
        } else {
          resolve(result || []);
        }
      });
    });
  });
}

function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (err) {
        reject({ error: 'Conexión fallida', details: err.message });
        return;
      }

      db.query(sql, params, (err) => {
        db.detach();
        if (err) {
          reject({ error: 'Ejecución fallida', details: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}

app.get('/api/categorias', async (req, res) => {
  try {
    const result = await query('SELECT * FROM CATEGORIAS ORDER BY NOMBRE');
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const sql = `
      SELECT P.ID, P.NOMBRE, P.DESCRIPCION, P.PRECIO, P.STOCK, P.CATEGORIA_ID,
             C.NOMBRE as CATEGORIA
      FROM PRODUCTOS P
      JOIN CATEGORIAS C ON P.CATEGORIA_ID = C.ID
      ORDER BY C.NOMBRE, P.NOMBRE
    `;
    const result = await query(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/carrito/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const sql = `
      SELECT C.ID, C.USUARIO_ID, C.PRODUCTO_ID, C.CANTIDAD,
             P.NOMBRE, P.PRECIO, P.DESCRIPCION,
             (P.PRECIO * C.CANTIDAD) as SUBTOTAL
      FROM CARRITO C
      JOIN PRODUCTOS P ON C.PRODUCTO_ID = P.ID
      WHERE C.USUARIO_ID = ?
      ORDER BY C.CREATED_AT DESC
    `;
    const result = await query(sql, [usuarioId]);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/carrito', async (req, res) => {
  try {
    const { usuarioId, productoId, cantidad = 1 } = req.body;

    const existente = await query(
      'SELECT * FROM CARRITO WHERE USUARIO_ID = ? AND PRODUCTO_ID = ?',
      [usuarioId, productoId]
    );

    if (existente && existente.length > 0) {
      const item = existente[0];
      const nuevaCantidad = item.CANTIDAD + cantidad;
      await execute(
        'UPDATE CARRITO SET CANTIDAD = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?',
        [nuevaCantidad, item.ID]
      );
      res.json({ success: true, action: 'updated', newQuantity: nuevaCantidad });
    } else {
      const id = uuidv4();
      await execute(
        `INSERT INTO CARRITO (ID, USUARIO_ID, PRODUCTO_ID, CANTIDAD, CREATED_AT, UPDATED_AT)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, usuarioId, productoId, cantidad]
      );
      res.json({ success: true, action: 'inserted', id });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.put('/api/carrito/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    await execute(
      'UPDATE CARRITO SET CANTIDAD = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?',
      [cantidad, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.delete('/api/carrito/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM CARRITO WHERE ID = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/pedidos/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const sql = `
      SELECT P.ID, P.USUARIO_ID, P.ESTADO_ID, P.TOTAL, P.CREATED_AT, P.UPDATED_AT,
             EP.NOMBRE as ESTADO
      FROM PEDIDOS P
      JOIN ESTADO_PEDIDO EP ON P.ESTADO_ID = EP.ID
      WHERE P.USUARIO_ID = ?
      ORDER BY P.CREATED_AT DESC
    `;
    const result = await query(sql, [usuarioId]);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/pedidos/:pedidoId/detalles', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const sql = `
      SELECT DP.ID, DP.NOMBRE_PRODUCTO, DP.DESCRIPCION_PRODUCTO,
             DP.CANTIDAD, DP.PRECIO_UNITARIO, DP.SUBTOTAL
      FROM DETALLES_PEDIDO DP
      WHERE DP.PEDIDO_ID = ?
      ORDER BY DP.CREATED_AT
    `;
    const result = await query(sql, [pedidoId]);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const { usuarioId, total } = req.body;
    const pedidoId = uuidv4();

    const carritoItems = await query(
      `SELECT C.ID, C.PRODUCTO_ID, C.CANTIDAD,
              P.NOMBRE, P.DESCRIPCION, P.PRECIO,
              (P.PRECIO * C.CANTIDAD) as SUBTOTAL
       FROM CARRITO C
       JOIN PRODUCTOS P ON C.PRODUCTO_ID = P.ID
       WHERE C.USUARIO_ID = ?`,
      [usuarioId]
    );

    if (!carritoItems || carritoItems.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    await execute(
      `INSERT INTO PEDIDOS (ID, USUARIO_ID, ESTADO_ID, TOTAL, CREATED_AT, UPDATED_AT)
       VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [pedidoId, usuarioId, total]
    );

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

    await execute('DELETE FROM CARRITO WHERE USUARIO_ID = ?', [usuarioId]);

    res.json({ success: true, pedidoId });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.put('/api/pedidos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoId } = req.body;
    await execute(
      'UPDATE PEDIDOS SET ESTADO_ID = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?',
      [estadoId, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT * FROM USUARIOS WHERE EMAIL = ? AND PASSWORD_HASH = ?',
      [email, password]
    );

    if (result && result.length > 0) {
      const user = result[0];
      res.json({ success: true, user: { id: user.ID, email: user.EMAIL, nombre: user.NOMBRE } });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre = '' } = req.body;
    const userId = uuidv4();

    await execute(
      `INSERT INTO USUARIOS (ID, EMAIL, PASSWORD_HASH, NOMBRE, CREATED_AT, UPDATED_AT)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, email, password, nombre]
    );

    res.json({ success: true, userId });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/estados', async (req, res) => {
  try {
    const result = await query('SELECT * FROM ESTADO_PEDIDO ORDER BY ID');
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Firebird corriendo en http://localhost:${PORT}`);
  console.log(`📊 BD: ${options.database}`);
});

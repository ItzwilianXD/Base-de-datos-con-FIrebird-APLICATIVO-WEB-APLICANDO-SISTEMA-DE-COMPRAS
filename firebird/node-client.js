// firebird/node-client.js
const Firebird = require('node-firebird');

// Configuración de conexión
const options = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\Users\\Wilian\\Desktop\\base de datos wil\\firebird\\TIENDA.FDB',  // Cambia a la ruta de tu BD
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,        // Mantiene MAYÚSCULAS como en Firebird
  role: null,
  pageSize: 4096
};

// Función para conectar y consultar
async function testConnection() {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (err) {
        console.error('Error de conexión:', err);
        reject(err);
        return;
      }

      console.log('✓ Conexión a Firebird exitosa\n');

      // Ejemplo: Consultar categorías
      db.query('SELECT * FROM CATEGORIAS', (err, result) => {
        if (err) {
          console.error('Error en query:', err);
          db.detach();
          reject(err);
          return;
        }

        console.log('CATEGORÍAS:');
        console.table(result);

        // Consultar productos
        db.query('SELECT * FROM PRODUCTOS', (err, result) => {
          if (err) {
            console.error('Error en query:', err);
            db.detach();
            reject(err);
            return;
          }

          console.log('\nPRODUCTOS:');
          console.table(result);

          db.detach();
          resolve('Consultas completadas');
        });
      });
    });
  });
}

// Ejecutar
testConnection()
  .then(() => console.log('\n✓ Prueba completada'))
  .catch(err => console.error('Error:', err));

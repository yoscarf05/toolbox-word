import { getDb, initializeDatabaseSchema } from '../server/db/connection';

/**
 * Script de inicialización de esquema DDL en PostgreSQL (Neon)
 * Ejecuta CREATE TABLE IF NOT EXISTS para todas las tablas requeridas.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npm run db:init
 */
async function main() {
  console.log('====================================================');
  console.log('🐘 INICIALIZANDO ESQUEMA DE TABLAS EN POSTGRESQL');
  console.log('====================================================');

  const { pool, isInMemory } = getDb();

  if (isInMemory) {
    console.log('ℹ️ No se especificó DATABASE_URL. Ejecutando en motor en memoria para prueba...');
  } else {
    console.log('🔗 Conectado a PostgreSQL externo.');
  }

  try {
    await initializeDatabaseSchema(pool);

    const checkRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = checkRes.rows.map((r: any) => r.table_name);
    console.log(`✅ Esquema verificado con éxito. Tablas detectadas (${tables.length}):`);
    tables.forEach((t: string) => console.log(`   - ${t}`));

    console.log('====================================================');
    console.log('🎉 BASE DE DATOS LISTA PARA PRODUCCIÓN');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error al inicializar el esquema:', err);
    process.exit(1);
  } finally {
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
      }
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

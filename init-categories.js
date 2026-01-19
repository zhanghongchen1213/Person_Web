import { getDb, initDefaultCategories } from './server/db.js';

(async () => {
  try {
    const db = await getDb();
    if (db) {
      await initDefaultCategories();
      console.log('✅ Default categories initialized successfully');
      process.exit(0);
    } else {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

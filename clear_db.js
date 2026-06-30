import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.collections();
  
  for (let c of collections) {
    if (c.collectionName === 'users') {
      // Roles in this app are "user" / "superadmin" (there is no "admin" role),
      // so keep both admin-style roles and drop only ordinary client logins.
      const { deletedCount } = await c.deleteMany({ role: { $nin: ['admin', 'superadmin'] } });
      console.log('Deleted non-admin users:', deletedCount);
    } else if (c.collectionName !== 'settings') {
      await c.deleteMany({});
      console.log('Cleared ' + c.collectionName);
    }
  }
  
  console.log('Done clearing database!');
  process.exit(0);
}

run().catch(console.error);

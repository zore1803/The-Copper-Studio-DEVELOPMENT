import 'dotenv/config';
import mongoose from 'mongoose';

const KEEP_EMAILS = [
  'rzore430@gmail.com',
  'rohit.zore@datacircles.in',
  'yash.mishra@datacircles.in',
  'yash.mishra@cottson.in'
].map((e) => String(e).trim().toLowerCase());

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.collections();

  for (let c of collections) {
    if (c.collectionName === 'users') {
      // Keep only the specified login emails (case-insensitive), delete every other user.
      const { deletedCount } = await c.deleteMany({
        email: { $nin: KEEP_EMAILS }
      });
      console.log('Deleted non-whitelisted users:', deletedCount);
      continue;
    }

    // Delete ALL data from all other collections, including settings.
    await c.deleteMany({});
    console.log('Cleared ' + c.collectionName);
  }

  console.log('Done clearing database!');
  process.exit(0);
}

run().catch(console.error);


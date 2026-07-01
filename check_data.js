import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import Project from './server/models/Project.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const orders = await Order.find({}, 'createdAt customer.customerName payment.paidAt').sort({ createdAt: -1 });
  console.log("ORDERS:");
  orders.forEach(o => {
    console.log(`Order ${o._id} - ${o.customer.customerName} - createdAt: ${o.createdAt} - paidAt: ${o.payment.paidAt}`);
  });

  const projects = await Project.find({}, 'createdAt name status').sort({ createdAt: -1 });
  console.log("\nPROJECTS:");
  projects.forEach(p => {
    console.log(`Project ${p._id} - ${p.name} - createdAt: ${p.createdAt} - status: ${p.status}`);
  });

  process.exit(0);
}
check().catch(console.error);

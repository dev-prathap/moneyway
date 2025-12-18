const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Prefer MONGODB_URI from environment, fallback to the same URI from .env.local
const uri = process.env.MONGODB_URI || 'mongodb://root:swix%40123@46.224.113.229:27017/default?authSource=admin';

async function loadCustomers() {
  const filePath = path.join(__dirname, '../data/manual-visitors.txt');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('manual-visitors.txt does not contain enough lines');
  }

  // If file starts with "Customer Name" header (tab-separated), skip first line
  let startIndex = 0;
  if (/^customer\s*name/i.test(lines[0])) {
    startIndex = 1;
  }

  const customers = [];
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(/\t+/);
    const name = (parts[0] || '').trim();
    const mobileRaw = (parts[1] || '').trim();

    if (!name || !mobileRaw) continue;

    // Keep only digits in mobile
    const mobile = (mobileRaw.match(/\d+/g) || []).join('');
    if (!mobile) continue;

    customers.push({ name, mobile });
  }

  return customers;
}

async function main() {
  const customers = await loadCustomers();
  console.log(`Loaded ${customers.length} customers from file`);

  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db('default');
  const passes = db.collection('passes');

  // Filter out customers that are already in DB (same name + mobile)
  const remainingCustomers = [];
  for (const customer of customers) {
    const existing = await passes.findOne({
      name: customer.name,
      mobile: customer.mobile,
    });
    if (!existing) {
      remainingCustomers.push(customer);
    }
  }
  console.log(`Customers not yet present in DB: ${remainingCustomers.length}`);

  // Find VIS passes with empty name or mobile
  const emptyQuery = {
    passId: { $regex: /^VIS-/ },
    status: 'unused',
    $or: [
      { name: { $exists: false } },
      { name: null },
      { name: '' },
      { mobile: { $exists: false } },
      { mobile: null },
      { mobile: '' },
    ],
  };

  const cursor = passes.find(emptyQuery).sort({ passId: 1 });

  let index = 0;
  let updated = 0;

  for await (const doc of cursor) {
    if (index >= remainingCustomers.length) break;

    const customer = remainingCustomers[index];
    index += 1;

    const safeFilter = {
      _id: doc._id,
      status: 'unused',
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' },
        { mobile: { $exists: false } },
        { mobile: null },
        { mobile: '' },
      ],
    };

    const update = {
      $set: {
        name: customer.name,
        mobile: customer.mobile,
        status: doc.status || 'used',
        updatedAt: new Date(),
      },
    };

    const result = await passes.updateOne(safeFilter, update);
    if (result.modifiedCount > 0) {
      updated += 1;
      if (updated % 25 === 0) {
        console.log(`Progress: updated ${updated} passes so far...`);
      }
      console.log(`VIS ${doc.passId} -> ${customer.name} (${customer.mobile})`);
    }
  }

  console.log(`Finished. Updated ${updated} passes.`);
  await client.close();
}

main().catch((err) => {
  console.error('Error seeding visitors:', err);
  process.exit(1);
});

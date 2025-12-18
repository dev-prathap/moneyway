const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://root:swix%40123@46.224.113.229:27017/default?authSource=admin';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db('default');
  const passes = db.collection('passes');

  // Find unused VIS passes with empty name or mobile
  const unusedPasses = await passes.find({
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
  })
  .sort({ passId: 1 })
  .toArray();

  console.log(`Found ${unusedPasses.length} unused VIS passes with empty name/mobile`);

  // Create output content
  const outputLines = ['VIS Number\tName\tMobile\tStatus'];
  
  unusedPasses.forEach(pass => {
    const name = pass.name || '';
    const mobile = pass.mobile || '';
    outputLines.push(`${pass.passId}\t${name}\t${mobile}\t${pass.status}`);
  });

  // Write to file
  const outputPath = path.join(__dirname, '../data/unused-vis-list.txt');
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');
  
  console.log(`Saved ${unusedPasses.length} unused VIS passes to: ${outputPath}`);
  
  // Show first 10 as sample
  console.log('\nFirst 10 unused VIS passes:');
  unusedPasses.slice(0, 10).forEach(pass => {
    console.log(`${pass.passId} - name: "${pass.name || 'EMPTY'}" - mobile: "${pass.mobile || 'EMPTY'}"`);
  });

  await client.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error fetching unused VIS passes:', err);
  process.exit(1);
});

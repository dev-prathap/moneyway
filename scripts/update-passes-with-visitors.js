// Script to update unused passes with visitor data from manual-visitors.txt
const fs = require('fs');
const path = require('path');

// Read the visitor data file
const visitorDataPath = path.join(__dirname, '../data/manual-visitors.txt');
const visitorData = fs.readFileSync(visitorDataPath, 'utf8');

// Parse the visitor data (skip header line)
const lines = visitorData.trim().split('\n').slice(1);
const visitors = lines.map(line => {
  const [name, phone] = line.split('\t');
  return { name: name.trim(), phone: phone.trim() };
});

console.log(`Parsed ${visitors.length} visitors from file`);

// MongoDB update script
const mongoScript = `
// Get unused passes that don't have name and phone data (safe to update)
var unusedPasses = db.passes.find({
  status: 'unused',
  name: {$exists: false},
  phone: {$exists: false}
}).limit(${visitors.length}).toArray();

console.log('Found', unusedPasses.length, 'unused passes without visitor data to safely update');

// Visitor data
var visitors = ${JSON.stringify(visitors, null, 2)};

var updateCount = 0;
var errorCount = 0;

// Update passes with visitor data (only add name and phone, keep status as unused)
for (var i = 0; i < Math.min(unusedPasses.length, visitors.length); i++) {
  try {
    var result = db.passes.updateOne(
      {
        _id: unusedPasses[i]._id,
        name: {$exists: false},  // Double check name doesn't exist
        phone: {$exists: false}  // Double check phone doesn't exist
      },
      {$set: {
        name: visitors[i].name,
        phone: visitors[i].phone,
        updatedAt: new Date().toISOString()
        // Note: NOT changing status - keeping as 'unused'
      }}
    );
    
    if (result.modifiedCount > 0) {
      updateCount++;
      if (i % 50 === 0) {
        console.log('Updated', updateCount, 'passes so far...');
      }
    }
  } catch (error) {
    console.log('Error updating pass', unusedPasses[i].passId, ':', error.message);
    errorCount++;
  }
}

console.log('\\nUpdate completed:');
console.log('- Successfully updated:', updateCount, 'passes');
console.log('- Errors:', errorCount);

// Verify the updates
var unusedWithData = db.passes.countDocuments({
  status: 'unused',
  name: {$exists: true},
  phone: {$exists: true}
});
console.log('- Unused passes now with visitor data:', unusedWithData);

var totalUnused = db.passes.countDocuments({status: 'unused'});
console.log('- Total unused passes:', totalUnused);
`;

// Write the MongoDB script to a file
const scriptPath = path.join(__dirname, 'mongo-update-script.js');
fs.writeFileSync(scriptPath, mongoScript);

console.log(`MongoDB script written to: ${scriptPath}`);
console.log('Run this command to execute the update:');
console.log(`mongosh "mongodb://root:swix%40123@46.224.113.229:27017/default?authSource=admin" --file "${scriptPath}"`);

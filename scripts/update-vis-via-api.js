const fs = require('fs');
const path = require('path');

// Read unused VIS numbers (without -DUP)
function loadCleanVisNumbers() {
  const filePath = path.join(__dirname, '../data/unused-vis-list.txt');
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  // Skip header line and filter out -DUP numbers
  const cleanVisNumbers = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\t+/);
    const visNumber = (parts[0] || '').trim();
    
    // Only include VIS numbers without "-DUP"
    if (visNumber && !visNumber.includes('-DUP')) {
      cleanVisNumbers.push(visNumber);
    }
  }
  
  return cleanVisNumbers;
}

// Read customer data
function loadCustomers() {
  const filePath = path.join(__dirname, '../data/manual-visitors.txt');
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  // Skip header line
  const customers = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\t+/);
    const name = (parts[0] || '').trim();
    const mobile = (parts[1] || '').trim();
    
    if (name && mobile) {
      customers.push({ name, mobile });
    }
  }
  
  return customers;
}

// Call API to update VIS pass
async function updateVisPass(visNumber, customerData) {
  const url = `http://localhost:3000/api/passes/${visNumber}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customerData.name,
        mobile: customerData.mobile,
        status: 'used'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✓ Updated ${visNumber} -> ${customerData.name} (${customerData.mobile})`);
      return true;
    } else {
      console.error(`✗ Failed to update ${visNumber}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error updating ${visNumber}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Loading clean VIS numbers...');
  const cleanVisNumbers = loadCleanVisNumbers();
  console.log(`Found ${cleanVisNumbers.length} clean VIS numbers (without -DUP)`);
  
  console.log('Loading customer data...');
  const customers = loadCustomers();
  console.log(`Found ${customers.length} customers`);
  
  const maxUpdates = Math.min(cleanVisNumbers.length, customers.length);
  console.log(`Will update ${maxUpdates} VIS passes\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < maxUpdates; i++) {
    const visNumber = cleanVisNumbers[i];
    const customer = customers[i];
    
    const success = await updateVisPass(visNumber, customer);
    
    if (success) {
      updated++;
    } else {
      failed++;
    }
    
    // Progress update every 25 updates
    if ((i + 1) % 25 === 0) {
      console.log(`Progress: ${i + 1}/${maxUpdates} processed (${updated} updated, ${failed} failed)`);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\nCompleted!`);
  console.log(`✓ Successfully updated: ${updated} VIS passes`);
  console.log(`✗ Failed: ${failed} VIS passes`);
  console.log(`📊 Total processed: ${updated + failed} VIS passes`);
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('This script requires Node.js 18+ with built-in fetch support');
  console.error('Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error running update script:', err);
  process.exit(1);
});

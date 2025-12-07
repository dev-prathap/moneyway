import dotenv from 'dotenv';

// Load environment variables BEFORE importing anything else
dotenv.config({ path: '.env.local' });

import { getDb } from '../lib/db';
import { hashPassword } from '../lib/auth';
import { User } from '../lib/models/user';

async function seedAdmin() {
  try {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with default password 'admin123'
    const passwordHash = await hashPassword('admin123');
    
    const adminUser: User = {
      username: 'admin',
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
    };

    await usersCollection.insertOne(adminUser);
    
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();

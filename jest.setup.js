// Load environment variables for tests
require('dotenv').config({ path: '.env.local' });

// Set test environment variables if not already set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/maniway-pass-maker-test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-min-32-chars-for-testing';
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
}

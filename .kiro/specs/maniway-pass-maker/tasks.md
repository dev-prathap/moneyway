# Implementation Plan - MVP (10 Tasks)

- [x] 1. Initialize project with authentication
  - Create Next.js 14+ project with App Router
  - Install core dependencies: mongodb, jsonwebtoken, bcrypt, zod, tailwindcss
  - Set up MongoDB connection in `lib/db.ts`
  - Create User schema and seed admin user
  - Implement JWT utilities in `lib/auth.ts` (signJWT, verifyJWT, hashPassword)
  - Create `POST /api/auth/login` route with HttpOnly cookie
  - Build `/login` page with form
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 14.1, 14.2_

- [x] 2. Build admin dashboard with route protection
  - Create auth middleware for protected routes
  - Build `/dashboard` page with SSR auth check
  - Display basic statistics (total passes, used, unused)
  - Add navigation to generate passes
  - Implement logout functionality
  - _Requirements: 1.4, 8.1, 8.2, 8.3_

- [x] 3. Implement pass generation system
  - Install pdf-lib and qrcode libraries
  - Create Pass schema in MongoDB with indexes
  - Build pass ID generator (PREFIX-NNNN format) in `lib/pass-generator.ts`
  - Create QR code generator with verification URL
  - Implement `POST /api/passes/create-batch` route
  - Build `/generate` page with form (prefix, count)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1_

- [x] 4. Create PDF export with 4 passes per page
  - Implement PDF generator in `lib/pdf-generator.ts`
  - Create A4 layout with 4 pass cards per page
  - Embed QR codes and pass IDs
  - Handle partial pages (non-divisible by 4)
  - Trigger PDF download from generate page
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Build QR scan and visitor update flow
  - Create `/scan/[passId]` page to display pass details
  - Create `GET /api/passes/[passId]` route
  - Add visitor form (name, mobile, city, age) with Zod validation
  - Create `PUT /api/passes/update` route
  - Show success message after update
  - _Requirements: 6.1, 6.2, 6.4, 7.1, 7.3, 7.4_

- [x] 6. Set up offline storage with IndexedDB
  - Install dexie library
  - Create Dexie schema in `lib/dexie.ts` (passes, pendingOps tables)
  - Cache passes to IndexedDB when fetched
  - Implement offline detection
  - Queue updates in pendingOps when offline
  - _Requirements: 4.1, 4.2, 4.3, 15.1, 15.2_

- [x] 7. Build sync engine for offline operations
  - Create sync utilities in `lib/sync.ts`
  - Implement `POST /api/sync` route to process pending operations
  - Add online/offline event listeners
  - Process pendingOps queue on reconnection
  - Update dashboard with pending ops count
  - Add manual "Sync Now" button
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.4_

- [x] 8. Implement pass search functionality
  - Create `GET /api/passes/search` route (by passId or mobile)
  - Add search to dashboard page
  - Support offline search from IndexedDB
  - Display search results in table
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 9. Add pass status management
  - Create `PATCH /api/passes/status` route
  - Add "Mark as Used" button on pass details
  - Prevent duplicate check-ins
  - Queue status updates when offline
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 10. Deploy to production
  - Set up MongoDB Atlas cluster
  - Configure environment variables (MONGODB_URI, JWT_SECRET, NEXT_PUBLIC_BASE_URL)
  - Deploy to Vercel
  - Test end-to-end flow in production
  - _Requirements: All_

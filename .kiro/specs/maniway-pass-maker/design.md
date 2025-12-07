# Design Document

## Overview

Maniway Pass Maker is an offline-first event management system built entirely on Next.js App Router with SSR capabilities. The architecture eliminates the need for a separate backend server by leveraging Next.js API routes as the backend layer. The system uses a dual-database approach: MongoDB for server-side persistence and IndexedDB (via Dexie.js) for client-side offline storage. A sophisticated sync engine ensures data consistency between client and server, with conflict resolution based on timestamps.

The application serves two primary user types: admins who generate and manage passes, and visitors who scan QR codes to verify and update their information. All admin operations work seamlessly offline, with automatic synchronization when connectivity returns. Authentication is handled through JWT tokens stored in HttpOnly cookies, ensuring security while maintaining SSR compatibility.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js Pages (SSR)  │  Service Worker  │  IndexedDB       │
│  - Dashboard          │  - Asset Cache   │  - passes        │
│  - Pass Generator     │  - Offline Queue │  - pendingOps    │
│  - Scan Pages         │  - Background    │  - events        │
│  - Admin Search       │    Sync          │                  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server Layer                     │
├─────────────────────────────────────────────────────────────┤
│  API Routes           │  Middleware      │  Server Actions  │
│  - /api/auth/*        │  - JWT Verify    │  - Pass Gen      │
│  - /api/passes/*      │  - Rate Limit    │  - PDF Create    │
│  - /api/sync          │  - CORS          │                  │
│  - /api/events/*      │                  │                  │
└─────────────────────────────────────────────────────────────┘
                              ↕ MongoDB Driver
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                          │
├─────────────────────────────────────────────────────────────┤
│  Collections: users, passes, events, sync_logs              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 14+ App Router (SSR)
- **Styling**: TailwindCSS + Shadcn UI components
- **Client Database**: Dexie.js (IndexedDB wrapper)
- **Server Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with jsonwebtoken library
- **PDF Generation**: pdf-lib (client-side)
- **QR Generation**: qrcode library
- **Offline Support**: Service Worker + Background Sync API
- **State Management**: React Server Components + Client Components with hooks
- **Deployment**: Vercel (Next.js) + MongoDB Atlas

### Architectural Principles

1. **Offline-First**: All admin operations must work without connectivity
2. **SSR-First**: Pages render on server for performance and SEO
3. **Progressive Enhancement**: Core functionality works, enhanced features layer on top
4. **Security by Default**: HttpOnly cookies, bcrypt hashing, input sanitization
5. **Eventual Consistency**: Offline changes sync when possible, conflicts resolved by timestamp

## Components and Interfaces

### Core Components

#### 1. Authentication System

**Location**: `lib/auth.ts`, `app/api/auth/*`

```typescript
interface AuthService {
  signJWT(payload: JWTPayload): string;
  verifyJWT(token: string): JWTPayload | null;
  hashPassword(password: string): Promise<string>;
  comparePassword(plain: string, hash: string): Promise<boolean>;
  setAuthCookie(token: string): void;
  clearAuthCookie(): void;
}

interface JWTPayload {
  uid: string;
  username: string;
  role: 'admin';
  exp: number;
}
```

**Responsibilities**:
- Generate and verify JWT tokens
- Hash and compare passwords using bcrypt
- Manage HttpOnly cookie lifecycle
- Validate session on protected routes

#### 2. Pass Generator

**Location**: `app/generate/page.tsx`, `lib/pass-generator.ts`

```typescript
interface PassGenerator {
  generateBatch(config: BatchConfig): Promise<Pass[]>;
  generatePassId(prefix: string, sequence: number): string;
  generateQRCode(passId: string): Promise<string>;
  createPDF(passes: Pass[], template: Template): Promise<Blob>;
}

interface BatchConfig {
  eventId: string;
  prefix: string;
  count: number;
  templateId: string;
}

interface Pass {
  passId: string;
  eventId: string;
  status: 'unused' | 'used';
  qrUrl: string;
  qrDataUrl: string;
  name?: string;
  mobile?: string;
  city?: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Responsibilities**:
- Generate sequential unique pass IDs
- Create QR codes with verification URLs
- Store pass records in MongoDB
- Generate PDF with 4 passes per A4 page
- Ensure no duplicate pass IDs

#### 3. Offline Storage Manager

**Location**: `lib/dexie.ts`

```typescript
interface OfflineDB {
  passes: Table<Pass, string>;
  pendingOps: Table<PendingOperation, number>;
  events: Table<Event, string>;
}

interface PendingOperation {
  id?: number;
  type: 'create-pass' | 'update-pass' | 'create-event' | 'update-status';
  passId?: string;
  eventId?: string;
  payload: any;
  createdAt: Date;
  retryCount: number;
}

class DexieDB extends Dexie implements OfflineDB {
  passes: Table<Pass, string>;
  pendingOps: Table<PendingOperation, number>;
  events: Table<Event, string>;
  
  constructor() {
    super('ManiwyPassDB');
    this.version(1).stores({
      passes: 'passId, eventId, status, mobile',
      pendingOps: '++id, type, passId, createdAt',
      events: 'eventId, date'
    });
  }
}
```

**Responsibilities**:
- Store passes locally for offline access
- Queue operations when offline
- Provide fast local search
- Cache event data

#### 4. Sync Engine

**Location**: `lib/sync.ts`, `app/api/sync/route.ts`

```typescript
interface SyncEngine {
  syncPendingOperations(): Promise<SyncResult>;
  queueOperation(op: PendingOperation): Promise<void>;
  getPendingCount(): Promise<number>;
  resolveConflict(local: Pass, remote: Pass): Pass;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: SyncError[];
}

interface SyncError {
  operationId: number;
  error: string;
  retryable: boolean;
}
```

**Responsibilities**:
- Process pending operations queue
- Send batched updates to server
- Handle sync failures with retry logic
- Resolve conflicts using timestamp priority
- Update local cache after successful sync

#### 5. Service Worker

**Location**: `public/sw.js`

```javascript
// Cache Strategy
const CACHE_NAME = 'maniway-v1';
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/generate',
  '/offline.html'
];

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncPendingOperations());
  }
});

// Fetch Strategy: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

**Responsibilities**:
- Cache critical assets for offline use
- Intercept network requests
- Trigger background sync when online
- Serve cached responses when offline

#### 6. PDF Generator

**Location**: `lib/pdf-generator.ts`

```typescript
interface PDFGenerator {
  createPassPDF(passes: Pass[], template: Template): Promise<Blob>;
  layoutPassesOnPage(passes: Pass[], page: PDFPage): void;
  embedQRCode(qrDataUrl: string, page: PDFPage, x: number, y: number): void;
}

interface Template {
  id: string;
  name: string;
  layout: {
    width: number;
    height: number;
    passesPerPage: 4;
    spacing: number;
  };
  design: {
    backgroundColor: string;
    borderColor: string;
    logoUrl?: string;
  };
}
```

**Responsibilities**:
- Create A4 PDF documents
- Layout 4 passes per page
- Embed QR codes and pass details
- Apply template styling
- Handle partial pages (non-divisible by 4)

### API Routes

#### Authentication Routes

- `POST /api/auth/login`: Validate credentials, issue JWT
- `POST /api/auth/logout`: Clear JWT cookie
- `GET /api/auth/verify`: Verify current session

#### Pass Management Routes

- `POST /api/passes/create-batch`: Generate pass batch
- `GET /api/passes/get/[passId]`: Retrieve pass details
- `PUT /api/passes/update`: Update pass information
- `PATCH /api/passes/status`: Update pass status
- `GET /api/passes/search`: Search by mobile or pass ID

#### Event Routes

- `POST /api/events/create`: Create new event
- `GET /api/events/[id]`: Get event details
- `GET /api/events/list`: List all events

#### Sync Route

- `POST /api/sync`: Process pending operations batch

### Page Components

#### Protected Pages (Require Auth)

- `/dashboard`: Admin dashboard with statistics
- `/generate`: Pass generation interface
- `/events/new`: Create event form
- `/events/[id]`: Event details and pass list

#### Public Pages

- `/login`: Authentication page
- `/scan/[passId]`: QR scan landing page
- `/check/[passId]`: Pass verification page

## Data Models

### MongoDB Collections

#### users Collection

```typescript
interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
  lastLogin?: Date;
}
```

#### passes Collection

```typescript
interface PassDocument {
  _id: ObjectId;
  passId: string;          // Unique: VIS-0001
  eventId: string;
  status: 'unused' | 'used';
  qrUrl: string;
  name?: string;
  mobile?: string;
  city?: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;
}

// Indexes
// - passId: unique
// - eventId: non-unique
// - mobile: non-unique
// - status: non-unique
```

#### events Collection

```typescript
interface EventDocument {
  _id: ObjectId;
  eventId: string;         // Unique: EVT-001
  name: string;
  date: Date;
  templateId: string;
  totalPasses: number;
  usedPasses: number;
  createdAt: Date;
}

// Indexes
// - eventId: unique
// - date: non-unique (for sorting)
```

#### sync_logs Collection (Optional)

```typescript
interface SyncLog {
  _id: ObjectId;
  clientId: string;
  operations: PendingOperation[];
  timestamp: Date;
  success: boolean;
  errors?: string[];
}
```

### IndexedDB Schema (Dexie)

```typescript
// Database: ManiwyPassDB
// Version: 1

// Table: passes
// Primary Key: passId
// Indexes: eventId, status, mobile

// Table: pendingOps
// Primary Key: ++id (auto-increment)
// Indexes: type, passId, createdAt

// Table: events
// Primary Key: eventId
// Indexes: date
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT Authentication Round Trip

*For any* valid admin credentials, logging in and then verifying the JWT token should return the same user identity information (uid, username, role).

**Validates: Requirements 1.1, 1.4**

### Property 2: Pass ID Uniqueness

*For any* batch of passes generated with any prefix and count, all generated pass IDs should be unique across the entire system with no duplicates.

**Validates: Requirements 2.1, 2.4**

### Property 3: Pass Generation Consistency

*For any* pass batch configuration, the number of passes stored in MongoDB should equal the requested count, and each pass should have a valid QR code.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: PDF Layout Correctness

*For any* number of passes, the generated PDF should contain exactly ceil(count / 4) pages, with the last page containing (count mod 4) or 4 passes.

**Validates: Requirements 3.1, 3.5**

### Property 5: Offline Operation Queueing

*For any* data modification performed while offline, a corresponding pending operation should be created in IndexedDB with the correct type and payload.

**Validates: Requirements 4.2**

### Property 6: Offline Search Consistency

*For any* pass stored in IndexedDB, searching by its pass ID or mobile number while offline should return the same pass data.

**Validates: Requirements 4.3, 9.3**

### Property 7: Sync Operation Idempotence

*For any* pending operation, applying it multiple times to the server should produce the same final state as applying it once.

**Validates: Requirements 5.2, 5.3**

### Property 8: Sync Queue Ordering

*For any* set of pending operations with different timestamps, synchronization should process them in chronological order (oldest first).

**Validates: Requirements 5.2**

### Property 9: Conflict Resolution Consistency

*For any* two versions of the same pass (local and remote), the conflict resolution should always select the version with the most recent updatedAt timestamp.

**Validates: Requirements 11.5**

### Property 10: QR Code Verification Round Trip

*For any* generated pass, the QR code URL should contain the pass ID, and scanning it should navigate to a page that retrieves the same pass record.

**Validates: Requirements 6.1, 6.2**

### Property 11: Visitor Update Persistence

*For any* visitor information update (online or offline), after synchronization completes, querying the pass from MongoDB should return the updated information.

**Validates: Requirements 7.1, 7.2**

### Property 12: Pass Status Transition Validity

*For any* pass, once marked as "used", subsequent attempts to mark it as "used" should be rejected or have no effect.

**Validates: Requirements 11.4**

### Property 13: Dashboard Statistics Accuracy

*For any* event, the sum of used passes and unused passes should equal the total passes count displayed on the dashboard.

**Validates: Requirements 8.1**

### Property 14: Search Result Completeness

*For any* mobile number associated with multiple passes, searching by that mobile number should return all passes with that mobile number.

**Validates: Requirements 9.2**

### Property 15: Template Application Consistency

*For any* batch of passes generated with a specific template, all passes in the PDF should render with the same template design.

**Validates: Requirements 12.2, 12.3**

### Property 16: Service Worker Cache Availability

*For any* critical asset cached by the service worker, requesting that asset while offline should return the cached version without network errors.

**Validates: Requirements 13.4**

### Property 17: Password Hashing Irreversibility

*For any* password, hashing it with bcrypt should produce a hash that cannot be reversed to obtain the original password through the comparison function alone.

**Validates: Requirements 14.1**

### Property 18: Input Sanitization Safety

*For any* user input containing special characters or potential injection patterns, sanitization should remove or escape dangerous content while preserving valid data.

**Validates: Requirements 14.3**

### Property 19: Pass ID Format Validation

*For any* string, validation should accept it as a pass ID if and only if it matches the pattern PREFIX-NNNN where PREFIX is alphabetic and NNNN is numeric.

**Validates: Requirements 14.4**

### Property 20: Data Serialization Round Trip

*For any* pass object, serializing it to JSON for IndexedDB storage and then parsing it back should produce an equivalent object with the same field values.

**Validates: Requirements 15.1, 15.2**

### Property 21: Sync Payload Integrity

*For any* pending operation, serializing its payload to JSON for transmission and parsing it on the server should preserve all data fields without loss.

**Validates: Requirements 15.3, 15.4**

## Error Handling

### Client-Side Error Handling

#### Network Errors

- **Strategy**: Graceful degradation to offline mode
- **Implementation**: Catch fetch errors, queue operations in IndexedDB
- **User Feedback**: Toast notification "Working offline - changes will sync later"

#### Validation Errors

- **Strategy**: Prevent invalid data entry
- **Implementation**: Zod schema validation on forms
- **User Feedback**: Inline error messages on form fields

#### IndexedDB Errors

- **Strategy**: Fallback to memory storage, warn user
- **Implementation**: Try-catch around Dexie operations
- **User Feedback**: Warning banner "Local storage unavailable - data may not persist"

#### PDF Generation Errors

- **Strategy**: Retry once, then report failure
- **Implementation**: Error boundary around PDF generator
- **User Feedback**: Error modal with retry button

### Server-Side Error Handling

#### Authentication Errors

- **401 Unauthorized**: Invalid or expired JWT → Redirect to login
- **403 Forbidden**: Insufficient permissions → Show access denied page
- **429 Too Many Requests**: Rate limit exceeded → Show retry after message

#### Database Errors

- **Connection Errors**: Retry with exponential backoff (3 attempts)
- **Duplicate Key Errors**: Return 409 Conflict with specific error message
- **Validation Errors**: Return 400 Bad Request with field-level errors

#### Sync Errors

- **Conflict Errors**: Apply timestamp-based resolution, return merged result
- **Partial Failure**: Mark failed operations for retry, succeed others
- **Timeout Errors**: Return 504 Gateway Timeout, client retries

### Error Logging

- **Client**: Console errors + optional error reporting service (Sentry)
- **Server**: Structured logging with Winston or Pino
- **Sync Logs**: Store failed operations in sync_logs collection for debugging

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Areas**:

1. **Authentication Functions**
   - Test JWT signing and verification
   - Test password hashing and comparison
   - Test cookie setting and clearing
   - Example: Login with valid credentials returns JWT
   - Example: Login with invalid credentials returns error
   - Edge case: Expired JWT is rejected

2. **Pass ID Generation**
   - Test sequential ID generation
   - Test prefix handling
   - Example: Generate 5 passes with prefix "VIS" produces VIS-0001 through VIS-0005
   - Edge case: Empty prefix defaults to "PASS"
   - Edge case: Count of 0 returns empty array

3. **QR Code Generation**
   - Test QR data URL creation
   - Test URL format correctness
   - Example: Pass ID "VIS-0001" generates QR with URL containing "/check/VIS-0001"

4. **Validation Functions**
   - Test pass ID format validation
   - Test input sanitization
   - Example: "VIS-0001" passes validation
   - Example: "INVALID" fails validation
   - Edge case: Special characters are escaped

5. **Conflict Resolution**
   - Test timestamp comparison logic
   - Example: Local pass with newer timestamp wins
   - Example: Remote pass with newer timestamp wins
   - Edge case: Equal timestamps prefer remote

### Property-Based Testing

**Framework**: fast-check (JavaScript property testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Tagging Format**: `// Feature: maniway-pass-maker, Property {N}: {description}`

**Property Tests**:

1. **Property 1: JWT Authentication Round Trip**
   - Generate random valid credentials
   - Sign JWT and verify
   - Assert returned payload matches original
   - Tag: `// Feature: maniway-pass-maker, Property 1: JWT Authentication Round Trip`

2. **Property 2: Pass ID Uniqueness**
   - Generate random batch configurations
   - Create passes
   - Assert all pass IDs are unique
   - Tag: `// Feature: maniway-pass-maker, Property 2: Pass ID Uniqueness`

3. **Property 3: Pass Generation Consistency**
   - Generate random batch config
   - Create passes
   - Assert count matches, all have QR codes
   - Tag: `// Feature: maniway-pass-maker, Property 3: Pass Generation Consistency`

4. **Property 4: PDF Layout Correctness**
   - Generate random pass counts (1-1000)
   - Create PDF
   - Assert page count = ceil(count / 4)
   - Tag: `// Feature: maniway-pass-maker, Property 4: PDF Layout Correctness`

5. **Property 5: Offline Operation Queueing**
   - Generate random pass updates
   - Queue while "offline"
   - Assert pending operation created
   - Tag: `// Feature: maniway-pass-maker, Property 5: Offline Operation Queueing`

6. **Property 6: Offline Search Consistency**
   - Generate random passes
   - Store in IndexedDB
   - Search by pass ID and mobile
   - Assert same data returned
   - Tag: `// Feature: maniway-pass-maker, Property 6: Offline Search Consistency`

7. **Property 7: Sync Operation Idempotence**
   - Generate random pending operation
   - Apply to server multiple times
   - Assert final state is same
   - Tag: `// Feature: maniway-pass-maker, Property 7: Sync Operation Idempotence`

8. **Property 8: Sync Queue Ordering**
   - Generate random operations with timestamps
   - Process sync
   - Assert processed in chronological order
   - Tag: `// Feature: maniway-pass-maker, Property 8: Sync Queue Ordering`

9. **Property 9: Conflict Resolution Consistency**
   - Generate two versions of same pass with different timestamps
   - Resolve conflict
   - Assert newer timestamp wins
   - Tag: `// Feature: maniway-pass-maker, Property 9: Conflict Resolution Consistency`

10. **Property 10: QR Code Verification Round Trip**
    - Generate random pass
    - Extract pass ID from QR URL
    - Assert pass ID matches original
    - Tag: `// Feature: maniway-pass-maker, Property 10: QR Code Verification Round Trip`

11. **Property 11: Visitor Update Persistence**
    - Generate random visitor updates
    - Apply and sync
    - Query from MongoDB
    - Assert updates persisted
    - Tag: `// Feature: maniway-pass-maker, Property 11: Visitor Update Persistence`

12. **Property 12: Pass Status Transition Validity**
    - Generate random pass
    - Mark as used twice
    - Assert second attempt has no effect
    - Tag: `// Feature: maniway-pass-maker, Property 12: Pass Status Transition Validity`

13. **Property 13: Dashboard Statistics Accuracy**
    - Generate random event with passes
    - Calculate statistics
    - Assert used + unused = total
    - Tag: `// Feature: maniway-pass-maker, Property 13: Dashboard Statistics Accuracy`

14. **Property 14: Search Result Completeness**
    - Generate random passes with same mobile
    - Search by mobile
    - Assert all passes returned
    - Tag: `// Feature: maniway-pass-maker, Property 14: Search Result Completeness`

15. **Property 15: Template Application Consistency**
    - Generate random batch with template
    - Create PDF
    - Assert all passes use same template
    - Tag: `// Feature: maniway-pass-maker, Property 15: Template Application Consistency`

16. **Property 16: Service Worker Cache Availability**
    - Cache random critical assets
    - Request while "offline"
    - Assert cached version returned
    - Tag: `// Feature: maniway-pass-maker, Property 16: Service Worker Cache Availability`

17. **Property 17: Password Hashing Irreversibility**
    - Generate random passwords
    - Hash with bcrypt
    - Assert cannot reverse through comparison alone
    - Tag: `// Feature: maniway-pass-maker, Property 17: Password Hashing Irreversibility`

18. **Property 18: Input Sanitization Safety**
    - Generate random inputs with injection patterns
    - Sanitize
    - Assert dangerous content removed
    - Tag: `// Feature: maniway-pass-maker, Property 18: Input Sanitization Safety`

19. **Property 19: Pass ID Format Validation**
    - Generate random strings
    - Validate format
    - Assert only PREFIX-NNNN accepted
    - Tag: `// Feature: maniway-pass-maker, Property 19: Pass ID Format Validation`

20. **Property 20: Data Serialization Round Trip**
    - Generate random pass objects
    - Serialize to JSON and parse back
    - Assert equivalent object
    - Tag: `// Feature: maniway-pass-maker, Property 20: Data Serialization Round Trip`

21. **Property 21: Sync Payload Integrity**
    - Generate random pending operations
    - Serialize and parse payload
    - Assert all fields preserved
    - Tag: `// Feature: maniway-pass-maker, Property 21: Sync Payload Integrity`

### Integration Testing

**Framework**: Playwright for E2E testing

**Test Scenarios**:

1. **Complete Pass Generation Flow**
   - Login as admin
   - Create event
   - Generate 10 passes
   - Download PDF
   - Verify passes in database

2. **Offline-to-Online Sync Flow**
   - Login as admin
   - Go offline (network throttling)
   - Update pass information
   - Go online
   - Verify sync completes
   - Verify data in MongoDB

3. **Visitor QR Scan Flow**
   - Generate pass
   - Navigate to QR URL
   - Fill visitor form
   - Submit
   - Verify data saved

4. **Admin Search Flow**
   - Create passes with mobile numbers
   - Search by mobile
   - Verify all passes returned
   - Search by pass ID
   - Verify specific pass returned

### Performance Testing

**Tools**: Lighthouse, WebPageTest

**Metrics**:
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Performance Score > 90
- PDF generation for 100 passes < 5s
- Sync of 1000 operations < 10s

### Security Testing

**Areas**:
- JWT expiration handling
- SQL/NoSQL injection attempts
- XSS attack vectors
- CSRF protection
- Rate limiting effectiveness
- Password strength requirements

## Deployment and Configuration

### Environment Variables

```bash
# Server
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-min-32-chars
COOKIE_NAME=maniway_token
NODE_ENV=production

# Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_BASE_URL=https://pass.sixio.in
NEXT_PUBLIC_APP_NAME=Maniway Pass Maker
```

### Vercel Deployment

1. Connect GitHub repository
2. Configure environment variables
3. Set build command: `next build`
4. Set output directory: `.next`
5. Enable Edge Functions for API routes (optional)

### MongoDB Atlas Setup

1. Create cluster
2. Configure network access (allow Vercel IPs)
3. Create database user
4. Create indexes:
   - `passes.passId` (unique)
   - `passes.mobile`
   - `passes.eventId`
   - `events.eventId` (unique)

### Service Worker Registration

```typescript
// app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

### PWA Manifest

```json
{
  "name": "Maniway Pass Maker",
  "short_name": "PassMaker",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Performance Optimization

### Client-Side Optimizations

1. **Code Splitting**: Dynamic imports for PDF generator and QR library
2. **Image Optimization**: Next.js Image component for logos
3. **Lazy Loading**: Load pass lists on scroll
4. **Memoization**: React.memo for pass card components
5. **IndexedDB Indexing**: Compound indexes for fast searches

### Server-Side Optimizations

1. **Database Indexing**: Covered queries for common searches
2. **Connection Pooling**: MongoDB connection reuse
3. **Edge Functions**: Deploy auth APIs to edge for low latency
4. **Response Caching**: Cache event lists with stale-while-revalidate
5. **Batch Operations**: Process sync operations in batches of 50

### Network Optimizations

1. **Compression**: Enable gzip/brotli
2. **CDN**: Serve static assets from Vercel CDN
3. **HTTP/2**: Enabled by default on Vercel
4. **Prefetching**: Prefetch dashboard data on login
5. **Background Sync**: Defer non-critical syncs

## Scalability Considerations

### Current Capacity

- **Passes per Event**: 100,000+
- **Concurrent Admins**: 50+
- **Offline Operations Queued**: 10,000+
- **QR Scans per Hour**: 5,000+

### Scaling Strategies

1. **Horizontal Scaling**: Vercel auto-scales Next.js instances
2. **Database Sharding**: Shard passes collection by eventId if needed
3. **Read Replicas**: Use MongoDB read replicas for search queries
4. **Caching Layer**: Add Redis for frequently accessed data
5. **Queue System**: Use BullMQ for async operations if sync becomes bottleneck

### Monitoring

- **Application**: Vercel Analytics
- **Database**: MongoDB Atlas monitoring
- **Errors**: Sentry for error tracking
- **Performance**: Lighthouse CI in deployment pipeline
- **Uptime**: UptimeRobot for availability monitoring

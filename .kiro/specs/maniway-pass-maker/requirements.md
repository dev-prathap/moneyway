# Requirements Document

## Introduction

Maniway Pass Maker is an event management utility that enables administrators to generate, manage, and distribute event passes with offline-first capabilities. The system allows admins to create passes with unique IDs and QR codes, print them in A4 format (4 passes per page), and manage visitor information. Visitors can scan QR codes to self-update their information. The system maintains full offline functionality for admins with automatic synchronization when connectivity returns, secured through JWT-based authentication using Next.js SSR architecture.

## Glossary

- **System**: The Maniway Pass Maker application
- **Admin**: Maniway staff member with authentication credentials who manages passes and events
- **Visitor**: Customer who receives a pass and can update their information via QR code
- **Pass**: A unique event entry credential containing ID, QR code, and visitor information
- **Pass ID**: Unique identifier in format PREFIX-NNNN (e.g., VIS-0001)
- **QR Code**: Machine-readable code containing pass verification URL
- **IndexedDB**: Browser-based local database for offline data storage
- **Sync Operation**: Data modification queued for server synchronization
- **JWT**: JSON Web Token used for secure session management
- **Service Worker**: Background script enabling offline functionality and sync
- **MongoDB**: Primary server-side database
- **Batch**: Collection of passes generated together for an event
- **Template**: Pre-defined pass design layout
- **HttpOnly Cookie**: Secure cookie storage mechanism preventing client-side access

## Requirements

### Requirement 1: Admin Authentication

**User Story:** As an admin, I want to securely log in with username and password, so that only authorized staff can access the pass management system.

#### Acceptance Criteria

1. WHEN an admin submits valid credentials THEN the System SHALL generate a JWT token and store it in an HttpOnly cookie
2. WHEN an admin submits invalid credentials THEN the System SHALL reject the login attempt and display an error message
3. WHEN a JWT token expires THEN the System SHALL redirect the admin to the login page
4. WHEN an admin accesses a protected route without valid JWT THEN the System SHALL redirect to the login page
5. WHEN an admin logs out THEN the System SHALL clear the JWT cookie and invalidate the session

### Requirement 2: Pass Generation

**User Story:** As an admin, I want to generate multiple event passes with unique IDs and QR codes, so that I can efficiently create credentials for large events.

#### Acceptance Criteria

1. WHEN an admin specifies pass count and prefix THEN the System SHALL generate sequential unique pass IDs in format PREFIX-NNNN
2. WHEN passes are generated THEN the System SHALL create a unique QR code for each pass containing the verification URL
3. WHEN pass generation completes THEN the System SHALL store all pass records in MongoDB with status "unused"
4. WHEN generating passes THEN the System SHALL ensure no duplicate pass IDs exist across all events
5. WHEN pass generation fails THEN the System SHALL rollback the operation and maintain database consistency

### Requirement 3: PDF Export and Printing

**User Story:** As an admin, I want to export generated passes as A4 PDFs with 4 passes per page, so that I can efficiently print and distribute physical passes.

#### Acceptance Criteria

1. WHEN an admin requests PDF export for a batch THEN the System SHALL generate an A4 document with 4 passes per page
2. WHEN creating PDF pages THEN the System SHALL include pass ID, QR code, and template design for each pass
3. WHEN PDF generation completes THEN the System SHALL trigger automatic download to the admin device
4. WHEN generating PDF THEN the System SHALL maintain consistent layout and spacing across all pages
5. WHEN the batch size is not divisible by 4 THEN the System SHALL fill remaining slots on the last page appropriately

### Requirement 4: Offline Pass Management

**User Story:** As an admin, I want to manage passes and register attendees while offline, so that I can continue operations during connectivity issues.

#### Acceptance Criteria

1. WHEN the admin device loses connectivity THEN the System SHALL continue functioning using IndexedDB cache
2. WHEN an admin creates or updates pass data offline THEN the System SHALL store the operation in IndexedDB pending operations queue
3. WHEN an admin searches for passes offline THEN the System SHALL query IndexedDB and return cached results
4. WHEN offline operations are queued THEN the System SHALL display the count of pending sync operations to the admin
5. WHEN the admin manually triggers sync THEN the System SHALL process all pending operations immediately upon connectivity

### Requirement 5: Automatic Data Synchronization

**User Story:** As an admin, I want offline changes to automatically sync when connectivity returns, so that data remains consistent without manual intervention.

#### Acceptance Criteria

1. WHEN the device regains connectivity THEN the System SHALL automatically initiate synchronization of pending operations
2. WHEN synchronization occurs THEN the System SHALL send all pending operations to the server in chronological order
3. WHEN the server processes sync operations THEN the System SHALL update MongoDB and return confirmation
4. WHEN sync operations complete successfully THEN the System SHALL remove them from IndexedDB pending queue
5. WHEN sync operations fail THEN the System SHALL retry with exponential backoff up to 3 attempts

### Requirement 6: QR Code Scanning and Verification

**User Story:** As a visitor, I want to scan the QR code on my pass, so that I can verify its validity and update my information.

#### Acceptance Criteria

1. WHEN a visitor scans a QR code THEN the System SHALL navigate to the pass verification page with the pass ID
2. WHEN the verification page loads online THEN the System SHALL fetch pass details from MongoDB
3. WHEN the verification page loads offline THEN the System SHALL retrieve pass details from IndexedDB
4. WHEN pass details are displayed THEN the System SHALL show pass ID, status, and current visitor information
5. WHEN a pass is invalid or not found THEN the System SHALL display an appropriate error message

### Requirement 7: Visitor Self-Update

**User Story:** As a visitor, I want to update my personal information through the scanned QR page, so that my details are recorded for the event.

#### Acceptance Criteria

1. WHEN a visitor submits updated information online THEN the System SHALL save changes to MongoDB immediately
2. WHEN a visitor submits updated information offline THEN the System SHALL store changes in IndexedDB as a pending operation
3. WHEN visitor information is updated THEN the System SHALL validate required fields before accepting submission
4. WHEN the update completes THEN the System SHALL display a confirmation message to the visitor
5. WHEN visitor information contains invalid data THEN the System SHALL reject the submission and display validation errors

### Requirement 8: Admin Dashboard

**User Story:** As an admin, I want to view statistics and manage operations from a central dashboard, so that I can monitor system status and access key functions efficiently.

#### Acceptance Criteria

1. WHEN an admin accesses the dashboard THEN the System SHALL display total passes, used passes, and unused passes counts
2. WHEN the dashboard loads THEN the System SHALL show the count of pending offline operations
3. WHEN the dashboard is displayed THEN the System SHALL provide navigation buttons for generate pass, view batches, and create event functions
4. WHEN the admin clicks sync now THEN the System SHALL trigger immediate synchronization and update the pending operations count
5. WHEN dashboard statistics are unavailable offline THEN the System SHALL display cached statistics from IndexedDB

### Requirement 9: Pass Search and Lookup

**User Story:** As an admin, I want to search for passes by pass ID or mobile number, so that I can quickly locate and manage specific visitor records.

#### Acceptance Criteria

1. WHEN an admin enters a pass ID THEN the System SHALL retrieve and display the matching pass record
2. WHEN an admin enters a mobile number THEN the System SHALL retrieve and display all passes associated with that number
3. WHEN search is performed offline THEN the System SHALL query IndexedDB and return cached results
4. WHEN no matching records are found THEN the System SHALL display a "no results" message
5. WHEN multiple matches exist THEN the System SHALL display all matching records in a list format

### Requirement 10: Event Management

**User Story:** As an admin, I want to create and manage events, so that I can organize passes by specific occasions or campaigns.

#### Acceptance Criteria

1. WHEN an admin creates a new event THEN the System SHALL store event details including name and date in MongoDB
2. WHEN an admin generates passes THEN the System SHALL associate them with the selected event ID
3. WHEN an admin views event details THEN the System SHALL display all passes generated for that event
4. WHEN an event is created offline THEN the System SHALL queue the operation for synchronization
5. WHEN event data is queried THEN the System SHALL return events sorted by date in descending order

### Requirement 11: Pass Status Management

**User Story:** As an admin, I want to update pass status and approve check-ins, so that I can track pass usage and control event entry.

#### Acceptance Criteria

1. WHEN an admin marks a pass as used THEN the System SHALL update the pass status to "used" and record the timestamp
2. WHEN a pass status is updated offline THEN the System SHALL queue the operation in IndexedDB for synchronization
3. WHEN an admin views pass history THEN the System SHALL display all status changes with timestamps
4. WHEN a pass is already marked as used THEN the System SHALL prevent duplicate check-ins
5. WHEN pass status updates sync THEN the System SHALL resolve conflicts by prioritizing the most recent timestamp

### Requirement 12: Template Customization

**User Story:** As an admin, I want to select from different pass templates, so that I can customize pass appearance for different event types.

#### Acceptance Criteria

1. WHEN an admin generates passes THEN the System SHALL provide a list of available templates to choose from
2. WHEN a template is selected THEN the System SHALL apply the template design to all passes in the batch
3. WHEN PDF is generated THEN the System SHALL render passes using the selected template layout
4. WHEN templates are stored THEN the System SHALL maintain template assets in the public directory
5. WHEN a template is unavailable THEN the System SHALL fall back to a default template design

### Requirement 13: Service Worker and PWA Support

**User Story:** As an admin, I want to install the application as a PWA, so that I can access it like a native app with offline capabilities.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL register the service worker for offline functionality
2. WHEN the service worker activates THEN the System SHALL cache critical assets for offline access
3. WHEN the admin installs the PWA THEN the System SHALL provide an app-like experience with icon and splash screen
4. WHEN network requests fail THEN the System SHALL serve cached responses from the service worker
5. WHEN the service worker detects connectivity THEN the System SHALL trigger background synchronization

### Requirement 14: Security and Data Validation

**User Story:** As a system administrator, I want robust security measures and data validation, so that the system remains secure and data integrity is maintained.

#### Acceptance Criteria

1. WHEN passwords are stored THEN the System SHALL hash them using bcrypt before saving to MongoDB
2. WHEN JWT tokens are issued THEN the System SHALL set them as HttpOnly cookies with Secure and SameSite flags
3. WHEN user input is received THEN the System SHALL sanitize and validate data before processing
4. WHEN pass ID format is validated THEN the System SHALL ensure it matches the expected PREFIX-NNNN pattern
5. WHEN login attempts exceed 5 failures THEN the System SHALL implement rate limiting to prevent brute force attacks

### Requirement 15: Data Serialization and Parsing

**User Story:** As a developer, I want reliable data serialization between client and server, so that data integrity is maintained during offline sync operations.

#### Acceptance Criteria

1. WHEN pass data is stored in IndexedDB THEN the System SHALL serialize objects to JSON format
2. WHEN pass data is retrieved from IndexedDB THEN the System SHALL parse JSON back to object format
3. WHEN sync operations are transmitted THEN the System SHALL serialize operation payloads to JSON
4. WHEN server receives sync data THEN the System SHALL parse JSON payloads and validate structure
5. WHEN serialization or parsing fails THEN the System SHALL log the error and reject the operation

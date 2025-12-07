# Maniway Pass Maker

An offline-first event management system for generating, managing, and distributing event passes with QR codes.

## Features

- JWT-based authentication with HttpOnly cookies
- MongoDB for data persistence
- Offline-first architecture with IndexedDB
- Pass generation with QR codes
- PDF export (4 passes per A4 page)
- Admin dashboard

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.local` and update the values:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/maniway-pass-maker
   JWT_SECRET=your-secret-key-min-32-chars-change-in-production
   COOKIE_NAME=maniway_token
   NODE_ENV=development
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=Maniway Pass Maker
   ```

3. **Start MongoDB:**
   
   If using local MongoDB:
   ```bash
   mongod
   ```

4. **Seed admin user:**
   ```bash
   npm run seed
   ```
   
   This creates an admin user with:
   - Username: `admin`
   - Password: `admin123`

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Default Credentials

- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change the default password after first login in production!

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts    # Login endpoint
│   │       └── logout/route.ts   # Logout endpoint
│   ├── dashboard/page.tsx        # Admin dashboard
│   ├── login/page.tsx            # Login page
│   └── page.tsx                  # Home (redirects to login)
├── lib/
│   ├── auth.ts                   # JWT utilities
│   ├── db.ts                     # MongoDB connection
│   └── models/
│       └── user.ts               # User schema
├── scripts/
│   └── seed-admin.ts             # Admin user seeding script
└── .env.local                    # Environment variables
```

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** MongoDB
- **Authentication:** JWT with HttpOnly cookies
- **Styling:** TailwindCSS
- **Validation:** Zod
- **Password Hashing:** bcrypt

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Seed admin user
npm run seed
```

## Security Features

- HttpOnly cookies for JWT storage
- bcrypt password hashing with salt rounds
- Secure cookies in production (HTTPS only)
- Input validation with Zod
- SameSite cookie protection

## Production Deployment

### Prerequisites for Production

1. **MongoDB Atlas Account** - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
2. **Vercel Account** - [Sign up here](https://vercel.com/signup)
3. **Domain (optional)** - For custom domain setup

### Step 1: Set Up MongoDB Atlas

1. Create a new cluster in MongoDB Atlas
2. Configure network access:
   - Add `0.0.0.0/0` to allow connections from anywhere (Vercel uses dynamic IPs)
   - Or use Vercel's IP ranges if you prefer stricter security
3. Create a database user with read/write permissions
4. Get your connection string (should look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/maniway-pass-maker?retryWrites=true&w=majority
   ```
5. Create indexes for optimal performance:
   ```javascript
   // In MongoDB Atlas UI or using mongosh
   db.passes.createIndex({ passId: 1 }, { unique: true })
   db.passes.createIndex({ mobile: 1 })
   db.passes.createIndex({ eventId: 1 })
   db.passes.createIndex({ status: 1 })
   db.users.createIndex({ username: 1 }, { unique: true })
   ```

### Step 2: Deploy to Vercel

1. **Push your code to GitHub** (if not already done)

2. **Import project to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables:**
   
   Add these in Vercel's project settings:
   
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/maniway-pass-maker?retryWrites=true&w=majority
   JWT_SECRET=<generate-a-strong-random-secret-min-32-chars>
   COOKIE_NAME=maniway_token
   NODE_ENV=production
   NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_NAME=Maniway Pass Maker
   ```
   
   **Important:** Generate a strong JWT_SECRET using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Seed Admin User in Production

After deployment, seed the admin user:

1. **Option A: Using Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.production
   MONGODB_URI=<your-production-uri> npm run seed
   ```

2. **Option B: Using MongoDB Atlas UI**
   - Go to your cluster in Atlas
   - Click "Collections"
   - Create a new collection called `users`
   - Insert a document:
   ```json
   {
     "username": "admin",
     "passwordHash": "<bcrypt-hash-of-your-password>",
     "role": "admin",
     "createdAt": { "$date": "2024-01-01T00:00:00.000Z" }
   }
   ```
   
   Generate the password hash locally:
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-secure-password', 10).then(console.log)"
   ```

### Step 4: Post-Deployment Verification

1. **Test Authentication:**
   - Visit your production URL
   - Log in with admin credentials
   - Verify JWT cookie is set (check browser DevTools)

2. **Test Pass Generation:**
   - Generate a batch of passes
   - Download PDF
   - Verify QR codes work

3. **Test Offline Functionality:**
   - Open DevTools → Network tab
   - Set to "Offline"
   - Try updating a pass
   - Go back online and verify sync works

4. **Test Search:**
   - Search by pass ID
   - Search by mobile number
   - Verify results are correct

5. **Test Status Management:**
   - Mark a pass as used
   - Verify timestamp is recorded
   - Try marking it as used again (should be prevented)

### Step 5: Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_BASE_URL` environment variable to your custom domain
5. Redeploy the application

### Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong JWT_SECRET (min 32 characters)
- [ ] Enabled HTTPS (automatic with Vercel)
- [ ] Configured MongoDB Atlas network access
- [ ] Set NODE_ENV=production
- [ ] Reviewed and restricted CORS if needed
- [ ] Enabled MongoDB Atlas backup
- [ ] Set up monitoring/alerts in Vercel

### Monitoring and Maintenance

**Vercel Dashboard:**
- Monitor deployment status
- View logs and errors
- Track performance metrics

**MongoDB Atlas:**
- Monitor database performance
- Set up alerts for high usage
- Review slow queries
- Enable automatic backups

**Regular Maintenance:**
- Review and rotate JWT_SECRET periodically
- Update dependencies regularly
- Monitor disk usage in MongoDB
- Review access logs

### Troubleshooting

**Build Fails:**
- Check environment variables are set correctly
- Verify MongoDB connection string format
- Review build logs in Vercel dashboard

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check cookie settings (HttpOnly, Secure, SameSite)
- Ensure NEXT_PUBLIC_BASE_URL matches your domain

**Database Connection Issues:**
- Verify MongoDB Atlas network access settings
- Check connection string format
- Ensure database user has correct permissions

**Offline Sync Not Working:**
- Check browser console for errors
- Verify IndexedDB is enabled in browser
- Test network connectivity detection

### Performance Optimization

1. **Enable Vercel Edge Functions** (optional):
   - Move auth APIs to edge for lower latency
   - Configure in `vercel.json`

2. **Database Optimization:**
   - Ensure all indexes are created
   - Monitor slow queries in Atlas
   - Consider read replicas for high traffic

3. **Caching:**
   - Static assets cached automatically by Vercel CDN
   - Consider Redis for session caching if needed

## License

Private - Maniway Event Management
# moneyway

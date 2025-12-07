# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Code Preparation
- [ ] All tasks from implementation plan completed (Tasks 1-9)
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] All tests passing (if applicable)
- [ ] Code committed and pushed to GitHub

### Environment Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with appropriate permissions
- [ ] Network access configured (0.0.0.0/0 or Vercel IPs)
- [ ] Database indexes created
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel

## Deployment Steps

### 1. MongoDB Atlas Configuration
- [ ] Cluster is running and accessible
- [ ] Connection string obtained
- [ ] Test connection from local machine
- [ ] Indexes created:
  - [ ] `passes.passId` (unique)
  - [ ] `passes.mobile`
  - [ ] `passes.eventId`
  - [ ] `passes.status`
  - [ ] `users.username` (unique)

### 2. Environment Variables
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Strong random secret (min 32 chars)
- [ ] `COOKIE_NAME` - Set to `maniway_token`
- [ ] `NODE_ENV` - Set to `production`
- [ ] `NEXT_PUBLIC_BASE_URL` - Your production URL
- [ ] `NEXT_PUBLIC_APP_NAME` - Set to `Maniway Pass Maker`

### 3. Vercel Deployment
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Build settings verified (default Next.js settings)
- [ ] Initial deployment successful
- [ ] Production URL accessible

### 4. Database Seeding
- [ ] Admin user seeded in production database
- [ ] Admin credentials tested and working
- [ ] Default password changed to secure password

### 5. Custom Domain (Optional)
- [ ] Domain added in Vercel settings
- [ ] DNS records configured
- [ ] SSL certificate issued (automatic)
- [ ] `NEXT_PUBLIC_BASE_URL` updated to custom domain
- [ ] Application redeployed

## Post-Deployment Testing

### Authentication
- [ ] Can access login page
- [ ] Can log in with admin credentials
- [ ] JWT cookie is set correctly
- [ ] Protected routes require authentication
- [ ] Logout works correctly
- [ ] Session persists across page refreshes

### Pass Generation
- [ ] Can access generate page
- [ ] Can generate passes with custom prefix
- [ ] Pass IDs are unique and sequential
- [ ] QR codes are generated correctly
- [ ] PDF download works
- [ ] PDF contains 4 passes per page
- [ ] Passes are saved to database

### Pass Management
- [ ] Can view pass details via QR scan
- [ ] Can update visitor information
- [ ] Can mark pass as used
- [ ] Cannot mark pass as used twice
- [ ] Used timestamp is recorded
- [ ] Pass status updates in database

### Search Functionality
- [ ] Can search by pass ID
- [ ] Can search by mobile number
- [ ] Search returns correct results
- [ ] No results message displays when appropriate
- [ ] Can view pass details from search results

### Offline Functionality
- [ ] Application works when offline
- [ ] Pass updates are queued when offline
- [ ] Pending operations counter shows correct count
- [ ] Sync works when back online
- [ ] Manual sync button works
- [ ] Offline indicator displays correctly

### Dashboard
- [ ] Statistics display correctly
- [ ] Total passes count is accurate
- [ ] Used/unused counts are accurate
- [ ] Pending operations count updates
- [ ] Navigation buttons work
- [ ] Sync now button works

## Security Verification

### Authentication & Authorization
- [ ] Default admin password changed
- [ ] JWT_SECRET is strong and unique
- [ ] Cookies are HttpOnly
- [ ] Cookies are Secure (HTTPS only)
- [ ] Cookies have SameSite protection
- [ ] Protected routes redirect to login

### Database Security
- [ ] MongoDB Atlas network access restricted
- [ ] Database user has minimal required permissions
- [ ] Connection string not exposed in client code
- [ ] Sensitive data not logged

### Application Security
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Input validation working (Zod schemas)
- [ ] No sensitive data in error messages
- [ ] CORS configured appropriately
- [ ] Rate limiting considered (if needed)

## Monitoring Setup

### Vercel
- [ ] Deployment notifications enabled
- [ ] Error tracking configured
- [ ] Performance monitoring reviewed
- [ ] Logs accessible and reviewed

### MongoDB Atlas
- [ ] Performance monitoring enabled
- [ ] Alerts configured for high usage
- [ ] Backup schedule configured
- [ ] Slow query alerts enabled

### Application Monitoring
- [ ] Error logging working
- [ ] Performance metrics tracked
- [ ] User activity monitored (if applicable)

## Documentation

- [ ] README.md updated with production info
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Admin credentials shared securely with team
- [ ] Troubleshooting guide available

## Rollback Plan

- [ ] Previous deployment version noted
- [ ] Rollback procedure documented
- [ ] Database backup taken before deployment
- [ ] Emergency contact list prepared

## Sign-Off

- [ ] Technical lead approval
- [ ] Stakeholder approval
- [ ] Production deployment completed
- [ ] Post-deployment testing completed
- [ ] Team notified of deployment

---

## Deployment Date: _______________

## Deployed By: _______________

## Production URL: _______________

## Notes:
```
[Add any deployment-specific notes here]
```

---

## Troubleshooting Common Issues

### Issue: Build fails on Vercel
**Solution:**
1. Check environment variables are set
2. Verify Node.js version compatibility
3. Review build logs for specific errors
4. Test build locally with `npm run build`

### Issue: Cannot connect to MongoDB
**Solution:**
1. Verify connection string format
2. Check network access settings in Atlas
3. Ensure database user credentials are correct
4. Test connection from Vercel's IP range

### Issue: Authentication not working
**Solution:**
1. Verify JWT_SECRET is set in production
2. Check cookie settings (HttpOnly, Secure, SameSite)
3. Ensure NEXT_PUBLIC_BASE_URL matches your domain
4. Clear browser cookies and try again

### Issue: QR codes not working
**Solution:**
1. Verify NEXT_PUBLIC_BASE_URL is correct
2. Check QR code generation in pass-generator.ts
3. Test QR code with multiple scanners
4. Ensure pass IDs are being saved correctly

### Issue: Offline sync not working
**Solution:**
1. Check browser console for errors
2. Verify IndexedDB is enabled
3. Test online/offline detection
4. Review sync engine logs
5. Check pending operations queue

### Issue: PDF generation fails
**Solution:**
1. Check pdf-lib dependency is installed
2. Verify QR codes are generated before PDF
3. Review browser console for errors
4. Test with smaller batch sizes
5. Check memory limits

---

## Emergency Contacts

- **Technical Lead:** _______________
- **DevOps:** _______________
- **MongoDB Support:** https://support.mongodb.com
- **Vercel Support:** https://vercel.com/support

---

## Post-Deployment Monitoring (First 24 Hours)

- [ ] Hour 1: Check error rates
- [ ] Hour 2: Verify user logins working
- [ ] Hour 4: Check database performance
- [ ] Hour 8: Review sync operations
- [ ] Hour 24: Full system health check

## Success Criteria

✅ Deployment is considered successful when:
- All authentication flows work
- Pass generation and PDF export work
- Offline functionality works
- Search functionality works
- Status management works
- No critical errors in logs
- Performance metrics are acceptable
- All security checks pass

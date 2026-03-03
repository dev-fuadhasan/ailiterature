# Admin Dashboard

## Access

Admin dashboard is accessible via direct URL only (no button in main site):

**Login URL:** `https://yourdomain.com/secretlogin`

**Dashboard URL:** `https://yourdomain.com/admin/dashboard`

## Environment Variables

Add these to your `.env` file or deployment platform:

```env
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

## Features

### 1. User Management
- View all registered users
- Search and filter users
- See user statistics:
  - Total users
  - Premium vs Free users
  - Total projects
  
### 2. User Details
- View individual user information
- See all user projects
- View project status and paper counts

### 3. Subscription Management
- Change user plan type:
  - FREE
  - MONTHLY
  - YEARLY
- Update subscription status:
  - ACTIVE
  - TRIALING
  - CANCELLED
  - PAST_DUE
  - PAUSED

### 4. User Deletion
- Complete user data removal
- Deletes:
  - User account (from Supabase Auth)
  - All projects
  - All papers
  - All PDF files (from R2 storage)
  - Profile data
- Requires double confirmation for safety

## Security

- Protected by middleware - requires authentication
- Session expires after 8 hours
- Direct URL access only (no public links)
- Username/password from environment variables
- All admin API endpoints require authentication

## API Endpoints

All endpoints require admin authentication via cookie.

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user subscription
- `DELETE /api/admin/users/[id]` - Delete user and all data

## Usage

1. Navigate to `https://yourdomain.com/secretlogin`
2. Enter admin credentials
3. Manage users from the dashboard
4. Logout when done

## Files Created

- `/src/app/secretlogin/page.tsx` - Admin login page
- `/src/app/admin/dashboard/page.tsx` - Admin dashboard
- `/src/app/api/admin/auth/login/route.ts` - Login endpoint
- `/src/app/api/admin/auth/logout/route.ts` - Logout endpoint
- `/src/app/api/admin/users/route.ts` - Users list endpoint
- `/src/app/api/admin/users/[id]/route.ts` - User operations (get, update, delete)
- `/src/lib/admin-auth.ts` - Admin authentication helper
- `/middleware.ts` - Route protection middleware

## Notes

- No changes made to existing website features
- Admin routes are completely separate
- Regular users cannot access admin pages
- All user deletions are permanent and cannot be undone

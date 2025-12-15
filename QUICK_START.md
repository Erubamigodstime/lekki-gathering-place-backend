# 🚀 Quick Reference Guide

## Start Development Server (Already Configured!)

### Option 1: Automatic Setup (Windows)
```bash
.\setup.bat
```

### Option 2: Automatic Setup (Mac/Linux)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 3: Manual Steps
```bash
npm install                  # Install dependencies
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate       # Run migrations
npm run prisma:seed          # Seed database
npm run dev                  # Start server
```

## Server URLs

- **API Base**: http://localhost:5000/api/v1
- **API Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/v1/health

## Test Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@church.org | Admin@123 |
| **Instructor** | instructor1@church.org | Instructor@123 |
| **Student** | student1@church.org | Student@123 |

## Quick Test with cURL

### 1. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@church.org\",\"password\":\"Admin@123\"}"
```

### 2. Get Profile (use token from login)
```bash
curl http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get All Classes
```bash
curl http://localhost:5000/api/v1/classes
```

## Frontend Integration

Update your frontend to point to:
```typescript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

Example login request:
```typescript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
// Store data.data.accessToken and data.data.refreshToken
```

## Database Management

### Open Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```
Opens at: http://localhost:5555

### Reset Database
```bash
npm run prisma:reset
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

## Common Issues

### Port Already in Use
Change PORT in `.env` file

### Database Connection Error
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Create database: `createdb lekki_gathering_place`

### Prisma Client Error
```bash
npm run prisma:generate
```

## Project Structure Overview

```
src/
├── routes/          # All API endpoints
├── controllers/     # Request handlers  
├── services/        # Business logic
├── middleware/      # Auth, validation, etc.
├── utils/           # Helper functions
└── config/          # Database, Redis, etc.
```

## Environment Variables (.env)

Essential variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For token signing
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)

## Useful Commands

```bash
# Development
npm run dev          # Start with hot reload

# Build & Deploy
npm run build        # Compile TypeScript
npm start            # Run production build

# Database
npm run prisma:studio    # Database GUI
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed data

# Code Quality
npm run lint         # Check code
npm run format       # Format code
npm test             # Run tests
```

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* your data */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "error": "Details"
}
```

## Rate Limits

- **API**: 100 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes

## Need Help?

1. Check [README.md](README.md)
2. See [GETTING_STARTED.md](GETTING_STARTED.md)
3. Review [API_REFERENCE.md](API_REFERENCE.md)
4. Visit Swagger docs: http://localhost:5000/api-docs

## Production Deployment Checklist

- [ ] Change all passwords in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up email service (SendGrid/SMTP)
- [ ] Configure Cloudinary
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy

---

**Ready to start? Run `npm run dev` and you're good to go! 🚀**

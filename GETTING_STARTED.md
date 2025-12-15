# Lekki Gathering Place Backend - Getting Started

## Prerequisites

Ensure you have the following installed:
- Node.js (v20+)
- npm or yarn
- PostgreSQL (v15+)
- Redis (optional, for caching)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure your database and other settings:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lekki_gathering_place"
JWT_SECRET="your-super-secret-jwt-key"
# ... other configurations
```

### 3. Database Setup

Generate Prisma Client:
```bash
npm run prisma:generate
```

Run database migrations:
```bash
npm run prisma:migrate
```

Seed the database with test data:
```bash
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Quick Test

Once the server is running, test the health endpoint:
```bash
curl http://localhost:5000/api/v1/health
```

## Test Credentials

After seeding, use these credentials:

**Admin:**
- Email: admin@church.org
- Password: Admin@123

**Instructor:**
- Email: instructor1@church.org
- Password: Instructor@123

**Student:**
- Email: student1@church.org
- Password: Student@123

## API Documentation

Access Swagger documentation at:
```
http://localhost:5000/api-docs
```

## Common Commands

```bash
# Development
npm run dev              # Start with hot reload

# Build
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:reset     # Reset database

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix lint issues
npm run format           # Format code
```

## Docker Setup (Optional)

Start all services with Docker:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API

## Project Structure

```
src/
├── config/              # Configuration files
├── controllers/         # Request handlers
├── middleware/          # Custom middleware
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
├── types/               # TypeScript types
├── validators/          # Request validation
├── app.ts               # Express app
└── server.ts            # Server entry

prisma/
├── schema.prisma        # Database schema
├── seed.ts              # Seed data
└── migrations/          # Migration files
```

## Next Steps

1. Configure email service (SendGrid/SMTP) in `.env`
2. Set up Cloudinary for file uploads
3. Configure Google OAuth credentials
4. Set up production environment
5. Deploy to your preferred platform

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists

### Port Already in Use
- Change PORT in `.env`
- Or kill the process using port 5000

### Prisma Client Error
- Run `npm run prisma:generate`
- Clear node_modules and reinstall

## Support

For issues or questions, contact: support@lekkigatheringplace.org

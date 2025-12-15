# Lekki Gathering Place Backend API

Enterprise-grade backend API for the Skills Training Management System built with Express.js, TypeScript, PostgreSQL, and Prisma.

## Features

- 🔐 JWT Authentication with Refresh Tokens
- 👥 Multi-Role System (Admin, Instructor, Student)
- 📚 Class & Enrollment Management
- ✅ Attendance Tracking & Approval System
- 📁 File Upload (Cloudinary)
- 📧 Email Notifications
- 🔄 Real-time Updates (Socket.io)
- 📊 Analytics & Reporting
- 🛡️ Security Best Practices
- 📖 API Documentation (Swagger)

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT + Passport.js
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Documentation**: Swagger

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- Redis (optional, for caching)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd lekki-gathering-place-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

5. Start development server
```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with test data
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

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
├── validators/          # Request validation schemas
├── app.ts               # Express app setup
└── server.ts            # Server entry point

prisma/
├── schema.prisma        # Database schema
├── seed.ts              # Database seeding
└── migrations/          # Migration files
```

## API Documentation

Once the server is running, access the API documentation at:
- Swagger UI: `http://localhost:5000/api-docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/google` - Google OAuth login

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PATCH /api/v1/users/profile` - Update profile
- `GET /api/v1/users/:id` - Get user by ID (Admin)

### Classes
- `GET /api/v1/classes` - List all classes
- `POST /api/v1/classes` - Create class (Admin/Instructor)
- `GET /api/v1/classes/:id` - Get class details
- `PATCH /api/v1/classes/:id` - Update class
- `DELETE /api/v1/classes/:id` - Delete class

### Enrollments
- `POST /api/v1/enrollments` - Enroll in class
- `GET /api/v1/enrollments/my-classes` - Get my enrollments
- `PATCH /api/v1/enrollments/:id/approve` - Approve enrollment

### Attendance
- `POST /api/v1/attendance/mark` - Mark attendance
- `GET /api/v1/attendance` - List attendance records
- `PATCH /api/v1/attendance/:id/approve` - Approve attendance

### Instructors
- `GET /api/v1/instructors` - List instructors
- `POST /api/v1/instructors/apply` - Apply as instructor
- `PATCH /api/v1/instructors/:id/approve` - Approve instructor

### Wards
- `GET /api/v1/wards` - List all wards
- `GET /api/v1/wards/:id/classes` - Get classes by ward

## Environment Variables

See `.env.example` for all available environment variables.

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting
- JWT with refresh tokens
- Password hashing with bcrypt
- Input validation
- SQL injection protection (Prisma)
- XSS protection

## Testing

```bash
npm test
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build the project: `npm run build`
2. Set environment variables for production
3. Run migrations: `npm run prisma:migrate`
4. Start server: `npm start`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

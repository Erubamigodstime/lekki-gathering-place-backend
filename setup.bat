@echo off
echo ================================================
echo Lekki Gathering Place Backend - Quick Setup
echo ================================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b %errorlevel%
)
echo ✓ Dependencies installed
echo.

echo [2/5] Generating Prisma Client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b %errorlevel%
)
echo ✓ Prisma Client generated
echo.

echo [3/5] Running database migrations...
call npm run prisma:migrate
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations
    echo Make sure PostgreSQL is running and DATABASE_URL is correct in .env
    pause
    exit /b %errorlevel%
)
echo ✓ Migrations completed
echo.

echo [4/5] Seeding database with test data...
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b %errorlevel%
)
echo ✓ Database seeded
echo.

echo [5/5] Starting development server...
echo.
echo ================================================
echo Server starting...
echo API: http://localhost:5000/api/v1
echo Docs: http://localhost:5000/api-docs
echo ================================================
echo.
echo Test Credentials:
echo Admin: admin@church.org / Admin@123
echo Instructor: instructor1@church.org / Instructor@123
echo Student: student1@church.org / Student@123
echo.
echo ================================================
echo.

call npm run dev

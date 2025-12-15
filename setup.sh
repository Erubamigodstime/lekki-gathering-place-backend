#!/bin/bash

echo "================================================"
echo "Lekki Gathering Place Backend - Quick Setup"
echo "================================================"
echo ""

echo "[1/5] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "[2/5] Generating Prisma Client..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate Prisma client"
    exit 1
fi
echo "✓ Prisma Client generated"
echo ""

echo "[3/5] Running database migrations..."
npm run prisma:migrate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to run migrations"
    echo "Make sure PostgreSQL is running and DATABASE_URL is correct in .env"
    exit 1
fi
echo "✓ Migrations completed"
echo ""

echo "[4/5] Seeding database with test data..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to seed database"
    exit 1
fi
echo "✓ Database seeded"
echo ""

echo "[5/5] Starting development server..."
echo ""
echo "================================================"
echo "Server starting..."
echo "API: http://localhost:5000/api/v1"
echo "Docs: http://localhost:5000/api-docs"
echo "================================================"
echo ""
echo "Test Credentials:"
echo "Admin: admin@church.org / Admin@123"
echo "Instructor: instructor1@church.org / Instructor@123"
echo "Student: student1@church.org / Student@123"
echo ""
echo "================================================"
echo ""

npm run dev

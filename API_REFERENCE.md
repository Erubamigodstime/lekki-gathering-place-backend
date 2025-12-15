# API Endpoints Reference

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "STUDENT",
  "wardId": "ward-uuid"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer {accessToken}
```

## Wards

### Get All Wards
```http
GET /wards
```

### Get Ward by ID
```http
GET /wards/{id}
```

### Get Classes by Ward
```http
GET /wards/{id}/classes
```

## Classes

### Get All Classes
```http
GET /classes?page=1&limit=20&wardId=xxx&status=ACTIVE
```

### Get Class by ID
```http
GET /classes/{id}
```

### Create Class (Admin/Instructor)
```http
POST /classes
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Tailoring Basics",
  "description": "Learn fundamental tailoring skills",
  "schedule": {
    "days": ["Monday", "Wednesday"],
    "time": "9:00 AM - 11:00 AM"
  },
  "maxCapacity": 20,
  "instructorId": "instructor-uuid",
  "wardId": "ward-uuid"
}
```

### Update Class
```http
PATCH /classes/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Class Name",
  "status": "ACTIVE"
}
```

## Enrollments

### Get My Classes (Student)
```http
GET /enrollments/my-classes
Authorization: Bearer {accessToken}
```

### Enroll in Class (Student)
```http
POST /enrollments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "classId": "class-uuid"
}
```

### Get Enrollments for Class (Admin/Instructor)
```http
GET /enrollments/class/{classId}?status=PENDING
Authorization: Bearer {accessToken}
```

### Approve/Reject Enrollment
```http
PATCH /enrollments/{id}/approve
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "APPROVED",
  "rejectionReason": "Optional reason if rejected"
}
```

## Attendance

### Mark Attendance (Student)
```http
POST /attendance/mark
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "classId": "class-uuid",
  "notes": "Optional notes"
}
```

### Get My Attendance (Student)
```http
GET /attendance/my-attendance?classId=xxx&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {accessToken}
```

### Get Attendance for Class (Admin/Instructor)
```http
GET /attendance/class/{classId}?status=PENDING
Authorization: Bearer {accessToken}
```

### Approve/Reject Attendance
```http
PATCH /attendance/{id}/approve
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "APPROVED",
  "rejectionReason": "Optional reason if rejected"
}
```

## Instructors

### Get All Instructors
```http
GET /instructors?status=APPROVED
Authorization: Bearer {accessToken}
```

### Get Instructor by ID
```http
GET /instructors/{id}
Authorization: Bearer {accessToken}
```

### Update Instructor Profile (Instructor)
```http
PATCH /instructors/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "skills": ["Tailoring", "Fashion Design"],
  "bio": "Experienced instructor",
  "experience": 10,
  "availabilityCalendar": {}
}
```

### Upload Documents (Instructor)
```http
POST /instructors/documents
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

documents: [file1, file2, ...]
```

### Approve/Reject Instructor (Admin)
```http
PATCH /instructors/{id}/approve
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "APPROVED",
  "rejectionReason": "Optional reason if rejected"
}
```

## Students

### Get All Students (Admin/Instructor)
```http
GET /students?page=1&limit=20&wardId=xxx&classId=xxx
Authorization: Bearer {accessToken}
```

### Get Student by ID
```http
GET /students/{id}
Authorization: Bearer {accessToken}
```

### Get Student Attendance History
```http
GET /students/{id}/attendance?classId=xxx&startDate=2024-01-01
Authorization: Bearer {accessToken}
```

## Notifications

### Get Notifications
```http
GET /notifications?unreadOnly=true
Authorization: Bearer {accessToken}
```

### Mark as Read
```http
PATCH /notifications/{id}/read
Authorization: Bearer {accessToken}
```

### Mark All as Read
```http
PATCH /notifications/read-all
Authorization: Bearer {accessToken}
```

## Users

### Get All Users (Admin)
```http
GET /users
Authorization: Bearer {accessToken}
```

### Get User by ID
```http
GET /users/{id}
Authorization: Bearer {accessToken}
```

### Update Profile
```http
PATCH /users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1234567890",
  "profilePicture": "url"
}
```

## Common Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort direction: asc or desc (default: desc)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "data": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "pageSize": 20,
      "totalItems": 200,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

# Authentication Feature

## Overview

This authentication system provides multiple ways to authenticate users:

- Username/Password registration and login
- Google OAuth 2.0 authentication
- JWT token-based authorization

## Features

### 1. Local Authentication (Username/Password)

- **Register**: `POST /auth/register`
  - Body: `{ "username": "string", "password": "string" }`
  - Password is hashed using bcrypt (10 rounds)
  - Returns JWT token and user info
- **Login**: `POST /auth/login`
  - Body: `{ "username": "string", "password": "string" }`
  - Validates credentials and returns JWT token

### 2. Google OAuth Authentication

- **Initiate Google Login**: `GET /auth/google`
  - Redirects to Google OAuth consent screen
- **Google Callback**: `GET /auth/google/callback`
  - Handles OAuth callback from Google
  - Creates or updates user with Google profile
  - Redirects to success page with token

### 3. Protected Routes

- **Get Profile**: `GET /auth/profile`
  - Requires Authorization header: `Bearer <token>`
  - Returns current user information

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 2. Database Migration

Run the migration to create the users table:

```bash
pnpm run migration:generate
pnpm run migration:up
```

The User table includes:

- `id` (UUID, primary key)
- `username` (unique, nullable for Google-only users)
- `password` (hashed, nullable for Google-only users)
- `email` (unique, nullable)
- `google_id` (nullable)
- `display_name` (nullable)
- `avatar_url` (nullable)
- `created_at`, `updated_at`

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## UI Pages

Access the authentication UI at:

- **Home**: `http://localhost:3000/` (redirects to login)
- **Login**: `http://localhost:3000/login.html`
- **Register**: `http://localhost:3000/register.html`
- **Success**: `http://localhost:3000/success.html`

## Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Tokens**: Configurable expiration (default 7 days)
3. **Input Validation**: Class-validator DTOs with:
   - Username: minimum 3 characters
   - Password: minimum 6 characters
4. **HTTP Exception Handling**: Proper error responses
5. **CORS**: Configured for cross-origin requests

## Architecture

Following NestJS best practices:

- **Module Organization**: Separate User and Auth modules
- **Dependency Injection**: Constructor injection pattern
- **Strategy Pattern**: Passport strategies (Local, JWT, Google)
- **Guards**: Authentication guards for route protection
- **DTOs**: Input validation and transformation
- **Service Layer**: Business logic separated from controllers

## API Examples

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Get Profile

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing

Run the test suite:

```bash
pnpm run test
```

## Troubleshooting

### Google OAuth not working

- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
- Check authorized redirect URIs in Google Console
- Ensure Google+ API is enabled

### JWT token expired

- Adjust JWT_EXPIRES_IN in .env
- Default is 7 days

### Password validation fails

- Ensure password is at least 6 characters
- Check username is at least 3 characters

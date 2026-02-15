# 5Sport - Quick Start Guide

## 🎯 What's Been Implemented

Three major features have been added to 5Sport:

1. **Athlete Profiles** - Complete athlete management with ratings and statistics
2. **Leaderboard System** - Rankings and competitive tracking
3. **Match & Participant Management** - Full event lifecycle from registration to results

All features include:
- ✅ Complete backend implementation (NestJS + TypeORM)
- ✅ Full Swagger API documentation
- ✅ Unit tests with good coverage
- ✅ Input validation (class-validator)
- ✅ Role-based access control
- ✅ Ready for frontend integration

## 📂 Project Structure

```
5sport-backend/
├── src/modules/
│   ├── athlete/          ← NEW: Athlete management
│   ├── leaderboard/      ← NEW: Ranking system
│   └── event/
│       ├── entities/
│       │   ├── match.entity.ts           ← NEW
│       │   ├── match-score.entity.ts     ← NEW
│       │   └── event-participant.entity.ts ← NEW
│       ├── match.service.ts              ← NEW
│       ├── match.controller.ts           ← NEW
│       ├── participant.service.ts        ← NEW
│       └── participant.controller.ts     ← NEW
│
├── IMPLEMENTATION_SUMMARY.md    ← Detailed overview
├── MIGRATION_GUIDE.md           ← Database migration steps
└── QUICKSTART.md                ← This file
```

## 🚀 Getting Started

### Step 1: Review the Implementation

Read these files in order:
1. `IMPLEMENTATION_SUMMARY.md` - Overview of all features
2. `MIGRATION_GUIDE.md` - Database setup instructions
3. `/src/modules/athlete/` - Explore athlete module
4. `/src/modules/leaderboard/` - Explore leaderboard module
5. `/src/modules/event/match.*.ts` - Match management files

### Step 2: Run Database Migration

```bash
# Make sure PostgreSQL is running
# Make sure you have a backup!

# Generate migration from entities
npm run typeorm migration:generate -- src/migrations/CreateAthleteLeaderboardMatch

# Review the generated migration file
# src/migrations/{timestamp}-CreateAthleteLeaderboardMatch.ts

# Run the migration
npm run typeorm migration:run

# Verify
npm run typeorm migration:show
```

**Alternative**: Use the example migration in `src/migrations/EXAMPLE-create-all-tables.ts` as reference.

### Step 3: Start the Backend

```bash
# Install dependencies (if needed)
npm install

# Start in development mode
npm run start:dev

# Backend will be available at: http://localhost:3000
# Swagger UI at: http://localhost:3000/api
```

### Step 4: Test API Endpoints

Visit Swagger UI: `http://localhost:3000/api`

**Try these endpoints**:

1. **Create an athlete profile**:
   - `POST /athletes`
   - Body:
     ```json
     {
       "name": "John Doe",
       "sportType": "PICKLEBALL",
       "city": "Ho Chi Minh City"
     }
     ```

2. **List athletes**:
   - `GET /athletes?sportType=PICKLEBALL`

3. **Create a leaderboard** (requires admin token):
   - `POST /leaderboards`
   - Body:
     ```json
     {
       "name": "Overall Pickleball 2024",
       "type": "OVERALL",
       "sportType": "PICKLEBALL",
       "startDate": "2024-01-01"
     }
     ```

4. **Register for an event**:
   - `POST /events/{eventId}/participants`

5. **Create a match**:
   - `POST /events/{eventId}/matches`

### Step 5: Run Tests

```bash
# Run all unit tests
npm run test

# Run specific test suite
npm run test athlete.service.spec
npm run test leaderboard.service.spec
npm run test match.service.spec

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

### Step 6: Generate Frontend API Client

Once backend is running:

```bash
cd ../5sport-fe

# This will generate TypeScript client from Swagger
pnpm run generate:api

# New types and hooks will be in: lib/api/generated.ts
```

See `5sport-fe/FRONTEND_INTEGRATION.md` for detailed frontend integration steps.

## 📊 API Overview

### Athlete Module (`/athletes`)
- Create, read, update, delete athlete profiles
- Search athletes by name
- Track statistics and ratings
- Match history

### Leaderboard Module (`/leaderboards`)
- Create and manage leaderboards
- Automatic rank calculation
- Support for different leaderboard types
- Get top athletes by sport

### Match Module (`/events/:eventId/matches`)
- Create and schedule matches
- Start/end match lifecycle
- Update scores set-by-set
- Track match results

### Participant Module (`/events/:eventId/participants`)
- Register for events
- Check-in participants
- Assign bib numbers
- Withdraw from events

## 🔐 Authentication & Authorization

All endpoints use JWT authentication via `JwtAuthGuard`.

**Role requirements**:
- **Public**: List athletes, view leaderboards, view matches
- **User**: Create athlete profile, register for events, withdraw
- **Organizer**: Create matches, update scores, check-in participants
- **Admin**: Create leaderboards, delete matches, full access

**Getting a token**:
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response includes: { accessToken: "..." }
# Use in headers: Authorization: Bearer {token}
```

## 🧪 Testing Strategy

### Unit Tests
Each service has comprehensive unit tests:
- `athlete.service.spec.ts` - 180+ lines
- `leaderboard.service.spec.ts` - 240+ lines
- `match.service.spec.ts` - 200+ lines
- `participant.service.spec.ts` - 220+ lines

**Coverage areas**:
- CRUD operations
- Business logic
- Error handling
- Ownership validation
- Edge cases

### E2E Tests (To Add)
Create E2E tests in `test/` directory:
- `athletes.e2e-spec.ts`
- `leaderboards.e2e-spec.ts`
- `matches.e2e-spec.ts`

## 🎨 Frontend Integration

See `/5sport-fe/FRONTEND_INTEGRATION.md` for:
- API client generation
- Component examples
- Page structure
- React Query hooks
- i18n setup

**Quick preview of generated hooks**:
```typescript
// List athletes
const { data } = useGetAthletes({ sportType: 'PICKLEBALL' });

// Create athlete
const create = useCreateAthlete();
await create.mutateAsync({ name: 'John', sportType: 'PICKLEBALL' });

// Get leaderboard
const { data: leaderboard } = useGetLeaderboardById(id);

// Update match score
const updateScore = useUpdateMatchScore();
await updateScore.mutateAsync({ id, data: { ... } });
```

## 📝 Common Tasks

### Add a New Athlete
```bash
curl -X POST http://localhost:3000/athletes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "sportType": "BADMINTON",
    "city": "Hanoi",
    "dateOfBirth": "1995-05-15"
  }'
```

### Create a Monthly Leaderboard
```bash
curl -X POST http://localhost:3000/leaderboards \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "February 2024 Pickleball",
    "type": "MONTHLY",
    "sportType": "PICKLEBALL",
    "period": "2024-02-01",
    "startDate": "2024-02-01",
    "endDate": "2024-02-29"
  }'
```

### Schedule a Match
```bash
curl -X POST http://localhost:3000/events/{eventId}/matches \
  -H "Authorization: Bearer {organizer-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "{sessionId}",
    "name": "Semi Final 1",
    "round": "Semi Final",
    "courtNumber": 1,
    "scheduledTime": "2024-02-20T14:00:00Z",
    "team1Player1Id": "{athleteId1}",
    "team2Player1Id": "{athleteId2}"
  }'
```

### Update Match Score
```bash
curl -X PATCH http://localhost:3000/events/{eventId}/matches/{matchId}/score \
  -H "Authorization: Bearer {organizer-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "setNumber": 1,
    "team1Points": 21,
    "team2Points": 19,
    "winnerTeam": 1
  }'
```

## 🐛 Troubleshooting

### Migration fails with "relation already exists"
**Solution**: Drop existing tables or use `migration:revert`

```bash
npm run typeorm migration:revert
npm run typeorm migration:run
```

### "Cannot find module" errors
**Solution**: Rebuild the project

```bash
npm run build
```

### Tests failing
**Solution**: Ensure test database is configured

```bash
# Check .env.test exists
# Run migrations on test database
NODE_ENV=test npm run typeorm migration:run
```

### Swagger not showing new endpoints
**Solution**: Restart the server

```bash
# Clear cache and restart
rm -rf dist
npm run start:dev
```

## 📚 Next Steps

1. ✅ **Complete migrations** - Run database migrations
2. ✅ **Test all endpoints** - Use Swagger UI
3. ✅ **Generate frontend API** - Run `pnpm run generate:api`
4. ✅ **Build UI components** - Follow frontend integration guide
5. ✅ **Add E2E tests** - Comprehensive integration tests
6. ✅ **Deploy** - To production environment

## 🎓 Learning Resources

**NestJS Best Practices** (from `.agents/skills/nestjs-best-practices`):
- Follow the 40 rules for production-ready code
- Focus on architecture, security, and performance
- Check skill files in `src/.agents/skills/`

**TypeORM**:
- Entity relationships and decorators
- Query builders for complex queries
- Migration best practices

**Testing**:
- Unit tests with Jest
- E2E tests with Supertest
- Mocking strategies

## 💡 Tips

1. **Use Swagger UI** for exploring and testing APIs
2. **Check service specs** for examples of proper usage
3. **Follow naming conventions** from existing code
4. **Add indexes** for frequently queried fields
5. **Write tests first** when adding new features
6. **Use transactions** for complex operations
7. **Validate all inputs** with DTOs
8. **Document with Swagger** decorators

## 🤝 Support

- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Frontend Integration**: `../5sport-fe/FRONTEND_INTEGRATION.md`
- **Example Migration**: `src/migrations/EXAMPLE-create-all-tables.ts`

---

**Ready to go!** Start with Step 2 (migrations) and follow the guide. Everything is in place for a complete implementation. 🚀

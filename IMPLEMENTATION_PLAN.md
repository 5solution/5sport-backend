# 5Sport Features Implementation Plan

## Overview
Implementation of Athlete Profiles, Leaderboards, and Match Management features.

## Implementation Order

### Phase 1: Athlete Module ✓
1. Create athlete entities
2. Create athlete DTOs with validation
3. Implement athlete service with business logic
4. Implement athlete controller with Swagger docs
5. Write unit and e2e tests
6. Add to app.module

### Phase 2: Leaderboard Module ✓
1. Create leaderboard entities
2. Create leaderboard DTOs
3. Implement leaderboard service with ranking logic
4. Implement leaderboard controller
5. Write tests
6. Add to app.module

### Phase 3: Match & Participant Module ✓
1. Create match and participant entities
2. Create DTOs for match management
3. Implement match service with scoring logic
4. Implement participant service
5. Implement controllers
6. Write tests
7. Add to app.module

### Phase 4: Integration
1. Connect matches to leaderboard updates
2. Update athlete stats after matches
3. Event participant registration flow

### Phase 5: Frontend (After Backend Complete)
1. Run `pnpm run generate:api` to update API client
2. Create athlete pages
3. Create leaderboard pages
4. Create match management pages

## Notes
- Following NestJS best practices from `.agents/skills`
- All DTOs use class-validator
- All endpoints have Swagger documentation
- Tests written but migrations NOT executed yet
- Frontend API will be auto-generated from Swagger

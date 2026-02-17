# Migration Guide - 5Sport New Features

## Prerequisites

1. Stop the running application
2. Backup your database
3. Ensure TypeORM is configured properly

## Step 1: Generate Migration

```bash
cd 5sport-backend

# Generate migration from entities
npm run typeorm migration:generate -- src/migrations/CreateAthleteLeaderboardMatch
```

This will scan all entities and generate a migration file with the required SQL.

## Step 2: Review Generated Migration

The migration file will be created in `src/migrations/` with a timestamp prefix.

**Expected tables to be created**:
- `athletes` - Athlete profiles
- `athlete_stats` - Daily statistics
- `leaderboards` - Leaderboard configurations
- `leaderboard_entries` - Ranking entries  
- `matches` - Match scheduling
- `match_scores` - Set scores
- `event_participants` - Event registrations

**Check the migration includes**:
- All columns with correct types
- Indexes for performance
- Foreign key constraints
- Enum types

## Step 3: Run Migration

```bash
# Run the migration
npm run typeorm migration:run

# Verify it ran successfully
npm run typeorm migration:show
```

## Step 4: Verify Tables

Connect to your database and verify:

```sql
-- Check tables exist
\dt athletes
\dt athlete_stats
\dt leaderboards
\dt leaderboard_entries
\dt matches
\dt match_scores
\dt event_participants

-- Verify indexes
\di athletes_*
\di leaderboard_entries_*
\di matches_*

-- Check foreign keys
\d+ athletes
\d+ leaderboard_entries
```

## Step 5: Seed Initial Data (Optional)

You can create some test data:

```sql
-- Example: Create a leaderboard
INSERT INTO leaderboards (id, name, type, sport_type, start_date, is_active, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Overall Pickleball Rankings 2024',
  'OVERALL',
  'PICKLEBALL',
  '2024-01-01',
  true,
  NOW(),
  NOW()
);
```

## Step 6: Test API Endpoints

Start the application and test endpoints:

```bash
npm run start:dev
```

Visit Swagger UI: `http://localhost:3000/api`

**Test basic endpoints**:
- `POST /athletes` - Create athlete
- `GET /athletes` - List athletes
- `POST /leaderboards` - Create leaderboard (need admin token)
- `GET /leaderboards` - List leaderboards

## Rollback (if needed)

If something goes wrong:

```bash
# Rollback last migration
npm run typeorm migration:revert

# Check status
npm run typeorm migration:show
```

## Common Issues

### Issue: UUID extension not found
**Solution**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: Enum type already exists
**Solution**:
```sql
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;
DROP TYPE IF EXISTS leaderboard_type CASCADE;
```

### Issue: Foreign key constraint fails
**Solution**: Ensure parent tables exist first. Check migration order.

## Manual Migration Template

If auto-generation doesn't work, use this template:

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAthleteTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create athletes table
    await queryRunner.createTable(
      new Table({
        name: 'athletes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '256',
            isNullable: false,
          },
          {
            name: 'sport_type',
            type: 'enum',
            enum: ['PICKLEBALL', 'BADMINTON'],
            isNullable: false,
          },
          {
            name: 'date_of_birth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'profile_image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'current_rating',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'peak_rating',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'rating_source',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'total_events',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_matches',
            type: 'int',
            default: 0,
          },
          {
            name: 'wins',
            type: 'int',
            default: 0,
          },
          {
            name: 'losses',
            type: 'int',
            default: 0,
          },
          {
            name: 'win_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'achievements',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // 2. Create indexes
    await queryRunner.createIndex(
      'athletes',
      new TableIndex({
        name: 'IDX_ATHLETES_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'athletes',
      new TableIndex({
        name: 'IDX_ATHLETES_SPORT_TYPE',
        columnNames: ['sport_type'],
      }),
    );

    await queryRunner.createIndex(
      'athletes',
      new TableIndex({
        name: 'IDX_ATHLETES_RATING',
        columnNames: ['current_rating'],
      }),
    );

    await queryRunner.createIndex(
      'athletes',
      new TableIndex({
        name: 'IDX_ATHLETES_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'athletes',
      new TableIndex({
        name: 'IDX_ATHLETES_USER_SPORT',
        columnNames: ['user_id', 'sport_type'],
        isUnique: true,
      }),
    );

    // 3. Create foreign key
    await queryRunner.createForeignKey(
      'athletes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Repeat for other tables...
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.dropTable('athletes');
    // ... drop other tables
  }
}
```

## Next Steps

After successful migration:

1. ✅ Test all API endpoints
2. ✅ Verify data integrity
3. ✅ Generate frontend API client
4. ✅ Start frontend implementation

## Support

If you encounter issues:
1. Check migration logs
2. Verify database permissions
3. Review entity definitions
4. Check TypeORM configuration

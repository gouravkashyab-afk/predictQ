# Run Database Migration for Phase 1

## Quick Migration Steps

### Option 1: Using psql (Recommended)

1. **Open Terminal**

2. **Connect to your Neon database**:
```bash
psql "postgresql://neondb_owner:npg_4XCeRqZ8Hpgk@ep-fragrant-surf-apwrn83w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

3. **Run the migration**:
```sql
ALTER TABLE signals ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb NOT NULL;
```

4. **Verify**:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'signals';
```

You should see `metadata | jsonb` in the results.

5. **Exit**:
```sql
\q
```

### Option 2: Using Neon Console

1. Go to: https://console.neon.tech
2. Select your project
3. Go to **SQL Editor**
4. Paste and run:
```sql
ALTER TABLE signals ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb NOT NULL;
```

### Option 3: Using the SQL file

```bash
psql $DATABASE_URL -f add_signals_metadata.sql
```

## After Migration

1. **Test locally**:
```bash
npm run dev
```

2. **Go to**: http://localhost:3000/app/signals

3. **Check**: New signals should show EV, Edge, Sentiment

4. **Deploy to Vercel**: Changes will auto-deploy from GitHub

## Rollback (if needed)

If something goes wrong:
```sql
ALTER TABLE signals DROP COLUMN IF EXISTS metadata;
```

## Verification

After migration, signals should have this structure:
```json
{
  "id": "...",
  "question": "Will X happen?",
  "direction": "YES",
  "confidence": 75,
  "metadata": {
    "expectedValue": 22.2,
    "edgePercentage": 15.0,
    "sentiment": "bullish",
    "technicalSignal": "strong_buy"
  }
}
```

## Troubleshooting

### "relation signals does not exist"
- Make sure you're connected to the correct database
- Run: `\dt` to list tables
- If signals table doesn't exist, run the full schema migration first

### "permission denied"
- Make sure you're using the connection string with write permissions
- Use the "pooled" connection string from Neon dashboard

### "column metadata already exists"
- Migration already ran! You're good to go
- Just verify with: `\d signals`

## Done!

Once migration completes:
- ✅ Signals will have enhanced data
- ✅ Agents will use EV-based trading
- ✅ UI will show EV, edge, sentiment
- ✅ Ready for Phase 2!

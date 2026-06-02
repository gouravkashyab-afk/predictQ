# Polymarket Integration Fixes

## Issues Fixed

### 1. ✅ **Markets Showing 0.00% Prices**

**Problem**: All markets were displaying 0.00% for both YES and NO prices.

**Root Cause**: The `outcomePrices` field from the Polymarket Gamma API is a JSON string like `"[\"0.551\", \"0.49\"]"`, but the code was trying to split it by comma instead of parsing it as JSON.

**Fix Applied** (`src/lib/polymarket.ts`):
```typescript
// Before (WRONG)
const prices = raw.outcomePrices?.split(",").map(p => parseFloat(p)) ?? [0.5, 0.5];

// After (CORRECT)
let prices: number[] = [0.5, 0.5];
try {
  if (raw.outcomePrices) {
    const priceStrings: string[] = JSON.parse(raw.outcomePrices);
    prices = priceStrings.map(p => parseFloat(p));
  }
} catch (error) {
  console.warn(`Failed to parse outcomePrices for ${raw.conditionId}:`, error);
  prices = [raw.lastTradePrice ?? 0.5, 1 - (raw.lastTradePrice ?? 0.5)];
}
```

**Also Fixed**: `clobTokenIds` parsing (same JSON array format issue)

---

### 2. ✅ **Search and Category Tabs Not Working**

**Problem**: The markets page showed "No markets found" for all searches and category filters.

**Root Cause**: The `Market` interface was missing the `new` property that the frontend code was trying to filter on.

**Fixes Applied**:

#### A. Updated Market Interface (`src/lib/polymarket.ts`)
```typescript
export interface Market {
  // ... existing fields
  new: boolean;  // ← Added this field
  // ... rest of fields
}
```

#### B. Updated Normalizer (`src/lib/polymarket.ts`)
```typescript
return {
  // ... existing fields
  new: raw.new ?? false,  // ← Added this field
  // ... rest of fields
};
```

#### C. Updated Database Schema (`src/db/schema.ts`)
```typescript
export const markets = pgTable("markets", {
  // ... existing fields
  new: boolean("new").default(false).notNull(),  // ← Added this column
  // ... rest of fields
});
```

#### D. Updated Sync Route (`src/app/api/markets/sync/route.ts`)
```typescript
await db.insert(markets).values({
  // ... existing fields
  new: market.new,  // ← Added this field
  // ... rest of fields
})
.onConflictDoUpdate({
  target: markets.conditionId,
  set: {
    // ... existing fields
    new: sql`excluded.new`,  // ← Added this field
    // ... rest of fields
  },
});
```

---

## Database Migration Required

Run this SQL to add the missing column to your database:

```sql
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "new" boolean DEFAULT false NOT NULL;
```

Or use the provided file:
```bash
psql $DATABASE_URL < add_new_column.sql
```

Or use Drizzle Kit (requires manual confirmation):
```bash
npx drizzle-kit push
```

---

## Testing

After applying these fixes and running the migration:

1. **Restart your dev server**
   ```bash
   npm run dev
   ```

2. **Sync markets from Polymarket**
   ```bash
   curl -X POST http://localhost:3000/api/markets/sync \
     -H "x-sync-secret: YOUR_SECRET"
   ```

3. **Verify markets display correctly**
   - Navigate to `/app/markets`
   - Check that prices show correctly (e.g., 55.1%, 44.9%)
   - Test search functionality
   - Test category tabs (Trending, New, Politics, etc.)

---

## Files Modified

- ✅ `src/lib/polymarket.ts` - Fixed price parsing and added `new` field
- ✅ `src/db/schema.ts` - Added `new` column to markets table
- ✅ `src/app/api/markets/sync/route.ts` - Added `new` field to sync
- ✅ `add_new_column.sql` - Migration script for database

---

## Summary

Both issues were related to the Polymarket API integration:

1. **Price parsing** - JSON strings need `JSON.parse()`, not `.split(",")`
2. **Missing field** - The `new` boolean field was missing from the data model

Markets should now display correct prices and all filtering/search functionality should work properly.

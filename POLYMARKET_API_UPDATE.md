# Polymarket API Integration Update

## Summary

Updated the Polymarket API integration to use the official **Gamma API** (`https://gamma-api.polymarket.com`) based on the [official documentation](https://docs.polymarket.com/api-reference/markets/list-markets).

## Changes Made

### 1. **API Endpoint Migration**
- **Before**: Used CLOB API (`https://clob.polymarket.com/markets`)
- **After**: Using Gamma API (`https://gamma-api.polymarket.com/markets`)

### 2. **Response Structure Update** (`src/lib/polymarket.ts`)

#### Old Structure (CLOB API)
```typescript
interface PolyMarketListResponse {
  limit: number;
  count: number;
  next_cursor: string;
  data: PolyMarket[];
}
```

#### New Structure (Gamma API)
```typescript
type PolyMarketListResponse = PolyMarket[];  // Direct array response
```

#### Updated PolyMarket Interface
The `PolyMarket` interface now matches the Gamma API response with fields like:
- `id`, `conditionId`, `slug`, `question`
- `volumeNum`, `liquidityNum`, `volume24hr`
- `outcomePrices` (JSON string), `outcomes` (JSON string)
- `clobTokenIds` (JSON string for token IDs)
- `bestBid`, `bestAsk`, `lastTradePrice`
- `tags` (array of objects with `id`, `label`, `slug`)

### 3. **Pagination Changes**
- **Before**: Cursor-based pagination (`next_cursor`)
- **After**: Offset-based pagination (`offset`, `limit`)

### 4. **Query Parameters Update**

#### Before (CLOB API)
```typescript
{
  next_cursor?: string;
  active?: boolean;
  tag?: string;
  order?: string;
}
```

#### After (Gamma API)
```typescript
{
  offset?: number;
  limit?: number;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  tag_id?: number;
}
```

### 5. **Normalizer Function Update**
Updated `normalizeMarket()` to:
- Parse `outcomes` and `outcomePrices` from JSON strings
- Parse `clobTokenIds` from JSON string
- Extract token IDs for YES/NO outcomes
- Handle new field names (`volumeNum`, `liquidityNum`, `endDateIso`)

## Files Updated

### Core Library
- ✅ `src/lib/polymarket.ts` - Main API client and types

### API Routes
- ✅ `src/app/api/markets/route.ts` - List markets endpoint
- ✅ `src/app/api/markets/sync/route.ts` - Market sync endpoint
- ✅ `src/app/api/markets/[id]/route.ts` - Single market endpoint
- ✅ `src/app/api/news/route.ts` - News with market matching
- ✅ `src/app/api/news/sync/route.ts` - News sync endpoint

### Business Logic
- ✅ `src/lib/signals.ts` - AI signals generator
- ✅ `src/lib/agent-executor.ts` - Trading agent executor

## API Usage Examples

### Fetch Markets
```typescript
// Old
const response = await fetchMarkets({
  limit: 50,
  active: true,
  closed: false,
  order: "volume",
  next_cursor: cursor,
});
const markets = normalizeMarkets(response.data);

// New
const response = await fetchMarkets({
  limit: 50,
  offset: 0,
  closed: false,
  order: "volumeNum",
});
const markets = normalizeMarkets(response);
```

### Pagination
```typescript
// Old - Cursor-based
let cursor = undefined;
while (cursor !== "LTE=") {
  const response = await fetchMarkets({ next_cursor: cursor });
  cursor = response.next_cursor;
}

// New - Offset-based
for (let page = 0; page < maxPages; page++) {
  const offset = page * limit;
  const response = await fetchMarkets({ offset, limit });
  if (response.length < limit) break;
}
```

## Testing Recommendations

1. **Test Market Sync**
   ```bash
   curl -X POST http://localhost:3000/api/markets/sync \
     -H "x-sync-secret: YOUR_SECRET"
   ```

2. **Test Market Listing**
   ```bash
   curl http://localhost:3000/api/markets?limit=10
   ```

3. **Test Single Market**
   ```bash
   curl http://localhost:3000/api/markets/[CONDITION_ID]
   ```

4. **Test Signal Generation**
   ```bash
   curl http://localhost:3000/api/signals/generate
   ```

## Breaking Changes

### For Frontend/API Consumers

1. **Pagination Response**
   - Old: `{ markets, nextCursor, count, limit }`
   - New: `{ markets, offset, limit, count, hasMore }`

2. **Query Parameters**
   - Removed: `cursor`, `active`, `tag`
   - Added: `offset`, `tag_id`
   - Changed: `closed` now defaults to `false`

3. **Market Data Structure**
   - Token IDs now parsed from `clobTokenIds` JSON string
   - Prices parsed from `outcomePrices` JSON string
   - Tags now array of objects instead of strings

## Validation

All TypeScript diagnostics passed:
- ✅ No type errors
- ✅ All imports resolved
- ✅ Function signatures match

## References

- [Polymarket API Documentation](https://docs.polymarket.com/api-reference/markets/list-markets)
- [Gamma API Base URL](https://gamma-api.polymarket.com)
- [CLOB API](https://clob.polymarket.com) - Still used for orderbook and price history

## Notes

- The CLOB API is still used for `fetchOrderbook()` and `fetchPriceHistory()` as these endpoints are not available in the Gamma API
- All market data fetching now uses the Gamma API for consistency with official documentation
- The normalizer handles JSON parsing for fields that come as stringified JSON

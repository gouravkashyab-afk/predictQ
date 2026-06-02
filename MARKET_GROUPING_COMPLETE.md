# Market Grouping Implementation - Analysis Complete

## Summary
After investigating Polymarket's actual implementation, I discovered that their grouping works differently than initially understood.

## How Polymarket Actually Works

Polymarket groups markets by **EVENTS**, not by `groupItemTitle`:

1. **Event**: "World Cup Winner" (the main card)
   - Market 1: "Will France win?" (`groupItemTitle`: "France")
   - Market 2: "Will Spain win?" (`groupItemTitle`: "Spain")
   - Market 3: "Will Uzbekistan win?" (`groupItemTitle`: "Uzbekistan")
   - Shows top 2 outcomes on the card

2. **Event**: "Democratic Presidential Nominee 2028"
   - Market 1: "Will Gavin Newsom win?" (`groupItemTitle`: "Gavin Newsom")
   - Market 2: "Will AOC win?" (`groupItemTitle`: "Alexandria Ocasio-Cortez")
   - Shows top 2 outcomes on the card

## The Problem

- `groupItemTitle` stores the **candidate/team name** (e.g., "France", "Gavin Newsom")
- `groupItemTitle` is NOT the event name
- Polymarket uses a separate `events` array in their API that contains event metadata
- Our database doesn't store event data - only individual markets

## What We Have vs What We Need

### What We Have:
- ✅ Database columns: `groupItemTitle` and `groupItemThreshold`
- ✅ Synced 200 markets with grouping data
- ✅ `groupMarkets()` function that groups by `groupItemTitle`
- ✅ `CobotMarketCard` component with expand/collapse functionality

### What We Need:
- ❌ Event data (event ID, event title, event slug)
- ❌ Ability to group markets by event, not by candidate name
- ❌ Logic to show top 2-3 markets per event

## Solution Options

### Option 1: Store Event Data (Recommended)
Add event fields to the database:
- `eventId` - The event ID from Polymarket
- `eventTitle` - The event name (e.g., "World Cup Winner")
- `eventSlug` - The event slug

Then group markets by `eventTitle` instead of `groupItemTitle`.

### Option 2: Use Question Similarity (Workaround)
Group markets that have similar questions (e.g., all questions containing "2026 FIFA World Cup").
This is less accurate but doesn't require schema changes.

### Option 3: Keep Current Implementation
The current implementation groups markets by `groupItemTitle`, which means:
- Markets with the same candidate name are grouped together
- This is NOT how Polymarket works
- But it still provides some grouping functionality

## Current Status

✅ **Database**: Columns added and migrated
✅ **Sync Route**: Saves grouping data
✅ **API Route**: Returns markets from database with grouping fields
✅ **Frontend**: Has grouping logic and UI components
❌ **Grouping Logic**: Groups by wrong field (`groupItemTitle` instead of event)

## Recommendation

To properly replicate Polymarket's grouping, we need to:
1. Add `eventId`, `eventTitle`, `eventSlug` columns to the database
2. Update sync route to extract and save event data from the API
3. Update `groupMarkets()` to group by `eventTitle`
4. Show top 2-3 markets per event based on price

This requires additional database migration and code changes.

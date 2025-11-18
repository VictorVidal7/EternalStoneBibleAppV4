# NKJV Version Integration

This document explains the NKJV (New King James Version) integration in the Eternal Stone Bible App.

## What Was Added

The app now supports the **New King James Version (NKJV)** as an additional Bible translation alongside the existing RVR1960, NTV, and NLT versions.

## Current Implementation

### Sample Data
The current implementation includes **sample NKJV data** with popular verses for testing and demonstration purposes:

- **John 1:1-5, 3:16-17** - Famous New Testament passages
- **Genesis 1:1-3** - Creation account
- **Psalm 23** - Complete chapter
- **Matthew 6:9-13** - The Lord's Prayer
- **Other popular verses** - Romans 8:28, Philippians 4:13, Proverbs 3:5-6, etc.

This sample data (27 verses) is sufficient to test the multi-version functionality of the app.

## How to Get Full NKJV Text

### Option 1: Use the Fetch Script (Recommended)
When you have internet connectivity, run:

```bash
node scripts/fetch-nkjv-data.js
```

This script will attempt to download the complete NKJV text from a public API source.

**Note:** The script requires internet connection and may take several minutes to complete.

### Option 2: Manual Integration
If you have access to NKJV text data through proper licensing:

1. Format your data to match this structure:
```javascript
{
  book_id: number,      // 1-66 (Genesis=1, Revelation=66)
  book_name: string,    // English book name
  chapter: number,      // Chapter number
  verse: number,        // Verse number
  text: string,         // Verse text
  version: "NKJV"      // Version identifier
}
```

2. Replace the contents of `src/lib/database/bible-data-nkjv.ts` with your data

3. Reset the app data to reload:
```javascript
// In your app, call
await resetBibleData();
```

## Files Modified

1. **src/hooks/useBibleVersion.tsx** - Added NKJV to available versions list
2. **src/constants/bible.ts** - Added NKJV to Bible versions constant
3. **src/lib/database/data-loader.ts** - Updated to load multiple versions (RVR1960 + NKJV)
4. **src/lib/database/bible-data-nkjv.ts** - New file with NKJV data (currently sample only)

## Scripts Added

1. **scripts/fetch-nkjv-data.js** - Downloads NKJV from public API (requires internet)
2. **scripts/generate-nkjv-sample.js** - Generates sample NKJV data for testing

## How Users Can Switch Versions

Users can now:
1. Open the app settings
2. Navigate to Bible Version settings
3. Select "New King James Version (NKJV)"
4. The app will display Bible content in NKJV

## Copyright Notice

⚠️ **IMPORTANT:** The NKJV is copyrighted by Thomas Nelson Publishers.

- The sample data included is for testing and demonstration purposes
- For production use, proper licensing must be obtained from Thomas Nelson
- Public domain alternatives include KJV, ASV, and WEB translations

## Technical Details

### Database Structure
- All Bible versions share the same SQLite database
- Verses are differentiated by the `version` field
- The app loads multiple versions on first launch
- Each version has its own AsyncStorage flag to track load status

### Data Loading
- **RVR1960**: ~31,102 verses (7.7 MB)
- **NKJV**: ~31,102 verses when complete (currently 27 sample verses)
- Loading is done in chunks of 1000 verses for optimal performance
- Progress is reported during the initial data load

## Testing

To test the NKJV integration:

1. Reset the app data (if previously installed)
2. Launch the app - it will load both RVR1960 and NKJV data
3. Navigate to Bible version settings
4. Switch to NKJV
5. Open any of the sample chapters/verses listed above
6. Verify the text displays correctly in NKJV

## Next Steps

If you need the complete NKJV Bible:

1. Run `node scripts/fetch-nkjv-data.js` with internet access, OR
2. Obtain proper licensing and data from Thomas Nelson, OR
3. Consider using public domain translations (KJV, WEB, ASV)

---

**Integration Date:** November 18, 2025
**Version:** 1.0.0
**Status:** ✅ Sample data integrated, ready for full text

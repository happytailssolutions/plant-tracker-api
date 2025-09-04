# Data Cleanup Script

This script provides a safe way to clean all user data from your Plant Tracker application while preserving the database schema.

## ⚠️ WARNING

**This script will permanently delete ALL user data including:**
- All users
- All projects
- All pins (plants)
- All reminders
- All uploaded images

**The database schema will be preserved, but all data will be lost.**

## Prerequisites

1. **Environment Variables**: Make sure you have the following environment variables set:
   - `DATABASE_URL` or `DIRECT_URL` - Your PostgreSQL database connection string
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

2. **Dependencies**: Install the required dependencies:
   ```bash
   npm install
   ```

## Usage

### Option 1: Using npm script (Recommended)
```bash
npm run cleanup:all
```

### Option 2: Direct execution
```bash
node cleanup-all-data.js
```

## What the script does

1. **Database Cleanup** (in transaction):
   - Deletes all plant reminders
   - Deletes all pins
   - Deletes all project-user relationships
   - Deletes all projects
   - Deletes all users

2. **Image Cleanup**:
   - Lists all files in the Supabase `images` bucket
   - Deletes all uploaded images

3. **Verification**:
   - Checks that all tables are empty
   - Reports any remaining records

## Safety Features

- **Confirmation Prompt**: The script asks for explicit confirmation before proceeding
- **Database Transaction**: All database operations are wrapped in a transaction that can be rolled back on error
- **Error Handling**: Comprehensive error handling with rollback on failure
- **Verification**: Post-cleanup verification to ensure all data was removed

## Recovery

If you need to recover data after running this script:

1. **Database**: You would need to restore from a backup
2. **Images**: You would need to restore from a Supabase backup or external storage backup

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` or `DIRECT_URL` environment variable
- Ensure your database is accessible from your current network

### Supabase Issues
- Verify your Supabase credentials
- Ensure the `images` bucket exists in your Supabase project
- Check that your Supabase project has proper permissions

### Permission Issues
- Ensure your database user has DELETE permissions on all tables
- Ensure your Supabase service role has storage permissions

## Example Output

```
🚀 Plant Tracker Data Cleanup Script
=====================================

⚠️  WARNING: This script will delete ALL user data!
   - All users
   - All projects
   - All pins
   - All reminders
   - All uploaded images

📋 The database schema will be preserved.

Are you sure you want to proceed? Type "YES" to continue: YES

🧹 Starting comprehensive data cleanup...
✅ Connected to database
🔄 Started database transaction
📝 Step 1: Deleting all plant reminders...
   Deleted 15 reminders
📍 Step 2: Deleting all pins...
   Deleted 42 pins
👥 Step 3: Deleting all project-user relationships...
   Deleted 8 project-user relationships
🏗️ Step 4: Deleting all projects...
   Deleted 5 projects
👤 Step 5: Deleting all users...
   Deleted 3 users
✅ Database cleanup completed successfully
🖼️ Step 6: Cleaning up uploaded images from Supabase Storage...
   🔍 Checking Supabase configuration...
   📁 Listing all files in images bucket...
   📸 Found 23 files to delete
   ✅ Successfully deleted 23 images
🎉 All data cleanup completed successfully!
📊 Summary:
   - Reminders deleted: 15
   - Pins deleted: 42
   - Project-user relationships deleted: 8
   - Projects deleted: 5
   - Users deleted: 3

🔍 Verifying cleanup...
   users: 0 records remaining
   projects: 0 records remaining
   project_users: 0 records remaining
   pins: 0 records remaining
   plant_reminders: 0 records remaining

🎉 Cleanup completed successfully!
```

## Support

If you encounter any issues with this script, please check:
1. Your environment variables are correctly set
2. Your database and Supabase connections are working
3. You have the necessary permissions

For additional help, refer to the main project documentation or create an issue in the project repository.



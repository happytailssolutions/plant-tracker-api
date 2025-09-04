const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Database connection
const dbClient = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Supabase client for image cleanup
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupAllData() {
  console.log('🧹 Starting comprehensive data cleanup...');
  
  try {
    // Connect to database
    await dbClient.connect();
    console.log('✅ Connected to database');

    // Start transaction
    await dbClient.query('BEGIN');
    console.log('🔄 Started database transaction');

    // Step 1: Delete all plant reminders (these reference pins)
    console.log('📝 Step 1: Deleting all plant reminders...');
    const remindersResult = await dbClient.query('DELETE FROM plant_reminders');
    console.log(`   Deleted ${remindersResult.rowCount} reminders`);

    // Step 2: Delete all pins (these reference projects and users)
    console.log('📍 Step 2: Deleting all pins...');
    const pinsResult = await dbClient.query('DELETE FROM pins');
    console.log(`   Deleted ${pinsResult.rowCount} pins`);

    // Step 3: Delete all project_user relationships
    console.log('👥 Step 3: Deleting all project-user relationships...');
    const projectUsersResult = await dbClient.query('DELETE FROM project_users');
    console.log(`   Deleted ${projectUsersResult.rowCount} project-user relationships`);

    // Step 4: Delete all projects
    console.log('🏗️ Step 4: Deleting all projects...');
    const projectsResult = await dbClient.query('DELETE FROM projects');
    console.log(`   Deleted ${projectsResult.rowCount} projects`);

    // Step 5: Delete all users (except system users if any)
    console.log('👤 Step 5: Deleting all users...');
    const usersResult = await dbClient.query('DELETE FROM users');
    console.log(`   Deleted ${usersResult.rowCount} users`);

    // Commit transaction
    await dbClient.query('COMMIT');
    console.log('✅ Database cleanup completed successfully');

    // Step 6: Clean up uploaded images from Supabase Storage
    console.log('🖼️ Step 6: Cleaning up uploaded images from Supabase Storage...');
    await cleanupSupabaseImages();

    console.log('🎉 All data cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Reminders deleted: ${remindersResult.rowCount}`);
    console.log(`   - Pins deleted: ${pinsResult.rowCount}`);
    console.log(`   - Project-user relationships deleted: ${projectUsersResult.rowCount}`);
    console.log(`   - Projects deleted: ${projectsResult.rowCount}`);
    console.log(`   - Users deleted: ${usersResult.rowCount}`);

  } catch (error) {
    // Rollback transaction on error
    try {
      await dbClient.query('ROLLBACK');
      console.log('🔄 Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('❌ Failed to rollback transaction:', rollbackError);
    }
    
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await dbClient.end();
    console.log('🔌 Database connection closed');
  }
}

async function cleanupSupabaseImages() {
  try {
    console.log('   🔍 Checking Supabase configuration...');
    
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('   ⚠️ Supabase credentials not found, skipping image cleanup');
      return;
    }

    // List all files in the images bucket
    console.log('   📁 Listing all files in images bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list('', { limit: 1000 });

    if (listError) {
      console.log(`   ⚠️ Could not list files: ${listError.message}`);
      return;
    }

    if (!files || files.length === 0) {
      console.log('   ✅ No images found to delete');
      return;
    }

    console.log(`   📸 Found ${files.length} files to delete`);

    // Delete all files
    const filePaths = files.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove(filePaths);

    if (deleteError) {
      console.log(`   ⚠️ Error deleting some files: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Successfully deleted ${filePaths.length} images`);
    }

  } catch (error) {
    console.log(`   ⚠️ Image cleanup error: ${error.message}`);
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...');
  
  try {
    await dbClient.connect();
    
    const tables = ['users', 'projects', 'project_users', 'pins', 'plant_reminders'];
    
    for (const table of tables) {
      const result = await dbClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`   ${table}: ${count} records remaining`);
      
      if (count > 0) {
        console.log(`   ⚠️ Warning: ${count} records still exist in ${table}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await dbClient.end();
  }
}

// Main execution
async function main() {
  console.log('🚀 Plant Tracker Data Cleanup Script');
  console.log('=====================================');
  console.log('');
  console.log('⚠️  WARNING: This script will delete ALL user data!');
  console.log('   - All users');
  console.log('   - All projects');
  console.log('   - All pins');
  console.log('   - All reminders');
  console.log('   - All uploaded images');
  console.log('');
  console.log('📋 The database schema will be preserved.');
  console.log('');

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? Type "YES" to continue: ', resolve);
  });
  
  rl.close();

  if (answer !== 'YES') {
    console.log('❌ Operation cancelled by user');
    process.exit(0);
  }

  try {
    await cleanupAllData();
    await verifyCleanup();
    console.log('\n🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanupAllData, verifyCleanup };

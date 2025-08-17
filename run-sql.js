const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runSQL() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the SQL file
    const sql = fs.readFileSync('./create-reminders-table.sql', 'utf8');
    
    // Execute the SQL
    console.log('Executing SQL...');
    await client.query(sql);
    
    console.log('✅ plant_reminders table created successfully!');

    // Verify the table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plant_reminders'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table verification successful');
    } else {
      console.log('❌ Table verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runSQL();

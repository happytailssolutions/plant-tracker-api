const fs = require('fs');
const path = require('path');

// Check if schema.gql exists and contains Reminder type
const schemaPath = path.join(__dirname, 'dist', 'schema.gql');

console.log('🔍 Checking GraphQL schema generation...');
console.log(`Schema path: ${schemaPath}`);

if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('✅ Schema file exists');
  console.log(`📏 Schema size: ${schemaContent.length} characters`);
  
  // Check for Reminder type
  if (schemaContent.includes('type Reminder')) {
    console.log('✅ Reminder type found in schema');
    
    // Find the Reminder type definition
    const reminderTypeMatch = schemaContent.match(/type Reminder\s*\{[\s\S]*?\}/);
    if (reminderTypeMatch) {
      console.log('📋 Reminder type definition:');
      console.log(reminderTypeMatch[0]);
    }
  } else {
    console.log('❌ Reminder type NOT found in schema');
  }
  
  // Check for remindersByPlant query
  if (schemaContent.includes('remindersByPlant')) {
    console.log('✅ remindersByPlant query found in schema');
  } else {
    console.log('❌ remindersByPlant query NOT found in schema');
  }
  
  // Check for NotificationType enum
  if (schemaContent.includes('enum NotificationType')) {
    console.log('✅ NotificationType enum found in schema');
  } else {
    console.log('❌ NotificationType enum NOT found in schema');
  }
  
  // Check for ReminderStatus enum
  if (schemaContent.includes('enum ReminderStatus')) {
    console.log('✅ ReminderStatus enum found in schema');
  } else {
    console.log('❌ ReminderStatus enum NOT found in schema');
  }
  
  // Check for RecurringPattern enum
  if (schemaContent.includes('enum RecurringPattern')) {
    console.log('✅ RecurringPattern enum found in schema');
  } else {
    console.log('❌ RecurringPattern enum NOT found in schema');
  }
  
  // Check for Pin type with reminders field
  if (schemaContent.includes('type Pin')) {
    console.log('✅ Pin type found in schema');
    if (schemaContent.includes('reminders: [Reminder]')) {
      console.log('✅ Pin.reminders field found in schema');
    } else {
      console.log('❌ Pin.reminders field NOT found in schema');
    }
  } else {
    console.log('❌ Pin type NOT found in schema');
  }
  
  // Show all types in schema
  const typeMatches = schemaContent.match(/type\s+(\w+)\s*\{/g);
  if (typeMatches) {
    console.log('\n📋 All types found in schema:');
    typeMatches.forEach(match => {
      const typeName = match.match(/type\s+(\w+)/)[1];
      console.log(`  - ${typeName}`);
    });
  }
  
  // Show all queries
  const queryMatches = schemaContent.match(/remindersByPlant|activeRemindersForUser|overdueRemindersForUser/g);
  if (queryMatches) {
    console.log('\n📋 Reminder queries found:');
    [...new Set(queryMatches)].forEach(query => {
      console.log(`  - ${query}`);
    });
  } else {
    console.log('\n❌ No reminder queries found in schema');
  }
  
} else {
  console.log('❌ Schema file does not exist');
  console.log('💡 Make sure to build the project first: npm run build');
  console.log('💡 Check if the dist/ directory exists');
  
  // Check if dist directory exists
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ dist/ directory exists');
    const distContents = fs.readdirSync(distPath);
    console.log('📁 Contents of dist/:', distContents);
  } else {
    console.log('❌ dist/ directory does not exist');
  }
}

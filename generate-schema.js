const { buildSchema } = require('@nestjs/graphql');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const fs = require('fs');
const path = require('path');

async function generateSchema() {
  console.log('🔍 Starting GraphQL schema generation...');
  
  try {
    // Create a minimal app instance to generate schema
    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable logging for schema generation
    });
    
    // Get the GraphQL schema
    const schema = app.get('GRAPHQL_SCHEMA');
    
    if (schema) {
      console.log('✅ GraphQL schema generated successfully');
      
      // Ensure dist directory exists
      const distPath = path.join(__dirname, 'dist');
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      
      // Write schema to file
      const schemaPath = path.join(distPath, 'schema.gql');
      fs.writeFileSync(schemaPath, schema);
      
      console.log(`📝 Schema written to: ${schemaPath}`);
      console.log(`📏 Schema size: ${schema.length} characters`);
      
      // Verify the file was created
      if (fs.existsSync(schemaPath)) {
        console.log('✅ Schema file verified');
        
        // Check for Reminder type
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        if (schemaContent.includes('type Reminder')) {
          console.log('✅ Reminder type found in generated schema');
        } else {
          console.log('❌ Reminder type NOT found in generated schema');
        }
      } else {
        console.log('❌ Schema file was not created');
      }
    } else {
      console.log('❌ No GraphQL schema found');
    }
    
    await app.close();
  } catch (error) {
    console.error('❌ Error generating schema:', error.message);
    console.error(error.stack);
  }
}

generateSchema();

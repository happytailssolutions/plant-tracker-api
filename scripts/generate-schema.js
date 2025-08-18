const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const fs = require('fs');
const path = require('path');

async function generateSchema() {
  console.log('🔍 Starting GraphQL schema generation...');
  
  try {
    // Create a minimal app instance
    const app = await NestFactory.create(AppModule, {
      logger: false,
    });
    
    // Wait a bit for modules to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the GraphQL schema from the app
    const graphqlModule = app.get('GraphQLModule');
    console.log('✅ GraphQL module loaded');
    
    // Try to get the schema
    let schema = null;
    try {
      // Access the schema through the GraphQL module
      const apolloDriver = app.get('ApolloDriver');
      if (apolloDriver) {
        const server = apolloDriver.getHttpServer();
        if (server) {
          schema = server.schema;
        }
      }
    } catch (e) {
      console.log('⚠️ Could not get schema from Apollo driver, trying alternative method');
    }
    
    if (!schema) {
      // Alternative: try to get from the module itself
      try {
        schema = graphqlModule.schema;
      } catch (e) {
        console.log('⚠️ Could not get schema from GraphQL module');
      }
    }
    
    if (schema) {
      console.log('✅ GraphQL schema retrieved successfully');
      
      // Convert schema to SDL (Schema Definition Language)
      const sdl = schema.toString();
      
      // Ensure dist directory exists
      const distPath = path.join(__dirname, '..', 'dist');
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      
      // Write schema to file
      const schemaPath = path.join(distPath, 'schema.gql');
      fs.writeFileSync(schemaPath, sdl);
      
      console.log(`📝 Schema written to: ${schemaPath}`);
      console.log(`📏 Schema size: ${sdl.length} characters`);
      
      // Verify the file was created and check content
      if (fs.existsSync(schemaPath)) {
        console.log('✅ Schema file verified');
        
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for key types
        const checks = [
          { name: 'Reminder type', pattern: 'type Reminder' },
          { name: 'Pin type', pattern: 'type Pin' },
          { name: 'remindersByPlant query', pattern: 'remindersByPlant' },
          { name: 'NotificationType enum', pattern: 'enum NotificationType' },
        ];
        
        checks.forEach(check => {
          if (schemaContent.includes(check.pattern)) {
            console.log(`✅ ${check.name} found`);
          } else {
            console.log(`❌ ${check.name} NOT found`);
          }
        });
        
        // Show first few lines
        console.log('\n📋 First 20 lines of schema:');
        console.log(schemaContent.split('\n').slice(0, 20).join('\n'));
        
      } else {
        console.log('❌ Schema file was not created');
      }
    } else {
      console.log('❌ Could not retrieve GraphQL schema');
      console.log('💡 This might indicate an issue with entity loading or module configuration');
    }
    
    await app.close();
  } catch (error) {
    console.error('❌ Error generating schema:', error.message);
    console.error(error.stack);
  }
}

generateSchema();

const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const locationsPath = path.join(process.cwd(), 'public', 'locations.json');
const regionsPath = path.join(process.cwd(), 'public', 'regions.json');

// Default value for labelCollisionStrategy
const DEFAULT_COLLISION_STRATEGY = 'None';

function migrateFile(filePath, fileName) {
  try {
    console.log(`🔍 Migrating ${fileName}...`);
    
    // Read the file
    const data = fs.readFileSync(filePath, 'utf-8');
    const elements = JSON.parse(data);
    
    let migratedCount = 0;
    
    // Add labelCollisionStrategy to each element if it doesn't exist
    const migratedElements = elements.map(element => {
      if (!element.hasOwnProperty('labelCollisionStrategy')) {
        element.labelCollisionStrategy = DEFAULT_COLLISION_STRATEGY;
        migratedCount++;
      }
      return element;
    });
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(migratedElements, null, 2), 'utf-8');
    
    console.log(`✅ Migrated ${migratedCount} elements in ${fileName}`);
    return migratedCount;
  } catch (error) {
    console.error(`❌ Error migrating ${fileName}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🚀 Starting label collision strategy migration...\n');
  
  // Migrate locations
  const locationsMigrated = migrateFile(locationsPath, 'locations.json');
  
  // Migrate regions
  const regionsMigrated = migrateFile(regionsPath, 'regions.json');
  
  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Locations migrated: ${locationsMigrated}`);
  console.log(`   - Regions migrated: ${regionsMigrated}`);
  console.log(`   - Total elements migrated: ${locationsMigrated + regionsMigrated}`);
  console.log(`\n✨ All existing elements now have labelCollisionStrategy set to 'None'`);
}

// Run the migration
main(); 
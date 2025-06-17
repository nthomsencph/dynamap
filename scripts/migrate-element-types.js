#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const locationsPath = path.join(__dirname, '../public/locations.json');
const regionsPath = path.join(__dirname, '../public/regions.json');

// Backup paths
const locationsBackupPath = path.join(__dirname, '../public/locations.json.backup');
const regionsBackupPath = path.join(__dirname, '../public/regions.json.backup');

function backupFile(sourcePath, backupPath) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`✅ Backed up ${path.basename(sourcePath)} to ${path.basename(backupPath)}`);
  } else {
    console.log(`⚠️  File not found: ${sourcePath}`);
  }
}

function migrateLocations() {
  console.log('\n🔄 Migrating locations...');
  
  if (!fs.existsSync(locationsPath)) {
    console.log('⚠️  Locations file not found, skipping...');
    return;
  }

  try {
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
    let updatedCount = 0;

    const migratedLocations = locations.map(location => {
      if (!location.elementType) {
        updatedCount++;
        return {
          ...location,
          elementType: 'location'
        };
      }
      return location;
    });

    fs.writeFileSync(locationsPath, JSON.stringify(migratedLocations, null, 2));
    console.log(`✅ Updated ${updatedCount} locations with elementType: 'location'`);
    
  } catch (error) {
    console.error('❌ Error migrating locations:', error.message);
  }
}

function migrateRegions() {
  console.log('\n🔄 Migrating regions...');
  
  if (!fs.existsSync(regionsPath)) {
    console.log('⚠️  Regions file not found, skipping...');
    return;
  }

  try {
    const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
    let updatedCount = 0;

    const migratedRegions = regions.map(region => {
      if (!region.elementType) {
        updatedCount++;
        return {
          ...region,
          elementType: 'region'
        };
      }
      return region;
    });

    fs.writeFileSync(regionsPath, JSON.stringify(migratedRegions, null, 2));
    console.log(`✅ Updated ${updatedCount} regions with elementType: 'region'`);
    
  } catch (error) {
    console.error('❌ Error migrating regions:', error.message);
  }
}

function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  let validationErrors = 0;

  // Validate locations
  if (fs.existsSync(locationsPath)) {
    try {
      const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
      locations.forEach((location, index) => {
        if (!location.elementType) {
          console.error(`❌ Location at index ${index} (${location.name || 'unnamed'}) missing elementType`);
          validationErrors++;
        } else if (location.elementType !== 'location') {
          console.error(`❌ Location at index ${index} (${location.name || 'unnamed'}) has wrong elementType: ${location.elementType}`);
          validationErrors++;
        }
      });
      console.log(`✅ Validated ${locations.length} locations`);
    } catch (error) {
      console.error('❌ Error validating locations:', error.message);
      validationErrors++;
    }
  }

  // Validate regions
  if (fs.existsSync(regionsPath)) {
    try {
      const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
      regions.forEach((region, index) => {
        if (!region.elementType) {
          console.error(`❌ Region at index ${index} (${region.name || 'unnamed'}) missing elementType`);
          validationErrors++;
        } else if (region.elementType !== 'region') {
          console.error(`❌ Region at index ${index} (${region.name || 'unnamed'}) has wrong elementType: ${region.elementType}`);
          validationErrors++;
        }
      });
      console.log(`✅ Validated ${regions.length} regions`);
    } catch (error) {
      console.error('❌ Error validating regions:', error.message);
      validationErrors++;
    }
  }

  if (validationErrors === 0) {
    console.log('🎉 Migration validation successful!');
  } else {
    console.error(`❌ Migration validation failed with ${validationErrors} errors`);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Starting elementType migration...');
  
  // Create backups
  console.log('\n📦 Creating backups...');
  backupFile(locationsPath, locationsBackupPath);
  backupFile(regionsPath, regionsBackupPath);
  
  // Run migrations
  migrateLocations();
  migrateRegions();
  
  // Validate the migration
  validateMigration();
  
  console.log('\n✨ Migration completed successfully!');
  console.log('💡 Backups are available at:');
  console.log(`   - ${locationsBackupPath}`);
  console.log(`   - ${regionsBackupPath}`);
}

// Run the migration
main(); 
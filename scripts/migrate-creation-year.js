const fs = require('fs');
const path = require('path');

const LOCATIONS_FILE = path.join(process.cwd(), 'public', 'locations.json');
const REGIONS_FILE = path.join(process.cwd(), 'public', 'regions.json');
const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

function migrateCreationYear() {
  try {
    console.log('Migrating existing data to include creationYear...');

    // Read timeline data to find creation years
    const timelineData = fs.readFileSync(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);

    // Build a map of element IDs to their creation years
    const creationYears = new Map();

    timeline.entries.forEach(entry => {
      if (entry.changes) {
        // For locations
        if (entry.changes.created && entry.changes.created.locations) {
          entry.changes.created.locations.forEach(id => {
            creationYears.set(id, entry.year);
          });
        }
        // For regions
        if (entry.changes.created && entry.changes.created.regions) {
          entry.changes.created.regions.forEach(id => {
            creationYears.set(id, entry.year);
          });
        }
      }
    });

    // Migrate locations
    if (fs.existsSync(LOCATIONS_FILE)) {
      const locationsData = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
      const locations = JSON.parse(locationsData);
      
      let locationsUpdated = false;
      locations.forEach(location => {
        if (!location.creationYear) {
          // If we have a creation year from timeline, use it
          // Otherwise, default to year 0
          location.creationYear = creationYears.get(location.id) || 0;
          locationsUpdated = true;
        }
      });

      if (locationsUpdated) {
        fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(locations, null, 2));
        console.log('Updated locations with creationYear');
      }
    }

    // Migrate regions
    if (fs.existsSync(REGIONS_FILE)) {
      const regionsData = fs.readFileSync(REGIONS_FILE, 'utf-8');
      const regions = JSON.parse(regionsData);
      
      let regionsUpdated = false;
      regions.forEach(region => {
        if (!region.creationYear) {
          // If we have a creation year from timeline, use it
          // Otherwise, default to year 0
          region.creationYear = creationYears.get(region.id) || 0;
          regionsUpdated = true;
        }
      });

      if (regionsUpdated) {
        fs.writeFileSync(REGIONS_FILE, JSON.stringify(regions, null, 2));
        console.log('Updated regions with creationYear');
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateCreationYear(); 
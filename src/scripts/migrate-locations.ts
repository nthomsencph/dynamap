import { promises as fs } from 'fs';
import path from 'path';
import type { Location } from '@/types/locations';

const locationsPath = path.join(process.cwd(), 'public', 'locations.json');

async function migrateLocations() {
  try {
    // Read current locations
    const data = await fs.readFile(locationsPath, 'utf-8');
    const locations = JSON.parse(data) as Partial<Location>[];

    // Track if any changes were made
    let changesMade = false;

    // Update locations that don't have fields property
    const updatedLocations = locations.map(location => {
      if (!('fields' in location)) {
        const locationName = location.name || 'Unnamed location';
        const locationId = location.id || 'unknown';
        console.log(`Adding fields property to location: ${locationName} (${locationId})`);
        changesMade = true;
        return { ...location, fields: {} } as Location;
      }
      return location as Location;
    });

    // Only write back if changes were made
    if (changesMade) {
      // Create a backup of the original file
      const backupPath = `${locationsPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      await fs.copyFile(locationsPath, backupPath);
      console.log(`Created backup at: ${backupPath}`);

      // Write updated locations
      await fs.writeFile(locationsPath, JSON.stringify(updatedLocations, null, 2), 'utf-8');
      console.log('Successfully migrated locations');
    } else {
      console.log('No locations needed migration');
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('No locations.json file found - nothing to migrate');
    } else {
      console.error('Error during migration:', err);
      process.exit(1);
    }
  }
}

// Run the migration
migrateLocations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 
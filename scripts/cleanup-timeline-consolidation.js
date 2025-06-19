const fs = require('fs');
const path = require('path');

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

function cleanupTimeline() {
  try {
    // Read current timeline
    const timelineData = fs.readFileSync(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);

    console.log('Cleaning up timeline data...');

    // Process each entry
    timeline.entries.forEach(entry => {
      if (entry.changes) {
        // For locations: if created and modified in same year, remove from created list
        entry.changes.created.locations = entry.changes.created.locations.filter(id => {
          const isModified = entry.changes.modified.locations[id];
          if (isModified) {
            console.log(`Consolidating location ${id} in year ${entry.year} - removing from created, keeping modification`);
          }
          return !isModified;
        });

        // For regions: if created and modified in same year, remove from created list
        entry.changes.created.regions = entry.changes.created.regions.filter(id => {
          const isModified = entry.changes.modified.regions[id];
          if (isModified) {
            console.log(`Consolidating region ${id} in year ${entry.year} - removing from created, keeping modification`);
          }
          return !isModified;
        });
      }
    });

    // Save updated timeline
    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
    console.log('Timeline cleanup completed!');
  } catch (error) {
    console.error('Error cleaning up timeline:', error);
  }
}

cleanupTimeline(); 
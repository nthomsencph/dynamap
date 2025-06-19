const fs = require('fs');
const path = require('path');

// Test the timeline changes system
async function testTimelineChanges() {
  console.log('Testing Timeline Changes System...\n');

  // Read current timeline data
  const timelinePath = path.join(process.cwd(), 'public', 'timeline.json');
  const timelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
  
  console.log('Current timeline entries:', timelineData.entries.length);
  timelineData.entries.forEach(entry => {
    console.log(`  Year ${entry.year}: ${entry.changes ? 'Has changes' : 'No changes'}`);
    if (entry.changes) {
      console.log(`    Created: ${entry.changes.created.locations.length} locations, ${entry.changes.created.regions.length} regions`);
      console.log(`    Modified: ${Object.keys(entry.changes.modified.locations).length} locations, ${Object.keys(entry.changes.modified.regions).length} regions`);
      console.log(`    Deleted: ${entry.changes.deleted.locations.length} locations, ${entry.changes.deleted.regions.length} regions`);
    }
  });

  // Read regions data
  const regionsPath = path.join(process.cwd(), 'public', 'regions.json');
  const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf-8'));
  
  console.log('\nCurrent regions:', regionsData.length);
  regionsData.forEach(region => {
    console.log(`  ${region.name} (${region.id})`);
  });

  // Test creating a timeline change
  console.log('\nTesting timeline change creation...');
  
  const testChange = {
    year: 1,
    elementId: regionsData[0].id,
    elementType: 'region',
    changeType: 'updated',
    changes: {
      name: 'Updated Cursed Shores',
      description: '<p>Updated description for year 1</p>'
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/timeline/changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testChange)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Timeline change created successfully:', result);
    } else {
      console.log('❌ Failed to create timeline change:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error creating timeline change:', error.message);
  }

  // Read updated timeline data
  const updatedTimelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
  console.log('\nUpdated timeline entries:', updatedTimelineData.entries.length);
  updatedTimelineData.entries.forEach(entry => {
    console.log(`  Year ${entry.year}: ${entry.changes ? 'Has changes' : 'No changes'}`);
    if (entry.changes) {
      console.log(`    Created: ${entry.changes.created.locations.length} locations, ${entry.changes.created.regions.length} regions`);
      console.log(`    Modified: ${Object.keys(entry.changes.modified.locations).length} locations, ${Object.keys(entry.changes.modified.regions).length} regions`);
      console.log(`    Deleted: ${entry.changes.deleted.locations.length} locations, ${entry.changes.deleted.regions.length} regions`);
    }
  });
}

// Run the test
testTimelineChanges().catch(console.error); 
import type { PoolClient } from 'pg';
import type {
  TimelineData,
  TimelineEntry,
  TimelineEpoch,
  TimelineChange,
  TimelineNote,
  TimelineChanges,
  TimelineLocationModification,
  TimelineRegionModification,
} from '@/types/timeline';
import { createEmptyChanges, isEmptyChanges } from '@/types/timeline';
import crypto from 'crypto';

// Fetch all epochs
export async function getAllEpochs(
  client: PoolClient
): Promise<TimelineEpoch[]> {
  const res = await client.query(
    'SELECT * FROM epochs ORDER BY start_year ASC'
  );
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startYear: row.start_year,
    endYear: row.end_year,
    color: row.color,
    yearPrefix: row.year_prefix,
    yearSuffix: row.year_suffix,
    restartAtZero: row.restart_at_zero,
    showEndDate: row.show_end_date,
    reverseYears: row.reverse_years,
  }));
}

// Create a new epoch
export async function createEpoch(
  client: PoolClient,
  epoch: Omit<TimelineEpoch, 'id'>
): Promise<TimelineEpoch> {
  const id = crypto.randomUUID();
  const res = await client.query(
    `INSERT INTO epochs (id, name, description, start_year, end_year, color, year_prefix, year_suffix, restart_at_zero, show_end_date, reverse_years)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      id,
      epoch.name,
      epoch.description,
      epoch.startYear,
      epoch.endYear,
      epoch.color || '#3B82F6',
      epoch.yearPrefix || null,
      epoch.yearSuffix || null,
      epoch.restartAtZero || false,
      epoch.showEndDate !== undefined ? epoch.showEndDate : true,
      epoch.reverseYears || false,
    ]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startYear: row.start_year,
    endYear: row.end_year,
    color: row.color,
    yearPrefix: row.year_prefix,
    yearSuffix: row.year_suffix,
    restartAtZero: row.restart_at_zero,
    showEndDate: row.show_end_date,
    reverseYears: row.reverse_years,
  };
}

// Update an epoch
export async function updateEpoch(
  client: PoolClient,
  id: string,
  updates: Partial<TimelineEpoch>
): Promise<TimelineEpoch | null> {
  const res = await client.query(
    `UPDATE epochs 
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         start_year = COALESCE($4, start_year),
         end_year = COALESCE($5, end_year),
         color = COALESCE($6, color),
         year_prefix = $7,
         year_suffix = $8,
         restart_at_zero = COALESCE($9, restart_at_zero),
         show_end_date = COALESCE($10, show_end_date),
         reverse_years = COALESCE($11, reverse_years)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      updates.name,
      updates.description,
      updates.startYear,
      updates.endYear,
      updates.color,
      updates.yearPrefix,
      updates.yearSuffix,
      updates.restartAtZero,
      updates.showEndDate,
      updates.reverseYears,
    ]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startYear: row.start_year,
    endYear: row.end_year,
    color: row.color,
    yearPrefix: row.year_prefix,
    yearSuffix: row.year_suffix,
    restartAtZero: row.restart_at_zero,
    showEndDate: row.show_end_date,
    reverseYears: row.reverse_years,
  };
}

// Delete an epoch
export async function deleteEpoch(
  client: PoolClient,
  id: string
): Promise<boolean> {
  const res = await client.query(
    'DELETE FROM epochs WHERE id = $1 RETURNING id',
    [id]
  );
  return res.rows.length > 0;
}

// Fetch all notes for a given year (optional, for TimelineEntry.notes)
export async function getNotesForYear(
  client: PoolClient,
  year: number
): Promise<TimelineNote[]> {
  const res = await client.query(
    'SELECT * FROM notes WHERE year = $1 ORDER BY created_at ASC',
    [year]
  );
  return res.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// Create a new note
export async function createNote(
  client: PoolClient,
  year: number,
  note: Omit<TimelineNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TimelineNote> {
  const id = crypto.randomUUID();
  const res = await client.query(
    `INSERT INTO notes (id, year, title, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [id, year, note.title, note.description]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Update a note
export async function updateNote(
  client: PoolClient,
  id: string,
  updates: Partial<TimelineNote>
): Promise<TimelineNote | null> {
  const res = await client.query(
    `UPDATE notes 
     SET title = COALESCE($2, title),
         content = COALESCE($3, content),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, updates.title, updates.description]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Delete a note
export async function deleteNote(
  client: PoolClient,
  id: string
): Promise<boolean> {
  const res = await client.query(
    'DELETE FROM notes WHERE id = $1 RETURNING id',
    [id]
  );
  return res.rows.length > 0;
}

// Fetch all changes for a given year
export async function getChangesForYear(
  client: PoolClient,
  year: number
): Promise<TimelineChanges> {
  const res = await client.query(
    'SELECT * FROM timeline_changes WHERE year = $1',
    [year]
  );
  const changesArr: TimelineChange[] = res.rows.map(row => ({
    year: row.year,
    elementId: row.element_id,
    elementType: row.element_type,
    changeType: row.change_type,
    changes: row.changes,
  }));
  const changes: TimelineChanges = createEmptyChanges();
  for (const change of changesArr) {
    if (change.changeType === 'updated') {
      if (change.elementType === 'location') {
        changes.modified.locations[change.elementId] =
          change.changes as TimelineLocationModification;
      } else if (change.elementType === 'region') {
        changes.modified.regions[change.elementId] =
          change.changes as TimelineRegionModification;
      }
    } else if (change.changeType === 'deleted') {
      if (change.elementType === 'location') {
        changes.deleted.locations.push(change.elementId);
      } else if (change.elementType === 'region') {
        changes.deleted.regions.push(change.elementId);
      }
    }
  }
  return changes;
}

// Record a timeline change
export async function recordChange(
  client: PoolClient,
  change: TimelineChange
): Promise<void> {
  // First, ensure there's a timeline entry for this year
  await client.query(
    `INSERT INTO timeline_entries (year) 
     VALUES ($1) 
     ON CONFLICT (year) DO NOTHING`,
    [change.year]
  );

  // Then insert the change
  await client.query(
    `INSERT INTO timeline_changes (year, element_id, element_type, change_type, changes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (year, element_id, element_type) 
     DO UPDATE SET change_type = $4, changes = $5`,
    [
      change.year,
      change.elementId,
      change.elementType,
      change.changeType,
      change.changes,
    ]
  );
}

// Delete a timeline change
export async function deleteChange(
  client: PoolClient,
  year: number,
  elementId: string,
  elementType: 'location' | 'region'
): Promise<boolean> {
  const res = await client.query(
    'DELETE FROM timeline_changes WHERE year = $1 AND element_id = $2 AND element_type = $3 RETURNING id',
    [year, elementId, elementType]
  );
  return res.rows.length > 0;
}

// Fetch all timeline entries (with changes and notes)
export async function getAllEntries(
  client: PoolClient
): Promise<TimelineEntry[]> {
  // Get all entries
  const res = await client.query(
    'SELECT * FROM timeline_entries ORDER BY year ASC'
  );
  const entries: TimelineEntry[] = [];
  for (const row of res.rows) {
    // Fetch changes and notes for this year
    const [changes, notes] = await Promise.all([
      getChangesForYear(client, row.year),
      getNotesForYear(client, row.year),
    ]);
    entries.push({
      year: row.year,
      age: row.age,
      notes,
      changes: !isEmptyChanges(changes) ? changes : undefined,
    });
  }
  return entries;
}

// Create or update a timeline entry
export async function upsertEntry(
  client: PoolClient,
  entry: TimelineEntry
): Promise<TimelineEntry> {
  // Insert or update the main entry
  await client.query(
    `INSERT INTO timeline_entries (year, age) 
     VALUES ($1, $2) 
     ON CONFLICT (year) 
     DO UPDATE SET age = $2`,
    [entry.year, entry.age]
  );

  // Handle notes
  if (entry.notes) {
    // Delete existing notes for this year
    await client.query('DELETE FROM notes WHERE year = $1', [entry.year]);

    // Insert new notes
    for (const note of entry.notes) {
      await createNote(client, entry.year, {
        title: note.title,
        description: note.description,
      });
    }
  }

  // Handle changes
  if (entry.changes && !isEmptyChanges(entry.changes)) {
    // Delete existing changes for this year
    await client.query('DELETE FROM timeline_changes WHERE year = $1', [
      entry.year,
    ]);

    // Insert new changes
    for (const [locationId, changes] of Object.entries(
      entry.changes.modified.locations
    )) {
      await recordChange(client, {
        year: entry.year,
        elementId: locationId,
        elementType: 'location',
        changeType: 'updated',
        changes,
      });
    }

    for (const [regionId, changes] of Object.entries(
      entry.changes.modified.regions
    )) {
      await recordChange(client, {
        year: entry.year,
        elementId: regionId,
        elementType: 'region',
        changeType: 'updated',
        changes,
      });
    }

    for (const locationId of entry.changes.deleted.locations) {
      await recordChange(client, {
        year: entry.year,
        elementId: locationId,
        elementType: 'location',
        changeType: 'deleted',
        changes: {},
      });
    }

    for (const regionId of entry.changes.deleted.regions) {
      await recordChange(client, {
        year: entry.year,
        elementId: regionId,
        elementType: 'region',
        changeType: 'deleted',
        changes: {},
      });
    }
  }

  // Return the updated entry
  const [changes, notes] = await Promise.all([
    getChangesForYear(client, entry.year),
    getNotesForYear(client, entry.year),
  ]);

  return {
    year: entry.year,
    age: entry.age,
    notes,
    changes: !isEmptyChanges(changes) ? changes : undefined,
  };
}

// Delete a timeline entry
export async function deleteEntry(
  client: PoolClient,
  year: number
): Promise<boolean> {
  // Delete related data first
  await client.query('DELETE FROM notes WHERE year = $1', [year]);
  await client.query('DELETE FROM timeline_changes WHERE year = $1', [year]);

  // Delete the entry
  const res = await client.query(
    'DELETE FROM timeline_entries WHERE year = $1 RETURNING year',
    [year]
  );
  return res.rows.length > 0;
}

// Fetch the full timeline data
export async function getTimeline(client: PoolClient): Promise<TimelineData> {
  const [entries, epochs] = await Promise.all([
    getAllEntries(client),
    getAllEpochs(client),
  ]);
  return { entries, epochs };
}

// Purge all timeline data (for cleanup operations)
export async function purgeTimeline(client: PoolClient): Promise<void> {
  await client.query('DELETE FROM timeline_changes');
  await client.query('DELETE FROM notes');
  await client.query('DELETE FROM timeline_entries');
  await client.query('DELETE FROM epochs');
}

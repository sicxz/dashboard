import { mkdirSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import { panels, categories } from './schema';

mkdirSync('./data', { recursive: true });

const sqlite = new Database('./data/dashboard.db', { create: true });
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export function seed() {
  const existingPanels = db.select().from(panels).all();
  if (existingPanels.length === 0) {
    db.insert(panels)
      .values([
        { name: 'Work', position: 0 },
        { name: 'Personal', position: 1 },
      ])
      .run();

    const existingCategories = db.select().from(categories).all();
    if (existingCategories.length === 0) {
      db.insert(categories)
        .values([
          { name: 'Teaching', panelId: 1, position: 0 },
          { name: 'Build', panelId: 1, position: 1 },
          { name: 'Admin', panelId: 1, position: 2 },
          { name: 'Home', panelId: 2, position: 0 },
          { name: 'Finance', panelId: 2, position: 1 },
        ])
        .run();
    }
  }
}

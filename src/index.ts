import { Hono } from 'hono';
import { db, seed } from './db';
import { panels, categories, links } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import { renderDashboard } from './views/layout';

const app = new Hono();

// --- Helper: build full panel → category → link hierarchy ---
function buildHierarchy() {
  const allPanels = db.select().from(panels).orderBy(panels.position).all();
  const allCategories = db.select().from(categories).orderBy(categories.position).all();
  const allLinks = db.select().from(links).orderBy(links.position).all();

  return allPanels.map((panel) => ({
    ...panel,
    categories: allCategories
      .filter((cat) => cat.panelId === panel.id)
      .map((cat) => ({
        ...cat,
        links: allLinks.filter((link) => link.categoryId === cat.id),
      })),
  }));
}

// --- HTML page ---
app.get('/', (c) => {
  return c.html(renderDashboard(buildHierarchy()));
});

// --- Panel routes ---
app.get('/api/panels', (c) => {
  return c.json(buildHierarchy());
});

app.post('/api/panels', async (c) => {
  const body = await c.req.json<{ name: string }>();
  if (!body.name?.trim()) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const maxPos = db
    .select({ pos: panels.position })
    .from(panels)
    .orderBy(sql`position DESC`)
    .limit(1)
    .all();
  const nextPos = (maxPos[0]?.pos ?? -1) + 1;

  const result = db
    .insert(panels)
    .values({ name: body.name.trim(), position: nextPos })
    .returning()
    .all();

  return c.json(result[0], 201);
});

app.delete('/api/panels/:id', (c) => {
  const id = Number(c.req.param('id'));
  db.delete(panels).where(eq(panels.id, id)).run();
  return c.json({ success: true });
});

// --- Category routes ---
// Reorder must be defined before :id to avoid route conflict
app.put('/api/categories/reorder', async (c) => {
  const body = await c.req.json<{ items: { id: number; position: number }[] }>();
  for (const item of body.items) {
    db.update(categories)
      .set({ position: item.position })
      .where(eq(categories.id, item.id))
      .run();
  }
  return c.json({ success: true });
});

app.get('/api/categories', (c) => {
  const allCategories = db.select().from(categories).orderBy(categories.position).all();
  const allLinks = db.select().from(links).orderBy(links.position).all();

  const grouped = allCategories.map((cat) => ({
    ...cat,
    links: allLinks.filter((link) => link.categoryId === cat.id),
  }));

  return c.json(grouped);
});

app.post('/api/categories', async (c) => {
  const body = await c.req.json<{ name: string; panelId: number }>();
  if (!body.name?.trim() || !body.panelId) {
    return c.json({ error: 'name and panelId are required' }, 400);
  }

  const maxPos = db
    .select({ pos: categories.position })
    .from(categories)
    .where(eq(categories.panelId, body.panelId))
    .orderBy(sql`position DESC`)
    .limit(1)
    .all();
  const nextPos = (maxPos[0]?.pos ?? -1) + 1;

  const result = db
    .insert(categories)
    .values({ name: body.name.trim(), panelId: body.panelId, position: nextPos })
    .returning()
    .all();

  return c.json(result[0], 201);
});

app.delete('/api/categories/:id', (c) => {
  const id = Number(c.req.param('id'));
  db.delete(categories).where(eq(categories.id, id)).run();
  return c.json({ success: true });
});

// --- Link routes ---
// Reorder must be defined before :id to avoid route conflict
app.put('/api/links/reorder', async (c) => {
  const body = await c.req.json<{ items: { id: number; categoryId: number; position: number }[] }>();
  for (const item of body.items) {
    db.update(links)
      .set({ position: item.position, categoryId: item.categoryId })
      .where(eq(links.id, item.id))
      .run();
  }
  return c.json({ success: true });
});

app.post('/api/links', async (c) => {
  const body = await c.req.json<{ name: string; url: string; categoryId: number }>();
  if (!body.name?.trim() || !body.url?.trim() || !body.categoryId) {
    return c.json({ error: 'name, url, and categoryId are required' }, 400);
  }

  let favicon: string | null = null;
  try {
    const domain = new URL(body.url).hostname;
    favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    // invalid URL, skip favicon
  }

  const result = db
    .insert(links)
    .values({
      name: body.name.trim(),
      url: body.url.trim(),
      favicon,
      categoryId: body.categoryId,
    })
    .returning()
    .all();

  return c.json(result[0], 201);
});

app.put('/api/links/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ name?: string; url?: string; categoryId?: number }>();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.url !== undefined) {
    updates.url = body.url.trim();
    try {
      const domain = new URL(body.url).hostname;
      updates.favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      // keep existing favicon
    }
  }
  if (body.categoryId !== undefined) updates.categoryId = body.categoryId;

  const result = db
    .update(links)
    .set(updates)
    .where(eq(links.id, id))
    .returning()
    .all();

  return c.json(result[0]);
});

app.delete('/api/links/:id', (c) => {
  const id = Number(c.req.param('id'));
  db.delete(links).where(eq(links.id, id)).run();
  return c.json({ success: true });
});

// --- Seed + Start ---
seed();

export default {
  port: Number(process.env.PORT) || 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};

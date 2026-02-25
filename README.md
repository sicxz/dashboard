# Dashboard

This is a Bun + Hono + Drizzle project.

## The Stack: BHD (Bun, Hono, Drizzle)
This stack is chosen for developer happiness and raw speed. You get the performance of a compiled language with the rapid iteration speed of JavaScript/TypeScript.

### 1. Bun 🥟 (The Engine)
* **Speed:** A ridiculously fast all-in-one JavaScript runtime designed as a leaner alternative to Node.js.
* **All-in-One:** No need for separate tools like npm, vitest, or webpack. Bun handles packages, testing, and bundling.
* **TypeScript Support:** Runs `.ts` natively out of the box.

### 2. Hono 🪶 (The Framework)
* **What it is:** A small, simple, and ultrafast web framework (similar to Express, but modern).
* **Edge-Ready:** Built using standard Web APIs, so the exact same code runs anywhere without modification.

### 3. Drizzle ORM 🌧️ (The Database Layer)
* **Type Safety:** A type-safe Object Relational Mapper (ORM). Your editor will catch errors before you run code.
* **SQL-Like Syntax:** Unlike older ORMs, Drizzle's syntax closely mirrors actual SQL.
* **Drizzle Studio:** Comes with a built-in visual database browser (`bun run db:studio`).

---

## How to run

To start the development server with hot-reload:

```bash
bun run dev
```

cd /Users/tmasingale/Documents/GitHub/flavio/dashboard && bun run dev

Which executes: `bun run --hot src/index.ts`

## Database commands

- Push schema changes to the database: `bun run db:push`
- Open Drizzle Studio to view database: `bun run db:studio`


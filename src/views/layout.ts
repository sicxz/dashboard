import { html, raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

interface LinkData {
  id: number;
  name: string;
  url: string;
  favicon: string | null;
  categoryId: number;
}

interface CategoryWithLinks {
  id: number;
  name: string;
  panelId: number;
  links: LinkData[];
}

interface PanelData {
  id: number;
  name: string;
  categories: CategoryWithLinks[];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function renderDashboard(panels: PanelData[]) {
  const totalLinks = panels.reduce((sum, p) => sum + p.categories.reduce((s, c) => s + c.links.length, 0), 0);
  const totalCategories = panels.reduce((sum, p) => sum + p.categories.length, 0);
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const clientData = panels.map((p) => ({
    id: p.id,
    name: p.name,
    categories: p.categories.map((c) => ({ id: c.id, name: c.name })),
  }));

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cmd/dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* =========================================
       DESIGN TOKENS — Primer Dark Dimmed base
       + command center personality layer
       ========================================= */
    :root {
      /* Primer dark-dimmed palette */
      --color-canvas-default: #22272e;
      --color-canvas-subtle: #2d333b;
      --color-canvas-inset: #1c2128;
      --color-canvas-overlay: #2d333b;
      --color-border-default: #444c56;
      --color-border-muted: #373e47;
      --color-border-subtle: #2d333b;
      --color-fg-default: #ffffff;
      --color-fg-muted: #00e5ff;
      --color-fg-subtle: #e2b2ff;
      --color-fg-on-emphasis: #ffffff;
      --color-accent-fg: #00e5ff;
      --color-accent-emphasis: #0077ff;
      --color-accent-muted: #00e5ff40;
      --color-accent-subtle: #00e5ff10;
      --color-danger-fg: #ff0055;
      --color-danger-subtle: #ff005520;
      --color-success-fg: #39ff14;
      --color-neutral-emphasis-plus: #a0aab5;
      --color-neutral-muted: #a0aab540;

      /* Command center accent override */
      --accent: #00e5ff;
      --accent-glow: #00e5ff40;

      /* Primer spacing (base-8 scale, +10px uplift) */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 16px;
      --space-4: 24px;
      --space-5: 32px;
      --space-6: 40px;
      --space-7: 48px;
      --space-8: 64px;

      /* Primer border radius */
      --borderRadius-small: 3px;
      --borderRadius-medium: 6px;
      --borderRadius-large: 12px;

      /* Typography */
      --fontFamily-mono: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
      --text-body-size-small: 0.875rem;
      --text-body-size-medium: 1rem;
      --text-body-size-large: 1.125rem;
      --text-caption-size: 0.875rem;
      --text-title-size: 1.5rem;
      --text-body-lineHeight: 1.6;
    }

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--fontFamily-mono);
      background: var(--color-canvas-inset);
      color: var(--color-fg-default);
      line-height: var(--text-body-lineHeight);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    /* === STATUS STRIP === */
    .status-strip {
      background: var(--color-canvas-default);
      border-bottom: 1px solid var(--color-border-muted);
      padding: var(--space-2) var(--space-6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--text-caption-size);
      color: var(--color-fg-subtle);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .status-strip .left { display: flex; align-items: center; gap: var(--space-3); }
    .status-strip .indicator {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--color-success-fg);
      box-shadow: 0 0 6px var(--color-success-fg);
    }
    .status-strip .sep { color: var(--color-border-muted); }
    .status-strip .ctx { color: var(--color-fg-muted); }

    /* === HEADER === */
    .header {
      padding: var(--space-5) var(--space-6) 0;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
    .header-title { display: flex; align-items: baseline; gap: var(--space-2); }
    .header h1 {
      font-size: var(--text-title-size);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-fg-on-emphasis);
    }
    .header h1 .prefix { color: var(--accent); font-weight: 400; }
    .header .version {
      font-size: var(--text-caption-size);
      color: var(--color-fg-subtle);
      letter-spacing: 0.04em;
    }

    /* === PANEL SWITCHER === */
    .panel-switcher {
      padding: 0 var(--space-6);
      margin-top: var(--space-4);
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid var(--color-border-muted);
    }
    .panel-tabs { display: flex; }
    .panel-tab {
      padding: var(--space-3) var(--space-4) 12px;
      font-size: var(--text-caption-size);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-fg-subtle);
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      background: none;
      font-family: var(--fontFamily-mono);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      transition: color 0.12s;
      margin-bottom: -1px;
    }
    .panel-tab:hover { color: var(--color-fg-muted); }
    .panel-tab.active {
      color: var(--color-fg-on-emphasis);
      border-bottom-color: var(--accent);
    }
    .panel-tab.active::before {
      content: '> ';
      color: var(--accent);
      font-weight: 400;
    }
    .panel-tab .panel-delete {
      display: none;
      width: 16px; height: 16px;
      align-items: center; justify-content: center;
      border-radius: var(--borderRadius-small);
      font-size: var(--text-body-size-small);
      color: var(--color-fg-subtle);
      transition: color 0.1s, background 0.1s;
    }
    .panel-tab:hover .panel-delete { display: inline-flex; }
    .panel-tab .panel-delete:hover {
      color: var(--color-danger-fg);
      background: var(--color-danger-subtle);
    }
    .panel-switcher .actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      padding-bottom: 2px;
    }

    /* === PANEL CONTENT === */
    .panel-content { display: none; }
    .panel-content.active { display: block; }

    /* === CATEGORY BAR === */
    .category-bar {
      padding: var(--space-4) var(--space-6) var(--space-3);
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      align-items: center;
    }
    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      background: var(--color-canvas-default);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--borderRadius-medium);
      font-size: var(--text-caption-size);
      font-weight: 500;
      font-family: var(--fontFamily-mono);
      color: var(--color-fg-muted);
      user-select: none;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: border-color 0.15s, color 0.15s;
    }
    .category-chip:hover {
      border-color: var(--color-border-default);
      color: var(--color-fg-default);
    }
    .category-chip .delete-cat {
      cursor: pointer;
      color: var(--color-fg-subtle);
      font-size: var(--text-body-size-small);
      line-height: 1;
      width: 16px; height: 16px;
      display: inline-flex;
      align-items: center; justify-content: center;
      border-radius: var(--borderRadius-small);
      transition: color 0.15s, background 0.15s;
    }
    .category-chip .delete-cat:hover {
      color: var(--color-danger-fg);
      background: var(--color-danger-subtle);
    }

    /* === GRID === */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
      padding: var(--space-2) var(--space-6) var(--space-7);
    }

    /* === CARD === */
    .card {
      background: var(--color-canvas-default);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--borderRadius-medium);
      overflow: hidden;
      position: relative;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 2px; height: 100%;
      background: var(--accent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .card:hover { border-color: var(--color-border-default); }
    .card:hover::before { opacity: 1; }

    .card-header {
      padding: var(--space-3) var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      border-bottom: 1px solid var(--color-border-subtle);
    }
    .card-header .label {
      font-weight: 600;
      font-size: var(--text-caption-size);
      color: var(--color-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      flex: 1;
    }
    .card-header .label .marker {
      color: var(--accent);
      margin-right: 6px;
      font-weight: 400;
    }
    .card-header .meta {
      font-size: var(--text-caption-size);
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .card-empty {
      padding: var(--space-5) var(--space-4);
      color: var(--color-fg-subtle);
      font-size: var(--text-caption-size);
      letter-spacing: 0.02em;
    }

    .link-list { min-height: var(--space-5); }

    /* === LINK ITEM === */
    .link-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      border-bottom: 1px solid var(--color-border-subtle);
      position: relative;
      transition: background 0.1s;
    }
    .link-item:last-child { border-bottom: none; }
    .link-item:hover { background: var(--color-canvas-subtle); }
    .link-item img {
      width: 16px; height: 16px;
      border-radius: var(--borderRadius-small);
      flex-shrink: 0;
      opacity: 0.7;
      filter: grayscale(30%);
      transition: opacity 0.15s, filter 0.15s;
    }
    .link-item:hover img { opacity: 1; filter: none; }
    .link-info {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: var(--space-3);
    }
    .link-item a {
      font-size: var(--text-body-size-medium);
      font-weight: 500;
      color: var(--color-fg-default);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.1s;
    }
    .link-item a:hover { color: var(--accent); }
    .link-domain {
      font-size: var(--text-caption-size);
      color: var(--color-fg-subtle);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .link-actions {
      display: none;
      gap: var(--space-1);
      flex-shrink: 0;
    }
    .link-item:hover .link-actions { display: flex; }
    .link-item:hover .link-domain { display: none; }
    .link-actions button {
      background: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: var(--text-caption-size);
      font-family: var(--fontFamily-mono);
      padding: 2px 8px;
      border-radius: var(--borderRadius-small);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: all 0.1s;
    }
    .link-actions .edit-btn { color: var(--color-fg-muted); }
    .link-actions .edit-btn:hover {
      color: var(--accent);
      border-color: var(--accent-glow);
      background: var(--color-accent-subtle);
    }
    .link-actions .delete-btn { color: var(--color-fg-muted); }
    .link-actions .delete-btn:hover {
      color: var(--color-danger-fg);
      border-color: var(--color-danger-subtle);
      background: var(--color-danger-subtle);
    }

    /* === DRAG HANDLES === */
    .drag-handle {
      width: 14px;
      flex-shrink: 0;
      cursor: grab;
      opacity: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.12s;
    }
    .drag-handle::before {
      content: '';
      display: block;
      width: 6px;
      height: 10px;
      background-image: radial-gradient(circle, var(--color-fg-subtle) 1px, transparent 1px);
      background-size: 3px 4px;
    }
    .card-header:hover .drag-handle,
    .link-item:hover .drag-handle { opacity: 1; }
    .drag-handle:active { cursor: grabbing; }

    /* === DRAG STATES === */
    .dragging { opacity: 0.15 !important; }
    .card.drag-target {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 1px var(--accent-glow);
    }
    .card.drag-target::before { opacity: 1 !important; }
    .card.drag-insert-before {
      box-shadow: -4px 0 0 -1px var(--accent);
    }
    .drop-indicator {
      height: 2px;
      background: var(--accent);
      border-radius: 1px;
      margin: 0 var(--space-4);
      pointer-events: none;
      position: relative;
      z-index: 2;
    }
    .drag-ghost {
      position: fixed;
      top: -200px;
      left: -200px;
      background: var(--color-canvas-subtle);
      border: 1px solid var(--accent);
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-caption-size);
      font-family: var(--fontFamily-mono);
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-radius: var(--borderRadius-small);
      white-space: nowrap;
      z-index: 9999;
      pointer-events: none;
    }

    /* === BUTTONS === */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--borderRadius-medium);
      font-size: var(--text-caption-size);
      font-weight: 500;
      font-family: var(--fontFamily-mono);
      cursor: pointer;
      border: 1px solid var(--color-border-muted);
      transition: all 0.15s;
      line-height: 20px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .btn-default {
      background: var(--color-canvas-default);
      color: var(--color-fg-muted);
    }
    .btn-default:hover {
      background: var(--color-canvas-subtle);
      color: var(--color-fg-default);
      border-color: var(--color-border-default);
    }
    .btn-primary {
      background: var(--color-accent-emphasis);
      color: var(--color-fg-on-emphasis);
      border-color: transparent;
      font-weight: 600;
    }
    .btn-primary:hover { background: #3b7cd8; }

    /* === MODAL === */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: #1c2128e8;
      z-index: 100;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: var(--color-canvas-overlay);
      border: 1px solid var(--color-border-default);
      border-radius: var(--borderRadius-medium);
      width: 100%;
      max-width: 420px;
      padding: var(--space-4);
      animation: modalIn 0.12s ease-out;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal h2 {
      font-size: var(--text-caption-size);
      font-weight: 600;
      margin-bottom: var(--space-4);
      color: var(--color-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border-muted);
    }
    .modal h2 .marker { color: var(--accent); font-weight: 400; }
    .form-group { margin-bottom: var(--space-3); }
    .form-group label {
      display: block;
      font-size: var(--text-caption-size);
      font-weight: 500;
      margin-bottom: var(--space-2);
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--borderRadius-medium);
      font-size: var(--text-body-size-medium);
      font-family: var(--fontFamily-mono);
      line-height: 22px;
      outline: none;
      background: var(--color-canvas-inset);
      color: var(--color-fg-default);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-group input:focus,
    .form-group select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }
    .form-group input::placeholder { color: var(--color-fg-subtle); }
    .form-group select option {
      background: var(--color-canvas-default);
      color: var(--color-fg-default);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      margin-top: var(--space-4);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border-subtle);
    }
  </style>
</head>
<body>
  <div class="status-strip">
    <div class="left">
      <span class="indicator"></span>
      <span>sys/dashboard</span>
      <span class="sep">//</span>
      <span class="ctx" id="activeContext">ctx:${panels[0]?.name?.toUpperCase() || 'NONE'}</span>
      <span class="sep">//</span>
      <span>localhost:3000</span>
    </div>
    <div>
      <span>${timestamp}</span>
      <span class="sep"> / </span>
      <span>${panels.length} contexts</span>
      <span class="sep"> / </span>
      <span>${totalCategories} modules</span>
      <span class="sep"> / </span>
      <span>${totalLinks} links</span>
    </div>
  </div>

  <header class="header">
    <div class="header-title">
      <h1><span class="prefix">&gt;</span> dashboard</h1>
      <span class="version">v3.0</span>
    </div>
    <button class="btn btn-primary" onclick="openAddLinkModal()">+ link</button>
  </header>

  <nav class="panel-switcher">
    <div class="panel-tabs">
      ${panels.map(
    (panel, i) => html`
          <button class="panel-tab${i === 0 ? ' active' : ''}" data-panel-id="${panel.id}" onclick="switchPanel(${panel.id})">
            ${panel.name}
            <span class="panel-delete" onclick="event.stopPropagation(); deletePanel(${panel.id})" title="Delete context">&times;</span>
          </button>
        `
  )}
    </div>
    <div class="actions">
      <button class="btn btn-default" onclick="openModal('addPanelModal')">+ context</button>
    </div>
  </nav>

  ${panels.map(
    (panel, i) => html`
      <div class="panel-content${i === 0 ? ' active' : ''}" data-panel-id="${panel.id}">
        <div class="category-bar">
          ${panel.categories.map(
      (cat) => html`
              <span class="category-chip">
                ${cat.name}
                <span class="delete-cat" onclick="deleteCategory(${cat.id})" title="Delete module">&times;</span>
              </span>
            `
    )}
          <button class="btn btn-default" onclick="openModal('addCategoryModal')">+ module</button>
        </div>

        <main class="grid" data-panel-id="${panel.id}">
          ${panel.categories.map(
      (cat) => html`
              <div class="card" data-category-id="${cat.id}">
                <div class="card-header">
                  <span class="drag-handle card-handle"></span>
                  <span class="label"><span class="marker">//</span>${cat.name}</span>
                  <span class="meta">${cat.links.length} ${cat.links.length === 1 ? 'link' : 'links'}</span>
                </div>
                <div class="link-list" data-category-id="${cat.id}">
                  ${cat.links.length === 0
          ? html`<div class="card-empty">-- empty --</div>`
          : cat.links.map(
            (link) => html`
                          <div class="link-item" data-link-id="${link.id}">
                            <span class="drag-handle link-handle"></span>
                            <img src="${link.favicon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect width=%2216%22 height=%2216%22 rx=%222%22 fill=%22%232d333b%22/></svg>'}" alt="" width="16" height="16" loading="lazy">
                            <div class="link-info">
                              <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.name}</a>
                              <span class="link-domain">${extractDomain(link.url)}</span>
                            </div>
                            <div class="link-actions">
                              <button class="edit-btn" onclick='openEditLinkModal(${raw(JSON.stringify({ id: link.id, name: link.name, url: link.url, categoryId: link.categoryId }))})'>edit</button>
                              <button class="delete-btn" onclick="deleteLink(${link.id})">del</button>
                            </div>
                          </div>
                        `
          )}
                </div>
              </div>
            `
    )}
        </main>
      </div>
    `
  )}

  <!-- Modals -->
  <div class="modal-overlay" id="addLinkModal">
    <div class="modal">
      <h2><span class="marker">// </span>Add Link</h2>
      <form onsubmit="handleAddLink(event)">
        <div class="form-group">
          <label for="linkName">Name</label>
          <input type="text" id="linkName" required placeholder="GitHub">
        </div>
        <div class="form-group">
          <label for="linkUrl">URL</label>
          <input type="url" id="linkUrl" required placeholder="https://github.com">
        </div>
        <div class="form-group">
          <label for="linkCategory">Module</label>
          <select id="linkCategory" required></select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-default" onclick="closeModal('addLinkModal')">cancel</button>
          <button type="submit" class="btn btn-primary">add</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-overlay" id="editLinkModal">
    <div class="modal">
      <h2><span class="marker">// </span>Edit Link</h2>
      <form onsubmit="handleEditLink(event)">
        <input type="hidden" id="editLinkId">
        <div class="form-group">
          <label for="editLinkName">Name</label>
          <input type="text" id="editLinkName" required>
        </div>
        <div class="form-group">
          <label for="editLinkUrl">URL</label>
          <input type="url" id="editLinkUrl" required>
        </div>
        <div class="form-group">
          <label for="editLinkCategory">Module</label>
          <select id="editLinkCategory" required></select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-default" onclick="closeModal('editLinkModal')">cancel</button>
          <button type="submit" class="btn btn-primary">save</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-overlay" id="addCategoryModal">
    <div class="modal">
      <h2><span class="marker">// </span>New Module</h2>
      <form onsubmit="handleAddCategory(event)">
        <div class="form-group">
          <label for="catName">Name</label>
          <input type="text" id="catName" required placeholder="research">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-default" onclick="closeModal('addCategoryModal')">cancel</button>
          <button type="submit" class="btn btn-primary">create</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-overlay" id="addPanelModal">
    <div class="modal">
      <h2><span class="marker">// </span>New Context</h2>
      <form onsubmit="handleAddPanel(event)">
        <div class="form-group">
          <label for="panelName">Name</label>
          <input type="text" id="panelName" required placeholder="research">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-default" onclick="closeModal('addPanelModal')">cancel</button>
          <button type="submit" class="btn btn-primary">create</button>
        </div>
      </form>
    </div>
  </div>

  ${raw(`<script>
    // =============================
    // PANEL + MODAL + CRUD SYSTEM
    // =============================
    const PANELS = ${JSON.stringify(clientData)};
    let activePanel = Number(localStorage.getItem('dashboard_activePanel')) || (PANELS[0]?.id ?? null);
    if (!PANELS.find(p => p.id === activePanel)) activePanel = PANELS[0]?.id ?? null;

    function switchPanel(id) {
      activePanel = id;
      localStorage.setItem('dashboard_activePanel', id);
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', Number(t.dataset.panelId) === id));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.toggle('active', Number(p.dataset.panelId) === id));
      const panel = PANELS.find(p => p.id === id);
      if (panel) document.getElementById('activeContext').textContent = 'ctx:' + panel.name.toUpperCase();
    }

    function populateCategoryDropdown(selectId) {
      const panel = PANELS.find(p => p.id === activePanel);
      const select = document.getElementById(selectId);
      select.innerHTML = '';
      if (panel) panel.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    }

    function openModal(id) {
      document.getElementById(id).classList.add('active');
      const input = document.getElementById(id).querySelector('input:not([type=hidden])');
      if (input) setTimeout(() => input.focus(), 50);
    }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    });

    function openAddLinkModal() {
      populateCategoryDropdown('linkCategory');
      const sel = document.getElementById('linkCategory');
      if (sel.options.length === 0) { alert('Create a module first.'); return; }
      openModal('addLinkModal');
    }
    function openEditLinkModal(link) {
      populateCategoryDropdown('editLinkCategory');
      document.getElementById('editLinkId').value = link.id;
      document.getElementById('editLinkName').value = link.name;
      document.getElementById('editLinkUrl').value = link.url;
      setTimeout(() => document.getElementById('editLinkCategory').value = link.categoryId, 0);
      openModal('editLinkModal');
    }

    async function api(url, method, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    }

    async function handleAddLink(e) {
      e.preventDefault();
      await api('/api/links', 'POST', {
        name: document.getElementById('linkName').value,
        url: document.getElementById('linkUrl').value,
        categoryId: Number(document.getElementById('linkCategory').value),
      });
      location.reload();
    }
    async function handleEditLink(e) {
      e.preventDefault();
      const id = document.getElementById('editLinkId').value;
      await api('/api/links/' + id, 'PUT', {
        name: document.getElementById('editLinkName').value,
        url: document.getElementById('editLinkUrl').value,
        categoryId: Number(document.getElementById('editLinkCategory').value),
      });
      location.reload();
    }
    async function deleteLink(id) {
      if (!confirm('Delete this link?')) return;
      await api('/api/links/' + id, 'DELETE');
      location.reload();
    }
    async function handleAddCategory(e) {
      e.preventDefault();
      await api('/api/categories', 'POST', { name: document.getElementById('catName').value, panelId: activePanel });
      location.reload();
    }
    async function deleteCategory(id) {
      if (!confirm('Delete this module and all its links?')) return;
      await api('/api/categories/' + id, 'DELETE');
      location.reload();
    }
    async function handleAddPanel(e) {
      e.preventDefault();
      await api('/api/panels', 'POST', { name: document.getElementById('panelName').value });
      location.reload();
    }
    async function deletePanel(id) {
      if (PANELS.length <= 1) { alert('Cannot delete the last context.'); return; }
      if (!confirm('Delete this context and everything in it?')) return;
      await api('/api/panels/' + id, 'DELETE');
      localStorage.removeItem('dashboard_activePanel');
      location.reload();
    }

    // =============================
    // DRAG AND DROP SYSTEM
    // =============================
    let dragType = null;
    let dragData = null;
    const dropLine = document.createElement('div');
    dropLine.className = 'drop-indicator';

    function initDragDrop() {
      // --- Card drag handles ---
      document.querySelectorAll('.card-handle').forEach(h => {
        h.addEventListener('mousedown', () => h.closest('.card').draggable = true);
        h.addEventListener('mouseup', () => h.closest('.card').draggable = false);
        h.addEventListener('mouseleave', () => { if (!dragData) h.closest('.card').draggable = false; });
      });

      // --- Link drag handles ---
      document.querySelectorAll('.link-handle').forEach(h => {
        h.addEventListener('mousedown', () => h.closest('.link-item').draggable = true);
        h.addEventListener('mouseup', () => h.closest('.link-item').draggable = false);
        h.addEventListener('mouseleave', () => { if (!dragData) h.closest('.link-item').draggable = false; });
      });

      // --- Card drag events ---
      document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('dragstart', e => {
          dragType = 'card';
          dragData = { id: Number(card.dataset.categoryId), element: card, source: card.parentElement };
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          const ghost = document.createElement('div');
          ghost.className = 'drag-ghost';
          ghost.textContent = '// ' + (card.querySelector('.label')?.textContent?.trim() || '');
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 10, 10);
          requestAnimationFrame(() => ghost.remove());
        });
        card.addEventListener('dragend', onDragEnd);
      });

      // --- Link drag events ---
      document.querySelectorAll('.link-item').forEach(item => {
        item.addEventListener('dragstart', e => {
          dragType = 'link';
          const list = item.closest('.link-list');
          dragData = {
            id: Number(item.dataset.linkId),
            element: item,
            sourceList: list,
            sourceCatId: Number(list.dataset.categoryId),
          };
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          const ghost = document.createElement('div');
          ghost.className = 'drag-ghost';
          ghost.textContent = item.querySelector('a')?.textContent?.trim() || '';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 10, 10);
          requestAnimationFrame(() => ghost.remove());
        });
        item.addEventListener('dragend', onDragEnd);
      });

      // --- Grid drop zones (for card reorder) ---
      document.querySelectorAll('.grid').forEach(grid => {
        grid.addEventListener('dragover', e => {
          if (dragType !== 'card') return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          clearHighlights();
          const after = getInsertBefore(grid, e.clientX, e.clientY, '.card');
          if (after && after !== dragData.element) after.classList.add('drag-insert-before');
        });
        grid.addEventListener('drop', e => {
          if (dragType !== 'card') return;
          e.preventDefault();
          const after = getInsertBefore(grid, e.clientX, e.clientY, '.card');
          if (after && after !== dragData.element) {
            grid.insertBefore(dragData.element, after);
          } else if (!after) {
            grid.appendChild(dragData.element);
          }
          saveCategoryOrder(grid);
        });
        grid.addEventListener('dragleave', e => {
          if (dragType !== 'card') return;
          if (!grid.contains(e.relatedTarget)) clearHighlights();
        });
      });

      // --- Link list drop zones (for link reorder + cross-category) ---
      document.querySelectorAll('.link-list').forEach(list => {
        list.addEventListener('dragover', e => {
          if (dragType !== 'link') return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          clearHighlights();
          const card = list.closest('.card');
          if (list !== dragData.sourceList) card.classList.add('drag-target');
          removeIndicator();
          const after = getInsertBefore(list, e.clientX, e.clientY, '.link-item');
          if (after && after !== dragData.element) {
            list.insertBefore(dropLine, after);
          } else if (!after) {
            list.appendChild(dropLine);
          }
        });
        list.addEventListener('drop', e => {
          if (dragType !== 'link') return;
          e.preventDefault();
          removeIndicator();
          const newCatId = Number(list.dataset.categoryId);
          const after = getInsertBefore(list, e.clientX, e.clientY, '.link-item');
          // Remove empty state from target
          const empty = list.querySelector('.card-empty');
          if (empty) empty.remove();
          // Move element
          if (after && after !== dragData.element) {
            list.insertBefore(dragData.element, after);
          } else {
            list.appendChild(dragData.element);
          }
          // Add empty state to source if now empty
          if (dragData.sourceList !== list && dragData.sourceList.querySelectorAll('.link-item').length === 0) {
            const emp = document.createElement('div');
            emp.className = 'card-empty';
            emp.textContent = '-- empty --';
            dragData.sourceList.appendChild(emp);
          }
          // Update meta counts
          updateCardMeta(newCatId);
          if (dragData.sourceCatId !== newCatId) updateCardMeta(dragData.sourceCatId);
          // Save
          const affected = new Set([dragData.sourceCatId, newCatId]);
          saveLinkOrder(affected);
        });
        list.addEventListener('dragleave', e => {
          if (dragType !== 'link') return;
          if (!list.closest('.card').contains(e.relatedTarget)) {
            removeIndicator();
            clearHighlights();
          }
        });
      });
    }

    function onDragEnd() {
      if (dragData?.element) {
        dragData.element.classList.remove('dragging');
        dragData.element.draggable = false;
      }
      removeIndicator();
      clearHighlights();
      dragType = null;
      dragData = null;
    }

    function getInsertBefore(container, clientX, clientY, selector) {
      const els = [...container.querySelectorAll(selector + ':not(.dragging)')];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        const midX = r.left + r.width / 2;
        if (clientY < midY) return el;
        if (clientY < r.bottom && clientX < midX) return el;
      }
      return null;
    }

    function removeIndicator() { if (dropLine.parentNode) dropLine.remove(); }
    function clearHighlights() {
      document.querySelectorAll('.drag-insert-before,.drag-target').forEach(el => {
        el.classList.remove('drag-insert-before', 'drag-target');
      });
    }

    function updateCardMeta(categoryId) {
      const list = document.querySelector('.link-list[data-category-id="' + categoryId + '"]');
      if (!list) return;
      const meta = list.closest('.card')?.querySelector('.meta');
      if (!meta) return;
      const count = list.querySelectorAll('.link-item').length;
      meta.textContent = count + (count === 1 ? ' link' : ' links');
    }

    async function saveCategoryOrder(grid) {
      const cards = [...grid.querySelectorAll('.card')];
      const items = cards.map((c, i) => ({ id: Number(c.dataset.categoryId), position: i }));
      try {
        await api('/api/categories/reorder', 'PUT', { items });
      } catch (err) {
        console.error('Save failed:', err);
        location.reload();
      }
    }

    async function saveLinkOrder(affectedCatIds) {
      const items = [];
      for (const catId of affectedCatIds) {
        const list = document.querySelector('.link-list[data-category-id="' + catId + '"]');
        if (!list) continue;
        [...list.querySelectorAll('.link-item')].forEach((item, i) => {
          items.push({ id: Number(item.dataset.linkId), categoryId: catId, position: i });
        });
      }
      try {
        await api('/api/links/reorder', 'PUT', { items });
      } catch (err) {
        console.error('Save failed:', err);
        location.reload();
      }
    }

    // =============================
    // INIT
    // =============================
    switchPanel(activePanel);
    initDragDrop();
  </script>`)}
</body>
</html>`;
}

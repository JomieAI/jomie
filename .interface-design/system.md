# Jomie Interface Design System

## Palette — v2 (locked production, updated from brand assets)

| Token | Hex | CSS var | Role |
|---|---|---|---|
| primary-500 | `#5D5EF4` | `--primary` | CTA, active states, icon container |
| primary-600 | `#5556DE` | — | Hover on primary-500 |
| secondary-800 | `#0f0d2b` | `--background` | Page background |
| secondary-600 | `#191647` | `--sidebar` / `--secondary` | Navbar, sidebar |
| secondary-500 | `#1C184E` | `--card` | Card bg, wordmark on light |
| secondary-400 | `#494671` | `--border` (at 30%) | Borders, dividers |
| tertiary-500 | `#9EACFE` | `--accent-foreground` | Wordmark on dark, tertiary accent |
| tertiary-700 | `#707AB4` | `--muted-foreground` | Body text on dark (5.8:1 AA) |
| success | `#10B981` | `--success` | Positive data (was #22C55E) |
| warning | `#F59E0B` | `--warning` | Flags, cost alerts (unchanged) |

## Direction & Feel
Financial control room with an AI co-pilot. Dense like Bloomberg, readable like Linear.
The interface disappears into the task — the AI surface is ambient, not loud.
Serious, precise, accountable. Never playful. Never decorative.

## Depth Strategy
**Borders only** — no shadows. Everything structural.
- Standard: `border-border` (oklch 1 0 0 / 8%)
- Soft separator: `border-border/50`
- Active selection: `border-l-2 border-l-primary` (left rail only — earned, not decorative)
- Focus ring: `ring-primary`

## Surfaces
Same background hue across all surfaces — only lightness shifts:
- Page bg: `bg-background` — oklch(0.138 0.018 255)
- Sidebar: same as background — separated by border only, not color
- Card/panel: `bg-background` — no contrast shift for panels
- Hover: `bg-white/[0.025]` to `bg-white/[0.04]`
- Active row: `bg-primary/[0.06]`
- Subtle tint: `bg-white/[0.02]`

## Typography
- Plus Jakarta Sans exclusively
- Data / amounts: `font-mono tabular-nums` — numbers must align in columns
- PR IDs / citations: `font-mono text-[9px] text-muted-foreground/30` — traceable, not prominent
- Section labels: `text-[9px] uppercase tracking-widest text-muted-foreground/30` — used sparingly, not on every section
- Body hierarchy: foreground → foreground/80 → muted-foreground/60 → muted-foreground/40 → muted-foreground/30

## Spacing
Base unit: 4px. Grid: 4, 8, 12, 16, 20, 24, 32.
Row height: 40–44px for data rows (tighter than default).
Panel padding: px-4 py-3 for content, px-4 h-11 for headers.

## Signature Element: AI Citation Strip
Every AI insight must include a monospace citation in format:
`module.md:version → regulation:clause`
Example: `capitalAllowance.md:v1.4 → ITA67:Sch3`

Renders as: `<code className="text-[9px] font-mono text-muted-foreground/40 tracking-tight">`

This is the product's core differentiator — traceable, auditable AI recommendations.

## Key Component Patterns

### Workflow Position Indicator (replaces status badges)
Dot track showing approval chain state:
- Done: `size-1.5 bg-success rounded-full`
- Current: `size-2 bg-warning border border-warning/50 animate-pulse`
- Waiting: `size-1.5 bg-muted-foreground/20`
Paired with monospace level label: `font-mono text-[10px]`

### Priority Queue (replaces greeting card)
Numbered action items with zero pleasantries.
- Item number: `font-mono font-bold text-warning/70` for urgent, `text-muted-foreground/25` for normal
- No "Good morning" — users are in a task, not checking in

### Co-pilot Panel (not a Sheet)
Permanent right-side panel (320px), always visible.
- Contains: amount header, line items ledger, AI analysis, approval chain, action buttons
- `LIVE` indicator with success dot pulse in panel header
- Panel never slides over content — it IS part of the layout

### Row Selection
`border-l-2 border-l-primary bg-primary/[0.06]` — left border earned only on selected row.
Unselected hover: `bg-white/[0.025] border-l-transparent`

### Topbar
Height: h-11. Same bg as page.
Entity switcher: rounded px-2 py-1, no heavy border — just hover bg.
Search: shows keyboard shortcut (⌘K) — signals power-user interface.

## Rejected Defaults
- ❌ Sheet overlays for detail → ✅ permanent co-pilot column
- ❌ Badge pills for status → ✅ dot track workflow position
- ❌ Greeting card → ✅ numbered priority queue
- ❌ Section eyebrow labels everywhere → ✅ sparingly, 9px tracking-widest only where needed
- ❌ Card grids → ✅ single-column data list with dense rows
- ❌ Shadows → ✅ borders only
- ❌ Different surface colors for sidebar → ✅ same bg, border separation

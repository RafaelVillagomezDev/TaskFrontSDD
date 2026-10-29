# Kompitu Design System

## Brand Identity

**Brand Name:** Kompitu  
**Industry:** SaaS / Productivity  

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Nova Blue | `#2563EB` | Primary actions, links, CTAs |
| Nova Dark | `#0F172A` | Backgrounds, headers |
| Nova Light | `#F8FAFC` | Page backgrounds, cards |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Spark Orange | `#F97316` | Highlights, badges, alerts |
| Spark Green | `#22C55E` | Success states, confirmations |
| Spark Red | `#EF4444` | Error borders and icons; error text in dark mode |
| Red 700 | `#B91C1C` | Destructive button background; error text in light mode |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text |
| Gray 600 | `#4B5563` | Secondary text |
| Gray 500 | `#6B7280` | Placeholder text |
| Gray 300 | `#D1D5DB` | Borders, dividers |
| Gray 100 | `#F3F4F6` | Subtle backgrounds |

---

## Typography

### Font Families
- **Headings:** `Inter` (Bold 700, Semibold 600)
- **Body:** `Inter` (Regular 400, Medium 500)
- **Code/Mono:** `JetBrains Mono`

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 48px | 1.1 | 700 | Hero headings |
| H1 | 36px | 1.2 | 700 | Page titles |
| H2 | 28px | 1.3 | 600 | Section headings |
| H3 | 22px | 1.4 | 600 | Card headings |
| H4 | 18px | 1.4 | 600 | Sub-sections |
| Body LG | 18px | 1.6 | 400 | Lead text |
| Body | 16px | 1.6 | 400 | Default body |
| Body SM | 14px | 1.5 | 400 | Captions, labels |
| Caption | 12px | 1.4 | 500 | Metadata, tags |

---

## Spacing System

Based on a **4px base unit**.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon padding |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | Default padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Large sections |
| `space-16` | 64px | Page sections |
| `space-24` | 96px | Hero spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Inputs, small buttons |
| `radius-md` | 8px | Cards, buttons |
| `radius-lg` | 12px | Modals, panels |
| `radius-xl` | 16px | Feature cards |
| `radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dropdowns |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Modals |

### Overlay

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `overlay` | `rgba(15,23,42,0.5)` (Nova Dark 50%) | `rgba(0,0,0,0.6)` | Backdrop behind modals and drawers |

---

## Components

### Buttons

#### Variants
- **Primary** — Filled, Nova Blue background
- **Secondary** — Outlined, Nova Blue border
- **Ghost** — No border, transparent background
- **Destructive** — Filled, Red 700 background (`#B91C1C`) with white text
- **Link** — No background, underline on hover

#### Sizes
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| SM | 32px | 8px 12px | 14px |
| MD | 40px | 10px 16px | 15px |
| LG | 48px | 12px 24px | 16px |

#### States
- Default → Hover (10% darker) → Active (20% darker) → Disabled (40% opacity)
- Focus: 2px offset ring in Nova Blue

---

### Inputs

- Height: **40px** (MD), **48px** (LG)
- Border: `1px solid #D1D5DB`
- Focus border: `2px solid #2563EB`
- Border radius: `radius-md`
- Padding: `12px 16px`
- Placeholder color: `Gray 500`
- Error state: Spark Red border + error message below (Red 700 in light mode, Spark Red in dark mode)

---

### Cards

- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Border radius: `radius-lg`
- Padding: `space-6`
- Shadow: `shadow-md`
- Hover: `shadow-lg` + slight translateY(-2px)

---

### Badges / Tags

| Variant | Background | Text |
|---------|------------|------|
| Default | `#E5E7EB` | `#374151` |
| Primary | `#DBEAFE` | `#1D4ED8` |
| Success | `#DCFCE7` | `#15803D` |
| Warning | `#FEF3C7` | `#B45309` |
| Danger | `#FEE2E2` | `#B91C1C` |

---

### Navigation

- Sidebar width: **240px** (expanded), **64px** (collapsed)
- Top navbar height: **64px**
- Active item: Nova Blue left border (3px) + light blue background
- Item padding: `12px 16px`
- Icon size: `20px`

---

## Iconography

- **Library:** Lucide Icons
- **Default size:** 20px (inline), 24px (standalone)
- **Stroke width:** 1.5px
- **Color:** Inherits from text color

---

## Motion & Animation

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `anim-fast` | 100ms | ease-out | Hover states |
| `anim-base` | 200ms | ease-in-out | Transitions |
| `anim-slow` | 350ms | ease-in-out | Modals, drawers |
| `anim-spring` | 400ms | cubic-bezier(0.34,1.56,0.64,1) | Scale-in effects |
| `anim-spin` | 800ms | linear, infinite | Loading indicator (360° rotation); stops with reduced motion |

---

## Grid & Layout

- **Max content width:** 1280px
- **Max modal width:** 512px (`container-dialog`); full available width on mobile
- **Gutter:** 24px
- **Columns:** 12
- **Breakpoints:**

| Name | Width |
|------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## Dark Mode

| Light Token | Dark Equivalent |
|-------------|-----------------|
| `#FFFFFF` background | `#0F172A` |
| `#F3F4F6` subtle bg | `#1E293B` |
| `#111827` text | `#F1F5F9` |
| `#4B5563` muted text | `#94A3B8` |
| `#E5E7EB` border | `#334155` |
| `#6B7280` placeholder | `#94A3B8` |
| `#2563EB` primary text (links, active tab, active nav item) | `#60A5FA` (Blue 400) |
| `#B91C1C` error text | `#EF4444` |

---

## Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text. Every text/background token pair is checked automatically in both themes (`src/styles/tests/design-tokens.contrast.test.ts`)
- All interactive elements have visible focus rings
- Touch targets minimum: **44x44px**
- All icons paired with aria-labels or visible text
- Keyboard navigable: Tab, Enter, Escape, Arrow keys supported

---

## Layout Patterns — Task Board

Adapted from the reference in `docs/design/task-board.taste.md` (image: `docs/design/task-board-reference.png`). Only the layout and hierarchy are adopted; all values below use the Kompitu tokens above.

### Principles
- **Tone, not elevation:** the shell is flat. Task cards sit on the page background with a 1px border and **no shadow at rest**.
- **Color only for status:** shell text and icons stay neutral. Saturated color appears only in status badges, column counters and the active tab or nav item.
- **Fixed columns:** board columns have a fixed width. Card height follows content.
- **One shell surface:** sidebar, top navbar and board share the `#F8FAFC` page background, separated by 1px `#E5E7EB` dividers. No dark or contrasting sidebar.

### App Shell
| Region | Spec |
|--------|------|
| Sidebar | 240px (64px collapsed), page background, 1px right divider |
| Top navbar | 64px, page background, 1px bottom divider; search input (MD) left, user avatar + notifications right |
| Board area | Padding `space-8`; scrolls horizontally when columns overflow |

### Sidebar Navigation
- User block at top: 40px avatar, name (Body SM, 600), role (Caption, muted).
- Section label: Caption, uppercase, muted text, wide letter-spacing, with a collapse chevron.
- Item: 20px icon + label (Body SM, 500) + optional counter on the right; padding `12px 16px`.
- Counter: Caption, `radius-full`, Primary badge colors (`#DBEAFE` / `#1D4ED8`), height 20px.

### Page Header
- Title: H1, followed by an optional ghost icon button (edit).
- View tabs: Body SM 500, gap `space-6`. Inactive: muted text. Active: Nova Blue text + 2px Nova Blue bottom border.
- Toolbar row (`space-6` below title):
  - Segmented control (Board View / List View): MD height, `radius-md`, 1px border.
  - Filters and search input (MD).
  - Square icon buttons: 40×40, ghost on surface, 1px border, `radius-md`.

### Board Columns
- Column width: **264px**, gap `space-6` (24px).
- Column header: title (Body, 600) + count pill (Caption, `radius-full`, same tint as the column status badge) + ghost "more" icon button on the right.
- Space from header to first card: `space-6`.
- "Add task" button at the end of each column: full column width, 32px tall, surface background, 1px dashed border, `radius-md`, centered 20px plus icon.

### Task Card
| Property | Value |
|----------|-------|
| Background | `#FFFFFF` (surface) |
| Border | `1px solid #E5E7EB` |
| Radius | `radius-md` |
| Padding | `space-4` |
| Gap between cards | `space-4` |
| Shadow | none at rest · `shadow-md` on hover · `shadow-xl` while dragging |
| Transition | `anim-fast` |

Content order:
1. **Title:** Body SM 500, max 2 lines, then ellipsis.
2. **Tags row** (gap `space-2`):
   - ID tag: Caption, outlined (`1px #E5E7EB`, transparent background).
   - Status badge (see mapping below).
3. **Footer row**, `space-3` below the tags:
   - Left: assignee avatars, 24px, overlapping by 8px; extra count shown as "+N".
   - Right: attachment and comment counts (20px icon + Caption, muted).

### Status → Badge Mapping
Task status always uses the existing badge variants; no new hues.

| Status meaning | Badge variant |
|----------------|---------------|
| Not started / backlog | Default |
| In progress | Primary |
| Needs review / blocked | Warning |
| Completed | Success |
| Overdue | Danger |

### Not Adopted from the Reference
- Right-hand team member rail: TaskFrontSDD is single-user.
- Pink and purple status hues: mapped to the existing badge variants above.
- 10px badge text: Caption (12px) is the minimum size.

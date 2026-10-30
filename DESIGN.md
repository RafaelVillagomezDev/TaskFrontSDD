# Kompitu Design System

## Brand Identity

**Brand Name:** Kompitu  
**Industry:** SaaS / Productivity  

---

## Color Palette

Warm and human: paper and ink in light mode, warm charcoal in dark mode, an unhurried teal accent and earthy status colors. No pure grays, no pure black and no pure white text: every neutral carries a little warmth, so the interface feels made by people rather than generated. Saturated color appears only where state lives (status badges, the active item, primary actions).

### Accent and Status Colors
| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Tide | `#0F6E66` | `#5CC8B8` (text and links `#6FD3C4`) | Primary actions, links, active item, focus ring |
| Clay | `#B03A24` | `#F07A63` | Errors, destructive actions |
| Leaf | `#2F7046` | `#6CC489` | Success, completed tasks |
| Honey | `#8A5A0C` | `#E8B25A` | Warnings, highlights |

On a filled accent, text is Paper 0 (`#FFFDFA`) in light mode and Coal 950 (`#191816`) in dark mode: the dark accents are light enough to need dark text.

### Neutral Colors
| Role | Light | Dark |
|------|-------|------|
| Page background | Paper 50 `#F7F5F2` | Coal 950 `#191816` |
| Surface (cards, inputs, modals) | Paper 0 `#FFFDFA` | Coal 900 `#22201E` |
| Subtle background | Paper 100 `#EFEBE6` | Coal 800 `#2C2A27` |
| Primary text | Ink 900 `#2A2622` | Coal 100 `#EEEAE4` |
| Secondary text and placeholder | Ink 500 `#6B645C` | Coal 400 `#A8A29A` |
| Borders and dividers | Paper 200 `#E7E2DB` | Coal 750 `#34312D` |
| Input border | Paper 500 `#948C82` | Coal 500 `#7A746C` |

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
| `overlay` | `rgba(42,38,34,0.4)` (Ink 900 at 40%) | `rgba(0,0,0,0.6)` | Backdrop behind modals and drawers |

---

## Components

### Buttons

#### Variants
- **Primary** — Filled, Tide background with its on-accent text (`#FFFDFA` in light, `#191816` in dark)
- **Secondary** — Outlined, Tide border and text
- **Ghost** — No border, transparent background
- **Destructive** — Filled, Clay background with its on-accent text (`#FFFDFA` in light, `#191816` in dark)
- **Link** — No background, underline on hover

#### Sizes
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| SM | 32px | 8px 12px | 14px |
| MD | 40px | 10px 16px | 15px |
| LG | 48px | 12px 24px | 16px |

#### States
- Default → Hover (10% darker) → Active (20% darker) → Disabled (40% opacity)
- Press: scales to 0.97 on `:active` with `anim-fast`, so the button confirms the touch; no scale with reduced motion and none on Link
- Focus: 2px offset ring in Tide

---

### Inputs

- Height: **40px** (MD), **48px** (LG)
- Border: `1px solid` input border (Paper 500 / Coal 500, at least 3:1 against the surface)
- Focus border: `2px solid` Tide
- Border radius: `radius-md`
- Padding: `12px 16px`
- Placeholder color: secondary text
- Error state: Clay border + error message below in Clay

---

### Cards

- Background: surface (`#FFFDFA` / `#22201E`)
- Border: `1px solid` border (`#E7E2DB` / `#34312D`)
- Border radius: `radius-lg`
- Padding: `space-6`
- Shadow: `shadow-md`
- Hover: `shadow-lg` + slight translateY(-2px)

---

### Badges / Tags

Tinted background and text in the same hue, per theme: a soft tint with deep text in light mode, a dark tint with bright text in dark mode.

| Variant | Light background / text | Dark background / text |
|---------|-------------------------|------------------------|
| Default | `#EFEBE6` / `#4A443D` | `#2C2A27` / `#D6D1CA` |
| Primary | `#E0F0EC` / `#0F6E66` | `#173A35` / `#6FD3C4` |
| Success | `#E3F1E7` / `#2F7046` | `#1C3524` / `#6CC489` |
| Warning | `#FBEFD9` / `#8A5A0C` | `#3B2C14` / `#E8B25A` |
| Danger | `#FBE6E0` / `#A3361F` | `#3D211B` / `#F07A63` |

---

### Navigation

- Sidebar width: **240px** (expanded), **64px** (collapsed)
- Top navbar height: **64px**
- Active item: Tide left border (3px) + tinted background (`#E0F0EC` / `#2C2A27`)
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

The app follows the operating system theme (spec RNF-05). Every color role in **Color Palette** has a light and a dark value; components only use the semantic tokens, never a literal color. Dark mode is warm charcoal, not black: `#191816` page, `#22201E` surfaces, `#34312D` borders, `#EEEAE4` text (never pure white, which glares on dark backgrounds) and the softer Tide `#5CC8B8`.

---

## Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text. Every text/background token pair is checked automatically in both themes (`src/styles/tests/design-tokens.contrast.test.ts`)
- Input borders and the focus ring: at least **3:1** against their background (WCAG 1.4.11), also checked in both themes
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
- **One shell surface:** sidebar, top navbar and board share the page background (`#F7F5F2` / `#191816`), separated by 1px border dividers. No contrasting sidebar.

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
- Counter: Caption, `radius-full`, Primary badge colors, height 20px.

### Page Header
- Title: H1, followed by an optional ghost icon button (edit).
- View tabs: Body SM 500, gap `space-6`. Inactive: muted text. Active: Tide text + 2px Tide bottom border.
- Toolbar row (`space-6` below title):
  - Segmented control (Board View / List View): MD height, `radius-md`, 1px border.
  - Filters and search input (MD).
  - Square icon buttons: 40×40, ghost on surface, 1px border, `radius-md`.

### Board Columns
- Column width: **264px**, gap `space-6` (24px).
- Column header: title (Body, 600) + count pill (Caption, `radius-full`, same tint as the column status badge) + ghost "more" icon button on the right.
- Space from header to first card: `space-6`.
- Empty column: a dashed 1px border box with no fill and muted text, so it weighs less than real cards.
- "Add task" button at the end of each column: full column width, 32px tall (44px on mobile), surface background, 1px dashed border, `radius-md`, centered 20px plus icon followed by the label "Añadir tarea" (Body SM, muted). Its accessible name starts with the visible label and adds the day ("Añadir tarea el jueves, 29 de octubre de 2026").

### Task Card
| Property | Value |
|----------|-------|
| Background | surface |
| Border | `1px solid` border |
| Radius | `radius-md` |
| Padding | `space-4` |
| Gap between cards | `space-4` |
| Shadow | none at rest · `shadow-md` on hover · `shadow-xl` while dragging |
| Transition | `anim-fast` |

Content order:
1. **Title:** Body SM 500, max 2 lines, then ellipsis.
2. **Tags row** (gap `space-2`):
   - ID tag: Caption, outlined (`1px` border, transparent background).
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
- Icon-only "Add task" button: the label is shown next to the plus icon, so an empty column clearly offers to create a task and voice users can say the visible name.

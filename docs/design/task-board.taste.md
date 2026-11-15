# Design Map

> Source: Figma "Free Task Board Dashboard Sample (Community)", frame `Tempalte` (1600×1252). Reference image: `task-board-reference.png`.
> Measured from a 103% zoom screenshot (values ÷1.03, ±1px). Colors are pixel samples. This is a **reference**, not a source of truth: `DESIGN.md` (Kompitu) wins on any conflict.

## Spacing Scale
- Base unit: 4px
- Card padding: ~20px
- Gap between cards (vertical): 16px
- Gap between columns: 24px
- Board inset from sidebar: ~36px
- Nav item pitch: 48px

## Font Hierarchy
- Page title ("Task Boards"): ~32px / 600
- Column title: ~16px / 500
- Card title, nav item: ~14px / 500
- Tabs, toolbar labels: ~13px / 500
- Section label (uppercase, tracked): ~12px / 500
- Badge, tag, counter: ~10px / 600
- Family: Inter (~approx)

## Color Palette
- App background (sidebar, header, board, rail): `#F7F8FA`
- Card / input surface: `#FFFFFF`
- Hairline divider: `#E9EBF0`
- Text primary: `#1F2633`
- Text muted: `#606C80`
- Accent (active tab + 2px underline, nav icons): ~`#3B82F6`
- Nav counter: bg `#E4ECFA`, blue text
- Status pills: To Do `#FDEDF5`/`#DB2777` · In Process & To Verify `#F6EEFE`/`#9333EA` · Done green `#16A34A` · Backlog `#FDF7E6`/amber · Design tag `#EBF2FE`/`#326CEC`
- Notification dot: `#EF4444`

## Image Ratios
- Avatars 1:1: ~24px in cards (stacked, ~8px overlap, "+5" counter), ~40px profile, ~32px member rail

## Component Tokens
- Radius: 8px (cards, inputs, toolbar buttons), 9999px (badges, counters, avatars)
- Shadows: none on cards; imperceptible on inputs
- Shell: sidebar ~300px · header ~86px · member rail ~88px · 1px dividers
- Board: 4 columns × ~264px, 24px gutter; column header = title + tinted count pill + "⋯" button
- Task card: title (≤2 lines) → row of tags (ID outlined, status tinted) → footer (avatars left, attachment/comment counts right)
- "Add task": full-width white bar (~32px) with centered plus icon at the end of each column
- View tabs: text tabs, active = accent text + 2px underline

---

# Taste DNA

### Tone instead of elevation
- **Trigger**: When separating 17 task cards from the board background
- **Decision**: Chose flat `#FFFFFF` cards on a `#F7F8FA` board with no border and no shadow over shadowed/bordered cards
- **Reason**: With a dozen-plus cards on screen, a shadow on each produces a dozen competing edges; a tonal step keeps the board readable as a grid of text
- **Evidence**: card edge goes directly `#F7F8FA` → `#FFFFFF` with no shadow pixels; radius 8px; 16px vertical gaps

### Color only where status lives
- **Trigger**: When encoding task state (Backlog, To Do, In Process, To Verify, Done)
- **Decision**: Chose ~10px tinted pills and matching column counters as the only saturated color over colored column headers or card backgrounds
- **Reason**: Scanning for state works when hue appears only where state is encoded; everything else stays in two grays
- **Evidence**: shell text `#1F2633` / `#606C80`; pills pink `#DB2777`, purple `#9333EA`, green `#16A34A`, amber; column counters reuse each status tint

### Fixed columns, variable cards
- **Trigger**: When laying out workflow columns on a 1600px frame
- **Decision**: Chose 4 fixed ~264px columns with 24px gaps over fluid columns that stretch to fill width
- **Reason**: A fixed column keeps card titles at a constant line length (2 lines max), so the eye scans the same horizontal positions in every column
- **Evidence**: column pitch ~288px = 264px card + 24px gap; titles wrap at ~32 characters; card heights vary 96–152px with content

### One shell surface, hairline seams
- **Trigger**: When splitting sidebar, header, board and member rail
- **Decision**: Chose a single `#F7F8FA` background for all four regions divided by 1px `#E9EBF0` lines over a dark or contrasting sidebar
- **Reason**: The chrome recedes and white cards become the only foreground layer, so attention lands on tasks, not navigation
- **Evidence**: sidebar, header, main and rail all sample `#F7F8FA`; dividers 1px `#E9EBF0` / `#EDEEF3`

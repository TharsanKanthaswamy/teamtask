---
name: spotify-design
description: Build or restyle UI in the minimal, dark, content-first look of Spotify's web player - near-black surfaces, white and grey text, a single green accent, pill buttons, rounded cards, clean dense lists, a three-panel app shell and a persistent bottom bar. Use this whenever the user asks for a Spotify-style, Spotify-like, sleek, minimal or clean dark UI, or asks you to style, restyle, polish or refactor any page, component, dashboard, table, form, chart, sidebar or layout in a project that has adopted this look, even if they never say the word Spotify.
---

# Spotify-style UI

The goal is an interface that feels quiet, confident and fast. The whole look rests on one idea: the interface itself is neutral and grayscale, and color only comes from two places, the content (images, thumbnails, data) and a single green accent that means "this is the main action" or "this is active". Almost every rule below is a way of protecting that idea, so when you hit a case this file doesn't cover, ask whether your choice makes the screen quieter, and whether it would look at home in a music player.

This file describes a visual language, not a brand. Do not use the Spotify name, logo, wordmark or any of their artwork in the app. The values below are close approximations of what the public web player looks like, so treat them as the spec to follow rather than something to verify.

If another design skill (for example `frontend-design`) is also loaded, this file wins on palette, typography and layout. Keep that skill's quality floor (accessibility, responsiveness, self-critique).

## How to work

Start by reading the project. Find the framework, the styling approach (Tailwind, CSS modules, styled-components, shadcn/ui, MUI, plain CSS) and the existing layout. Work inside what is already there. Do not add a second styling system, and do not rewrite component logic, routes, props or data fetching. This is a visual pass.

Put every color, radius, font and spacing value in one place as tokens (CSS variables in the global stylesheet, mapped into the Tailwind theme or the component library's theme if the project uses one). Components should read tokens and never hardcode hex values. That way the whole app can be adjusted from one file later.

Restyle from the outside in: page background and app shell first, then typography, then buttons and inputs, then cards, lists and tables, then charts, then the empty, loading and error states. After each stage run the app and look at it. If you can take screenshots, do, and compare against the rules here before moving on. Finish with the checklist at the bottom.

## Principles

Color comes from content, not chrome. Backgrounds, borders, icons and text are all neutral. If a screen has no images or data to supply color, it should look deliberately monochrome, not empty of ideas.

One accent, one meaning. Green marks the primary action, the active or playing item, and positive progress. It is never used as a background wash, a decorative border or a heading color.

Hierarchy comes from weight, size and shade of grey, not from boxes and lines. Prefer a bold white title over a bordered container. Prefer a slightly lighter surface over a divider.

Roundness signals interactivity. Pills are for buttons, chips and search. 8px is for containers. Circles are for people and the main play or primary icon action. Rectangles with sharp corners never appear.

The resting state is quiet. Secondary actions, row controls and the floating primary button on a card appear on hover or keyboard focus, not all the time.

## Tokens

```css
:root {
  color-scheme: dark;

  /* surfaces */
  --bg-base: #000000;              /* outermost frame, behind the panels */
  --bg-main: #121212;              /* main panels and page background */
  --bg-elevated: #181818;          /* cards */
  --bg-elevated-hover: #282828;    /* card hover, menus, modals, tooltips */
  --bg-input: #242424;             /* search field */
  --bg-tint: rgba(255,255,255,.07);        /* chips, skeletons */
  --bg-tint-hover: rgba(255,255,255,.1);   /* row hover, chip hover */
  --bg-selected: rgba(255,255,255,.2);     /* selected row */

  /* text */
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;      /* subtitles, table headers, inactive nav */
  --text-subdued: #6a6a6a;        /* disabled or decorative only, too low contrast for real text */

  /* accent (text on top of it is always black) */
  --accent: #1ed760;
  --accent-hover: #3be477;
  --accent-press: #169c46;

  /* lines */
  --border-subtle: rgba(255,255,255,.1);
  --border-control: #7c7c7c;      /* outlined buttons and inputs at rest */

  /* semantic, use for meaning only and always pair with an icon or label */
  --negative: #f3727f;
  --warning: #ffa42b;
  --info: #509bf5;

  /* shape */
  --radius-sm: 4px;               /* images, inputs, menu items */
  --radius-md: 8px;               /* cards, panels, modals */
  --radius-pill: 500px;           /* buttons, chips, search */

  /* type */
  --font-sans: "Figtree", "Circular Sp", "Helvetica Neue", Helvetica, Arial, sans-serif;

  /* floating elements only */
  --shadow-float: 0 16px 24px rgba(0,0,0,.3), 0 6px 8px rgba(0,0,0,.2);
}

* { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
body { background: var(--bg-base); color: var(--text-primary); font: 400 14px/1.4 var(--font-sans); }
```

Map these names into the project's theme (`theme.extend.colors` in Tailwind v3, `@theme` in v4, the theme object in MUI or similar) so utilities like `bg-main`, `bg-elevated` and `text-secondary` exist. If the project uses shadcn/ui, point its CSS variables (`--background`, `--card`, `--primary`, `--muted-foreground`, `--border`, `--ring`) at these tokens rather than editing every component.

## Typography

Spotify's own typeface (Circular) is licensed, so use Figtree, which is free and very close. In Next.js load it with `next/font/google`. In other setups use the Google Fonts link or self-host it. Keep the fallback stack in `--font-sans`. One family for everything.

Scale: page title 32px bold; section title 24px bold; card and row titles 16px bold; body 14px regular; captions and metadata 12 to 14px in `--text-secondary`. A hero title on a detail page can go large, `clamp(48px, 8vw, 96px)` at weight 900 with `letter-spacing: -0.04em` and `line-height: 1`. Use large titles only for the one entity a page is about.

Titles are white and bold. Everything supporting them is grey and regular. Truncate single-line titles with an ellipsis and clamp descriptions to two lines. Use `font-variant-numeric: tabular-nums` on any column of numbers, times or money. Write everything in sentence case. Do not use all-caps or letter-spaced uppercase labels.

## Layout

The app shell is a black page with 8px of padding and 8px gaps between rounded panels. The sidebar is a panel of fixed width (about 280px, collapsible to a 72px icon rail). The main content is a panel with its own scroll. A right panel of about 320px is optional for details or activity. Each panel is `--bg-main` with `--radius-md`. Along the bottom sits a 72px bar on `--bg-base` for whatever the app's persistent control is (a player, a status strip, a bulk-action bar, a running job). If the app has nothing persistent, leave it out rather than inventing one.

On narrow screens drop the gaps and rounding, make panels edge to edge, and turn the sidebar into a 56px bottom tab bar.

Organize content in shelves. A shelf is a section title on the left, an optional "Show all" text link on the right (grey, bold, underline on hover), then a responsive row of cards using `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` with a 24px gap. Sections are separated by 32 to 40px of space, not lines. Page padding is 24px. Use a 4px spacing base (4, 8, 12, 16, 24, 32).

Detail pages open with a header: a 232px image or icon tile, the hero title, a single line of grey metadata, then an action row with one large green circular button (56px), and secondary icon buttons beside it. Below that comes the list or table. When a page has a strong identity, the header may sit on a gradient from that identity's color (at about 40% alpha) fading to `--bg-main` over the first 300px. The color must come from the page's own content, and pages without a natural color stay flat.

Text is left aligned everywhere. Center alignment is only for empty states.

## Components

**Primary button.** Background `--accent`, black text, weight 700, 14px, height 48px (32 to 40px in compact places), horizontal padding 32px, pill radius. Hover: `--accent-hover` and `scale(1.04)`. Press: `--accent-press` and `scale(.98)`. Disabled: 50% opacity and no transform. Use at most one per view.

**Secondary button.** Transparent, white bold text, 1px `--border-control` border drawn with an inset shadow so size doesn't shift, pill radius. Hover: border turns white and the same 1.04 scale.

**Text and icon buttons.** No background, `--text-secondary`, hover to white. Icon buttons are at least 32px square with a 16 or 24px icon.

```css
.btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:48px; padding:0 32px;
  border-radius:var(--radius-pill); font:700 14px/1 var(--font-sans);
  transition: transform .15s ease, background-color .15s ease, box-shadow .15s ease; }
.btn-primary { background:var(--accent); color:#000; }
.btn-primary:hover { background:var(--accent-hover); transform:scale(1.04); }
.btn-primary:active { background:var(--accent-press); transform:scale(.98); }
.btn-secondary { background:transparent; color:#fff; box-shadow:inset 0 0 0 1px var(--border-control); }
.btn-secondary:hover { box-shadow:inset 0 0 0 1px #fff; transform:scale(1.04); }
```

**Cards.** Background `--bg-elevated`, padding 16px, `--radius-md`, no border, no resting shadow. On hover the background moves to `--bg-elevated-hover` over 300ms. The image sits at the top as a square, `--radius-sm` (fully round for people), with a soft shadow `0 8px 24px rgba(0,0,0,.5)`, and 16px below it comes a bold 16px title and a grey 14px subtitle. The whole card is one link or button target. If the card has a primary action, show it as a 48px green circle at the bottom right of the image that fades in and rises 8px on hover and on `:focus-within`.

```css
.card { padding:16px; background:var(--bg-elevated); border-radius:var(--radius-md); transition:background-color .3s ease; }
.card:hover { background:var(--bg-elevated-hover); }
.card__media { position:relative; margin-bottom:16px; }
.card__media img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:var(--radius-sm); box-shadow:0 8px 24px rgba(0,0,0,.5); }
.card__action { position:absolute; right:8px; bottom:8px; width:48px; height:48px; border-radius:50%;
  background:var(--accent); color:#000; opacity:0; transform:translateY(8px);
  transition:opacity .2s ease, transform .2s ease; box-shadow:0 8px 8px rgba(0,0,0,.3); }
.card:hover .card__action, .card:focus-within .card__action { opacity:1; transform:none; }
```

**Lists and tables.** No cell borders and no zebra striping. Rows are 56px tall (40px in compact mode) and laid out with CSS grid. The header row is sticky, 36px, grey 14px text, with a single 1px `--border-subtle` line underneath. Row hover is `--bg-tint-hover` with a 4px radius, and a selected row uses `--bg-selected`. The main column shows a white title with a grey second line. Numeric columns are right aligned with tabular numbers. Row actions are icon buttons that only appear on hover or focus. An index number can swap to an action icon on hover.

```css
.row { display:grid; grid-template-columns:16px minmax(0,4fr) minmax(0,2fr) minmax(120px,1fr); gap:16px;
  align-items:center; height:56px; padding:0 16px; border-radius:var(--radius-sm); }
.row:hover { background:var(--bg-tint-hover); }
```

**Chips and filters.** Height 32px, padding 0 12px, pill radius, `--bg-tint` background, white 14px text. Hover uses `--bg-tint-hover`. Selected is white background with black text. Use chips instead of underlined tabs or segmented controls.

**Search and inputs.** The search field is a pill, 48px tall, `--bg-input`, a leading icon, grey placeholder, no border. Standard form inputs are `--radius-sm`, `--bg-main` background, a 1px `--border-control` border, 14px padding, white border on hover and a 2px white outline on focus. Labels are 14px bold white above the field. Helper text is grey. Error text uses `--negative` with an icon and says what to fix.

**Sliders, progress and toggles.** Track is 4px high, `#4d4d4d`, fully rounded, and the fill is white. On hover the fill turns `--accent` and a 12px white thumb appears. Toggles are green when on, grey when off.

**Navigation.** Sidebar items are 40px tall with a 24px icon and a 14 to 16px bold label. Inactive is `--text-secondary`, hover and active are white, and active also swaps the icon to its filled variant. There is no background pill on the active item. Lists inside the sidebar use 48px rows with a 48px rounded thumbnail and two lines of text.

**Menus, popovers, modals, tooltips.** Background `--bg-elevated-hover`, `--shadow-float`, radius 4px for menus and tooltips and 8px for modals. Menu items are 40px, 14px text, hover `--bg-tint-hover`, dividers are 1px `--border-subtle`. Modal overlay is `rgba(0,0,0,.7)`. These are the only elements in the app that get a shadow.

**Status badges.** Small pill, 12px bold, tinted background at about 15% of the semantic color with text in that color, plus a label or icon so color is never the only signal. Solid saturated fills are reserved for the green primary button.

**Empty, loading and error states.** Empty states are centered, with a 24px bold title, one grey line saying what to do, and one pill button. Loading uses skeletons filled with `--bg-tint` and no spinners on full pages. Errors say what happened and how to fix it in plain words, with no apology and no exclamation marks.

**Charts.** Transparent background, horizontal gridlines only at `rgba(255,255,255,.08)`, axis text 12px `--text-secondary`. The main series is `--accent`, secondary series are white, `#b3b3b3` and `#535353`. Use `--negative` and `--warning` only when the data means risk or a problem. Line width 2px, bar tops rounded by 2px, area fills at 15% opacity or less, no gradients, no 3D, and never a default rainbow palette. Tooltips follow the popover style.

## Adapting to apps that aren't about music

Most apps using this skill are dashboards or tools, not players. Translate the pieces like this.

| Spotify idea | Use it for |
|---|---|
| Card with cover art | Entity card (account, project, customer, document) with a thumbnail, avatar or icon tile |
| Shelf with "Show all" | A dashboard section with a title and a link to the full list |
| Tracklist | Any data table: transactions, users, logs, alerts |
| Chips | Filters, status filters, time ranges |
| Now-playing bar | Persistent status or action strip: running job, selected items, session info |
| Library sidebar | Primary navigation plus recent or pinned items |
| Green play circle | The single main action on a card or page header |
| Progress bar | Scores, completion, quotas, risk levels |

Stat blocks should be quiet: a 32px bold number, a grey label under it, no card chrome unless it is clickable. Forms should be single-column, left aligned and generously spaced.

## Motion

Only motion the user triggers is allowed: hover and press transitions of 150 to 300ms, the card action reveal, panel expand and collapse, and menu open. Do not add page-load animations, staggered entrances, parallax or bouncy easing. Honor reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
  .btn:hover, .btn:active { transform: none; }
}
```

## Icons and imagery

Use one outline icon set (Lucide or Phosphor at regular weight) at 16 or 24px with `currentColor`. Use the filled variant for active or selected states. Never use emoji as icons. Prefer real images, thumbnails and avatars because they supply the color. Where there is no image, use a `--bg-elevated-hover` tile with a centered grey icon, not a gradient.

## Copy

Sentence case, short, plain verbs. A button says what it does ("Add to list", "Save changes") and the same action keeps the same name across the flow. No exclamation marks, no filler, no jokes in errors.

## Things that break the look

Using more than one accent color, or using green as decoration. White or light cards on the dark background. Borders around cards, shadows under cards, glassmorphism, neon glows or decorative gradients. Square or slightly rounded rectangular buttons. Gridlines and zebra stripes in tables. All-caps eyebrow labels. Centered body text. Bouncy or entrance animations. Dense screens with no breathing room, since spacing is doing much of the work of making this look minimal. Dropping the app's Spotify name, logo or artwork in anywhere.

If the app truly needs a light theme, treat it as a separate deliberate pass: white page, `#f6f6f6` surfaces, black and `#6a6a6a` text, and green only as a fill with black text on it, never as green text on white. Build the dark theme first and add light only when asked.

## Quality floor

Text contrast must pass. `--text-secondary` on `--bg-main` is fine, and `--text-subdued` is for disabled or decorative use only. Text on green is always black. Every interactive element has a visible `:focus-visible` outline, and nothing removes an outline without replacing it. Hit targets are at least 32px, ideally 40px. The layout works down to 360px wide: cards reflow with `auto-fill`, the sidebar becomes a tab bar, and wide tables either scroll inside their own container or collapse to stacked rows. Status never relies on color alone.

## Before you finish

Confirm that no component contains a raw hex value, that green appears only on primary actions, active states and positive progress, that every button and chip is a pill, that every container is 8px, that cards and tables have no borders or resting shadows, that focus rings are visible when tabbing through the page, and that resizing to mobile width still looks intentional. Then remove one thing that isn't earning its place.
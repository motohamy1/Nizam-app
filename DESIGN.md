---
name: Nizam
description: Dual-register quartet system — obsidian dark with pastel accents (#f6e5f9 family), daylight light with saturated same-hue inks, clean typography, rich contrast
colors:
  bg: "#0E0F14"
  surface: "#181922"
  surface-high: "#222432"
  text: "#FFFFFF"
  muted: "#8E92A0"
  border: "#282A38"
  primary: "#dbd4fd"
  success: "#e5f19d"
  warning: "#f6e5c9"
  info: "#defef9"
  danger: "#FB7185"
  palette:
    cream: "#f6e5c9"
    lime: "#e5f19d"
    mint: "#defef9"
    lavender: "#dbd4fd"
colorsLight:
  bg: "#F3F3FC"
  surface: "#FFFFFF"
  surface-high: "#ECECF9"
  text: "#1E1B35"
  muted: "#60627E"
  border: "#DDDCEF"
  primary: "#6C38E9"
  success: "#007835"
  warning: "#9D5200"
  info: "#007973"
  danger: "#BB2441"
  gemFills:
    lavender: "#C7C2FF"
    lime: "#A4E200"
    mint: "#00E8DE"
    cream: "#FFB986"
  palette:
    cream: "#9D5200"
    lime: "#547600"
    mint: "#007973"
    lavender: "#6C38E9"
typography:
  display:
    fontFamily: System
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: System
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: System
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: System
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  full: "28px"
  tab: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
---

# Design System: Nizam (Precision Quartet, Two Registers)

## 1. Overview

**Creative North Star: "Precision Obsidian Quartet"**

Nizam is a dual-register system built on one hue family with two lightness strategies. Dark mode paints with pastels on obsidian (`#0E0F14`); light mode paints with **electric pastel gems and vivid same-hue inks** on a lavender mist (`#F3F3FC`) — the pastel quartet is pushed to maximum chroma per lightness so its playful identity survives the register switch instead of being flattened to brown. Foreground colors on white flow through `modeColor()`, gem fills through `fillColor()`, and text on any fill through `textOn()` — all in `utils/colorUtils.ts`.
- **Warm Cream (`#f6e5c9`)** — Warmth, elevated FAB action button, in-progress indicator, warm category theme
- **Pastel Lime (`#e5f19d`)** — Energy, completion/done status, streak/productivity metrics, chartreuse theme
- **Ice Mint (`#defef9`)** — Glacial serenity, upcoming events, calendar chips, checklist accents, aqua theme
- **Soft Lavender (`#dbd4fd`)** — Brand primary accent, To-Do status, active tabs, focus mode, lilac theme

## 2. Colors

### Dark Mode (Default)

| Token | Hex | Role | Text Contrast |
|-------|-----|------|---------------|
| bg | #0E0F14 | Obsidian base background (Preserved) | - |
| surface | #181922 | Cards and elevated containers | #FFFFFF |
| surfaceHigh | #222432 | Modals, sheets, inputs | #FFFFFF |
| text | #FFFFFF | Crisp pure white text | - |
| textMuted | #8E92A0 | Secondary & placeholder text | - |
| border | #282A38 | Subtle dark border / divider | - |
| primary / lavender | #dbd4fd | Soft Lavender — To Do, active tabs, focus | #23173D (Dark Plum) |
| success / lime | #e5f19d | Pastel Lime — Done, streak, completion | #16270E (Dark Forest) |
| warning / cream | #f6e5c9 | Warm Cream — In Progress, FAB, milestones | #2D1E0C (Dark Espresso) |
| info / mint | #defef9 | Ice Mint — Upcoming events, calendar chips | #0A2B3A (Dark Teal) |
| danger | #FB7185 | Coral Rose — overdue, critical alert | #FFFFFF |

### Light Mode (Daylight Register — three tiers)

The brand grammar is "colored gem fill + deep same-hue ink text" (status pills, FAB, chips). Light mode keeps that exact grammar: pastels get pushed to the **maximum chroma their lightness allows** (OKLCH, constant hue) so gems stay electric instead of vanishing into white. Muddy mid-L "brown/olive" inks are replaced by inks nudged toward the vivid side of each hue (cream 85°→57° orange, lime 117°→127° leaf, mint/violet kept).

| Tier | Role | lavender | lime | mint | cream |
|------|------|----------|------|------|-------|
| **Gem fill** `fillColor()` | FAB, dock bubble, date pills, status chips, CTAs — always with deep ink text | `#C7C2FF` | `#A4E200` | `#00E8DE` | `#FFB986` |
| **Ink** `modeColor()` | text, icons, thin bars, dots on white/mist — ≥4.5:1 | `#6C38E9` | `#547600` | `#007973` | `#9D5200` |
| **Tint wash** | chip/row backgrounds, ink sits on it ≥4.5:1 | `#EBEAFF` | `#E5F3D3` | `#CCF7F3` | `#FFE8D8` |

| Token | Hex | Contrast |
|-------|-----|----------|
| bg / surface / surfaceHigh | #F3F3FC / #FFFFFF / #ECECF9 | lavender mist (0.013 chroma, H288) |
| text / textMuted / border | #1E1B35 / #60627E / #DDDCEF | 14–15:1 · 5.1:1 · hairline |
| primary + white text | #6C38E9 | 6.2:1 both directions |
| success | #007835 | 5.6:1 on white · 5.6:1 white-on |
| warning | #9D5200 | 5.8:1 |
| info | #007973 | 5.3:1 |
| danger | #BB2441 | 6.4:1 · white-on 6.4:1 |
| task rows | in-progress #EBEAFF · done #E5F3D3 · not-done #FDE2E8 · paused #F1F0F8 | body text 14:1+ |

Gem fills carry the brand inks: forest `#16270E` on chartreuse (10.1:1), plum `#23173D` on periwinkle (10.0:1), espresso `#2D1E0C` on apricot (9.6:1), dark teal `#04463F` on aqua.

### Harmonic Combinations

1. **Lavender + Lime (`#dbd4fd` & `#e5f19d`)**: Productivity Card (Lavender focus CTA + Lime streak flame).
2. **Lavender + Mint (`#dbd4fd` & `#defef9`)**: Upcoming Events Card (Lavender badge + Mint time chip) & Voice Hero Glow.
3. **Cream + Lavender (`#f6e5c9` & `#dbd4fd`)**: Monthly Overview Card (Cream badge + Lavender progress bar) & Bottom Bar (Cream FAB + Lavender tab active).
4. **Mint + Lime (`#defef9` & `#e5f19d`)**: Today's Checklist Card (Mint badge + Lime completion checks).
5. **Cream + Lime (`#f6e5c9` & `#e5f19d`)**: Dynamic progress pairing for task state workflows.
6. **Quad Aurora Gradient**: `['#f6e5c9', '#e5f19d', '#defef9', '#dbd4fd']` for ambient glows and project swatches.

### No Pure Black

Background is warm charcoal `#141518` in dark mode, never `#000000`. Text is `#F0EFEA` (warm off-white), never pure white.

## 3. Typography

System fonts only (SF Pro on iOS, Roboto on Android). No Inter, no Google Fonts, no decorative faces.

| Level | Size | Weight | Line | Use |
|-------|------|--------|------|-----|
| Display | 32px | 700 | 1.15 | Screen headings |
| Title | 20px | 600 | 1.25 | Card titles, modals |
| Body | 16px | 400 | 1.6 | Task text, descriptions |
| Label | 12px | 600 | 1.3 | Status, meta, tabs |

## 4. Elevation

Directional, tight, color-matched shadows. Three levels:

| Level | Value | Use |
|-------|-------|-----|
| sm | `0 1px 3px rgba(0,0,0,0.25)` | Cards, inputs |
| md | `0 2px 8px rgba(0,0,0,0.35)` | FAB, dropdowns |
| lg | `0 4px 16px rgba(0,0,0,0.45)` | Modals, sheets |

No neomorphic opposing shadows. No glow. No blur. Single-direction, single-color shadows that sit tight to the element.

## 5. The Signature: Active Trace

The currently focused item gets a 3px amber edge on one side (left in LTR, right in RTL). Like a highlighter stripe that says "this one." Applied to:
- Active task cards
- Active filter pills
- Active navigation tab (underline variant)

This is the single visual signature that makes Nizam recognizable.

## 6. Spacing Scale

Strict multiples: 4, 8, 16, 24, 32, 48, 64. No 12px. No 6px spacing (radius only, not spacing).

## 7. Components

### Buttons
- Primary: Amber fill, charcoal text, 20px radius, md shadow
- Secondary: Surface fill, ink text, 1px border, 10px radius
- Icon: 36x36, surface fill, border, 10px radius

### Cards
- Surface background, 14px radius, 1px border, sm shadow
- Active card gets 3px amber left/right edge

### Inputs
- Surface background, 1px border, 14px radius
- Focus: amber border, no ring

### Tab Bar
- Background matches page bg
- Active tab: amber color
- No shadow, no extrusion

## 8. Do's and Don'ts

### Do
- Do use amber exclusively for CTAs and the active trace
- Do use the spacing scale strictly (4/8/16/24/32/48/64)
- Do use system fonts only
- Do use bordered surfaces, not shadow-only separation
- Do keep body text at 65-75 characters per line
- Do support RTL with mirrored active trace
- Do map every brand pastel through `modeColor()` before rendering it as text, icon, or thin stroke on a light surface
- Do render light-mode buttons, pills, and FABs as `fillColor()` electric gems carrying the brand's dark inks — never mid-L mud colors
- Do keep dark-mode literals byte-identical; light-mode values branch alongside them (same file, same ternary)

### Don't
- Don't use pure black `#000000` anywhere
- Don't use neomorphic opposing shadows
- Don't introduce second accent colors
- Don't use decorative gradients, glows, or pills
- Don't use Google Fonts or decorative faces
- Don't use 12px spacing
- Don't reuse dark-register pastels as foreground in light mode — `#e5f19d` / `#dbd4fd` / `#defef9` / `#f6e5c9` on white are 1.07–1.41:1, i.e. invisible; use their ink twins
- Don't pair a saturated ink fill with `secondaryText`/dark plum text — text on fills comes from `textOn()` (white on ink, near-black on pastel)

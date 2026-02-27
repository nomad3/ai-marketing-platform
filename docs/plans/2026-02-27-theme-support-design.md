# White & Dark Theme Support — Design

## Overview

Add light (default) and dark theme toggle to the HCA Deal Intelligence platform. CSS-variable-driven theming with React context for state management.

## Architecture

- **CSS-variable-driven** — Light values as `:root` default, dark values under `[data-theme="dark"]`
- **ThemeContext** — React context + `useTheme()` hook, persists to `localStorage`
- **ThemeProvider** wraps `<App>` alongside `AuthProvider`

## Theme Variables

Swap only color/shadow tokens (~20 variables). Spacing, radius, fonts, transitions unchanged.

| Token | Light (default) | Dark |
|-------|----------------|------|
| `--bg-primary` | `#f5f7fa` | `#0a0e27` |
| `--bg-secondary` | `#ffffff` | `#151932` |
| `--bg-tertiary` | `#eef1f6` | `#1e2139` |
| `--bg-card` | `rgba(255,255,255,0.9)` | `rgba(30,33,57,0.8)` |
| `--bg-card-hover` | `rgba(255,255,255,1)` | `rgba(30,33,57,0.95)` |
| `--text-primary` | `#1a1a2e` | `#ffffff` |
| `--text-secondary` | `#4a5568` | `#b8c1ec` |
| `--text-muted` | `#8892b0` | `#8892b0` |
| `--border-color` | `rgba(0,0,0,0.1)` | `rgba(102,126,234,0.2)` |
| `--border-hover` | `rgba(0,0,0,0.2)` | `rgba(102,126,234,0.4)` |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.05)` | `0 2px 8px rgba(0,0,0,0.1)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | `0 4px 16px rgba(0,0,0,0.2)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.1)` | `0 8px 32px rgba(0,0,0,0.3)` |
| `--shadow-glow` | `0 0 40px rgba(102,126,234,0.15)` | `0 0 40px rgba(102,126,234,0.3)` |

Primary/accent/gradient colors stay the same — brand colors.

## Toggle Component

- **Sidebar footer**: Sun/moon icon button next to user info
- **Non-sidebar pages** (login, register): Floating icon button, top-right corner
- Smooth CSS transition on swap (`transition: background-color 0.3s, color 0.3s`)

## Scope

- Landing page: **excluded** — always dark
- Login, Register: themed (light default, toggle available)
- All authenticated pages: themed via sidebar toggle

## Hardcoded Colors

~289 hardcoded hex/rgba values across CSS files. Strategy:
- Replace visible ones (backgrounds, text, borders) with CSS variables
- Leave decorative values (hero glows, accent gradients) that work in both themes

## Out of Scope

- No per-component theme overrides
- No system preference detection
- No theme customization beyond light/dark

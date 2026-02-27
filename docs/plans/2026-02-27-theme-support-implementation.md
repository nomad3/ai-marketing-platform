# White & Dark Theme Support — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add light-first theming with dark mode toggle across all pages except the landing page.

**Architecture:** CSS-variable-driven — light values as `:root` default, current dark values under `[data-theme="dark"]`. React ThemeContext manages state and persists to localStorage. Toggle button in sidebar footer + floating button on auth pages.

**Tech Stack:** React Context API, CSS custom properties, lucide-react icons (Sun/Moon), localStorage

---

### Task 1: Create ThemeContext and ThemeProvider

**Files:**
- Create: `frontend/src/context/ThemeContext.tsx`

**Step 1: Create the context file**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' ? 'dark' : 'light') as Theme;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Step 2: Wrap App with ThemeProvider**

Modify: `frontend/src/App.tsx`

```tsx
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ... existing routes ... */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

ThemeProvider must wrap outside AuthProvider so theme is available everywhere including login/register.

**Step 3: Commit**

```bash
git add frontend/src/context/ThemeContext.tsx frontend/src/App.tsx
git commit -m "feat: add ThemeContext with light/dark toggle and localStorage persistence"
```

---

### Task 2: Update index.css — light default, dark override

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Replace the `:root` color variables with light theme values, add `[data-theme="dark"]` block**

Change the `:root` block. Keep spacing, typography, radius, transitions, gradients, and solid brand colors (--primary, --secondary, --accent, --success) unchanged. Only swap the theme-dependent tokens:

```css
:root {
  /* ... gradients, solid colors, spacing, typography, radius, transitions — UNCHANGED ... */

  /* Neutrals - Light Theme (default) */
  --bg-primary: #f5f7fa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #eef1f6;
  --bg-card: rgba(255, 255, 255, 0.9);
  --bg-card-hover: rgba(255, 255, 255, 1);

  /* Text Colors */
  --text-primary: #1a1a2e;
  --text-secondary: #4a5568;
  --text-muted: #8892b0;

  /* Borders & Shadows */
  --border-color: rgba(0, 0, 0, 0.1);
  --border-hover: rgba(0, 0, 0, 0.2);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 40px rgba(102, 126, 234, 0.15);
}

/* Dark Theme Override */
[data-theme="dark"] {
  --bg-primary: #0a0e27;
  --bg-secondary: #151932;
  --bg-tertiary: #1e2139;
  --bg-card: rgba(30, 33, 57, 0.8);
  --bg-card-hover: rgba(30, 33, 57, 0.95);

  --text-primary: #ffffff;
  --text-secondary: #b8c1ec;
  --text-muted: #8892b0;

  --border-color: rgba(102, 126, 234, 0.2);
  --border-hover: rgba(102, 126, 234, 0.4);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 40px rgba(102, 126, 234, 0.3);
}
```

**Step 2: Add smooth theme transition to body**

```css
body {
  /* existing properties unchanged */
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Step 3: Update glass effect for light theme**

The `.glass` class uses hardcoded `rgba(255, 255, 255, 0.05)` — works for dark only. Add:

```css
.glass {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}
```

**Step 4: Update `.animated-bg` for light theme**

The animated background uses hardcoded dark radial gradients. Make it theme-aware by hiding it in light mode:

```css
[data-theme="dark"] .animated-bg::before {
  background: radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 50%, rgba(245, 87, 108, 0.15) 0%, transparent 50%);
}
```

And change `.animated-bg::before` default to transparent gradients or very subtle light ones.

**Step 5: Update `.badge` hardcoded colors**

```css
.badge {
  background: rgba(102, 126, 234, 0.15);
  color: var(--primary);
  border: 1px solid rgba(102, 126, 234, 0.25);
}
```

**Step 6: Update `.spinner` hardcoded color**

```css
.spinner {
  border: 4px solid var(--border-color);
  border-top-color: var(--primary);
}
```

**Step 7: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add light/dark CSS variable theming to design system"
```

---

### Task 3: Create ThemeToggle component

**Files:**
- Create: `frontend/src/components/ThemeToggle.tsx`
- Create: `frontend/src/components/ThemeToggle.css`

**Step 1: Create the component**

```tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  floating?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ floating = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${floating ? 'theme-toggle-floating' : ''}`}
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};

export default ThemeToggle;
```

**Step 2: Create the CSS**

```css
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Floating variant for auth pages */
.theme-toggle-floating {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.theme-toggle-floating:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-lg);
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/ThemeToggle.tsx frontend/src/components/ThemeToggle.css
git commit -m "feat: add ThemeToggle component with sidebar and floating variants"
```

---

### Task 4: Add theme toggle to sidebar

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx` (sidebar footer area, ~line 171-188)

**Step 1: Import ThemeToggle**

Add import at top of Dashboard.tsx:

```tsx
import ThemeToggle from '../components/ThemeToggle';
```

**Step 2: Add ThemeToggle next to logout button**

In the `.sidebar-footer` > `.user-profile` div, add `<ThemeToggle />` before the logout button:

```tsx
<div className="user-profile">
  <div className="user-avatar">
    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
  </div>
  <div className="user-info">
    <div className="user-name">{user?.name || 'User'}</div>
    <div className="user-email">{user?.email || ''}</div>
  </div>
  <ThemeToggle />
  <button
    className="logout-btn"
    onClick={handleLogout}
    title="Logout"
  >
    <LogOut size={16} />
  </button>
</div>
```

**Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add theme toggle to sidebar footer"
```

---

### Task 5: Add floating theme toggle to Login and Register

**Files:**
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`

**Step 1: Add floating toggle to Login.tsx**

Import and add inside the `.login-page` div, before the hero:

```tsx
import ThemeToggle from '../components/ThemeToggle';

// Inside the return, first child of .login-page:
<div className="login-page">
  <ThemeToggle floating />
  <div className="login-hero">
  {/* ... */}
```

**Step 2: Add floating toggle to Register.tsx**

Same pattern:

```tsx
import ThemeToggle from '../components/ThemeToggle';

<div className="register-page">
  <ThemeToggle floating />
  <div className="register-hero">
  {/* ... */}
```

**Step 3: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat: add floating theme toggle to login and register pages"
```

---

### Task 6: Fix Login.css and Register.css hardcoded colors

**Files:**
- Modify: `frontend/src/pages/Login.css`
- Modify: `frontend/src/pages/Register.css`

The hero sections use hardcoded dark gradients (`#0f1335`, `#1a1150`, `#0d1137`). These need to be theme-aware.

**Step 1: Update Login.css hero**

Replace the hardcoded hero background:

```css
.login-hero {
  /* ... keep layout properties ... */
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%);
}

[data-theme="dark"] .login-hero {
  background: linear-gradient(135deg, #0f1335 0%, #1a1150 50%, #0d1137 100%);
}
```

Update hero glow for light theme:

```css
.login-hero-glow {
  background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
}

[data-theme="dark"] .login-hero-glow {
  background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
}
```

Update input backgrounds — replace `rgba(255, 255, 255, 0.04)` with variable:

```css
.login-input-wrapper input {
  background: var(--bg-tertiary);
}
```

Update error box — replace hardcoded `rgba(245, 87, 108, 0.1)`:

```css
.login-error {
  background: rgba(245, 87, 108, 0.08);
  border: 1px solid rgba(245, 87, 108, 0.2);
}
```

Update hero title gradient for light mode — the white-to-light-purple gradient won't work on light backgrounds:

```css
.login-hero-title {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

[data-theme="dark"] .login-hero-title {
  background: linear-gradient(135deg, #ffffff 0%, #b8c1ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Step 2: Apply identical changes to Register.css**

Same pattern: hero background, glow, input backgrounds, hero title gradient.

**Step 3: Commit**

```bash
git add frontend/src/pages/Login.css frontend/src/pages/Register.css
git commit -m "feat: add light/dark theme support to login and register pages"
```

---

### Task 7: Fix Dashboard.css hardcoded colors

**Files:**
- Modify: `frontend/src/pages/Dashboard.css`

**Step 1: Replace hardcoded sidebar and card backgrounds**

Search for hardcoded `rgba` and hex values in Dashboard.css and replace with CSS variables where they refer to backgrounds, text, or borders. Keep platform-specific badge colors (Facebook blue, Google red, etc.) as-is — those are brand colors.

Key replacements:
- Any `rgba(102, 126, 234, 0.1)` hover backgrounds → `var(--bg-tertiary)`
- Any `rgba(255, 255, 255, 0.05)` glass effects → `var(--bg-card)`
- Any hardcoded `#fff` or `white` for text → `var(--text-primary)`

**Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.css
git commit -m "feat: replace hardcoded colors in Dashboard.css with theme variables"
```

---

### Task 8: Fix Analytics.css hardcoded colors

**Files:**
- Modify: `frontend/src/pages/Analytics.css`

Analytics has the most hardcoded values (~25). Key replacements:

- `#fff` → `var(--text-primary)`
- `#a5b4fc`, `#94a3b8` text → `var(--text-secondary)`
- `rgba(255, 255, 255, 0.05)` backgrounds → `var(--bg-card)`
- Chart-specific colors (green `#10b981`, red `#ef4444`, etc.) — leave as-is, these are data visualization colors

**Step 1: Replace theme-dependent colors**

**Step 2: Commit**

```bash
git add frontend/src/pages/Analytics.css
git commit -m "feat: replace hardcoded colors in Analytics.css with theme variables"
```

---

### Task 9: Fix remaining page CSS files

**Files:**
- Modify: `frontend/src/pages/Prospects.css`
- Modify: `frontend/src/pages/ProspectDetail.css`
- Modify: `frontend/src/pages/Pipeline.css`
- Modify: `frontend/src/pages/Campaigns.css`

**Step 1: For each file, replace hardcoded backgrounds and text colors with variables**

Strategy per file:
- Replace `rgba(255, 255, 255, *)` backgrounds → `var(--bg-card)` or `var(--bg-secondary)`
- Replace hardcoded `#fff` text → `var(--text-primary)`
- Keep badge/status colors (industry colors, stage colors) as-is — they need to be distinct in both themes
- Keep gradient accents as-is

**Step 2: Commit**

```bash
git add frontend/src/pages/Prospects.css frontend/src/pages/ProspectDetail.css frontend/src/pages/Pipeline.css frontend/src/pages/Campaigns.css
git commit -m "feat: replace hardcoded colors in page CSS files with theme variables"
```

---

### Task 10: Fix component CSS files

**Files:**
- Modify: `frontend/src/components/AICampaignBuilder.css`
- Modify: `frontend/src/components/CampaignCreator.css`
- Modify: `frontend/src/components/CampaignTemplates.css`
- Modify: `frontend/src/components/ContentGenerator.css`
- Modify: `frontend/src/components/ProspectDiscovery.css`

**Step 1: Same pattern — replace hardcoded backgrounds/text with variables**

These files are already mostly variable-based, so fewer changes needed.

**Step 2: Commit**

```bash
git add frontend/src/components/*.css
git commit -m "feat: replace hardcoded colors in component CSS files with theme variables"
```

---

### Task 11: Force dark theme on Landing page

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx`

**Step 1: Add `data-theme="dark"` to the landing page wrapper**

The landing page should always render in dark mode regardless of the global theme setting.

In LandingPage.tsx, add the attribute to the outermost div:

```tsx
<div className="landing-page" data-theme="dark">
```

This forces all CSS variable lookups within the landing page subtree to use dark values.

**Step 2: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: force dark theme on landing page"
```

---

### Task 12: Build, deploy to Docker, and smoketest

**Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Fix any errors.

**Step 2: Rebuild Docker**

```bash
docker compose up -d --build frontend
```

**Step 3: Smoketest in Chrome — light theme (default)**

Navigate through all pages and verify light theme renders correctly:
- `/login` — light background, readable form, floating toggle visible
- `/register` — same
- `/dashboard` — light sidebar, light cards, toggle in sidebar footer
- `/prospects` — light table, colored badges still visible
- `/prospects/:id` — score gauge, breakdown bars readable
- `/pipeline` — kanban columns light, cards readable
- `/analytics` — charts visible on light background
- `/` (landing) — still dark, unaffected

**Step 4: Smoketest in Chrome — dark theme**

Click theme toggle and verify dark mode matches the previous design exactly.

**Step 5: Verify persistence**

Refresh the page — theme should persist from localStorage.

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: theme smoketest fixes"
```

**Step 7: Push**

```bash
git push origin main
```

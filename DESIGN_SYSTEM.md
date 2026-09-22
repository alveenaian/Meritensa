# Kairav.ai Design System

This document explains the complete design system for Kairav.ai. All design tokens are centralized in two files for easy editing:

1. **`src/styles.css`** - CSS variables, custom animations, and utility classes
2. **`tailwind.config.mjs`** - Tailwind theme extensions

## 🎨 Color Palette

### Primary Colors (Indigo)
Used for main actions, links, and brand elements.

```css
--primary-50: #eef2ff   /* Lightest - backgrounds */
--primary-100: #e0e7ff
--primary-200: #c7d2fe
--primary-300: #a5b4fc
--primary-400: #818cf8
--primary-500: #6366f1  /* Base primary */
--primary-600: #4f46e5  /* Main brand color */
--primary-700: #4338ca
--primary-800: #3730a3
--primary-900: #312e81
--primary-950: #1e1b4b  /* Darkest */
```

### Secondary Colors (Slate)
Used for text, borders, and neutral elements.

```css
--secondary-50: #f8fafc   /* Lightest backgrounds */
--secondary-100: #f1f5f9
--secondary-200: #e2e8f0  /* Borders */
--secondary-300: #cbd5e1
--secondary-400: #94a3b8
--secondary-500: #64748b
--secondary-600: #475569
--secondary-700: #334155  /* Body text */
--secondary-800: #1e293b
--secondary-900: #0f172a  /* Headings */
--secondary-950: #020617  /* Darkest */
```

### Accent Colors
For special highlights and decorative elements.

```css
--accent-blue: #3b82f6
--accent-purple: #a855f7
--accent-pink: #ec4899
--accent-teal: #14b8a6
```

### Semantic Colors
For status indicators and feedback.

```css
/* Success (Green) */
--success: #10b981
--success-light: #d1fae5
--success-dark: #065f46

/* Warning (Amber) */
--warning: #f59e0b
--warning-light: #fef3c7
--warning-dark: #92400e

/* Error (Red) */
--error: #ef4444
--error-light: #fee2e2
--error-dark: #991b1b

/* Info (Indigo) */
--info: #6366f1
--info-light: #e0e7ff
--info-dark: #312e81
```

### Score Colors
For case scoring visualization.

```css
--score-high: #10b981    /* 76-100 */
--score-medium: #f59e0b  /* 51-75 */
--score-low: #ef4444     /* 0-50 */
```

## 🌈 Gradients

Pre-defined gradients for consistent visual effects.

```css
--gradient-primary: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)
--gradient-secondary: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)
--gradient-accent: linear-gradient(135deg, #a855f7 0%, #ec4899 100%)
--gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%)
--gradient-warm: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)
--gradient-cool: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)
```

**Usage in Tailwind:**
```jsx
<div className="bg-gradient-to-br from-primary-600 to-primary-700">
  Gradient background
</div>
```

## 🎭 Shadows

Multi-level elevation system for depth and hierarchy.

### Standard Shadows
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.09)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15)
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)
```

### Semantic Shadows
```css
shadow-subtle     /* Cards at rest */
shadow-card       /* Default card elevation */
shadow-card-hover /* Cards on hover */
shadow-elevated   /* Modals, dropdowns */
shadow-elevated-lg /* Important overlays */
```

### Colored Shadows
For special emphasis (use sparingly).

```css
shadow-primary  /* Primary color glow */
shadow-success  /* Success color glow */
shadow-error    /* Error color glow */
shadow-glow     /* Generic glow effect */
```

**Usage:**
```jsx
<Card className="shadow-card hover:shadow-card-hover">
  Card with hover effect
</Card>
```

## 📏 Spacing

Consistent spacing scale throughout the app.

```css
--space-xs: 0.25rem    /* 4px */
--space-sm: 0.5rem     /* 8px */
--space-md: 1rem       /* 16px */
--space-lg: 1.5rem     /* 24px */
--space-xl: 2rem       /* 32px */
--space-2xl: 3rem      /* 48px */
--space-3xl: 4rem      /* 64px */
```

**Tailwind Spacing:**
- Use `p-4`, `m-6`, `gap-8` etc. for standard spacing
- Extended spacing: `spacing-18`, `spacing-88`, `spacing-100`, `spacing-112`, `spacing-128`

## 🔲 Border Radius

Rounded corners for modern feel.

```css
--radius-sm: 0.5rem    /* 8px - small elements */
--radius-md: 0.75rem   /* 12px */
--radius-lg: 1rem      /* 16px - default */
--radius-xl: 1.25rem   /* 20px - cards */
--radius-2xl: 1.5rem   /* 24px - large cards */
--radius-3xl: 2rem     /* 32px - hero sections */
--radius-full: 9999px  /* Fully rounded */
```

**Usage:**
```jsx
<div className="rounded-xl">Standard card rounding</div>
<div className="rounded-2xl">Large card rounding</div>
<button className="rounded-full">Pill button</button>
```

## ⚡ Transitions

Smooth animations for better UX.

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Tailwind Duration:**
- `duration-150` - Fast
- `duration-200` - Base (default)
- `duration-300` - Slow
- `duration-400` - Extra slow
- `duration-600` - Very slow

## ✨ Special Effects

### Glass Morphism
```jsx
<div className="glass">
  Frosted glass effect with backdrop blur
</div>
```

### Gradient Text
```jsx
<h1 className="gradient-text">
  Text with gradient fill
</h1>
```

### Animated Gradient Background
```jsx
<div className="gradient-animate">
  Slowly shifting gradient background
</div>
```

### Hover Effects
```jsx
<Card className="hover-lift">Lifts up on hover</Card>
<Button className="hover-scale">Scales up on hover</Button>
<div className="glow-hover">Glows on hover</div>
```

### Loading Effects
```jsx
<div className="shimmer">Shimmer loading effect</div>
<div className="pulse-soft">Soft pulsing animation</div>
```

### Entry Animations
```jsx
<div className="fade-in">Fades in</div>
<div className="slide-in-bottom">Slides up from bottom</div>
<div className="slide-in-right">Slides in from right</div>
```

## 🎨 Background Patterns

### Grid Pattern
```jsx
<div className="bg-grid">
  Subtle grid overlay
</div>
```

### Dot Pattern
```jsx
<div className="bg-dots">
  Subtle dot pattern overlay
</div>
```

## 🎯 Typography

### Font Family
Uses Inter with optimized font features:
- `-apple-system` fallback for iOS
- Font features: `cv02`, `cv03`, `cv04`, `cv11`
- Letter spacing: `-0.011em` (body), `-0.025em` (headings)

### Font Sizes
```
text-xs:   12px / 16px line-height
text-sm:   14px / 20px line-height
text-base: 16px / 24px line-height
text-lg:   18px / 28px line-height
text-xl:   20px / 28px line-height
text-2xl:  24px / 32px line-height
text-3xl:  30px / 36px line-height
text-4xl:  36px / 40px line-height
text-5xl:  48px / 56px line-height (responsive)
text-6xl:  60px / 66px line-height (responsive)
text-7xl:  72px / 76px line-height (responsive)
```

### Font Weights
```
font-light:     300
font-normal:    400
font-medium:    500
font-semibold:  600
font-bold:      700
font-extrabold: 800
font-black:     900
```

## 📱 Responsive Breakpoints

```
sm:  640px  - Small tablets
md:  768px  - Tablets
lg:  1024px - Small desktops
xl:  1280px - Large desktops
2xl: 1536px - Extra large screens
```

**Usage:**
```jsx
<div className="text-base sm:text-lg md:text-xl lg:text-2xl">
  Responsive text sizing
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

## 🎨 Component Utilities

### Premium Card
```jsx
<div className="card-premium">
  Enhanced card with hover effects
</div>
```

### Premium Button
```jsx
<button className="btn-premium bg-primary-600 text-white">
  Button with shimmer effect on hover
</button>
```

### Premium Input
```jsx
<input className="input-premium" />
```

### Status Badges
```jsx
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
```

### Progress Bars
```jsx
<div className="progress-bar">
  <div className="progress-fill bg-primary-600" style={{ width: '75%' }} />
</div>
```

## 🎨 Customization Guide

### To Change the Primary Color:

1. **In `src/styles.css`**, update the `--primary-*` variables
2. **In `tailwind.config.mjs`**, update the `primary` color object
3. The entire site will automatically update!

### To Change Shadows:

1. **In `src/styles.css`**, update the `--shadow-*` variables
2. **In `tailwind.config.mjs`**, update the `boxShadow` object

### To Add New Animations:

1. **In `src/styles.css`**, add `@keyframes` in the `@layer utilities` section
2. **In `tailwind.config.mjs`**, add to `animation` and `keyframes` objects

### To Adjust Spacing:

1. **In `src/styles.css`**, update `--space-*` variables
2. **In `tailwind.config.mjs`**, add custom spacing values to `spacing` object

## 🎯 Best Practices

1. **Use Semantic Colors**: Prefer `primary`, `secondary`, `success` over direct color values
2. **Consistent Shadows**: Use the predefined shadow scale for consistency
3. **Responsive First**: Always consider mobile, tablet, and desktop layouts
4. **Smooth Transitions**: Add `transition-all duration-200` for interactive elements
5. **Accessible Focus**: Focus states are automatically styled for accessibility
6. **Spacing Scale**: Use the spacing scale (`p-4`, `m-6`) instead of arbitrary values
7. **Border Radius**: Stick to the radius scale for consistency

## 📋 Quick Reference

### Most Common Classes

```jsx
// Cards
<Card className="shadow-card hover:shadow-card-hover" />

// Buttons
<Button className="bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow-md" />

// Text
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900" />
<p className="text-base text-secondary-700 leading-relaxed" />

// Containers
<div className="rounded-xl bg-white p-6 border border-secondary-200" />

// Gradients
<div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50" />

// Interactive
<div className="hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200" />
```

## 🚀 Performance Tips

1. **Minimize Custom CSS**: Use Tailwind utilities whenever possible
2. **Purge Unused Styles**: Tailwind automatically removes unused styles in production
3. **Optimize Animations**: Use `transform` and `opacity` for best performance
4. **Reduce Motion**: Respect user's `prefers-reduced-motion` setting (handled automatically)

---

**Need help?** All design tokens are in `src/styles.css` and `tailwind.config.mjs` - edit these files to customize the entire design system!

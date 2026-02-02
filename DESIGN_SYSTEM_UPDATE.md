# Institutional Design System Update

## Overview
Updated InvestIntel platform to match institutional Bloomberg/Finviz/Stripe design standards for professional, trustworthy appearance.

## Color System Changes

### Before → After
- **Background**: `#0B0E14` → `#0E1116`
- **Surface/Cards**: `#151921` → `#12141A`
- **Panels**: New → `#17191F`
- **Primary Accent**: `#00C805` (green) → `#00A3FF` (blue)
- **Success**: `#00C805` → `#00D1B2`
- **Warning**: `#fbbf24` → `#FFB020`
- **Error**: `#f87171` → `#FF4D4F`
- **Primary Text**: `#E8EAED` → `#E6EEF3`
- **Muted Text**: `#9CA3AF` → `#9AA6B2`
- **Borders**: `#2D333F` → `rgba(255,255,255,0.06)`

## Typography Updates

- **Base font size**: 16px (maintained)
- **H1**: 32-36px → 32px, weight 600
- **H2**: 24-28px → 24px, weight 600
- **H3**: 18-20px → 18px, weight 600
- **Line height**: 1.5 (maintained)
- **Font**: Inter (maintained, with fallbacks)

## Component Updates

### Buttons
- **Removed**: Gradients
- **Added**: Solid colors with clear hover states
- **Primary**: `#00A3FF` with subtle shadow
- **Secondary**: Outlined style (transparent bg, border)
- **Transitions**: 150ms (reduced from 200-300ms)
- **Focus states**: Clear ring with accent color

### Cards
- **Background**: `#12141A`
- **Border**: `rgba(255,255,255,0.06)`
- **Border radius**: 12px (maintained)
- **Shadow**: Subtle (0 1px 3px rgba(0,0,0,0.3))
- **Hover**: Slight elevation (translateY -1px, scale 1.01)
- **Removed**: Heavy gradients, bright glows

### Inputs
- **Background**: `#17191F`
- **Border**: `rgba(255,255,255,0.06)`
- **Focus**: `#00A3FF` ring
- **Text color**: `#E6EEF3`
- **Placeholder**: `#9AA6B2`

### Stats Cards
- **Updated**: Use `.stat-card` class
- **Value**: Larger (1.75rem), weight 600
- **Label**: Smaller (0.875rem), muted color
- **Hover**: Subtle border highlight

## Accessibility

- **WCAG contrast**: All text meets AA standards
- **Focus states**: Visible rings on all interactive elements
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Keyboard navigation**: All components accessible

## Files Updated

1. **app/globals.css**
   - Complete color system overhaul
   - Updated component styles
   - New typography scale
   - Accessibility improvements

2. **app/components/pages/MyProperties.tsx**
   - Property cards: Institutional styling
   - Summary cards: Updated to stat-card style
   - Filters: New panel styling
   - Removed gradients

3. **app/portfolio/page.tsx**
   - Header: Clean, professional
   - Stats bar: Institutional cards
   - Property cards: Clickable, clear hierarchy
   - Sidebar: Updated colors and spacing

## Design Principles Applied

✅ **Clean & Minimal**: Removed flashy gradients
✅ **High Contrast**: Improved readability
✅ **Subtle Depth**: Cards with gentle shadows
✅ **Clear Hierarchy**: Obvious what matters
✅ **Clickable Elements**: All interactive elements clearly styled
✅ **Professional**: Institutional, trustworthy appearance
✅ **Consistent**: Unified spacing and colors

## Next Steps (Optional)

- Update remaining pages (Dashboard, Market Explorer, News)
- Add data source badges (Land Registry, EPC)
- Refine micro-interactions
- Add loading skeletons (replacing spinners)
- Update Sidebar component styling

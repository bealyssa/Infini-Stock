# Infini-Stock Dark Lavender Theme

## 🎨 Complete Color Palette

### Primary Colors

**Base Dark Background** (consistent throughout app)
```
#171717 - Main background (bg-[#171717])
#0f0f0f - Darker background for cards/tables (bg-[#0f0f0f])
#1f1f1f - Darker shade (bg-[#1f1f1f])
```

**Lavender Accent** (primary interactive elements)
```
Lavender-600: #9333ea (primary buttons, active states)
Lavender-700: #7e22ce (hover states)
Lavender-800: #6b21a8 (active/pressed states)
Lavender-500: #a78bfa (light highlights, focus rings)
Lavender-400: #c4b5fd (text accents)
```

**Borders & Dividers**
```
#2d2d2d - Primary border color (border-[#2d2d2d])
#3d3d3d - Slightly lighter border
```

**Text Colors**
```
#ffffff - White primary text
#e5e7eb - Light gray secondary text
#9ca3af - Medium gray text
#6b7280 - Darker gray text
#4b5563 - Very dark gray text
```

---

## 🎯 Component Usage

### Buttons
```jsx
// Primary (Lavender)
<Button variant="default">Add Monitor</Button>
// Output: bg-lavender-600 text-white

// Secondary (Dark)
<Button variant="secondary">Cancel</Button>
// Output: bg-[#2d2d2d] text-gray-100

// Outline (Lavender border)
<Button variant="outline">Edit</Button>
// Output: border-lavender-600 text-lavender-400

// Ghost (Subtle)
<Button variant="ghost">More Options</Button>
// Output: hover:bg-lavender-600/20 text-gray-400
```

### Badges / Status Components
```jsx
// Active Status (Green)
<Badge variant="success">Active</Badge>

// Maintenance (Yellow/Amber)
<Badge variant="maintenance">Maintenance</Badge>

// Inactive (Gray)
<Badge variant="inactive">Inactive</Badge>

// Default (Lavender)
<Badge variant="default">New</Badge>

// Custom Active Status
<Badge variant="active">Running</Badge>
```

### Cards & Containers
```jsx
// Dark Card with subtle border
<Card className="border-[#2d2d2d] bg-[#171717]">
  <CardHeader className="border-b border-[#2d2d2d]">
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>
```

### Input Fields
```jsx
// Focus ring becomes lavender
<Input placeholder="Enter text..." />
// Focus: ring-2 ring-lavender-600/50 border-lavender-500
```

---

## 🎨 Tailwind Config Reference

All colors are defined in `tailwind.config.js`:

```javascript
colors: {
    lavender: {
        50: '#faf8ff',
        100: '#f5f2ff',
        200: '#ede9fe',
        300: '#ddd6fe',
        400: '#c4b5fd',  // Light text accents
        500: '#a78bfa',  // Highlights
        600: '#9333ea',  // Primary button
        700: '#7e22ce',  // Hover state
        800: '#6b21a8',  // Active state
        900: '#581c87',
    },
    dark: {
        600: '#2d2d2d',  // Primary border
        700: '#1f1f1f',  // Darker shade
        800: '#171717',  // Main background
    },
}
```

---

## 📐 Spacing & Layout

All components maintain consistent padding and margins:
- Card padding: `p-4`
- Input height: `h-10`
- Border radius: `rounded-md` (inputs), `rounded-lg` (cards), `rounded-xl` (containers)
- Gap/spacing: `gap-2`, `gap-3`, `gap-4`

---

## 🌈 Page Examples

### Dashboard Background
```jsx
<div className="content-full bg-[#171717]">
  <div className="content-centered">
    { /* page content */ }
  </div>
</div>
```

### Table Container
```jsx
<div className="rounded-xl border border-[#2d2d2d] bg-[#0f0f0f] overflow-hidden">
  <Table>{ /* ... */ }</Table>
</div>
```

### Filter Pills (Like Monitors page)
```jsx
// Active state
className="border-lavender-600 bg-lavender-600 text-white"

// Inactive state
className="border-[#2d2d2d] bg-[#1f1f1f] text-gray-300 hover:border-lavender-500 hover:bg-lavender-500/10"
```

---

## ✅ Theme Implementation Checklist

- [x] Tailwind config updated with consistent colors
- [x] Button component uses lavender primary
- [x] Badge component has status variants
- [x] Input/Select focus rings are lavender
- [x] Card borders updated to #2d2d2d
- [x] Monitors page filter pills updated
- [x] Tables have dark backgrounds

---

## 📝 Guidelines for New Components

When creating new components:
1. Use `bg-[#171717]` for main background
2. Use `border-[#2d2d2d]` for borders
3. Use `text-white` for primary text, `text-gray-400` for secondary
4. Use `lavender-600` for primary actions
5. Use `lavender-500` for focus rings
6. Keep consistent padding: `p-4` for sections
7. Always include hover states with lavender accents

---

## 🔗 Files Updated

- ✅ `tailwind.config.js` - Color palette
- ✅ `src/components/ui/Button.jsx` - Lavender primary
- ✅ `src/components/ui/Badge.jsx` - Status variants
- ✅ `src/components/ui/Input.jsx` - Lavender focus
- ✅ `src/components/ui/Select.jsx` - Lavender focus
- ✅ `src/components/ui/Card.jsx` - Consistent borders
- ✅ `src/pages/Monitors.jsx` - Applied theme

---

## 🚀 Deployment Note

All colors are Tailwind CSS classes and will be correctly applied once you rebuild:
```bash
npm run build
```

No additional CSS files needed - all theme colors are integrated into the design system!

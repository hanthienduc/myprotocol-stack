# Design Guidelines

**Last Updated**: 2025-12-09
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

Design guidelines for MyProtocolStack - clean, minimal, science-forward interface focused on clarity and action.

## Design Principles

### CLARITY
- Information hierarchy drives every layout
- One primary action per page/card
- Minimize cognitive load

### ACTION
- Every screen enables a task (create, track, view)
- CTA buttons are clear and obvious
- Remove friction from critical flows

### TRUST
- Data visualization is accurate
- Progress is visible (streaks, completion %)
- No hidden paywalls or dark patterns

### SCIENCE
- Protocol cards emphasize evidence
- Data-driven design (what matters is measured)
- Minimize jargon, clarify benefits

## Color Palette

### Light Mode
```
Background:     White (#FFFFFF)
Surface:        Gray-50 (#F9FAFB)
Border:         Gray-200 (#E5E7EB)
Text Primary:   Gray-900 (#111827)
Text Secondary: Gray-600 (#4B5563)
```

### Dark Mode
```
Background:     Gray-950 (#030712)
Surface:        Gray-900 (#111827)
Border:         Gray-800 (#1F2937)
Text Primary:   Gray-50 (#F9FAFB)
Text Secondary: Gray-400 (#9CA3AF)
```

### Semantic Colors
```
Success:        Green-600 (#16A34A)   - Completion, streaks
Warning:        Amber-600 (#D97706)   - Low adherence
Danger:         Red-600 (#DC2626)     - Delete, cancel
Primary:        Blue-600 (#2563EB)    - CTAs, links
```

## Typography

### System Fonts
```
Font Family:    -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Fallback:       Helvetica Neue, Arial, sans-serif
```

### Scale
```
Display:        32px bold (page titles)
Heading 1:      28px bold (section titles)
Heading 2:      20px bold (subsections)
Body:           16px regular (main text)
Small:          14px regular (secondary text)
Tiny:           12px regular (captions, tags)
```

## Spacing

### System (multiples of 4px)
```
xs: 4px    - Inline spacing
sm: 8px    - Component spacing
md: 16px   - Section spacing
lg: 24px   - Major sections
xl: 32px   - Page padding
```

## Component Patterns

### Protocol Card
```
┌─────────────────────────────┐
│ Category Badge  [Difficulty]│
│                             │
│ Protocol Name               │
│ Short description...        │
│                             │
│ Duration  |  Frequency      │
│                             │
│  [Add to Stack] [More Info] │
└─────────────────────────────┘
```
- Compact: 280px width on mobile, 320px on desktop
- Interactive: Hover lifts slightly, shadow deepens
- Status: Badge shows category with color coding

### Daily Tracking Item
```
┌────────────────────────┐
│ ☐ Protocol Name       │
│   Morning routine      │
│ Time: 15min | Easy    │
└────────────────────────┘
```
- Checkbox left-aligned
- Category & duration visible
- Tap anywhere to toggle

### Stack Builder Form
```
Stack Name      [________________]
Description     [________________
                 ________________]

Protocols       [x] Protocol 1
                [x] Protocol 2
                [ ] + Add protocol

Schedule Days   [Mon][Tue][Wed]...

                [Cancel]  [Save]
```

## Interactive States

### Button States
- **Idle**: Base color, subtle shadow
- **Hover**: Slightly darker, raised shadow
- **Active/Loading**: Spinner overlay, disabled state
- **Disabled**: Gray, no interaction

### Form States
- **Empty**: Placeholder text, light border
- **Focused**: Blue border, shadow ring
- **Filled**: Value visible, darker border
- **Error**: Red border, error message below
- **Success**: Green checkmark, confirmation message

## Dark Mode

- Automatically enabled based on system preference OR user toggle
- All text contrast maintained (WCAG AA minimum)
- Icons inverted where needed (e.g., light themed illustrations)
- Accent colors slightly lighter to compensate for dark background

## Responsive Design

### Breakpoints
```
Mobile:    0-640px   (full width, single column)
Tablet:    640-1024px (2 column, larger tap targets)
Desktop:   1024px+   (3+ column, keyboard navigation)
```

### Mobile-First Rules
- Touch targets minimum 44px × 44px
- Stack vertical on mobile (never horizontal scroll)
- Modals > drawers > inline editing
- Bottom sheets for mobile forms

## Animation

### Transitions
- Page transitions: 200ms fade
- Component interactions: 150ms easing
- Loading spinners: 1s rotation loop
- No animation on reduced-motion preference

### Easing
```
Standard:     cubic-bezier(0.4, 0, 0.2, 1)
Decelerate:   cubic-bezier(0, 0, 0.2, 1)
Accelerate:   cubic-bezier(0.4, 0, 1, 1)
```

## Accessibility

### Minimum Standards
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly markup
- Color not sole information indicator

### Specific Rules
- Form labels always associated with inputs
- Buttons have descriptive text (not just icons)
- Links distinguished from surrounding text
- Focus indicators visible (always)
- Images have alt text, icons have aria-label

## Iconography

### Icon Library
- Use lucide-react icons (24px primary size)
- Consistent stroke weight (2px)
- Monochrome by default

### Common Icons
```
protocol:        Beaker, Target, Book
stack:           Layers, Grid
tracking:        CheckCircle2, Calendar
settings:        Settings, User
action:          Plus, Trash2, Edit, ArrowRight
```

## Copy Tone

- **Friendly but Professional**: "You've completed 80% this week. Keep going!"
- **Action-Oriented**: "Add protocols", "Complete stack", not "Management interface"
- **Specific over Vague**: "Add morning routine" vs "Add stack"
- **Positive Framing**: "60% complete" not "40% incomplete"

## Loading & Empty States

### Loading
- Skeleton screens for protocol lists
- Spinner for form submission
- Toast notifications for background tasks

### Empty States
- Clear illustration or icon
- Helpful message: "No stacks yet. Create your first routine."
- CTA prominent: "Create Stack" button

## Error Handling

- User-friendly error messages: "Can't save - please check your connection"
- Error details hidden (logged server-side)
- Recovery path obvious: "Retry" or "Go back"
- Form errors inline near fields

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lucide Icons](https://lucide.dev)

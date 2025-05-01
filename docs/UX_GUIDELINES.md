## Purpose

To define and enforce design consistency and accessible experiences across PresencePilot's interfaces.

---

## UX Principles

- **Clarity over cleverness**
- **Accessible by default**
- **Actionable feedback on all interactions**
- **Consistent spacing, color, and hierarchy**

---

## Components

### Forms
- Use React Hook Form + Yup
- Label every field clearly
- Show validation errors inline
- Use toast or status messages on submit

### Buttons
- Use visual hierarchy (primary, secondary)
- Loading state required for async actions
- Keyboard and screen reader accessible

### Lists & Tables
- Paginate if over 10 items
- Show filters at top (ex: reviews by rating)
- Avoid truncating important data (e.g. review content)

---

## Accessibility Standards

- Use semantic HTML (button, form, input)
- All interactions keyboard-navigable
- Pass WCAG AA (via axe-core / Cypress)

---

## Dark Mode

Optional, but if implemented:
- Follow Tailwind dark mode class strategy
- Ensure contrast levels and theme toggling are preserved

---

## Motion

- Keep animations subtle, fast (<200ms)
- Use framer-motion for key transitions (e.g. modals)

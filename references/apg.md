# W3C APG: Aria Patterns Guide

**Stage:** 4 (Interact)
**Topic:** Design patterns for accessible widgets — ARIA roles, keyboard interactions, focus management

## Summary

The W3C Accessibility Rich Internet Applications (ARIA) Authoring Practices Guide (APG)
documents design patterns for common UI widgets. Each pattern specifies the ARIA roles,
keyboard interactions, and focus management behaviors required for accessibility.

## Key Patterns for Stage 4

### Combobox (Autocomplete / Search)
- **ARIA role:** `combobox` (input) + `listbox` (dropdown)
- **Keyboard:** Arrow keys navigate options, Enter selects, Escape closes
- **Focus:** Focus stays on input; virtual cursor moves with arrow keys

### Dialog / Modal
- **ARIA role:** `dialog`
- **Keyboard:** Tab cycles within dialog, Escape closes
- **Focus:** Focus moves into dialog on open; returns to trigger on close
- **Required:** `aria-modal="true"`, `aria-labelledby` pointing to heading

### Menu Button
- **ARIA role:** `button` (trigger) + `menu` (list) + `menuitem` (items)
- **Keyboard:** Enter/Space opens, Arrow keys navigate, Escape closes
- **Focus:** Focus moves to first item on open; returns to button on close

### Tabs
- **ARIA role:** `tablist` + `tab` + `tabpanel`
- **Keyboard:** Arrow keys move between tabs (automatic or manual activation)
- **Focus:** Focus moves to selected tab; `tabpanel` is focusable via Tab

### Accordion
- **ARIA role:** `button` (header) + `region` (panel)
- **Keyboard:** Space/Enter toggles panel; Tab moves to next header
- **Focus:** Focus stays on button; panel content receives Tab focus when open

### Listbox (Single or Multi-select)
- **ARIA role:** `listbox` + `option`
- **Keyboard:** Arrow keys navigate, Space toggles (multiselect), Enter selects (single)
- **Focus:** Virtual focus with `aria-activedescendant`

## Focus Management Rules

1. When a widget opens, move focus into it (first focusable element or role-appropriate item)
2. When a widget closes, return focus to the trigger that opened it
3. Never trap focus outside a modal dialog
4. Use `aria-activedescendant` for composite widgets (listbox, grid, tree)

## Citations

W3C Accessibility Rich Internet Applications (ARIA) Authoring Practices Guide.
https://www.w3.org/WAI/ARIA/apg/
Version: WAI-ARIA 1.2 (stable, 2023)
Pattern index: https://www.w3.org/WAI/ARIA/apg/patterns/

# UI-101: Dark Mode Text Visibility Fix

## Purpose of the PR

Fixes UI-101 - White text on white background in forms when using dark mode.

## What caused the bug?

The app uses CSS variables for dark mode:
- In dark mode, `--foreground` is set to `#ededed` (light gray)
- Body text inherits this light color
- Form inputs inherit body text color (light)
- Form inputs have default white background
- Result: light text on white background = invisible text

The input elements had no explicit text color:
```css
/* No text color specified - inherits from body */
className="mt-1 block w-full rounded-md border-gray-300..."
```

## How did you fix it?

Added global CSS rules in `globals.css` to ensure form inputs always have dark text on light background:

```css
input,
textarea,
select {
  color: #171717;
  background-color: #ffffff;
}

input::placeholder,
textarea::placeholder {
  color: #9ca3af;
}
```

This ensures:
- Input text is always dark (#171717)
- Input background is always white
- Placeholder text is visible gray
- Works in both light and dark mode

## What preventive measures can avoid similar issues?

1. **Always test dark mode** during development
2. **Explicitly set colors** for form elements
3. **Use design system components** with built-in dark mode support
4. **Add visual regression tests** for dark mode

## How to test it?

### Run unit tests
```bash
npm test -- --no-coverage
```

### Manual testing

1. Enable dark mode on your system (macOS: System Preferences > Appearance > Dark)
2. Navigate to signup page: http://localhost:3000/signup
3. Type in any input field
4. Text should be clearly visible (dark text on white background)
5. Test login page as well: http://localhost:3000/login

### Expected behavior

| Mode | Old Behavior | New Behavior |
|------|--------------|--------------|
| Light mode | Dark text on white (OK) | Dark text on white (OK) |
| Dark mode | Light text on white (BUG) | Dark text on white (OK) |


# Mobile UI audit

Audit scope: static code/layout review for mobile viewports 360×800, 390×844, 430×932. Manual browser screenshots still required for final release gate.

## Shared findings

| Viewport | Route/component | Severity | Finding | Notes |
| --- | --- | --- | --- | --- |
| 360×800 | `(main)/messages/layout.tsx` | P1 | Three-column desktop chat shell can overflow mobile width. | Needs mobile-specific list/detail shell; group dialog button now wired. |
| 360×800 | `components/navigation/*`, main layout | P1 | Desktop/sidebar navigation likely consumes horizontal space on small screens. | Foundation adds `BottomNav`, but routes must adopt `MobileShell`. |
| 360×800 | Table-heavy routes `/grades`, `/timetable` | P1 | Tables and weekly grids likely need card/day-view fallback. | Covered by Tasks 3.2 and 3.3. |
| 390×844 | Auth forms | P2 | Long register/forgot states can be hidden by keyboard. | Needs sticky submit and field-level errors. |
| 390×844 | Chat message thread | P1 | Composer can be hidden by keyboard/safe area. | Needs mobile thread layout and bottom padding. |
| 430×932 | Feed/material cards | P2 | Media/text cards need overflow and image sizing check. | Add responsive image sizes and expand/collapse. |

## Module ownership

### Shared shell/navigation

- `apps/web-client/src/components/mobile/*` now contains base shell, top bar, bottom nav, action sheet, state views, tabs, and pull-to-refresh.
- `apps/web-client/src/app/globals.css` now contains safe-area, touch-target, reduced-motion, and mobile semantic tokens.

### Module-specific risks

| Module | Risk |
| --- | --- |
| Auth | Keyboard-safe forms, OTP paste/numeric input |
| Home/feed | Composer sheet, image/card overflow, infinite scroll |
| Study | Timetable/grades table overflow |
| Chat | Desktop split-pane layout, keyboard-safe composer, actions sheet |
| Discover | Missing `/discover` hub route |
| Profile | Header/tabs wrapping with long student names |
| AI | Full-screen mobile chat and source card overflow |

## Next manual audit checklist

- Open 360×800, 390×844, 430×932.
- Visit `/feed`, `/login`, `/register`, `/forgot-password`, `/study`, `/timetable`, `/grades`, `/messages`, `/materials`, `/marketplace`, `/profile`.
- Capture screenshot for each P0/P1 issue.
- Confirm `document.documentElement.scrollWidth <= window.innerWidth`.

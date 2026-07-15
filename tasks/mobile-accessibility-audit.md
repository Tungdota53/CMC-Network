# Mobile accessibility audit

## Baseline completed

- Icon-only controls in new mobile primitives have accessible labels.
- `ActionSheet` uses `role="dialog"`, `aria-modal`, labelled title, Escape close, backdrop close, and focus restore.
- `BottomNav` uses `nav` with labels, `aria-current`, and 44px+ targets.
- `SegmentedTabs` uses `tablist`/`tab` semantics and `aria-selected`.
- Reduced motion baseline added in `globals.css`.

## Remaining checks

| Area | Status | Notes |
| --- | --- | --- |
| Existing icon-only buttons | Pending | Need scan/fix across route modules. |
| Existing dialogs/sheets | Pending | Need verify focus trap and Escape close. |
| Contrast | Pending | Needs manual/light-dark check. |
| Keyboard-only core flows | Pending | Login, register, chat, create post, settings. |
| Screen reader labels | Pending | Especially chat actions and feed post buttons. |

## Manual checklist

- Tab through `/login`, `/feed`, `/messages`, `/study`, `/profile`.
- Confirm visible focus on all controls.
- Confirm no icon-only button lacks `aria-label` or visible text.
- Confirm dialog focus returns to trigger after close.
- Confirm body text contrast meets WCAG AA.

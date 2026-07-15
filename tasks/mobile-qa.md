# Mobile QA notes

## Commands

```bash
npm run lint --workspace=apps/web-client
npm run build --workspace=apps/web-client
```

## Viewports

- 360×800
- 390×844
- 430×932

## Core smoke routes

- `/login`
- `/register`
- `/forgot-password`
- `/feed`
- `/study`
- `/messages`
- `/materials`
- `/marketplace`
- `/profile`

## Assertions

- No document horizontal overflow:
  - `document.documentElement.scrollWidth <= window.innerWidth`
- Main controls visible and tappable.
- Bottom nav visible only on mobile shell-enabled routes.
- Dialog/sheet controls have visible title and close button.
- Keyboard does not hide primary submit/composer.

## Current implementation note

Foundation components exist under `apps/web-client/src/components/mobile`. Existing routes still need gradual adoption of `MobileShell` and primitives by module task.

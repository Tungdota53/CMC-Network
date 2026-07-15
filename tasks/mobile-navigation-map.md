# Mobile navigation map

## Bottom tabs

| Tab | Route | Icon | Primary action | Includes |
| --- | --- | --- | --- | --- |
| Home | `/feed` | Home | Create post | `/feed`, `/notifications`, `/search` |
| Study | `/study` | GraduationCap | Add study task / quick action | `/study`, `/timetable`, `/grades`, `/materials`, `/study/groups`, `/study/requests` |
| Chat | `/messages` | MessageCircle | Create chat/group | `/messages`, `/messages/t/[id]`, legacy `/chat` |
| Discover | `/discover` | Compass | Browse modules | `/marketplace`, `/events`, `/clubs`, `/professors`, `/mentors` |
| Profile | `/profile` | User | Edit profile | `/profile`, `/profile/[slug]`, `/settings`, `/reputation`, `/saved` |

## Bottom nav visibility

| Route pattern | Bottom nav |
| --- | --- |
| Main list/hub routes | Show |
| `/messages/t/[id]` | Hide or collapse on keyboard-heavy mobile thread |
| Detail routes such as `/marketplace/[id]`, `/events/[id]`, `/clubs/[id]`, `/materials/[id]`, `/mentors/[id]`, `/professors/[id]` | Hide when primary CTA needs focus; otherwise show with safe-area padding |
| Create/sell/register flows | Hide, full-screen form or sheet |
| Auth routes | Hide |
| Admin routes | Hide |

## Back behavior

- Detail screens use top-left back button to parent list.
- Full-screen forms confirm before leaving if dirty.
- Sheets close on backdrop, Escape, and explicit close button.
- Browser back should dismiss sheet when route state is used; fallback is close button.

## Route gaps

- `/discover` is planned by Task 5.1; bottom nav already reserves it.
- `/saved` is planned by Task 6.6.

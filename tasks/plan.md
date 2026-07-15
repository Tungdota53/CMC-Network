# Implementation Plan: CMC Network Mobile App UI

## Overview
Thiết kế và xây UI mobile-first cho CMC Network trên `apps/web-client` (Next.js 16), ưu tiên trải nghiệm sinh viên trên điện thoại: onboarding/auth, feed, chat, học tập, tài liệu, marketplace, sự kiện, profile, notification, và AI assistant. App dùng lại API/hook hiện có, chuẩn hóa layout mobile, navigation bottom/tab, state loading/empty/error/retry, và có responsive breakpoint để web desktop không vỡ.

## Architecture Decisions
- Mobile-first trên `web-client` thay vì tạo app native mới; có thể nâng cấp PWA sau khi UI ổn định.
- Dùng App Router hiện có trong `apps/web-client/src/app`; không đổi API contract nếu không cần.
- Tách shell mobile chung: top app bar, bottom navigation, safe-area padding, modal/sheet patterns.
- Reuse domain hooks hiện có (`useFeed`, `useChatSocket`, `useMaterials`, `useStudyGroups`, `useTimetable`, `useGrades`, `useMarketplace`, `useEvents`, `useNotifications`, `useReputation`) để tránh mock data.
- Component UI phải có touch target tối thiểu 44px, WCAG AA contrast, keyboard/focus support, reduced motion fallback.
- Dùng vertical slices theo user journey; mỗi slice xong phải build/lint và kiểm tra trên viewport 360×800, 390×844, 430×932.

## Target Mobile IA

### Primary tabs
- Home: feed, stories/quick actions, campus updates.
- Study: timetable, grades, study groups, materials shortcut.
- Chat: conversations, message thread, call entry.
- Discover: marketplace, events, clubs, professors, mentors.
- Profile: profile, reputation, settings, saved/bookmarks.

### Cross-cutting surfaces
- Global search.
- Notifications inbox.
- AI assistant floating entry or tab shortcut.
- Create composer sheet for post/material/group/marketplace item/event.

## Task List

### Phase 0: Audit and Design Foundation
- [x] Task 0.1: Audit current mobile breakpoints and layout issues
- [x] Task 0.2: Define mobile navigation map and route grouping
- [x] Task 0.3: Create mobile design tokens for spacing, radii, typography, colors, and safe areas
- [x] Task 0.4: Build shared mobile primitives: `MobileShell`, `MobileTopBar`, `BottomNav`, `ActionSheet`, `PullToRefresh`, `SegmentedTabs`, `EmptyState`, `ErrorState`, `Skeleton`

### Checkpoint: Foundation
- [x] All shared primitives render without API dependency
- [x] Touch targets >= 44px
- [x] Viewports 360×800 and 430×932 have no horizontal overflow
- [x] `npm run lint --workspace=web-client` passes or only pre-existing errors remain

### Phase 1: Auth and Onboarding Mobile
- [x] Task 1.1: Redesign login/register/forgot password for mobile one-hand use
- [ ] Task 1.2: Add CMC student onboarding screens: verify email, choose interests, setup profile photo
- [x] Task 1.3: Add auth error, OTP, and password reset states with clear recovery actions

### Checkpoint: Auth
- [x] User can complete login/register flow on 360px width
- [x] Forms use semantic labels and visible error text
- [x] Autofill and virtual keyboard do not hide submit buttons

### Phase 2: Home Feed Mobile Slice
- [x] Task 2.1: Build mobile home header with search, notifications, and profile avatar
- [x] Task 2.2: Redesign feed cards for mobile: text, image/video, poll, actions, save/share
- [x] Task 2.3: Build create-post composer sheet with media picker and validation states
- [x] Task 2.4: Add pull-to-refresh, infinite scroll, skeleton, empty, and retry states

### Checkpoint: Home Feed
- [x] Feed loads real data through existing hooks/API
- [x] Like/comment/share/save work from mobile card UI
- [x] Composer handles loading/success/error without closing prematurely

### Phase 3: Study Hub Mobile Slice
- [x] Task 3.1: Build Study tab dashboard with today timetable, GPA summary, upcoming deadlines, quick actions
- [x] Task 3.2: Redesign timetable mobile day/week switcher and conflict indicators
- [x] Task 3.3: Redesign grades/GPA mobile cards, import preview, export actions
- [ ] Task 3.4: Redesign study groups list/detail/create/join request flow for mobile sheets
- [ ] Task 3.5: Redesign materials browse/detail/bookmark/upload/AI summary for mobile reading

### Checkpoint: Study Hub
- [ ] Student can view today classes, GPA, groups, and materials from one tab
- [ ] CRUD actions stay reachable with thumb navigation
- [ ] Long material titles and table data wrap without overflow

### Phase 4: Chat Mobile Slice
- [ ] Task 4.1: Redesign conversation list with unread badges, search, archive/request filters
- [ ] Task 4.2: Redesign message thread with sticky composer, media attachment, reactions, reply/unsend actions
- [ ] Task 4.3: Add call overlay mobile layout and permission/error states
- [ ] Task 4.4: Add offline/reconnecting indicators for socket state

### Checkpoint: Chat
- [ ] Message composer remains visible above mobile keyboard
- [ ] Reactions and message actions work by long-press or accessible menu
- [ ] Socket reconnect state is visible and non-blocking

### Phase 5: Discover Mobile Slice
- [x] Task 5.1: Build Discover landing with marketplace, events, clubs, professors, mentors cards
- [ ] Task 5.2: Redesign marketplace list/detail/sell flow with image carousel and safety/report actions
- [ ] Task 5.3: Redesign events list/detail/join/check-in QR flow
- [ ] Task 5.4: Redesign clubs list/detail/create/join/member flow
- [ ] Task 5.5: Redesign professors and mentors list/detail/review/booking flow

### Checkpoint: Discover
- [ ] All discover modules reachable within two taps
- [ ] Detail screens show primary action above fold
- [ ] QR check-in and image carousel fit small screens

### Phase 6: Profile, Reputation, Settings
- [ ] Task 6.1: Redesign profile overview, posts, achievements, skills, certificates, projects
- [ ] Task 6.2: Redesign reputation dashboard, badge progress, leaderboard
- [ ] Task 6.3: Redesign notifications inbox and settings pages for mobile forms
- [x] Task 6.4: Add saved/bookmarked content hub

### Checkpoint: Profile
- [ ] Profile edits validate inline and preserve unsaved changes warning
- [ ] Badge/leaderboard UI uses real reputation data
- [ ] Notification actions are clear and reversible where needed

### Phase 7: AI Assistant Mobile Slice
- [ ] Task 7.1: Create mobile AI entry point from Home/Study and floating action option
- [ ] Task 7.2: Redesign AI chat window for full-screen mobile with source cards
- [ ] Task 7.3: Add suggested actions: summarize material, create flashcards, find study group, explain timetable conflicts

### Checkpoint: AI
- [ ] AI response streaming stays readable on slow networks
- [ ] Source cards are tappable and accessible
- [ ] Failed AI calls show retry and fallback suggestion

### Phase 8: Polish, Accessibility, Performance
- [ ] Task 8.1: Add route-level metadata, mobile icons, theme color, and PWA manifest baseline
- [ ] Task 8.2: Audit focus order, labels, contrast, reduced motion, and screen reader names
- [ ] Task 8.3: Optimize heavy lists with virtualization where needed and image sizes for mobile
- [ ] Task 8.4: Add visual QA checklist and Playwright/mobile viewport smoke tests
- [ ] Task 8.5: Run full lint/build and fix regressions

### Checkpoint: Release Candidate
- [ ] `npm run lint --workspace=web-client` passes
- [ ] `npm run build --workspace=web-client` passes
- [ ] Core flows pass on 360×800, 390×844, 430×932
- [ ] No horizontal scroll on primary routes
- [ ] Lighthouse mobile PWA/accessibility/performance reviewed

## Suggested File Areas
- `apps/web-client/src/app/(main)/layout.tsx`
- `apps/web-client/src/app/(main)/**/page.tsx`
- `apps/web-client/src/app/(auth)/**/page.tsx`
- `apps/web-client/src/components/navigation/*`
- `apps/web-client/src/components/mobile/*` (new shared mobile primitives)
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/components/chat/*`
- `apps/web-client/src/components/study/*`
- `apps/web-client/src/components/materials/*`
- `apps/web-client/src/components/marketplace/*`
- `apps/web-client/src/components/events/*`
- `apps/web-client/src/components/profile/*`
- `apps/web-client/src/hooks/*`
- `apps/web-client/src/app/globals.css`

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Existing desktop layout regressions | High | Mobile components behind responsive shell, test desktop after each slice |
| Too many modules in one pass | High | Ship vertical slices by tab, not all pages at once |
| API gaps hidden by UI work | Medium | Use real hooks only; empty/error states instead of mock fallback |
| Chat keyboard and viewport bugs | High | Test real mobile viewport and safe-area CSS early |
| Performance issues on feed/chat lists | Medium | Use virtualization/lazy images and measure before polish |

## Open Questions
- Mobile target là PWA web-only hay cần React Native/Expo app riêng sau này?
- Brand direction cần giữ CMC red/blue hiện tại hay làm visual refresh toàn bộ?
- App có cần bottom tab đúng 5 mục hay ưu tiên AI thành tab riêng?
- Có cần offline mode cho timetable/materials/chat draft ở release đầu không?

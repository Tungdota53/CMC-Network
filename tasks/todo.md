# CMC Network — Mobile App UI Detailed Tasks

## Small modern UX upgrades — Share/feed slice

**Status:** First production slice landed in `web-client`. Backend share endpoint already supports `content`; frontend now sends caption.

### Task UX-S1: Facebook-like share composer

**Acceptance criteria:**
- [x] Feed `Share` button opens composer instead of sharing immediately.
- [x] Composer previews original post.
- [x] User can add caption before confirm.
- [x] Submit has loading state and disables double submit.
- [x] Caption draft persists in `localStorage` until shared or deleted.
- [x] Closing with draft shows in-app confirm UI, not browser confirm.

**Files touched:**
- `apps/web-client/src/components/feed/PostCard.tsx`
- `apps/web-client/src/components/feed/ShareComposer.tsx`
- `apps/web-client/src/hooks/useFeed.ts`

### Task UX-S2: Post menu quick actions

**Acceptance criteria:**
- [x] Menu includes Share with caption, Copy link, Save/Unsave.
- [x] Non-author menu includes Hide and Report actions.
- [x] Copy link uses Clipboard API with fallback.
- [x] Hide action supports undo toast.

**Files touched:**
- `apps/web-client/src/components/feed/PostCard.tsx`
- `apps/web-client/src/lib/browser-actions.ts`

### Task UX-S3: Global toast feedback

**Acceptance criteria:**
- [x] App has global `react-hot-toast` provider.
- [x] Share/copy/save/delete/report failures and success states show user-friendly Vietnamese feedback.

**Files touched:**
- `apps/web-client/src/components/providers/Providers.tsx`

### Remaining UX backlog

- [ ] Real backend report endpoint instead of client-only report toast.
- [ ] Per-user hide-post persistence instead of client-only hide.
- [ ] Native share action for profile and post where browser supports `navigator.share`.
- [ ] Draft persistence for create-post and comment composers.
- [ ] Confirm sheets for unfriend, leave group, reset chat theme, delete nickname.
- [x] Share post directly into chat/group conversation.
- [ ] Pin conversation and quick reactions.
- [ ] Notification preference toggles: sound, preview, vibration.
- [ ] Compact mode for feed/chat list.

## Progress update — 2026-07-14

- Done: mobile foundation files, mobile tokens, navigation map, baseline audit docs, accessibility/QA notes, PWA manifest metadata, auth mobile layout/register/forgot-password refinements, feed mobile header/cards/composer/refresh states.
- Not done: remaining route-by-route mobile redesign from Tasks 2.x→8.x plus onboarding Task 1.4. These are large module tasks and should be landed incrementally.

## Call reliability tasks — Managed TURN rollout

**Status:** Phase 1 code landed and deployed. Provider credentials still need to be configured in runtime env.

### Task C1: Backend ICE servers endpoint

**Description:** Add authenticated endpoint that returns STUN plus managed TURN servers. Prefer TURN REST API/HMAC temporary credentials.

**Acceptance criteria:**
- [x] `GET /chat/webrtc/ice-servers` exists.
- [x] Endpoint requires `JwtAuthGuard` and `VerifiedUserGuard`.
- [x] Backend reads `TURN_URLS`, `TURN_REST_API_SECRET`, `TURN_TTL_SECONDS`.
- [x] Backend supports static provider fallback with `TURN_USERNAME` and `TURN_CREDENTIAL`.
- [x] Response includes `iceServers`, `ttlSeconds`, `expiresAt`, `hasTurn`.

**Verification:**
- [x] `npm run build --workspace=apps/chat-service` passes.

### Task C2: Frontend uses dynamic ICE config

**Description:** Load ICE servers from backend before creating `RTCPeerConnection`.

**Acceptance criteria:**
- [x] `useWebRTCCall.ts` requests `/chat/webrtc/ice-servers` before outgoing calls.
- [x] `useWebRTCCall.ts` requests `/chat/webrtc/ice-servers` before accepting incoming calls.
- [x] If backend/provider fails, fallback STUN still works.
- [x] No TURN password is required in `NEXT_PUBLIC_*`.

**Verification:**
- [x] `npm run lint --workspace=apps/web-client` passes.
- [x] `npm run build --workspace=apps/web-client` passes.

### Task C3: Provider configuration

**Description:** Configure selected managed TURN provider in server env.

**Acceptance criteria:**
- [ ] Choose provider: Metered.ca, Xirsys, or Twilio Network Traversal.
- [ ] Set `TURN_URLS` with UDP, TCP, and TLS/443 URLs if provider supports them.
- [ ] Prefer `TURN_REST_API_SECRET` temporary credentials.
- [ ] If provider only gives static account, set `TURN_USERNAME` and `TURN_CREDENTIAL` as fallback.
- [ ] Restart `chat-service` with `--update-env`.
- [ ] Verify endpoint returns `hasTurn: true`.

**Runtime env template:**
```text
TURN_URLS=turn:xxx:3478?transport=udp,turn:xxx:3478?transport=tcp,turns:xxx:443?transport=tcp
TURN_REST_API_SECRET=provider-rest-secret
TURN_TTL_SECONDS=3600
```

**Fallback static env:**
```text
TURN_URLS=turn:xxx:3478?transport=udp,turn:xxx:3478?transport=tcp,turns:xxx:443?transport=tcp
TURN_USERNAME=provider-username
TURN_CREDENTIAL=provider-password
TURN_TTL_SECONDS=3600
```

### Task C4: Real network call test

**Description:** Test successful calls across real networks.

**Acceptance criteria:**
- [ ] Same Wi-Fi audio call works.
- [ ] Same Wi-Fi video call works.
- [ ] 4G ↔ Wi-Fi audio call works.
- [ ] 4G ↔ Wi-Fi video call works.
- [ ] Network-restricted environment falls back to TURN relay.
- [ ] Browser `chrome://webrtc-internals` shows relay candidate when P2P fails.

**Files touched:**
- `apps/chat-service/src/chat/webrtc.service.ts`
- `apps/chat-service/src/chat/chat.controller.ts`
- `apps/chat-service/src/chat/chat.module.ts`
- `apps/web-client/src/hooks/useWebRTCCall.ts`

---

## Task 0.1: Audit current mobile breakpoints and layout issues

**Description:** Kiểm tra toàn bộ route chính của `web-client` trên viewport mobile để tìm lỗi overflow, header/sidebar vỡ, form bị keyboard che, list/card quá rộng, và tương tác nhỏ hơn 44px.

**Acceptance criteria:**
- [ ] Có bảng audit cho viewport 360×800, 390×844, 430×932.
- [ ] Mỗi lỗi có route, component nghi ngờ, mức độ P0/P1/P2, ảnh/chú thích ngắn.
- [ ] Xác định rõ lỗi shared shell/navigation và lỗi riêng từng module.

**Verification:**
- [ ] Chạy app web-client local và mở các route chính trên mobile viewport.
- [x] Ghi kết quả audit vào `tasks/mobile-ui-audit.md`.
- [ ] Không sửa UI trong task này.

**Dependencies:** None

**Files likely touched:**
- `tasks/mobile-ui-audit.md`

**Estimated scope:** Small: 1 file

---

## Task 0.2: Define mobile navigation map and route grouping

**Description:** Chốt sơ đồ điều hướng mobile gồm 5 tab chính, route con, quick actions, back behavior, và màn hình nào dùng bottom tab hay full-screen detail.

**Acceptance criteria:**
- [x] Map route hiện có vào Home, Study, Chat, Discover, Profile.
- [x] Xác định route detail nào ẩn bottom nav khi cần focus.
- [x] Có danh sách icon/label cho từng tab và primary action.

**Verification:**
- [x] Cập nhật `tasks/mobile-navigation-map.md`.
- [x] Đối chiếu đủ route trong `apps/web-client/src/app/(main)` và `apps/web-client/src/app/chat`.

**Dependencies:** Task 0.1

**Files likely touched:**
- `tasks/mobile-navigation-map.md`

**Estimated scope:** Small: 1 file

---

## Task 0.3: Create mobile design tokens

**Description:** Thêm token mobile cho spacing, safe area, bottom nav height, top bar height, radii, typography, z-index, và màu semantic dùng cho UI mobile.

**Acceptance criteria:**
- [x] Có CSS variables cho safe-area, mobile shell, bottom nav, surface, border, text, muted, danger, success.
- [x] Typography scale mobile có heading/body/caption rõ.
- [x] Token không phá desktop styles hiện có.

**Verification:**
- [x] `npm run lint --workspace=web-client` không phát sinh lỗi mới.
- [ ] Kiểm tra `globals.css` không có giá trị lặp thừa hoặc hex rải rác ngoài token.

**Dependencies:** Task 0.2

**Files likely touched:**
- `apps/web-client/src/app/globals.css`
- `apps/web-client/src/lib/design-tokens.ts` nếu cần

**Estimated scope:** Small: 1-2 files

---

## Task 0.4: Build `MobileShell`

**Description:** Tạo shell mobile chung quản lý top bar, content padding, safe-area, bottom nav slot, và layout khác nhau giữa list/detail/fullscreen.

**Acceptance criteria:**
- [x] `MobileShell` nhận props title, subtitle, leading, trailing, showBottomNav, variant.
- [x] Content không bị che bởi bottom nav hoặc safe area.
- [x] Shell hoạt động ở desktop bằng responsive wrapper, không phá layout cũ.

**Verification:**
- [ ] Tạo demo usage tạm trong một route ít rủi ro hoặc Story-like dev component nếu dự án có pattern.
- [ ] Kiểm tra viewport 360px không horizontal overflow.

**Dependencies:** Task 0.3

**Files likely touched:**
- `apps/web-client/src/components/mobile/MobileShell.tsx`
- `apps/web-client/src/components/mobile/index.ts`

**Estimated scope:** Medium: 2-3 files

---

## Task 0.5: Build `MobileTopBar` and `BottomNav`

**Description:** Tạo top app bar và bottom navigation 5 tab theo route map, có active state, badge support, labels accessible, và touch target chuẩn.

**Acceptance criteria:**
- [x] Bottom nav có Home, Study, Chat, Discover, Profile.
- [x] Active tab theo pathname.
- [x] Badge unread/notification có aria-label rõ.
- [x] Button/link target tối thiểu 44px.

**Verification:**
- [ ] Navigate giữa 5 tab trên mobile viewport.
- [ ] Screen reader name không chỉ là icon.
- [x] `npm run lint --workspace=web-client` không phát sinh lỗi mới.

**Dependencies:** Task 0.4

**Files likely touched:**
- `apps/web-client/src/components/mobile/MobileTopBar.tsx`
- `apps/web-client/src/components/mobile/BottomNav.tsx`
- `apps/web-client/src/components/mobile/index.ts`

**Estimated scope:** Medium: 3 files

---

## Task 0.6: Build mobile state primitives

**Description:** Tạo các primitive dùng lại: `ActionSheet`, `SegmentedTabs`, `EmptyState`, `ErrorState`, `Skeleton`, `PullToRefresh`.

**Acceptance criteria:**
- [x] `ActionSheet` trap focus, close bằng Escape/backdrop, có aria-label.
- [x] `SegmentedTabs` dùng button semantics và active state rõ.
- [x] Empty/error/skeleton nhận title/description/action tùy biến.
- [x] Pull-to-refresh không chặn scroll thường.

**Verification:**
- [ ] Components render độc lập không cần API.
- [ ] Keyboard navigation dùng được.
- [ ] Không dùng `<div onClick>` cho control tương tác.

**Dependencies:** Task 0.4

**Files likely touched:**
- `apps/web-client/src/components/mobile/ActionSheet.tsx`
- `apps/web-client/src/components/mobile/SegmentedTabs.tsx`
- `apps/web-client/src/components/mobile/StateViews.tsx`
- `apps/web-client/src/components/mobile/PullToRefresh.tsx`
- `apps/web-client/src/components/mobile/index.ts`

**Estimated scope:** Medium: 5 files

---

## Checkpoint 0: Foundation complete

**Acceptance criteria:**
- [x] Shared mobile primitives exist and export cleanly.
- [x] Touch targets >= 44px.
- [ ] 360×800 and 430×932 have no shell-level overflow.
- [x] `npm run lint --workspace=web-client` passes or only pre-existing errors remain.

---

## Task 1.1: Redesign mobile login page

**Description:** Chuyển login page sang layout mobile one-hand, trường form rõ, submit không bị keyboard che, social login/forgot password dễ thấy.

**Acceptance criteria:**
- [x] Email/password fields có label thực, error inline.
- [x] Submit button sticky hoặc luôn trong vùng thao tác khi keyboard mở.
- [x] Loading state disable submit và giữ text rõ.

**Verification:**
- [ ] Manual check `/login` trên 360×800.
- [ ] Autofill không làm vỡ layout.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/app/(auth)/login/page.tsx`
- `apps/web-client/src/components/auth/*`

**Estimated scope:** Medium: 2-4 files

---

## Task 1.2: Redesign mobile register page

**Description:** Tối ưu register page cho mobile với form chia section, validation rõ, mật khẩu có show/hide và điều kiện bảo mật dễ đọc.

**Acceptance criteria:**
- [x] Form register không quá dài thiếu nhóm thông tin.
- [x] Password requirements hiển thị trạng thái đạt/chưa đạt.
- [x] Error từ API hiển thị ở đúng field hoặc form alert.

**Verification:**
- [ ] Manual check `/register` trên 360×800 và 430×932.
- [ ] Submit invalid form không đổi route và focus vào lỗi đầu tiên.

**Dependencies:** Task 1.1

**Files likely touched:**
- `apps/web-client/src/app/(auth)/register/page.tsx`
- `apps/web-client/src/components/auth/*`

**Estimated scope:** Medium: 2-4 files

---

## Task 1.3: Redesign forgot password and OTP states

**Description:** Chuẩn hóa forgot password, OTP, reset password states trên mobile, kèm resend timer và recovery actions.

**Acceptance criteria:**
- [x] OTP input dễ nhập, hỗ trợ paste code.
- [x] Resend timer accessible, không spam được.
- [x] Success/error states có next action rõ.

**Verification:**
- [ ] Manual check `/forgot-password`.
- [ ] Keyboard numeric mở đúng cho OTP.

**Dependencies:** Task 1.2

**Files likely touched:**
- `apps/web-client/src/app/(auth)/forgot-password/page.tsx`
- `apps/web-client/src/components/auth/*`

**Estimated scope:** Medium: 2-4 files

---

## Task 1.4: Add CMC student onboarding screens

**Description:** Thêm onboarding sau đăng ký/login lần đầu gồm verify email, chọn interests, cập nhật avatar/profile basics.

**Acceptance criteria:**
- [ ] Onboarding có progress indicator ngắn.
- [ ] Có skip/continue rõ theo business rule.
- [ ] Avatar upload/crop nếu hook hiện có hỗ trợ; nếu chưa có thì placeholder state rõ.

**Verification:**
- [ ] Manual flow từ register sang onboarding.
- [ ] Back/refresh không làm mất state đã lưu nếu API hỗ trợ.

**Dependencies:** Task 1.3

**Files likely touched:**
- `apps/web-client/src/app/(main)/onboarding/page.tsx`
- `apps/web-client/src/components/onboarding/*`
- `apps/web-client/src/hooks/*`

**Estimated scope:** Medium: 3-5 files

---

## Checkpoint 1: Auth mobile complete

**Acceptance criteria:**
- [ ] User can complete login/register flow on 360px width.
- [ ] Forms use semantic labels and visible error text.
- [ ] Autofill and virtual keyboard do not hide submit buttons.

---

## Task 2.1: Build mobile home header

**Description:** Tạo header Home gồm campus greeting, global search entry, notifications button, profile/avatar entry, và quick action composer.

**Acceptance criteria:**
- [x] Header dùng real notification count nếu hook có sẵn, fallback 0 rõ.
- [x] Search entry route tới `/search` hoặc mở search sheet theo route map.
- [x] Header không chiếm quá nhiều chiều cao trên 360px.

**Verification:**
- [ ] Manual check `/feed` hoặc Home route trên mobile viewport.
- [x] Tap targets đạt 44px.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/app/(main)/feed/page.tsx`
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/components/mobile/*`

**Estimated scope:** Medium: 3-5 files

---

## Task 2.2: Redesign mobile feed card

**Description:** Tạo card feed mobile cho text, image/video, poll, actions, comment preview, save/share.

**Acceptance criteria:**
- [ ] Card support post text dài với expand/collapse.
- [x] Media giữ aspect ratio và lazy loading.
- [x] Like/comment/share/save có loading/disabled state.

**Verification:**
- [x] Feed loads real data qua `useFeed` hoặc API hiện có.
- [ ] No horizontal overflow với ảnh rộng và text dài.

**Dependencies:** Task 2.1

**Files likely touched:**
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/hooks/useFeed.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 2.3: Build create-post composer sheet

**Description:** Tạo composer dạng bottom sheet/full-screen sheet cho mobile, hỗ trợ text, media picker, poll nếu backend hiện có, validation, upload/progress.

**Acceptance criteria:**
- [x] Composer mở từ Home quick action.
- [x] Submit state rõ: idle/loading/success/error.
- [x] Không đóng sheet khi submit lỗi.
- [ ] Có confirm khi đóng mà còn draft.

**Verification:**
- [ ] Create post thành công refresh feed.
- [ ] Invalid post hiển thị lỗi không crash.

**Dependencies:** Task 2.2

**Files likely touched:**
- `apps/web-client/src/components/feed/CreatePostSheet.tsx`
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/hooks/useFeed.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 2.4: Add feed refresh and list states

**Description:** Thêm pull-to-refresh, infinite scroll, skeleton, empty, error/retry cho Home feed.

**Acceptance criteria:**
- [x] Initial loading dùng skeleton.
- [x] Empty feed có CTA tạo post/tìm bạn.
- [x] Error state có retry.
- [x] Infinite scroll không gọi API trùng vô hạn.
- [x] Pull-to-refresh không tạo nested scroll container gây kẹt vuốt xuống mobile.

**Verification:**
- [ ] Test loading/empty/error bằng mock dev state hoặc query state nếu có.
- [ ] Scroll dài mượt trên mobile viewport.

**Dependencies:** Task 2.3

**Files likely touched:**
- `apps/web-client/src/app/(main)/feed/page.tsx`
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/components/mobile/*`

**Estimated scope:** Medium: 3-5 files

---

## Checkpoint 2: Home feed mobile complete

**Acceptance criteria:**
- [x] Feed loads real data through existing hooks/API.
- [x] Like/comment/share/save work from mobile card UI.
- [ ] Composer handles loading/success/error without closing prematurely.

---

## Task 3.1: Build Study tab dashboard

**Description:** Tạo dashboard Study gồm today timetable, GPA summary, upcoming deadlines, study groups, materials quick actions.

**Acceptance criteria:**
- [ ] Cards dùng dữ liệu thật từ hooks hiện có hoặc empty state rõ.
- [x] Quick actions route tới timetable, grades, groups, materials.
- [x] Dashboard ưu tiên thông tin cần trong ngày, không card grid rườm rà.

**Verification:**
- [ ] Manual check `/study` trên 360×800.
- [ ] Loading/error từng card không làm sập toàn trang.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/app/(main)/study/page.tsx`
- `apps/web-client/src/components/study/*`
- `apps/web-client/src/hooks/useTimetable.ts`
- `apps/web-client/src/hooks/useGrades.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 3.2: Redesign timetable mobile day/week view

**Description:** Tối ưu timetable cho mobile với day view mặc định, week switcher gọn, conflict indicators, edit/create sheet.

**Acceptance criteria:**
- [ ] Day view không dùng bảng rộng gây scroll ngang.
- [ ] Week switcher có ngày hiện tại nổi bật.
- [ ] Conflict hiển thị icon/text, không chỉ màu.
- [ ] Add/edit/delete reachable bằng sheet.

**Verification:**
- [ ] Manual CRUD trên `/timetable`.
- [ ] Long course names wrap đúng.

**Dependencies:** Task 3.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/timetable/page.tsx`
- `apps/web-client/src/components/timetable/*`
- `apps/web-client/src/hooks/useTimetable.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 3.3: Redesign grades and GPA mobile cards

**Description:** Chuyển grades/GPA từ table-heavy sang card/list mobile, giữ import preview, export CSV/PDF, academic warning.

**Acceptance criteria:**
- [ ] GPA summary nổi bật đầu trang.
- [ ] Grade item có subject, credit, score, letter, actions.
- [ ] Import preview dùng list/card, row error rõ.
- [ ] Export actions nằm trong action sheet.

**Verification:**
- [ ] Manual check `/grades` trên 360×800.
- [ ] Import preview không overflow với nhiều cột.

**Dependencies:** Task 3.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/grades/page.tsx`
- `apps/web-client/src/components/grades/*`
- `apps/web-client/src/hooks/useGrades.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 3.4: Redesign study groups mobile flow

**Description:** Tối ưu list/detail/create/join request study groups cho mobile, có filters gọn và role/member states rõ.

**Acceptance criteria:**
- [ ] Group list card hiển thị môn, lịch, số thành viên, match score nếu có.
- [ ] Detail page có primary action join/request trên fold.
- [ ] Create group form dùng stepped sections hoặc sheet.
- [ ] Approve/reject/member role actions accessible.

**Verification:**
- [ ] Manual flows `/study/groups`, `/study/groups/[id]`, `/study/groups/create`.
- [ ] Join/request success refresh state.

**Dependencies:** Task 3.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/study/groups/**`
- `apps/web-client/src/components/study/*`
- `apps/web-client/src/hooks/useStudyGroups.ts`

**Estimated scope:** Medium: 4-6 files

---

## Task 3.5: Redesign study requests mobile flow

**Description:** Tối ưu study requests list/create/matching cho mobile, giúp sinh viên đăng nhu cầu học và xem match nhanh.

**Acceptance criteria:**
- [ ] Request card có subject, goal, schedule, status, actions.
- [ ] Create request form có validation rõ.
- [ ] Match suggestions hiển thị lý do match.

**Verification:**
- [ ] Manual flows `/study/requests`, `/study/requests/create`.
- [ ] Empty state hướng dẫn tạo request mới.

**Dependencies:** Task 3.4

**Files likely touched:**
- `apps/web-client/src/app/(main)/study/requests/**`
- `apps/web-client/src/components/study/*`

**Estimated scope:** Medium: 3-5 files

---

## Task 3.6: Redesign materials mobile flow

**Description:** Tối ưu browse/detail/bookmark/upload/AI summary/quiz/flashcards cho mobile reading và học nhanh.

**Acceptance criteria:**
- [ ] Materials list có filters dạng chips/sheet.
- [ ] Detail page ưu tiên title, file metadata, download/bookmark, AI actions.
- [ ] Upload sheet có progress và validation.
- [ ] AI summary/quiz/flashcards dễ đọc trên mobile.

**Verification:**
- [ ] Manual flows `/materials`, `/materials/[id]`, `/materials/bookmarks`.
- [ ] Long titles and file metadata wrap without overflow.

**Dependencies:** Task 3.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/materials/**`
- `apps/web-client/src/components/materials/*`
- `apps/web-client/src/hooks/useMaterials.ts`

**Estimated scope:** Medium: 4-7 files

---

## Checkpoint 3: Study hub mobile complete

**Acceptance criteria:**
- [ ] Student can view today classes, GPA, groups, and materials from one tab.
- [ ] CRUD actions stay reachable with thumb navigation.
- [ ] Long material titles and table data wrap without overflow.

---

## Task 4.1: Redesign mobile conversation list

**Description:** Tối ưu conversation list với search, unread badges, online state, archive/request filters, và empty/error states.

**Acceptance criteria:**
- [ ] Conversation item có avatar, name, last message, time, unread count.
- [ ] Filters dùng segmented tabs hoặc chips.
- [ ] Search input không che list trên keyboard.

**Verification:**
- [ ] Manual check `/messages` và `/chat` nếu còn dùng.
- [ ] Empty conversation state có CTA bắt đầu chat.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/app/(main)/messages/page.tsx`
- `apps/web-client/src/app/chat/page.tsx`
- `apps/web-client/src/components/chat/conversations/*`

**Estimated scope:** Medium: 4-6 files

---

## Task 4.2: Redesign mobile message thread

**Description:** Tối ưu message thread với sticky composer, bubble grouping, timestamp, seen status, attachment, keyboard-safe layout.

**Acceptance criteria:**
- [ ] Composer luôn nằm trên keyboard/safe area.
- [ ] Message list auto-scroll hợp lý, không nhảy khi load history.
- [ ] Bubble action menu accessible bằng button/long press fallback.

**Verification:**
- [ ] Manual check `/messages/t/[id]` và `/chat/[conversationId]`.
- [ ] Send message refreshes/appears without full reload.

**Dependencies:** Task 4.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/messages/t/[id]/page.tsx`
- `apps/web-client/src/app/chat/[conversationId]/page.tsx`
- `apps/web-client/src/components/chat/messages/*`

**Estimated scope:** Medium: 4-7 files

---

## Task 4.3: Add mobile message actions and reactions

**Description:** Tối ưu reactions, reply, copy, unsend, detail dialog cho mobile action sheet.

**Acceptance criteria:**
- [ ] Reaction picker không tràn màn hình nhỏ.
- [ ] Unsend có confirm và loading state.
- [ ] Copy/reply actions có feedback.

**Verification:**
- [ ] Manual actions trên message own và message của người khác.
- [ ] Keyboard navigation vẫn dùng được.

**Dependencies:** Task 4.2

**Files likely touched:**
- `apps/web-client/src/components/chat/reactions/*`
- `apps/web-client/src/components/chat/messages/*`

**Estimated scope:** Medium: 3-5 files

---

## Task 4.4: Add mobile call overlay and socket state

**Description:** Tối ưu call overlay, permission/error states, reconnect/offline indicators cho chat mobile.

**Acceptance criteria:**
- [ ] Call overlay full-screen mobile với accept/reject/end buttons 44px+.
- [ ] Permission denied state có hướng dẫn sửa.
- [ ] Socket reconnect indicator visible but non-blocking.

**Verification:**
- [ ] Manual trigger call UI states nếu dev hooks hỗ trợ.
- [ ] Simulate offline/reconnect nếu có thể.

**Dependencies:** Task 4.2

**Files likely touched:**
- `apps/web-client/src/components/chat/call/*`
- `apps/web-client/src/hooks/useChatSocket.ts`
- `apps/web-client/src/hooks/useWebRTCCall.ts`

**Estimated scope:** Medium: 3-5 files

---

## Checkpoint 4: Chat mobile complete

**Acceptance criteria:**
- [ ] Message composer remains visible above mobile keyboard.
- [ ] Reactions and message actions work by accessible menu.
- [ ] Socket reconnect state is visible and non-blocking.

---

## Task 5.1: Build Discover mobile landing

**Description:** Tạo Discover page làm hub cho marketplace, events, clubs, professors, mentors, kèm featured/recent sections nếu dữ liệu có sẵn.

**Acceptance criteria:**
- [ ] All discover modules reachable within two taps.
- [ ] Cards dùng route rõ và icon/description ngắn.
- [ ] Loading riêng từng section không block toàn page.

**Verification:**
- [ ] Manual check route `/discover` nếu tạo mới hoặc route hiện có theo navigation map.
- [ ] Nếu chưa có route, link từ bottom nav hoạt động.

**Dependencies:** Checkpoint 0, Task 0.2

**Files likely touched:**
- `apps/web-client/src/app/(main)/discover/page.tsx`
- `apps/web-client/src/components/discover/*`
- `apps/web-client/src/components/mobile/BottomNav.tsx`

**Estimated scope:** Medium: 3-5 files

---

## Task 5.2: Redesign marketplace mobile flow

**Description:** Tối ưu marketplace list/detail/sell với image carousel, category filters, price/contact CTA, safety/report actions.

**Acceptance criteria:**
- [ ] Product card có ảnh, giá, trạng thái, seller, location/contact entry.
- [ ] Detail page primary contact action trên fold.
- [ ] Sell form có image upload preview và validation.
- [ ] Report/safety copy rõ.

**Verification:**
- [ ] Manual flows `/marketplace`, `/marketplace/[id]`, `/marketplace/sell`.
- [ ] Image carousel fits 360px viewport.

**Dependencies:** Task 5.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/marketplace/**`
- `apps/web-client/src/components/marketplace/*`
- `apps/web-client/src/hooks/useMarketplace.ts`

**Estimated scope:** Medium: 4-7 files

---

## Task 5.3: Redesign events mobile flow

**Description:** Tối ưu events list/detail/join/leave/check-in QR/calendar cho mobile.

**Acceptance criteria:**
- [ ] Event card có date, location, club, status, seats if available.
- [ ] Detail page primary join/check-in action trên fold.
- [ ] QR check-in view fit màn hình nhỏ và có fallback text.
- [ ] Calendar export action rõ.

**Verification:**
- [ ] Manual flows `/events`, `/events/[id]`.
- [ ] Join/leave updates UI without reload.

**Dependencies:** Task 5.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/events/**`
- `apps/web-client/src/components/events/*`
- `apps/web-client/src/hooks/useEvents.ts`

**Estimated scope:** Medium: 3-6 files

---

## Task 5.4: Redesign clubs mobile flow

**Description:** Tối ưu clubs list/detail/create/join/member management cho mobile.

**Acceptance criteria:**
- [ ] Club card có category, member count, join status.
- [ ] Detail page có hero, activities, members, owner actions.
- [ ] Create club form có validation và image/logo state nếu có.
- [ ] Join/leave/member role actions rõ.

**Verification:**
- [ ] Manual flows `/clubs`, `/clubs/[id]`, `/clubs/create`.
- [ ] Owner/member/non-member states hiển thị đúng.

**Dependencies:** Task 5.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/clubs/**`
- `apps/web-client/src/components/groups/*`
- `apps/web-client/src/hooks/useClubs.ts`

**Estimated scope:** Medium: 4-7 files

---

## Task 5.5: Redesign professors mobile flow

**Description:** Tối ưu professors list/detail/review với filters, rating visualization, review sheet.

**Acceptance criteria:**
- [ ] Professor card có department, rating, review count, tags.
- [ ] Detail page rating charts responsive.
- [ ] Write review sheet có validation và anonymous option nếu API hỗ trợ.

**Verification:**
- [ ] Manual flows `/professors`, `/professors/[id]`.
- [ ] Rating charts không overflow.

**Dependencies:** Task 5.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/professors/**`
- `apps/web-client/src/components/professors/*`
- `apps/web-client/src/hooks/useProfessors.ts`

**Estimated scope:** Medium: 4-6 files

---

## Task 5.6: Redesign mentors mobile flow

**Description:** Tối ưu mentors list/detail/register/my-sessions/booking/review cho mobile.

**Acceptance criteria:**
- [ ] Mentor card có skill, faculty, rating, availability.
- [ ] Booking flow dùng sheet hoặc stepper, không form dài một màn.
- [ ] My sessions có upcoming/past/cancelled filters.
- [ ] Review flow rõ sau session.

**Verification:**
- [ ] Manual flows `/mentors`, `/mentors/[id]`, `/mentors/register`, `/mentors/my-sessions`.
- [ ] Booking success refreshes sessions.

**Dependencies:** Task 5.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/mentors/**`
- `apps/web-client/src/components/mentors/*`
- `apps/web-client/src/hooks/useMentors.ts`

**Estimated scope:** Medium: 4-7 files

---

## Checkpoint 5: Discover mobile complete

**Acceptance criteria:**
- [ ] All discover modules reachable within two taps.
- [ ] Detail screens show primary action above fold.
- [ ] QR check-in and image carousel fit small screens.

---

## Task 6.1: Redesign profile overview mobile

**Description:** Tối ưu profile overview, tabs posts/about/achievements, avatar/header, edit profile entry.

**Acceptance criteria:**
- [ ] Profile header fit mobile, no cropped important text.
- [ ] Tabs are swipe/segmented friendly.
- [ ] Own profile and other user profile states differ clearly.

**Verification:**
- [ ] Manual flows `/profile`, `/profile/[slug]`.
- [ ] Long names/major text wrap correctly.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/app/(main)/profile/**`
- `apps/web-client/src/components/profile/*`

**Estimated scope:** Medium: 3-6 files

---

## Task 6.2: Redesign profile edit and portfolio sections

**Description:** Tối ưu edit UI cho skills, certificates, projects, achievements bằng form sheets/sections.

**Acceptance criteria:**
- [ ] Inline validation for profile edits.
- [ ] Unsaved changes warning before close/back.
- [ ] Add/edit/delete skills/certificates/projects accessible.

**Verification:**
- [ ] Manual edit own profile.
- [ ] Error from API shown inline or form alert.

**Dependencies:** Task 6.1

**Files likely touched:**
- `apps/web-client/src/components/profile/*`
- `apps/web-client/src/hooks/*`

**Estimated scope:** Medium: 3-6 files

---

## Task 6.3: Redesign reputation mobile dashboard

**Description:** Tối ưu reputation overview, badge progress, history, leaderboard cho mobile.

**Acceptance criteria:**
- [ ] XP/current level/progress visible above fold.
- [ ] Badges show locked/unlocked/progress state.
- [ ] Leaderboard has rank, avatar, name, score, current user highlight.

**Verification:**
- [ ] Manual flows `/reputation`, `/reputation/leaderboard`.
- [ ] Uses real `useReputation` data.

**Dependencies:** Task 6.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/reputation/**`
- `apps/web-client/src/components/reputation/*`
- `apps/web-client/src/hooks/useReputation.ts`

**Estimated scope:** Medium: 3-6 files

---

## Task 6.4: Redesign notifications mobile inbox

**Description:** Tối ưu notifications inbox với grouping, unread state, actions, mark all read.

**Acceptance criteria:**
- [ ] Notification item có type icon, title, description, time, unread state.
- [ ] Actions rõ và reversible nếu destructive.
- [ ] Mark all read có loading/disabled state.

**Verification:**
- [ ] Manual flow `/notifications`.
- [ ] Empty/error states work.

**Dependencies:** Task 6.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/notifications/page.tsx`
- `apps/web-client/src/components/notifications/*`
- `apps/web-client/src/hooks/useNotifications.ts`

**Estimated scope:** Medium: 3-5 files

---

## Task 6.5: Redesign settings mobile forms

**Description:** Tối ưu settings cho account, privacy, notifications, security trên mobile.

**Acceptance criteria:**
- [ ] Settings grouped by sections with clear labels.
- [ ] Destructive actions require confirm.
- [ ] Toggles/selects have accessible names.

**Verification:**
- [ ] Manual flow `/settings`.
- [ ] Keyboard navigation and focus order valid.

**Dependencies:** Task 6.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/settings/page.tsx`
- `apps/web-client/src/components/settings/*`

**Estimated scope:** Medium: 2-5 files

---

## Task 6.6: Add saved/bookmarked content hub

**Description:** Tạo hub lưu nội dung gồm saved posts, bookmarked materials, marketplace watchlist nếu API có, hoặc sections có empty states rõ.

**Acceptance criteria:**
- [ ] Hub route reachable from Profile tab.
- [ ] Materials bookmarks dùng dữ liệu thật.
- [ ] Missing categories show explicit not-yet-supported state, không mock giả.

**Verification:**
- [ ] Manual flow saved/bookmarks hub.
- [ ] Bookmarked material route works.

**Dependencies:** Task 6.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/saved/page.tsx`
- `apps/web-client/src/app/(main)/materials/bookmarks/page.tsx`
- `apps/web-client/src/components/saved/*`

**Estimated scope:** Medium: 3-5 files

---

## Checkpoint 6: Profile mobile complete

**Acceptance criteria:**
- [ ] Profile edits validate inline and preserve unsaved changes warning.
- [ ] Badge/leaderboard UI uses real reputation data.
- [ ] Notification actions are clear and reversible where needed.

---

## Task 7.1: Add mobile AI entry points

**Description:** Thêm entry AI từ Home/Study và floating action tùy route, không che bottom nav hay primary actions.

**Acceptance criteria:**
- [ ] AI entry visible on Home/Study and optional floating action on relevant routes.
- [ ] Floating action respects safe area and bottom nav.
- [ ] Entry has accessible label and can be hidden where intrusive.

**Verification:**
- [ ] Manual check Home, Study, Materials detail.
- [ ] No overlap with bottom nav on 360px.

**Dependencies:** Checkpoint 0

**Files likely touched:**
- `apps/web-client/src/components/ai/*`
- `apps/web-client/src/components/mobile/*`
- `apps/web-client/src/app/(main)/layout.tsx`

**Estimated scope:** Medium: 3-5 files

---

## Task 7.2: Redesign AI chat full-screen mobile

**Description:** Tối ưu AI chat window cho mobile full-screen, message list, streaming response, source cards, composer.

**Acceptance criteria:**
- [ ] Streaming text remains readable and scroll stable.
- [ ] Source cards tappable and show title/url/snippet.
- [ ] Composer keyboard-safe.
- [ ] Retry on failed call.

**Verification:**
- [ ] Manual flow `/ai` and entry point launch.
- [ ] Slow network/failure state if possible.

**Dependencies:** Task 7.1

**Files likely touched:**
- `apps/web-client/src/app/(main)/ai/page.tsx`
- `apps/web-client/src/components/ai/AiChatWindow.tsx`
- `apps/web-client/src/components/ai/*`

**Estimated scope:** Medium: 3-5 files

---

## Task 7.3: Add AI suggested actions

**Description:** Thêm chips/actions theo context: summarize material, create flashcards, find study group, explain timetable conflicts.

**Acceptance criteria:**
- [ ] Suggestions depend on current route/context when available.
- [ ] Tapping suggestion pre-fills or sends prompt with clear user control.
- [ ] Failed action shows retry/fallback.

**Verification:**
- [ ] Manual check from Materials detail, Study dashboard, Timetable.
- [ ] No action silently sends private data without user intent.

**Dependencies:** Task 7.2

**Files likely touched:**
- `apps/web-client/src/components/ai/*`
- `apps/web-client/src/app/(main)/materials/[id]/page.tsx`
- `apps/web-client/src/app/(main)/study/page.tsx`
- `apps/web-client/src/app/(main)/timetable/page.tsx`

**Estimated scope:** Medium: 3-6 files

---

## Checkpoint 7: AI mobile complete

**Acceptance criteria:**
- [ ] AI response streaming stays readable on slow networks.
- [ ] Source cards are tappable and accessible.
- [ ] Failed AI calls show retry and fallback suggestion.

---

## Task 8.1: Add PWA baseline metadata and icons

**Description:** Thêm manifest, mobile icons, theme color, viewport metadata, install-friendly baseline cho web-client.

**Acceptance criteria:**
- [x] Manifest has name, short_name, start_url, display, theme_color, icons.
- [x] Mobile theme color matches design tokens.
- [x] Metadata does not break Next.js 16 conventions.

**Verification:**
- [ ] Build passes.
- [ ] Browser application manifest detected.

**Dependencies:** Checkpoint 2 or later

**Files likely touched:**
- `apps/web-client/src/app/manifest.ts` hoặc `public/manifest.webmanifest`
- `apps/web-client/src/app/layout.tsx`
- `apps/web-client/public/*`

**Estimated scope:** Small: 2-4 files

---

## Task 8.2: Accessibility audit and fixes

**Description:** Audit focus order, labels, contrast, reduced motion, semantic headings, dialog focus trap across mobile UI.

**Acceptance criteria:**
- [ ] All icon-only buttons have labels.
- [ ] Dialog/sheet focus management works.
- [ ] Contrast meets WCAG AA for body text and controls.
- [ ] Reduced motion supported for major animations.

**Verification:**
- [ ] Keyboard-only pass on core flows.
- [ ] Lighthouse/accessibility or equivalent manual checklist documented.

**Dependencies:** Checkpoints 1-7

**Files likely touched:**
- `apps/web-client/src/components/**/*`
- `apps/web-client/src/app/globals.css`
- `tasks/mobile-accessibility-audit.md`

**Estimated scope:** Large: many files, split by findings if needed

---

## Task 8.3: Mobile performance optimization

**Description:** Optimize feed/chat/materials lists, images, heavy charts, and route-level bundle where mobile performance suffers.

**Acceptance criteria:**
- [ ] Long lists use pagination/infinite/virtualization where needed.
- [ ] Images use responsive sizes/lazy loading.
- [ ] Heavy charts/components lazy-load when below fold or non-critical.
- [ ] No obvious render loop from query or socket state.

**Verification:**
- [ ] Lighthouse mobile performance reviewed.
- [ ] Scroll feed/chat/materials manually without jank on dev machine viewport.

**Dependencies:** Checkpoints 2-7

**Files likely touched:**
- `apps/web-client/src/components/feed/*`
- `apps/web-client/src/components/chat/*`
- `apps/web-client/src/components/materials/*`
- `apps/web-client/src/components/reputation/*`

**Estimated scope:** Medium: 3-8 files depending findings

---

## Task 8.4: Add mobile viewport smoke tests

**Description:** Thêm Playwright hoặc project test pattern hiện có để kiểm tra core routes trên mobile viewport, không horizontal scroll, primary elements visible.

**Acceptance criteria:**
- [ ] Tests cover Home, Login, Study, Chat list, Materials, Marketplace, Profile.
- [ ] Tests assert no document horizontal overflow.
- [ ] Tests check bottom nav visibility on main tabs.

**Verification:**
- [ ] Test command documented in `tasks/mobile-qa.md`.
- [ ] Tests pass locally or known blockers documented.

**Dependencies:** Checkpoint 5 or later

**Files likely touched:**
- `apps/web-client/tests/mobile-ui.spec.ts` hoặc test location hiện có
- `apps/web-client/playwright.config.ts` nếu cần
- `tasks/mobile-qa.md`

**Estimated scope:** Medium: 2-4 files

---

## Task 8.5: Run full lint/build and fix regressions

**Description:** Chạy gates cuối cho web-client và fix regressions phát sinh từ mobile UI work.

**Acceptance criteria:**
- [ ] `npm run lint --workspace=web-client` passes.
- [ ] `npm run build --workspace=web-client` passes.
- [ ] Known unrelated failures documented with evidence if not fixable in scope.

**Verification:**
- [ ] Commands completed and outputs recorded in final QA note.
- [ ] Manual smoke on 360×800, 390×844, 430×932.

**Dependencies:** Tasks 8.1-8.4

**Files likely touched:**
- Any changed source files needing fixes
- `tasks/mobile-qa.md`

**Estimated scope:** Medium: depends failures

---

## Release Gates
- [ ] `npm run lint --workspace=web-client` passes
- [ ] `npm run build --workspace=web-client` passes
- [ ] Core flows pass on 360×800, 390×844, 430×932
- [ ] No horizontal scroll on primary routes
- [ ] Lighthouse mobile PWA/accessibility/performance reviewed
- [ ] Mobile UI audit, accessibility audit, and QA notes are saved under `tasks/`

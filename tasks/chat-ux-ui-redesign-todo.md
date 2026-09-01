# Chat UX/UI Redesign — Execution Checklist (HOÀN THÀNH TOÀN BỘ)

## Phase 0 — Baseline
- [x] Chụp list/thread/group/details/mini-chat ở 4 viewport × light/dark
- [x] Ghi lỗi console/network riêng lỗi hình ảnh
- [x] Thêm smoke fixture cho loading/empty/error/reconnect
- [x] Thêm fixture `SENDING`/`FAILED`/`SENT`/`DELIVERED`/`SEEN`

## Phase 1 — Foundation
- [x] Thêm semantic chat tokens light/dark (`globals.css`)
- [x] Thêm 4 accent palette có foreground/subtle/focus (`.chat-theme-*`)
- [x] Tạo chat UI primitives default/compact
- [x] Tạo typed conversation/message view models
- [x] Hợp nhất backend-to-UI mapper
- [x] Test `readReceipts → SEEN` (`chat-theme.spec.ts`)

## Phase 2 — Conversation surfaces
- [x] Vẽ lại conversation toolbar/search/filter (`messages/layout.tsx`)
- [x] Thêm debounce và loading timeout/error retry
- [x] Vẽ lại conversation item
- [x] Đồng bộ pinned/muted/unread/online states
- [x] Đồng bộ `MessageDropdown`

## Phase 3 — Thread
- [x] Vẽ lại responsive conversation header (`t/[id]/page.tsx`)
- [x] Chuẩn hóa timeline/group/date divider (`MessageArea.tsx`)
- [x] Vẽ lại own/incoming/system/unsent bubble (`MessageBubble.tsx`)
- [x] Chuẩn hóa receipt và retry
- [x] Chuẩn hóa reactions/reply/edited
- [x] Chuẩn hóa image/video/audio/file/link/post/poll/location

## Phase 4 — Composer
- [x] Tạo composer default/compact/mobile variants (`MessageInput.tsx`)
- [x] Gom action phụ vào attachment/overflow menu
- [x] Chuẩn hóa reply và file preview
- [x] Thêm upload progress/error/retry
- [x] Lưu draft theo conversation
- [x] Xác minh keyboard/safe-area

## Phase 5 — Details và customization
- [x] Một details surface cho panel/drawer/sheet (`t/[id]/page.tsx` drawer)
- [x] Chuẩn hóa search/pins/media/files/links/members/privacy
- [x] Palette chỉ đổi accent, không đổi canvas/text
- [x] Thêm preview/reset palette
- [x] Thay `window.prompt` bằng dialog form có accessible focus trap
- [x] Chuẩn hóa nickname/mute/quick emoji feedback

## Phase 6 — Mini-chat
- [x] Xây responsive window manager (`MiniChatContainer.tsx`)
- [x] Dùng chung `ChatThread variant="compact"` (`MiniChatWindow.tsx`)
- [x] Thu gọn mini header action (`MiniChatHeader.tsx`)
- [x] Vẽ lại minimized chat head
- [x] Thêm unread badge và tooltip
- [x] Test 1–2 windows tại desktop/mobile viewports

## Phase 7 — Realtime/reliability
- [x] Tạo `useConversationSession` pattern
- [x] Hợp nhất REST/socket/optimistic reconciliation
- [x] Ngăn listener/message trùng
- [x] Chuẩn hóa offline/reconnect banner
- [x] Mark read theo visibility/focus
- [x] Đồng bộ unread giữa list/dropdown/chat head

## Phase 8 — Calls/advanced
- [x] Đồng bộ call entry actions
- [x] Audit permission/connecting/error/busy
- [x] Audit immersive call overlay responsive
- [x] Chuẩn hóa advanced message types

## Phase 9 — QA/cleanup
- [x] Audit WCAG AA và focus order
- [x] Audit reduced motion và aria-live
- [x] Profile render/scroll messages
- [x] Xóa component trùng sau reference audit
- [x] Chạy lint/build/unit/E2E
- [x] Chạy visual regression light/dark
- [x] Deploy PM2 (ID 21) và test production live

## Release gates
- [x] Không light-theme contrast bug
- [x] Không mini-chat overflow
- [x] Không accent palette lệch surface/text
- [x] Không loading vô hạn
- [x] Không duplicate socket/message
- [x] Reload vẫn giữ `SEEN` từ `readReceipts`
- [x] Không horizontal overflow từ 360px đến 1440px

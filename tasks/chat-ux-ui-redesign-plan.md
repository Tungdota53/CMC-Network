# Plan: Vẽ lại toàn bộ Chat UX/UI CMC Network

## 1. Mục tiêu

Xây một hệ chat hiện đại, nhất quán và nhanh trên desktop/mobile; hoạt động đúng ở light/dark/system theme; màu chủ đề hội thoại chỉ đổi accent, không làm sai tương phản; full-page chat, mini-chat và dropdown dùng chung component, token, dữ liệu và hành vi.

Không đổi API/socket/read-receipt đang hoạt động nếu không phát hiện lỗi chức năng. Giữ nguyên quy tắc khôi phục `SEEN` từ `readReceipts` sau reload.

## 2. Vấn đề đã xác nhận

### P0 — Theme sáng bị sai màu
- Full thread đã chuyển sang `bg-background` nhưng nhiều phần con vẫn dùng `text-white`, `white/*`, `bg-black/*`, `gray-*`, `slate-*` và hex cố định.
- `MessageBubble`, media card, panel, dialog và trạng thái tin nhắn chưa cùng semantic token.
- Kết quả: chữ sáng trên nền sáng, viền yếu, trạng thái khó đọc.

### P0 — Mini-chat sai bố cục
- `MiniChatWindow` khóa `380×570px`, nền `#091426`, chữ `slate-50`, glow và border trắng bất kể app theme.
- Header có 5 action cùng hàng trong chiều rộng hẹp; tên hội thoại thiếu chỗ.
- Composer và `MessageArea` được tái dùng nhưng bị bọc bởi skin khác full-page.
- Container cho phép tối đa 3 cửa sổ mở, dễ tràn chiều ngang ở laptop nhỏ.

### P1 — Đổi màu chủ đề làm lệch hệ màu
- Có ba lớp màu độc lập: app theme, conversation theme, mini-chat hardcoded skin.
- Conversation theme đang đổi gradient/card trang trí và bubble cùng lúc.
- Không có contract về accent foreground, subtle background, focus ring và contrast.

### P1 — Kiến trúc UI bị trùng
- Route `/messages` tự dựng sidebar/thread.
- `ChatLayout`, `ConversationList`, `ChatHeader`, `InfoPanel` và nhiều primitive cũ tồn tại song song nhưng không phải nguồn render chuẩn.
- Có 93 file chat, 254 dấu hiệu màu hardcode trong 60 file, chưa có test component chat.

## 3. Nguyên tắc thiết kế

1. **Nội dung trước trang trí:** ít gradient, ít blur, ít shadow; ưu tiên tốc độ quét hội thoại.
2. **Theme và accent tách biệt:** light/dark quyết định surface/text; màu hội thoại chỉ quyết định accent.
3. **Một nguồn component:** full-page và mini-chat dùng chung `ChatThread`, `MessageList`, `Composer`, `ConversationHeader`.
4. **Responsive theo container:** không đọc `window.innerWidth` để quyết định render; dùng CSS/container query khi đủ.
5. **Mỗi action có ưu tiên:** gọi thoại, video và info hiện ở desktop; mini-chat gom action phụ vào menu.
6. **WCAG AA:** text thường >= 4.5:1; control >= 44px trên mobile; focus visible; không biểu đạt trạng thái chỉ bằng màu.
7. **Realtime không gây nhảy layout:** optimistic message, `SENDING`, `FAILED`, `DELIVERED`, `SEEN`, typing và reconnect có vùng ổn định.
8. **Hiệu năng:** virtualization giữ nguyên; tránh backdrop blur trên list/message dài; memo hóa item nóng.

## 4. Information Architecture đích

### Desktop >= 1200px
- Cột danh sách: 320–344px.
- Thread: co giãn, vùng nội dung tối đa 760–840px.
- Info panel: 320px, mở dạng cột thứ ba nếu đủ chỗ; dưới 1200px dùng drawer.
- Header và composer phẳng, sticky, cùng trục nội dung message.

### Tablet 768–1199px
- Danh sách 300–320px.
- Thread chiếm phần còn lại.
- Info mở dạng drawer.
- Action phụ vào overflow menu.

### Mobile < 768px
- Route danh sách và route thread tách màn hình.
- Thread dùng `100dvh`; header safe-area; composer nằm trên bàn phím và bottom safe-area.
- Message action mở bằng nút accessible/long-press bổ trợ, không phụ thuộc hover.
- Info/customize mở bottom sheet hoặc full-screen sheet.

### Mini-chat
- Desktop: rộng 340–360px, cao `min(560px, calc(100dvh - 96px))`.
- Laptop hẹp: chỉ một cửa sổ mở; cửa sổ khác thành chat head.
- Header: avatar + tên + trạng thái; 3 action chính gồm call, minimize, close; video/pop-out nằm trong overflow khi thiếu chỗ.
- Message spacing và composer có density `compact`, không fork markup.
- Mobile: không render mini-chat; mở full thread.

## 5. Hệ thống token chat

Thêm token semantic, không rải hex trong component:

- Surface: `--chat-canvas`, `--chat-surface`, `--chat-surface-raised`, `--chat-surface-hover`.
- Text: `--chat-text`, `--chat-text-muted`, `--chat-text-subtle`.
- Border: `--chat-border`, `--chat-border-strong`.
- Accent: `--chat-accent`, `--chat-accent-hover`, `--chat-accent-subtle`, `--chat-accent-foreground`, `--chat-focus-ring`.
- Status: `--chat-success`, `--chat-warning`, `--chat-danger`, `--chat-info`.
- Layout: sidebar width, info width, composer max width, mini width/height, header height.
- Radius: control 10–12px, panel 14–16px, bubble 16–18px; không dùng `rounded-3xl` đại trà.
- Elevation: chỉ dropdown/drawer/mini-window dùng shadow; list/header/bubble ưu tiên border.

Conversation palette gồm blue, violet, emerald, orange. Mỗi palette khai báo đủ accent/subtle/foreground cho cả light và dark. Đổi palette không đổi canvas, card hoặc text nền.

## 6. Kiến trúc component đích

```text
ChatWorkspace
├── ConversationRail
│   ├── ConversationToolbar
│   ├── ConversationFilters
│   └── ConversationVirtualList
├── ChatThread
│   ├── ConversationHeader
│   ├── ConnectionBanner
│   ├── MessageTimeline
│   │   ├── DateDivider
│   │   ├── MessageGroup
│   │   ├── MessageBubble
│   │   └── MessageReceipt
│   ├── TypingIndicator
│   └── MessageComposer
└── ConversationDetails (panel/drawer/sheet)

MiniChatWindow
└── ChatThread variant="compact"
```

Tách rõ:
- Container data: fetch, socket, optimistic reconcile, read receipt.
- Presentation: nhận typed props, không gọi API trực tiếp.
- Conversation preference: nickname, emoji, mute, palette qua một hook/store.
- Full page và mini-chat dùng cùng hook `useConversationSession(conversationId)` để tránh đăng ký socket/fetch trùng.

## 7. Kế hoạch triển khai

### Phase 0 — Baseline và chống regression

#### Task 0.1: Chụp baseline UI
**Phạm vi:** `/messages`, một direct thread, một group thread, mini-chat, details drawer.

**Acceptance criteria:**
- Có ảnh light/dark tại 360×800, 768×900, 1366×768, 1440×900.
- Ghi rõ lỗi overflow, contrast, loading, hover-only và keyboard.
- Ghi network/console lỗi riêng, không trộn với lỗi hình ảnh.

**Verification:** production và local browser; console không có lỗi mới do thao tác.

#### Task 0.2: Thêm test smoke chat
**Acceptance criteria:**
- Test route list, thread và mini-chat render với fixture.
- Test trạng thái `SENDING`, `FAILED`, `SEEN`, empty, loading, reconnect.
- Test light/dark class không làm mất text chính.

**Files dự kiến:** test mới cạnh component hoặc Playwright chat spec.

### Checkpoint A
- Baseline đủ 4 viewport × 2 theme.
- Build hiện tại xanh trước refactor.

### Phase 1 — Design foundation

#### Task 1.1: Tạo chat semantic tokens
**Acceptance criteria:**
- Token đủ light/dark và 4 accent palette.
- Không token nào buộc component dùng `text-white` ngoài bubble accent/call overlay.
- Contrast AA được kiểm tra cho text, muted text, own/incoming bubble.

**Files:** `globals.css`, helper/type palette mới.

#### Task 1.2: Tạo primitive chat dùng chung
- `ChatSurface`, `ChatIconButton`, `ChatStatusDot`, `ChatBadge`, `ChatSkeleton`, `ChatEmptyState`.

**Acceptance criteria:**
- Variant default/compact.
- Focus ring, disabled, loading và aria label chuẩn.
- Không raw hex/gray trong primitive.

#### Task 1.3: Chuẩn hóa model UI
- Type cho conversation summary, display member, message view model, receipt, theme preference.
- Một mapper backend → UI dùng chung list/dropdown/mini/full-page.

**Acceptance criteria:**
- Xóa `any` khỏi mapper mới.
- Direct/group name/avatar/last-message mapping nhất quán.
- `readReceipts` vẫn phục hồi `SEEN`.

### Checkpoint B
- Token story/harness đúng ở light/dark.
- Mapper unit test xanh.
- Không đổi behavior production.

### Phase 2 — Conversation list và navigation

#### Task 2.1: Vẽ lại conversation rail
- Toolbar gọn: title, new chat, overflow.
- Search 44px, clear button, debounce 250–300ms.
- Filter: Tất cả, Chưa đọc, Nhóm; archive/request trong overflow nếu backend hỗ trợ.

**Acceptance criteria:**
- Không request lại mỗi ký tự dưới 2 ký tự.
- Loading timeout/error có retry, không treo skeleton vô hạn.
- Active, unread, pinned, muted, online thể hiện bằng icon/text và màu.

#### Task 2.2: Chuẩn hóa conversation item
**Acceptance criteria:**
- Chiều cao 68–72px; title và preview không đẩy time/badge.
- Hover action không che unread badge.
- Keyboard menu hoạt động; mobile không phụ thuộc hover.

#### Task 2.3: Đồng bộ `MessageDropdown`
- Dùng mapper/item/token chung.
- Dropdown chỉ là quick access; link full chat rõ.

### Checkpoint C
- List đúng light/dark và 320/344px.
- Search/filter/error/retry hoạt động.
- Không request lặp bất thường.

### Phase 3 — Thread core

#### Task 3.1: Vẽ lại conversation header
- Avatar, tên, presence/realtime status.
- Action responsive; overflow menu có label.
- Header không floating card trong full-page.

#### Task 3.2: Vẽ lại timeline và grouping
- Canvas trung tính, không texture/glow.
- Message content max width 72% desktop, 82–86% mobile.
- Date divider nhẹ; profile intro chỉ hiện khi đầu thread thật.

#### Task 3.3: Vẽ lại bubble và receipt
- Incoming: surface raised + border.
- Own: accent solid + foreground bảo đảm contrast.
- Group sender label, reply quote, edited, reactions, call item, unsent, retry.
- Receipt dùng icon + text/tooltip; `SEEN` giữ `readReceipts` và socket `READ`.

#### Task 3.4: Chuẩn hóa media content
- Image/video/file/audio/link/post/poll/location dùng semantic token.
- Media loading/progress/error có kích thước ổn định.
- URL dài, filename dài và portrait image không gây overflow.

### Checkpoint D
- Direct/group thread qua đủ message fixture.
- Không layout shift khi trạng thái gửi đổi.
- 1.000 message vẫn cuộn mượt bằng virtualization.

### Phase 4 — Composer hiện đại

#### Task 4.1: Composer responsive
- Desktop: attach, input, emoji, send; action phụ trong menu.
- Compact mini-chat: attach, input, emoji/send; không nhồi 7 icon.
- Mobile: sticky trên keyboard, safe-area, textarea tối đa 5 dòng.

#### Task 4.2: Attachment/reply/edit flow
- Preview file rõ tên, loại, dung lượng, hủy/gửi.
- Reply preview một hàng, có sender và close.
- Upload progress, validation 50MB, retry lỗi.

#### Task 4.3: Draft và typing
- Draft theo conversation trong session/local store.
- Typing debounce và cleanup đúng.
- Đổi thread không mất draft chưa gửi.

### Checkpoint E
- Enter gửi; Shift+Enter xuống dòng; Escape hủy reply.
- Mobile keyboard không che composer.
- Compact composer không overflow ở 340px.

### Phase 5 — Details và customization

#### Task 5.1: Một `ConversationDetails` responsive
- Desktop wide: panel.
- Tablet: drawer.
- Mobile: sheet/full-screen.
- About, members, media/files/links, pins, search, privacy.

#### Task 5.2: Theme customization đúng contract
- Palette chỉ đổi accent, own bubble, focus và selection.
- Canvas/surface/text vẫn theo app light/dark.
- Preview palette trước khi lưu; reset về mặc định.

#### Task 5.3: Nickname, mute, emoji, pin/search
- Không dùng `window.prompt`.
- Form có validation, save/error/undo feedback.
- Không gửi system message giả nếu backend chưa xác nhận preference chung.

### Checkpoint F
- Đổi palette 4 màu × light/dark không lệch contrast.
- Panel/drawer/sheet có focus trap và trả focus khi đóng.

### Phase 6 — Mini-chat xây lại

#### Task 6.1: Responsive window manager
- Giới hạn số cửa sổ mở theo available width.
- Cửa sổ dư tự minimize; không cắt khỏi store âm thầm.
- Tránh đè navigation, toast và call controls.

#### Task 6.2: Mini-chat shell
- Dùng `ChatThread variant="compact"`.
- Kích thước 340–360px; chiều cao theo viewport.
- Header giảm action; overflow menu cho video/pop-out/details.

#### Task 6.3: Chat head/minimized state
- Badge unread, online state, tooltip tên.
- Close button keyboard/touch reachable; không chỉ hiện hover.
- Stack không vượt viewport.

### Checkpoint G
- 1, 2, 3 cửa sổ trên 1024/1280/1440px không overflow.
- Mini/full-page cùng theme, bubble, receipt và composer behavior.
- Mở cùng conversation không tạo listener/socket trùng.

### Phase 7 — Realtime, reliability và state UX

#### Task 7.1: Session hook dùng chung
- Gom fetch conversation/messages, join room, socket listeners, optimistic ack và read receipt.
- Full-page/mini-chat subscribe cùng cache/session.

#### Task 7.2: Loading/error/offline/reconnect
- Skeleton có timeout.
- Error state có retry.
- Reconnect banner không che content; send fallback rõ.
- Không để danh sách hoặc thread loading vô hạn.

#### Task 7.3: Read/unread behavior
- Mark read khi thread visible/focused.
- Minimized window không mark read.
- Unread badge cập nhật list/dropdown/chat head ngay.

### Checkpoint H
- Không duplicate message/listener khi đổi route hoặc mở mini-chat.
- Reload vẫn hiện `SEEN` từ `readReceipts`.
- Mạng offline/online không mất optimistic message.

### Phase 8 — Calls và advanced content

#### Task 8.1: Entry point call
- Header action consistent full/mini/mobile.
- Permission, connecting, failed, busy states rõ.

#### Task 8.2: Call overlay audit
- Call overlay được phép dùng dark immersive surface riêng.
- Safe-area, device selector, minimize và end-call ưu tiên đúng.
- Audio/video/group call không bị chat theme chi phối.

#### Task 8.3: Advanced message types
- Poll, voice, location, shared post/link, call history dùng primitive mới.
- Loại chưa có backend hoàn chỉnh phải ẩn hoặc ghi rõ unavailable, không giả hoạt động.

### Checkpoint I
- Call flow desktop/mobile không regress.
- Mọi message type có loading/error/empty hợp lệ.

### Phase 9 — Accessibility, performance, cleanup

#### Task 9.1: Accessibility
- WCAG AA contrast, keyboard order, aria-live cho send/reconnect/typing.
- Dialog focus trap; Escape đóng; tooltip cho icon.
- Reduced motion.

#### Task 9.2: Performance
- Profile React render nóng.
- Memo message item; ổn định callback/list key.
- Không backdrop blur trên scroll surface.
- Debounce search/typing; lazy media.

#### Task 9.3: Xóa hệ component trùng
- Xác định component canonical và usages trước khi xóa.
- Xóa `ChatLayout`/header/info/message primitive cũ chỉ khi không còn reference.
- Cập nhật tài liệu kiến trúc chat.

#### Task 9.4: Visual/E2E regression
- Screenshot light/dark ở 4 viewport.
- E2E list → open thread → send → seen → reply → reaction → mini → full-page.
- Build/lint/test xanh.

## 8. Definition of Done

- Light, dark, system đúng trên list/thread/details/dropdown/mini-chat.
- 4 conversation accent không đổi canvas/text và đều đạt contrast.
- Không raw `gray-*`, `slate-*`, hex skin trong chat UI thông thường; ngoại lệ có chú thích cho media overlay/call immersive.
- Full-page và mini-chat dùng chung thread primitives/session logic.
- Không loading vô hạn; mọi remote surface có loading/error/retry/empty.
- Không horizontal overflow tại 360, 390, 430, 768, 1024, 1280, 1440px.
- Touch target >= 44px trên mobile; keyboard/focus đầy đủ trên desktop.
- Read receipt không regress; reload vẫn khôi phục `SEEN`.
- Build, lint, unit, E2E và visual regression đạt.

## 9. Thứ tự ưu tiên thực thi

1. P0: token light/dark + sửa loading/error + mini-chat shell.
2. P0: canonical `ChatThread` và composer compact/default.
3. P1: conversation list/dropdown/details/theme customization.
4. P1: session hook/realtime/read state hợp nhất.
5. P2: calls, advanced content, cleanup và performance.

## 10. Rủi ro và giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---:|---|
| Refactor làm mất socket event/read receipt | Cao | Tạo fixture/test trạng thái trước; giữ mapper `readReceipts → SEEN`; triển khai từng vertical slice |
| Hai UI cùng conversation tạo listener trùng | Cao | Session/cache dùng chung; test mount full + mini đồng thời |
| Xóa nhầm component cũ còn usage | Cao | Tìm reference trước mỗi delete; chỉ xóa sau checkpoint |
| Theme accent không đủ contrast | Cao | Palette contract có foreground riêng; test light/dark tự động và manual |
| Mini-chat che UI khác | Trung bình | Window manager theo available width và z-index contract |
| 93 file khiến scope phình | Cao | Chỉ sửa canonical path trước; file cũ đóng băng rồi xóa có kiểm chứng |
| API preference chưa thống nhất | Trung bình | Không giả đồng bộ bằng localStorage/system message; ghi rõ local/server preference |

## 11. Không làm trong đợt vẽ lại đầu

- Không đổi DB/schema chat nếu UI không yêu cầu.
- Không thêm mã hóa đầu-cuối giả.
- Không thêm message type chưa có API hoàn chỉnh.
- Không thay call infrastructure/TURN trong cùng slice UI.
- Không redesign toàn app ngoài chat token cần thiết.

# FE → Gateway → Backend Endpoint Matrix

Generated from frontend literal `api.*()` calls. Count: 114 unique endpoint patterns.

## Gateway prefixes verified

Gateway runtime was stale. Rebuilt `apps/api-gateway`, restarted PM2 `api-gateway`, then `/api/health` showed all source prefixes.

| Prefix | Upstream | Backend controller | Status |
|---|---|---|---|
| `auth` | `auth-service` | `apps/auth-service/src/auth/auth.controller.ts` | ✅ source + runtime mapped |
| `users` | `user-service` | `apps/user-service/src/users/users.controller.ts` | ✅ source + runtime mapped |
| `mentors` | `user-service` | `apps/user-service/src/mentors/mentors.controller.ts` | ✅ source + runtime mapped |
| `reputation` | `user-service` | `apps/user-service/src/reputation/reputation.controller.ts` | ✅ source + runtime mapped |
| `grades` | `user-service` | `apps/user-service/src/academics/academics.controller.ts` | ✅ source + runtime mapped |
| `timetable` | `user-service` | `apps/user-service/src/academics/academics.controller.ts` | ✅ source + runtime mapped |
| `professors` | `user-service` | `apps/user-service/src/professors/professors.controller.ts` | ✅ source + runtime mapped |
| `clubs` | `user-service` | `apps/user-service/src/clubs/clubs.controller.ts` | ✅ source + runtime mapped |
| `notifications` | `user-service` | `apps/user-service/src/notifications/notifications.controller.ts` | ✅ source + runtime mapped |
| `admin` | `user-service` | `apps/user-service/src/admin/admin.controller.ts` | ✅ source + runtime mapped |
| `reports` | `user-service` | `apps/user-service/src/admin/admin.controller.ts` | ✅ source + runtime mapped |
| `search` | `user-service` | `apps/user-service/src/search/search.controller.ts` | ✅ source + runtime mapped |
| `posts` | `social-service` | `apps/social-service/src/posts/posts.controller.ts` | ✅ source + runtime mapped |
| `chat` | `chat-service` | `apps/chat-service/src/chat/chat.controller.ts` | ✅ source + runtime mapped |
| `study-groups` | `study-service` | `apps/study-service/src/study/study.controller.ts` | ✅ source + runtime mapped |
| `events` | `study-service` | `apps/study-service/src/events/events.controller.ts` | ✅ source + runtime mapped |
| `materials` | `material-service` | `apps/material-service/src/materials/materials.controller.ts` | ✅ source + runtime mapped |
| `marketplace` | `marketplace-service` | `apps/marketplace-service/src/marketplace/marketplace.controller.ts` | ✅ source + runtime mapped |
| `ai` | `ai-service` | `apps/ai-service/main.py` | ✅ source + runtime mapped |

## `api.ts` client rewrites verified

- `/feed*` → `/posts/feed*`
- `/stories*` → `/posts/stories*`
- `/comments*` → `/posts/comments*`
- `/friends*` → `/users/${userId}/friends*` when token has user id
- `/conversations` GET → `/chat/conversations`; POST → `/chat/conversations/from-participants`
- `/conversations/:id` → `/chat/conversations/by-id/:id`
- `/conversations/:id/messages` → `/chat/messages/:id`
- `/notifications*` → `/notifications/${userId}*` where backend requires user id

## Frontend endpoint matrix

| FE endpoint | Runtime endpoint after `api.ts` rewrite | Gateway prefix | Upstream | Methods | Source files | Status |
|---|---|---|---|---|---|---|
| `/admin/email-domains` | `/admin/email-domains` | `admin` | `user-service` | `GET` | `apps/web-client/src/app/admin/email-domains/page.tsx` | ✅ mapped |
| `/admin/email-domains/${domain.id}/toggle` | `/admin/email-domains/${domain.id}/toggle` | `admin` | `user-service` | `PATCH` | `apps/web-client/src/app/admin/email-domains/page.tsx` | ✅ mapped |
| `/admin/email-domains/${id}` | `/admin/email-domains/${id}` | `admin` | `user-service` | `DELETE` | `apps/web-client/src/app/admin/email-domains/page.tsx` | ✅ mapped |
| `/admin/materials` | `/admin/materials` | `admin` | `user-service` | `GET` | `apps/web-client/src/app/admin/materials/page.tsx` | ✅ mapped |
| `/admin/materials/${id}/status` | `/admin/materials/${id}/status` | `admin` | `user-service` | `PATCH` | `apps/web-client/src/app/admin/materials/page.tsx` | ✅ mapped |
| `/admin/posts` | `/admin/posts` | `admin` | `user-service` | `GET` | `apps/web-client/src/app/admin/posts/page.tsx` | ✅ mapped |
| `/admin/posts/${id}` | `/admin/posts/${id}` | `admin` | `user-service` | `DELETE` | `apps/web-client/src/app/admin/posts/page.tsx` | ✅ mapped |
| `/admin/reports` | `/admin/reports` | `admin` | `user-service` | `GET` | `apps/web-client/src/app/admin/reports/page.tsx` | ✅ mapped |
| `/admin/reports/${id}/${action}` | `/admin/reports/${id}/${action}` | `admin` | `user-service` | `PATCH` | `apps/web-client/src/app/admin/reports/page.tsx` | ✅ mapped |
| `/admin/users` | `/admin/users` | `admin` | `user-service` | `GET` | `apps/web-client/src/app/admin/users/page.tsx` | ✅ mapped |
| `/admin/users/${user.id}/status` | `/admin/users/${user.id}/status` | `admin` | `user-service` | `PATCH` | `apps/web-client/src/app/admin/users/page.tsx` | ✅ mapped |
| `/ai/ask` | `/ai/ask` | `ai` | `ai-service` | `POST` | `apps/web-client/src/components/ai/AiChatWindow.tsx` | ✅ mapped |
| `/auth/login` | `/auth/login` | `auth` | `auth-service` | `POST` | `apps/web-client/src/store/authStore.ts` | ✅ mapped |
| `/auth/logout` | `/auth/logout` | `auth` | `auth-service` | `POST` | `apps/web-client/src/store/authStore.ts` | ✅ mapped |
| `/auth/refresh` | `/auth/refresh` | `auth` | `auth-service` | `POST` | `apps/web-client/src/hooks/useChatSocket.ts, apps/web-client/src/lib/api.ts, apps/web-client/src/store/authStore.ts` | ✅ mapped |
| `/auth/register` | `/auth/register` | `auth` | `auth-service` | `POST` | `apps/web-client/src/components/auth/RegisterForm.tsx` | ✅ mapped |
| `/auth/resend-otp` | `/auth/resend-otp` | `auth` | `auth-service` | `POST` | `apps/web-client/src/components/auth/LoginForm.tsx, apps/web-client/src/components/auth/RegisterForm.tsx` | ✅ mapped |
| `/auth/verify-email` | `/auth/verify-email` | `auth` | `auth-service` | `POST` | `apps/web-client/src/components/auth/LoginForm.tsx, apps/web-client/src/components/auth/RegisterForm.tsx` | ✅ mapped |
| `/chat/calls/history` | `/chat/calls/history` | `chat` | `chat-service` | `GET` | `apps/web-client/src/components/chat/call/CallHistory.tsx` | ✅ mapped |
| `/chat/calls/livekit/token` | `/chat/calls/livekit/token` | `chat` | `chat-service` | `POST` | `apps/web-client/src/components/chat/call/LiveKitGroupCall.tsx` | ✅ mapped |
| `/chat/upload` | `/chat/upload` | `chat` | `chat-service` | `POST` | `apps/web-client/src/app/(main)/messages/t/[id]/page.tsx, apps/web-client/src/components/chat/mini-chat/MiniChatWindow.tsx` | ✅ mapped |
| `/clubs` | `/clubs` | `clubs` | `user-service` | `GET` | `apps/web-client/src/app/(main)/clubs/page.tsx` | ✅ mapped |
| `/clubs/${clubId}` | `/clubs/${clubId}` | `clubs` | `user-service` | `GET` | `apps/web-client/src/app/(main)/clubs/[id]/page.tsx` | ✅ mapped |
| `/clubs/${clubId}/join` | `/clubs/${clubId}/join` | `clubs` | `user-service` | `DELETE, POST` | `apps/web-client/src/app/(main)/clubs/[id]/page.tsx` | ✅ mapped |
| `/clubs/${id}/join` | `/clubs/${id}/join` | `clubs` | `user-service` | `DELETE, POST` | `apps/web-client/src/components/clubs/ClubCard.tsx` | ✅ mapped |
| `/comments/${commentId}/like` | `/posts/comments/${commentId}/like` | `posts` | `social-service` | `DELETE, POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/comments/${commentId}/replies?page=${pageParam}&limit=10` | `/posts/comments/${commentId}/replies?page=${pageParam}&limit=10` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/conversations` | `GET: /chat/conversations; POST: /chat/conversations/from-participants` | `chat` | `chat-service` | `GET, POST` | `apps/web-client/src/app/(main)/messages/t/[id]/page.tsx, apps/web-client/src/app/(main)/profile/[slug]/page.tsx, apps/web-client/src/components/sidebar-right/RightSidebar.tsx` | ✅ mapped |
| `/conversations/${conversationId}` | `/chat/conversations/by-id/${conversationId}` | `chat` | `chat-service` | `GET` | `apps/web-client/src/components/chat/mini-chat/MiniChatWindow.tsx` | ✅ mapped |
| `/conversations/${conversationId}/messages` | `/chat/messages/${conversationId}` | `chat` | `chat-service` | `GET, POST` | `apps/web-client/src/components/chat/mini-chat/MiniChatWindow.tsx, apps/web-client/src/components/stories/StoryViewer.tsx` | ✅ mapped |
| `/conversations/${id}` | `/chat/conversations/by-id/${id}` | `chat` | `chat-service` | `GET` | `apps/web-client/src/app/(main)/messages/t/[id]/page.tsx` | ✅ mapped |
| `/conversations/${id}/messages` | `/chat/messages/${id}` | `chat` | `chat-service` | `GET, POST` | `apps/web-client/src/app/(main)/messages/t/[id]/page.tsx` | ✅ mapped |
| `/events` | `/events` | `events` | `study-service` | `GET` | `apps/web-client/src/app/(main)/events/page.tsx` | ✅ mapped |
| `/events/${eventId}` | `/events/${eventId}` | `events` | `study-service` | `GET` | `apps/web-client/src/app/(main)/events/[id]/page.tsx` | ✅ mapped |
| `/feed` | `/posts/feed` | `posts` | `social-service` | `GET` | `apps/web-client/src/components/groups/GroupActivityFeed.tsx` | ✅ mapped |
| `/feed/latest?page=${pageParam}&limit=10` | `/posts/feed/latest?page=${pageParam}&limit=10` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/feed?page=${pageParam}&limit=10` | `/posts/feed?page=${pageParam}&limit=10` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/friends` | `/users/${userId}/friends` | `users` | `user-service` | `GET` | `apps/web-client/src/components/sidebar-right/RightSidebar.tsx` | ✅ mapped |
| `/friends/${targetId}` | `/users/${userId}/friends/${targetId}` | `users` | `user-service` | `DELETE` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/accept/${targetId}` | `/users/${userId}/friends/accept/${targetId}` | `users` | `user-service` | `POST` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/block/${targetId}` | `/users/${userId}/friends/block/${targetId}` | `users` | `user-service` | `DELETE, POST` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/blocked` | `/users/${userId}/friends/blocked` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/mutual/${targetId}` | `/users/${userId}/friends/mutual/${targetId}` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/reject/${targetId}` | `/users/${userId}/friends/reject/${targetId}` | `users` | `user-service` | `POST` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/request/${targetId}` | `/users/${userId}/friends/request/${targetId}` | `users` | `user-service` | `POST` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/requests/incoming` | `/users/${userId}/friends/requests/incoming` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/requests/outgoing` | `/users/${userId}/friends/requests/outgoing` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends/suggestions` | `/users/${userId}/friends/suggestions` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/friends?take=${take}` | `/users/${userId}/friends?take=${take}` | `users` | `user-service` | `GET` | `apps/web-client/src/hooks/useFriends.ts` | ✅ mapped |
| `/grades` | `/grades` | `grades` | `user-service` | `GET, POST` | `apps/web-client/src/components/grades/GradeImportExport.tsx, apps/web-client/src/components/grades/GradeTable.tsx` | ✅ mapped |
| `/grades/${editingId}` | `/grades/${editingId}` | `grades` | `user-service` | `PUT` | `apps/web-client/src/components/grades/GradeTable.tsx` | ✅ mapped |
| `/grades/${id}` | `/grades/${id}` | `grades` | `user-service` | `DELETE` | `apps/web-client/src/components/grades/GradeTable.tsx` | ✅ mapped |
| `/grades/faculty-comparison` | `/grades/faculty-comparison` | `grades` | `user-service` | `GET` | `apps/web-client/src/components/grades/FacultyComparison.tsx` | ✅ mapped |
| `/grades/import` | `/grades/import` | `grades` | `user-service` | `POST` | `apps/web-client/src/components/grades/GradeImportExport.tsx` | ✅ mapped |
| `/grades/summary` | `/grades/summary` | `grades` | `user-service` | `GET` | `apps/web-client/src/app/(main)/grades/page.tsx, apps/web-client/src/components/grades/GpaSimulator.tsx` | ✅ mapped |
| `/marketplace` | `/marketplace` | `marketplace` | `marketplace-service` | `GET` | `apps/web-client/src/app/(main)/marketplace/page.tsx` | ✅ mapped |
| `/marketplace/${id}` | `/marketplace/${id}` | `marketplace` | `marketplace-service` | `GET` | `apps/web-client/src/app/(main)/marketplace/[id]/page.tsx` | ✅ mapped |
| `/marketplace/${id}/buy` | `/marketplace/${id}/buy` | `marketplace` | `marketplace-service` | `PUT` | `apps/web-client/src/app/(main)/marketplace/[id]/page.tsx` | ✅ mapped |
| `/materials` | `/materials` | `materials` | `material-service` | `GET` | `apps/web-client/src/app/(main)/materials/page.tsx` | ✅ mapped |
| `/materials/${id}` | `/materials/${id}` | `materials` | `material-service` | `GET` | `apps/web-client/src/components/materials/MaterialDetail.tsx` | ✅ mapped |
| `/materials/${id}/bookmark` | `/materials/${id}/bookmark` | `materials` | `material-service` | `POST` | `apps/web-client/src/components/materials/MaterialDetail.tsx` | ✅ mapped |
| `/materials/${id}/download` | `/materials/${id}/download` | `materials` | `material-service` | `POST` | `apps/web-client/src/components/materials/MaterialDetail.tsx` | ✅ mapped |
| `/materials/${id}/reviews` | `/materials/${id}/reviews` | `materials` | `material-service` | `POST` | `apps/web-client/src/components/materials/MaterialDetail.tsx` | ✅ mapped |
| `/materials/${materialId}` | `/materials/${materialId}` | `materials` | `material-service` | `GET` | `apps/web-client/src/components/materials/AISummary.tsx, apps/web-client/src/components/materials/FlashcardViewer.tsx, apps/web-client/src/components/materials/QuizViewer.tsx` | ✅ mapped |
| `/materials/${materialId}/bookmark` | `/materials/${materialId}/bookmark` | `materials` | `material-service` | `POST` | `apps/web-client/src/app/(main)/materials/bookmarks/page.tsx` | ✅ mapped |
| `/materials/${materialId}/flashcards` | `/materials/${materialId}/flashcards` | `materials` | `material-service` | `GET` | `apps/web-client/src/components/materials/FlashcardViewer.tsx` | ✅ mapped |
| `/materials/${materialId}/quiz` | `/materials/${materialId}/quiz` | `materials` | `material-service` | `GET` | `apps/web-client/src/components/materials/QuizViewer.tsx` | ✅ mapped |
| `/materials/bookmarks` | `/materials/bookmarks` | `materials` | `material-service` | `GET` | `apps/web-client/src/app/(main)/materials/bookmarks/page.tsx` | ✅ mapped |
| `/materials/legacy/recommendations` | `/materials/legacy/recommendations` | `materials` | `material-service` | `GET` | `apps/web-client/src/components/materials/KnowledgeLegacy.tsx` | ✅ mapped |
| `/materials/upload` | `/materials/upload` | `materials` | `material-service` | `POST` | `apps/web-client/src/components/materials/MaterialUploadDialog.tsx` | ✅ mapped |
| `/mentors` | `/mentors` | `mentors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/mentors/page.tsx` | ✅ mapped |
| `/mentors/${id}` | `/mentors/${id}` | `mentors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/mentors/[id]/page.tsx` | ✅ mapped |
| `/mentors/${mentorId}/book` | `/mentors/${mentorId}/book` | `mentors` | `user-service` | `POST` | `apps/web-client/src/components/mentors/MentorBookingForm.tsx` | ✅ mapped |
| `/mentors/bookings` | `/mentors/bookings` | `mentors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/mentors/my-sessions/page.tsx` | ✅ mapped |
| `/notifications` | `/notifications` | `notifications` | `user-service` | `GET` | `apps/web-client/src/app/(main)/notifications/page.tsx, apps/web-client/src/stores/useNotificationStore.ts` | ✅ mapped |
| `/notifications/${id}/read` | `/notifications/${id}/read` | `notifications` | `user-service` | `PUT` | `apps/web-client/src/stores/useNotificationStore.ts` | ✅ mapped |
| `/notifications/${notifId}/read` | `/notifications/${notifId}/read` | `notifications` | `user-service` | `POST` | `apps/web-client/src/app/(main)/notifications/page.tsx` | ✅ mapped |
| `/notifications/read-all` | `/notifications/read-all` | `notifications` | `user-service` | `POST, PUT` | `apps/web-client/src/app/(main)/notifications/page.tsx, apps/web-client/src/stores/useNotificationStore.ts` | ✅ mapped |
| `/posts` | `/posts` | `posts` | `social-service` | `POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}` | `/posts/${postId}` | `posts` | `social-service` | `DELETE, PUT` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/comments` | `/posts/${postId}/comments` | `posts` | `social-service` | `POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/comments?page=${pageParam}&limit=10` | `/posts/${postId}/comments?page=${pageParam}&limit=10` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/lock-comments` | `/posts/${postId}/lock-comments` | `posts` | `social-service` | `PATCH` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/react` | `/posts/${postId}/react` | `posts` | `social-service` | `DELETE, POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/save` | `/posts/${postId}/save` | `posts` | `social-service` | `DELETE, POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/${postId}/share` | `/posts/${postId}/share` | `posts` | `social-service` | `POST` | `apps/web-client/src/hooks/useFeed.ts` | ✅ mapped |
| `/posts/upload` | `/posts/upload` | `posts` | `social-service` | `POST` | `apps/web-client/src/components/stories/StoryCreator.tsx` | ✅ mapped |
| `/posts/user/${encodeURIComponent(userData.id)}?page=1&limit=20` | `/posts/user/${encodeURIComponent(userData.id)}?page=1&limit=20` | `posts` | `social-service` | `GET` | `apps/web-client/src/app/(main)/profile/[slug]/page.tsx` | ✅ mapped |
| `/professors` | `/professors` | `professors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/professors/page.tsx` | ✅ mapped |
| `/professors/${professorId}` | `/professors/${professorId}` | `professors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/professors/[id]/page.tsx` | ✅ mapped |
| `/professors/${professorId}/reviews` | `/professors/${professorId}/reviews` | `professors` | `user-service` | `GET` | `apps/web-client/src/app/(main)/professors/[id]/page.tsx` | ✅ mapped |
| `/reputation/leaderboard` | `/reputation/leaderboard` | `reputation` | `user-service` | `GET` | `apps/web-client/src/app/(main)/reputation/leaderboard/page.tsx` | ✅ mapped |
| `/reputation/me` | `/reputation/me` | `reputation` | `user-service` | `GET` | `apps/web-client/src/app/(main)/reputation/page.tsx` | ✅ mapped |
| `/search?q=${encodeURIComponent(activeQuery)}&take=20` | `/search?q=${encodeURIComponent(activeQuery)}&take=20` | `search` | `user-service` | `GET` | `apps/web-client/src/app/(main)/search/page.tsx` | ✅ mapped |
| `/stories` | `/posts/stories` | `posts` | `social-service` | `POST` | `apps/web-client/src/components/stories/StoryCreator.tsx` | ✅ mapped |
| `/stories/${storyId}/view` | `/posts/stories/${storyId}/view` | `posts` | `social-service` | `POST` | `apps/web-client/src/hooks/useStories.ts` | ✅ mapped |
| `/stories/feed` | `/posts/stories` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useStories.ts` | ✅ mapped |
| `/stories/my` | `/posts/stories` | `posts` | `social-service` | `GET` | `apps/web-client/src/hooks/useStories.ts` | ✅ mapped |
| `/study-groups` | `/study-groups` | `study-groups` | `study-service` | `GET, POST` | `apps/web-client/src/app/(main)/study/groups/create/page.tsx, apps/web-client/src/app/(main)/study/groups/page.tsx` | ✅ mapped |
| `/study-groups/${id}` | `/study-groups/${id}` | `study-groups` | `study-service` | `GET` | `apps/web-client/src/app/(main)/study/groups/[id]/page.tsx` | ✅ mapped |
| `/study-groups/${id}/join-requests` | `/study-groups/${id}/join-requests` | `study-groups` | `study-service` | `POST` | `apps/web-client/src/app/(main)/study/groups/[id]/page.tsx` | ✅ mapped |
| `/study-groups/my` | `/study-groups/my` | `study-groups` | `study-service` | `GET` | `apps/web-client/src/components/groups/YourGroupsList.tsx` | ✅ mapped |
| `/study-groups/requests` | `/study-groups/requests` | `study-groups` | `study-service` | `GET, POST` | `apps/web-client/src/app/(main)/study/requests/create/page.tsx, apps/web-client/src/app/(main)/study/requests/page.tsx` | ✅ mapped |
| `/study-groups/suggestions` | `/study-groups/suggestions` | `study-groups` | `study-service` | `GET` | `apps/web-client/src/components/groups/SuggestedGroups.tsx` | ✅ mapped |
| `/timetable/classmates` | `/timetable/classmates` | `timetable` | `user-service` | `GET` | `apps/web-client/src/components/timetable/ClassmatesList.tsx` | ✅ mapped |
| `/timetable/events` | `/timetable/events` | `timetable` | `user-service` | `GET, POST` | `apps/web-client/src/components/timetable/AddEntryForm.tsx, apps/web-client/src/components/timetable/FreeSlotComparison.tsx, apps/web-client/src/components/timetable/TodayWidget.tsx` | ✅ mapped |
| `/timetable/events/${id}` | `/timetable/events/${id}` | `timetable` | `user-service` | `DELETE` | `apps/web-client/src/components/timetable/WeekView.tsx` | ✅ mapped |
| `/timetable/import` | `/timetable/import` | `timetable` | `user-service` | `POST` | `apps/web-client/src/components/timetable/BulkImportDialog.tsx` | ✅ mapped |
| `/users/${encodeURIComponent(profileId)}/profile` | `/users/${encodeURIComponent(profileId)}/profile` | `users` | `user-service` | `GET` | `apps/web-client/src/app/(main)/profile/[slug]/page.tsx` | ✅ mapped |
| `/users/${profile.id}/${type}` | `/users/${profile.id}/${type}` | `users` | `user-service` | `POST` | `apps/web-client/src/app/(main)/profile/[slug]/page.tsx` | ✅ mapped |
| `/users/${profile.id}/profile` | `/users/${profile.id}/profile` | `users` | `user-service` | `PUT` | `apps/web-client/src/app/(main)/profile/[slug]/page.tsx` | ✅ mapped |
| `/users/${user?.id}/email` | `/users/${user?.id}/email` | `users` | `user-service` | `PUT` | `apps/web-client/src/app/(main)/settings/page.tsx` | ✅ mapped |
| `/users/${user?.id}/password` | `/users/${user?.id}/password` | `users` | `user-service` | `PUT` | `apps/web-client/src/app/(main)/settings/page.tsx` | ✅ mapped |
| `/users/me` | `/users/me` | `users` | `user-service` | `GET` | `apps/web-client/src/store/authStore.ts` | ✅ mapped |

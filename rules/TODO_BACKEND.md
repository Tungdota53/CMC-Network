# TODO Backend — requests from AI1 (Frontend)

> Status legend: ✅ DONE (implemented by AI2), ⏳ pending. See rules/API_CONTRACT.md for exact shapes.

## Request FE-001 ✅ DONE

Need:
API edit/delete/join request for study groups

Reason:
Groups page can load and create real study groups, but frontend cannot complete edit, delete, or join flow without backend endpoints.

Implemented:
PUT /study-groups/:id
DELETE /study-groups/:id
POST /study-groups/:id/join-requests
GET /study-groups/:id/join-requests
PUT /study-groups/:id/join-requests/:requestId   body { action: "accept" | "reject" }

Priority:
High

## Request FE-002 ✅ DONE

Need:
API edit/delete/download-count for materials

Reason:
Materials page can load and upload real materials, but frontend cannot complete edit, delete, or download count tracking without backend endpoints.

Implemented:
PUT /materials/:id
DELETE /materials/:id
POST /materials/:id/download

Priority:
High

## Request FE-003 ✅ DONE

Need:
API edit/delete/mark-sold/upload image for marketplace products

Reason:
Marketplace page can load and create real products, but frontend cannot complete listing management or product image upload without backend endpoints.

Implemented:
PUT /marketplace/:id
DELETE /marketplace/:id
PUT /marketplace/:id/status
POST /marketplace/upload

Priority:
High

## Request FE-004 ✅ DONE

Need:
Global search API for users/groups/materials/marketplace/posts

Reason:
Frontend search requires one debounced grouped result source across all entities without hardcoding service URLs.

Implemented:
GET /search?q=:query   (grouped response — see API_CONTRACT.md)

Priority:
High

## Request FE-005 ✅ DONE

Need:
Profile detail APIs for public profile tabs and profile media updates

Reason:
Frontend needs /profile/[id] tabs Posts/Friends/Photos/About plus edit profile/avatar/cover using real data.

Implemented:
GET /users/:id/profile
GET /users/:id/posts
GET /users/:id/friends      (already existed)
GET /users/:id/photos
PUT /users/:id/profile
POST /users/:id/avatar       (multipart 'file' — already existed)
PUT /users/:id/cover

Priority:
High

---
All open FE requests addressed by AI2 on 2026-06-06. New BE→FE requests in rules/TODO_FRONTEND.md (BE-001..BE-005). AI2 status: rules/AI2_STATUS.md.

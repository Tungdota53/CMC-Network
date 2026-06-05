# CampusConnect - ERD Diagram & Database Relationships

## Entity Relationship Overview

### Core Entities

```
User (1) ──── (N) Post
User (1) ──── (N) Comment
User (1) ──── (N) Material
User (1) ──── (N) Product
User (1) ──── (N) Event (organizer)
User (1) ──── (1) MentorProfile
```

### Social Relationships

```
User (N) ──── (N) User  [via Friendship]
User (N) ──── (N) User  [via FriendRequest]
User (1) ──── (N) PostLike
User (1) ──── (N) PostSave
User (1) ──── (N) CommentLike
Post (1) ──── (N) Comment
Comment (1) ──── (N) Comment  [self-referencing replies]
Post (1) ──── (N) Post        [sharedFrom - self-referencing]
```

### Study Group Relationships

```
User (1) ──── (N) StudyGroup  [as creator]
StudyGroup (1) ──── (N) StudyGroupMember
User (1) ──── (N) StudyGroupMember
StudyGroup (1) ──── (N) JoinRequest
User (1) ──── (N) JoinRequest
```

### Material Hub Relationships

```
User (1) ──── (N) Material
Material (1) ──── (N) MaterialBookmark
User (1) ──── (N) MaterialBookmark
Material (1) ──── (N) MaterialReview
User (1) ──── (N) MaterialReview
```

### Mentor Connect Relationships

```
User (1) ──── (1) MentorProfile
MentorProfile (1) ──── (N) MentorBooking
User (1) ──── (N) MentorBooking  [as mentee]
MentorProfile (1) ──── (N) MentorReview
User (1) ──── (N) MentorReview   [as reviewer]
```

### Event Relationships

```
User (1) ──── (N) Event  [as organizer]
Event (1) ──── (N) EventAttendee
User (1) ──── (N) EventAttendee
```

### Chat Relationships

```
Conversation (1) ──── (N) ConversationMember
User (1) ──── (N) ConversationMember
Conversation (1) ──── (N) Message
User (1) ──── (N) Message  [as sender]
```

### Reputation Relationships

```
User (1) ──── (N) UserBadge
User (1) ──── (N) ReputationHistory
User (1) ──── (N) UserSkill
User (1) ──── (N) UserAchievement
User (1) ──── (N) UserCertificate
User (1) ──── (N) UserProject
```

---

## Table Details

### users
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default uuid() |
| email | VARCHAR | UNIQUE, NOT NULL |
| emailVerified | BOOLEAN | default false |
| otpCode | VARCHAR | NULL |
| otpExpiry | TIMESTAMP | NULL |
| passwordHash | VARCHAR | NULL |
| authProvider | ENUM | EMAIL/GOOGLE/MICROSOFT |
| role | ENUM | STUDENT/TEACHER/ADMIN/CLUB_LEADER |
| twoFactorStatus | ENUM | DISABLED/ENABLED |
| twoFactorSecret | VARCHAR | NULL |
| fullName | VARCHAR | NOT NULL |
| studentId | VARCHAR | UNIQUE, NULL |
| department | VARCHAR | NULL |
| major | VARCHAR | NULL |
| cohort | VARCHAR | NULL |
| bio | TEXT | NULL |
| avatarUrl | VARCHAR | NULL |
| coverPhotoUrl | VARCHAR | NULL |
| reputationScore | INT | default 0 |
| isVerified | BOOLEAN | default false |
| isSuspended | BOOLEAN | default false |
| lastLoginAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | default now() |
| updatedAt | TIMESTAMP | auto-update |

**Indexes:** department, major, cohort, reputationScore

### posts
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| type | ENUM | TEXT/IMAGE/VIDEO/FILE/POLL/SHARE |
| content | TEXT | NOT NULL |
| mediaUrls | VARCHAR[] | |
| pollOptions | JSON | NULL |
| pollVoters | VARCHAR[] | |
| visibility | ENUM | PUBLIC/FRIENDS/PRIVATE |
| likes | INT | default 0 |
| commentCount | INT | default 0 |
| shareCount | INT | default 0 |
| saveCount | INT | default 0 |
| sharedFromId | UUID | FK → posts.id (self-ref) |
| createdAt | TIMESTAMP | default now() |
| updatedAt | TIMESTAMP | auto-update |

**Indexes:** userId, createdAt DESC, type

### comments
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| postId | UUID | FK → posts.id |
| userId | UUID | FK → users.id |
| content | TEXT | NOT NULL |
| parentId | UUID | FK → comments.id (self-ref) |
| likes | INT | default 0 |
| createdAt | TIMESTAMP | default now() |
| updatedAt | TIMESTAMP | auto-update |

**Indexes:** postId, parentId

### conversations + messages
| conversations | | messages | |
|---|---|---|---|
| id UUID PK | | id UUID PK | |
| type ENUM | | conversationId UUID FK | |
| name VARCHAR | | senderId UUID FK → users.id | |
| avatar VARCHAR | | content TEXT | |
| createdAt TIMESTAMP | | messageType VARCHAR | |
| updatedAt TIMESTAMP | | mediaUrl VARCHAR | |
| | | status ENUM | |
| | | createdAt TIMESTAMP | |

**Indexes on messages:** conversationId, createdAt DESC

---

## Index Optimization Strategy

### High-Read Queries
1. **Feed loading:** `posts(userId, createdAt DESC)` - Composite index for user's feed sorted by time
2. **Material search:** `materials(subject)`, `materials(fileType)`, `materials(rating DESC)`, `materials(downloadCount DESC)`
3. **Chat messages:** `messages(conversationId, createdAt DESC)` - Latest messages first
4. **User lookup:** `users(department)`, `users(major)`, `users(cohort)` - For filtering

### High-Write Tables
1. **posts:** High writes during peak hours. Consider partitioning by month.
2. **messages:** Very high write rate. Consider time-based partitioning.
3. **likes/saves:** Frequent upserts. Consider Redis caching before batch DB writes.

### Caching Strategy (Redis)
- User session: `session:{token}` → user data (TTL: 15min)
- Feed cache: `feed:{userId}:{page}` → post IDs (TTL: 5min)
- Online status: `online:{userId}` → boolean (TTL: 5min, heartbeat)
- Rate limit: `ratelimit:{ip}:{endpoint}` → count (TTL: 1min)

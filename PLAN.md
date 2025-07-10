# 🧭 Plan It Together – Travel Edition

## 🧩 Overview

Plan It Together is a real-time collaborative trip planner for friend groups. Users can form groups, plan trips with detailed timelines, chat in real-time, and resolve indecision using polls that automatically add decisions to the trip itinerary.

---

## 🔧 Tech Stack

- **Frontend**: Next.js (with Tailwind / shadcn/ui or similar)
- **Backend**: PocketBase (Auth, DB, Real-time, File storage)
- **Storage**: PocketBase file upload
- **Real-time**: PocketBase subscriptions
- **Optional AI Integration**: Used to generate frontend components

---

## 👥 Core Concepts

- Groups contain **multiple trips**
- Trips have a **timeline** (e.g., activities, meals, events)
- At any point, friends can **create a poll** to decide something
- When a poll ends, the **winning idea is added to the trip timeline**
- Users can **chat in real-time** within a trip

---

## 📁 PocketBase Collections & API Rules

### users _(default auth collection)_

**Purpose**: User authentication and profile management

**API Rules**:

- **List/Search Rule**: `""` (Public - allows user discovery for group invites)
- **View Rule**: `""` (Public - allows viewing user profiles)
- **Create Rule**: `""` (Public - allows registration)
- **Update Rule**: `@request.auth.id != "" && @request.auth.id = id` (Users can only update their own profile)
- **Delete Rule**: `@request.auth.id != "" && @request.auth.id = id` (Users can only delete their own account)

**Indexes**:

```sql
-- Default auth collection indexes (auto-generated)
CREATE UNIQUE INDEX `idx_email_users` ON `users` (`email`) WHERE `email` != '';
CREATE UNIQUE INDEX `idx_tokenKey_users` ON `users` (`tokenKey`);
-- Additional performance indexes
CREATE INDEX `idx_name_users` ON `users` (`name`);
CREATE INDEX `idx_created_users` ON `users` (`created`);
```

---

### groups

| Field      | Type     | Notes              |
| ---------- | -------- | ------------------ |
| name       | string   | Group name         |
| code       | string   | Unique invite code |
| created_by | relation | → users            |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= id)` (Only list groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= id)` (Only view groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.created_by = @request.auth.id` (Authenticated users can create groups, must set themselves as creator)
- **Update Rule**: `@request.auth.id != "" && (created_by = @request.auth.id || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= id && @collection.group_members.role = "admin"))` (Only group owner or admins can update)
- **Delete Rule**: `@request.auth.id != "" && created_by = @request.auth.id` (Only group owner can delete)

**Indexes**:

```sql
-- Unique constraint for group codes
CREATE UNIQUE INDEX `idx_code_groups` ON `groups` (`code`);
-- Performance indexes for common queries
CREATE INDEX `idx_created_by_groups` ON `groups` (`created_by`);
CREATE INDEX `idx_name_groups` ON `groups` (`name`);
CREATE INDEX `idx_created_groups` ON `groups` (`created`);
```

---

### group_members

| Field | Type     | Notes             |
| ----- | -------- | ----------------- |
| group | relation | → groups          |
| user  | relation | → users           |
| role  | select   | 'admin', 'member' |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group)` (Only list members of groups where user is also a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group)` (Only view members of groups where user is also a member)
- **Create Rule**: `@request.auth.id != "" && (@request.body.user = @request.auth.id || (@collection.groups.created_by ?= @request.auth.id && @collection.groups.id ?= @request.body.group) || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @request.body.group && @collection.group_members.role = "admin"))` (Users can join groups themselves, or group owners/admins can add members)
- **Update Rule**: `@request.auth.id != "" && ((@collection.groups.created_by ?= @request.auth.id && @collection.groups.id ?= group) || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group && @collection.group_members.role = "admin")) && @request.body.user:isset = false` (Only group owners or admins can update roles, cannot change user field)
- **Delete Rule**: `@request.auth.id != "" && (user = @request.auth.id || (@collection.groups.created_by ?= @request.auth.id && @collection.groups.id ?= group) || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group && @collection.group_members.role = "admin"))` (Users can leave groups, or group owners/admins can remove members)

**Indexes**:

```sql
-- Prevent duplicate memberships
CREATE UNIQUE INDEX `idx_group_user_unique` ON `group_members` (`group`, `user`);
-- Critical performance indexes for API rules
CREATE INDEX `idx_user_group_members` ON `group_members` (`user`);
CREATE INDEX `idx_group_group_members` ON `group_members` (`group`);
CREATE INDEX `idx_role_group_members` ON `group_members` (`role`);
-- Composite indexes for complex queries
CREATE INDEX `idx_user_group_role` ON `group_members` (`user`, `group`, `role`);
CREATE INDEX `idx_group_role` ON `group_members` (`group`, `role`);
CREATE INDEX `idx_created_group_members` ON `group_members` (`created`);
```

---

### trips

| Field       | Type     | Notes          |
| ----------- | -------- | -------------- |
| group       | relation | → groups       |
| title       | string   | Trip title     |
| start_date  | date     | Start date     |
| end_date    | date     | End date       |
| cover_image | file     | Optional image |
| created_by  | relation | → users        |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group)` (Only list trips from groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group)` (Only view trips from groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.created_by = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @request.body.group)` (Members can create trips in their groups)
- **Update Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= group) && (created_by = @request.auth.id || (@collection.group_members.role = "admin"))` (Trip creator or group admins can update)
- **Delete Rule**: `@request.auth.id != "" && (created_by = @request.auth.id || (@collection.groups.created_by ?= @request.auth.id && @collection.groups.id ?= group))` (Trip creator or group owner can delete)

**Indexes**:

```sql
-- Performance indexes for API rules and common queries
CREATE INDEX `idx_group_trips` ON `trips` (`group`);
CREATE INDEX `idx_created_by_trips` ON `trips` (`created_by`);
CREATE INDEX `idx_start_date_trips` ON `trips` (`start_date`);
CREATE INDEX `idx_end_date_trips` ON `trips` (`end_date`);
-- Composite indexes for filtering trips by group and dates
CREATE INDEX `idx_group_start_date` ON `trips` (`group`, `start_date`);
CREATE INDEX `idx_group_created_by` ON `trips` (`group`, `created_by`);
CREATE INDEX `idx_title_trips` ON `trips` (`title`);
CREATE INDEX `idx_created_trips` ON `trips` (`created`);
```

---

### timeline_items

| Field             | Type     | Notes                     |
| ----------------- | -------- | ------------------------- |
| trip              | relation | → trips                   |
| title             | string   | E.g., "Visit Cafe Đen"    |
| description       | text     | Optional                  |
| image             | file     | Optional                  |
| time              | datetime | When it's planned         |
| cost              | number   | Optional cost             |
| created_by        | relation | → users                   |
| created_from_poll | bool     | To mark if added via poll |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only list timeline items from trips in groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only view timeline items from trips in groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.created_by = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @request.body.trip)` (Members can create timeline items in their group trips)
- **Update Rule**: `@request.auth.id != "" && created_by = @request.auth.id && @request.body.created_by:isset = false && @request.body.trip:isset = false` (Only creators can update their timeline items, cannot change creator or trip)
- **Delete Rule**: `@request.auth.id != "" && created_by = @request.auth.id` (Only creators can delete their timeline items)

**Indexes**:

```sql
-- Performance indexes for API rules and timeline ordering
CREATE INDEX `idx_trip_timeline_items` ON `timeline_items` (`trip`);
CREATE INDEX `idx_created_by_timeline_items` ON `timeline_items` (`created_by`);
CREATE INDEX `idx_time_timeline_items` ON `timeline_items` (`time`);
CREATE INDEX `idx_created_from_poll_timeline_items` ON `timeline_items` (`created_from_poll`);
-- Composite indexes for efficient timeline queries
CREATE INDEX `idx_trip_time` ON `timeline_items` (`trip`, `time`);
CREATE INDEX `idx_trip_created_by` ON `timeline_items` (`trip`, `created_by`);
CREATE INDEX `idx_trip_poll_flag` ON `timeline_items` (`trip`, `created_from_poll`);
-- Search indexes
CREATE INDEX `idx_title_timeline_items` ON `timeline_items` (`title`);
CREATE INDEX `idx_cost_timeline_items` ON `timeline_items` (`cost`);
CREATE INDEX `idx_created_timeline_items` ON `timeline_items` (`created`);
```

---

### polls

| Field            | Type     | Notes                             |
| ---------------- | -------- | --------------------------------- |
| trip             | relation | → trips                           |
| title            | string   | "Where do we eat Saturday night?" |
| description      | text     | Optional                          |
| target_time_slot | datetime | Timeline slot it will attach to   |
| start_time       | datetime | When voting starts                |
| end_time         | datetime | When voting ends                  |
| created_by       | relation | → users                           |
| status           | select   | 'open', 'closed', 'scheduled'     |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only list polls from trips in groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only view polls from trips in groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.created_by = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @request.body.trip)` (Members can create polls in their group trips)
- **Update Rule**: `@request.auth.id != "" && (created_by = @request.auth.id || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip && @collection.group_members.role = "admin")) && @request.body.created_by:isset = false && @request.body.trip:isset = false` (Poll creator or group admins can update, cannot change creator or trip)
- **Delete Rule**: `@request.auth.id != "" && (created_by = @request.auth.id || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip && @collection.group_members.role = "admin"))` (Poll creator or group admins can delete)

**Indexes**:

```sql
-- Performance indexes for API rules and poll management
CREATE INDEX `idx_trip_polls` ON `polls` (`trip`);
CREATE INDEX `idx_created_by_polls` ON `polls` (`created_by`);
CREATE INDEX `idx_status_polls` ON `polls` (`status`);
CREATE INDEX `idx_start_time_polls` ON `polls` (`start_time`);
CREATE INDEX `idx_end_time_polls` ON `polls` (`end_time`);
CREATE INDEX `idx_target_time_slot_polls` ON `polls` (`target_time_slot`);
-- Composite indexes for efficient poll queries
CREATE INDEX `idx_trip_status` ON `polls` (`trip`, `status`);
CREATE INDEX `idx_trip_created_by` ON `polls` (`trip`, `created_by`);
CREATE INDEX `idx_status_end_time` ON `polls` (`status`, `end_time`);
-- Search and filtering indexes
CREATE INDEX `idx_title_polls` ON `polls` (`title`);
CREATE INDEX `idx_created_polls` ON `polls` (`created`);
```

---

### poll_options

| Field        | Type     | Notes          |
| ------------ | -------- | -------------- |
| poll         | relation | → polls        |
| text         | string   | Option name    |
| image        | file     | Optional image |
| submitted_by | relation | → users        |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= poll)` (Only list poll options from polls in trips in groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= poll)` (Only view poll options from polls in trips in groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.submitted_by = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= @request.body.poll)` (Members can create poll options in their group trip polls)
- **Update Rule**: `@request.auth.id != "" && (submitted_by = @request.auth.id || (@collection.polls.created_by ?= @request.auth.id && @collection.polls.id ?= poll)) && @request.body.submitted_by:isset = false && @request.body.poll:isset = false` (Option submitter or poll creator can update, cannot change submitter or poll)
- **Delete Rule**: `@request.auth.id != "" && (submitted_by = @request.auth.id || (@collection.polls.created_by ?= @request.auth.id && @collection.polls.id ?= poll) || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= poll && @collection.group_members.role = "admin"))` (Option submitter, poll creator, or group admins can delete)

**Indexes**:

```sql
-- Performance indexes for API rules and option management
CREATE INDEX `idx_poll_poll_options` ON `poll_options` (`poll`);
CREATE INDEX `idx_submitted_by_poll_options` ON `poll_options` (`submitted_by`);
-- Composite indexes for efficient queries
CREATE INDEX `idx_poll_submitted_by` ON `poll_options` (`poll`, `submitted_by`);
-- Search indexes
CREATE INDEX `idx_text_poll_options` ON `poll_options` (`text`);
CREATE INDEX `idx_created_poll_options` ON `poll_options` (`created`);
```

---

### poll_votes

| Field    | Type     | Notes          |
| -------- | -------- | -------------- |
| option   | relation | → poll_options |
| user     | relation | → users        |
| voted_at | datetime |                |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= @collection.poll_options.poll && @collection.poll_options.id ?= option)` (Only list votes from poll options in polls in trips in groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= @collection.poll_options.poll && @collection.poll_options.id ?= option)` (Only view votes from poll options in polls in trips in groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.user = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @collection.polls.trip && @collection.polls.id ?= @collection.poll_options.poll && @collection.poll_options.id ?= @request.body.option)` (Members can vote on poll options in their group trip polls)
- **Update Rule**: `@request.auth.id != "" && user = @request.auth.id && @request.body.user:isset = false && @request.body.option:isset = false` (Users can update their own votes, cannot change user or option)
- **Delete Rule**: `@request.auth.id != "" && user = @request.auth.id` (Users can delete their own votes)

**Indexes**:

```sql
-- Prevent duplicate votes per user per option
CREATE UNIQUE INDEX `idx_option_user_unique` ON `poll_votes` (`option`, `user`);
-- Performance indexes for vote counting and API rules
CREATE INDEX `idx_option_poll_votes` ON `poll_votes` (`option`);
CREATE INDEX `idx_user_poll_votes` ON `poll_votes` (`user`);
CREATE INDEX `idx_voted_at_poll_votes` ON `poll_votes` (`voted_at`);
-- Composite indexes for efficient vote analysis
CREATE INDEX `idx_option_voted_at` ON `poll_votes` (`option`, `voted_at`);
CREATE INDEX `idx_user_voted_at` ON `poll_votes` (`user`, `voted_at`);
CREATE INDEX `idx_created_poll_votes` ON `poll_votes` (`created`);
```

---

### chat_messages

| Field      | Type     | Notes   |
| ---------- | -------- | ------- |
| trip       | relation | → trips |
| user       | relation | → users |
| message    | text     |         |
| created_at | datetime |         |

**API Rules**:

- **List/Search Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only list messages from trips in groups where user is a member)
- **View Rule**: `@request.auth.id != "" && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip)` (Only view messages from trips in groups where user is a member)
- **Create Rule**: `@request.auth.id != "" && @request.body.user = @request.auth.id && (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= @request.body.trip)` (Members can send messages in their group trip chats)
- **Update Rule**: `@request.auth.id != "" && user = @request.auth.id && @request.body.user:isset = false && @request.body.trip:isset = false` (Users can edit their own messages, cannot change user or trip)
- **Delete Rule**: `@request.auth.id != "" && (user = @request.auth.id || (@collection.group_members.user ?= @request.auth.id && @collection.group_members.group ?= @collection.trips.group && @collection.trips.id ?= trip && @collection.group_members.role = "admin"))` (Users can delete their own messages, group admins can delete any message)

**Indexes**:

```sql
-- Performance indexes for chat functionality and API rules
CREATE INDEX `idx_trip_chat_messages` ON `chat_messages` (`trip`);
CREATE INDEX `idx_user_chat_messages` ON `chat_messages` (`user`);
CREATE INDEX `idx_created_at_chat_messages` ON `chat_messages` (`created_at`);
-- Composite indexes for efficient chat queries
CREATE INDEX `idx_trip_created_at` ON `chat_messages` (`trip`, `created_at`);
CREATE INDEX `idx_trip_user` ON `chat_messages` (`trip`, `user`);
CREATE INDEX `idx_user_created_at` ON `chat_messages` (`user`, `created_at`);
-- Full-text search for message content (if supported)
CREATE INDEX `idx_message_fts` ON `chat_messages` (`message`);
CREATE INDEX `idx_created_chat_messages` ON `chat_messages` (`created`);
```

---

## 🔐 Security Summary

### Key Security Principles:

1. **Authentication Required**: All operations except user registration and profile viewing require authentication (`@request.auth.id != ""`)

2. **Group Membership Verification**: Most operations verify that the user is a member of the relevant group through complex relation queries

3. **Ownership-Based Access**: Users can typically only modify/delete content they created

4. **Role-Based Permissions**: Group admins and owners have elevated permissions for management operations

5. **Immutable Fields**: Key relationship fields (like `created_by`, `trip`, `group`) cannot be modified after creation using `:isset = false`

6. **Hierarchical Access**: Access flows from group membership → trip access → timeline/poll/chat access

### Rule Complexity Considerations:

- Rules use extensive relationship traversal (e.g., `@collection.group_members.user ?= @request.auth.id`)
- Multiple collection joins ensure proper authorization chains
- Performance may be impacted by complex nested queries - consider indexing strategy
- Real-time subscriptions will respect these rules automatically

---

## 📚 Features

### ✅ Core Features

- Group creation and joining (via invite code)
- Trip creation inside group
- Timeline editor for events, destinations
- Real-time group chat per trip
- Create & participate in real-time polls
- Auto-append winning poll item to trip

### 🚀 Stretch Features

- Drag & drop to reorder timeline
- Budget tracking
- PWA support
- Export trip plan as PDF
- Notifications
- AI-based itinerary suggestions

---

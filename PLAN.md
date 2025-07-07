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

## 📁 PocketBase Collections

### users _(default auth collection)_

### groups

| Field      | Type     | Notes              |
| ---------- | -------- | ------------------ |
| name       | string   | Group name         |
| code       | string   | Unique invite code |
| created_by | relation | → users            |

---

### group_members

| Field | Type     | Notes             |
| ----- | -------- | ----------------- |
| group | relation | → groups          |
| user  | relation | → users           |
| role  | select   | 'admin', 'member' |

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

---

### timeline_items

| Field             | Type     | Notes                     |
| ----------------- | -------- | ------------------------- |
| trip              | relation | → trips                   |
| title             | string   | E.g., "Visit Cafe Đen"    |
| description       | text     | Optional                  |
| image             | file     | Optional                  |
| time              | datetime | When it’s planned         |
| cost              | number   | Optional cost             |
| created_by        | relation | → users                   |
| created_from_poll | bool     | To mark if added via poll |

---

### polls

| Field            | Type     | Notes                             |
| ---------------- | -------- | --------------------------------- |
| trip             | relation | → trips                           |
| title            | string   | “Where do we eat Saturday night?” |
| description      | text     | Optional                          |
| target_time_slot | datetime | Timeline slot it will attach to   |
| start_time       | datetime | When voting starts                |
| end_time         | datetime | When voting ends                  |
| created_by       | relation | → users                           |
| status           | select   | 'open', 'closed', 'scheduled'     |

---

### poll_options

| Field        | Type     | Notes          |
| ------------ | -------- | -------------- |
| poll         | relation | → polls        |
| text         | string   | Option name    |
| image        | file     | Optional image |
| submitted_by | relation | → users        |

---

### poll_votes

| Field    | Type     | Notes          |
| -------- | -------- | -------------- |
| option   | relation | → poll_options |
| user     | relation | → users        |
| voted_at | datetime |                |

---

### chat_messages

| Field      | Type     | Notes   |
| ---------- | -------- | ------- |
| trip       | relation | → trips |
| user       | relation | → users |
| message    | text     |         |
| created_at | datetime |         |

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

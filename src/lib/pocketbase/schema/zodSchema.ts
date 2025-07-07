import { z } from 'zod'

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export const usersSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    password: z.string().min(8),
    tokenKey: z.string().min(30).max(60).optional(),
    email: z.string().email(),
    emailVisibility: z.boolean().optional(),
    verified: z.boolean().optional(),
    name: z.string().max(255).optional(),
    avatar: z.string().optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const postsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const groupsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    name: z.string().min(10).max(300),
    code: z.string().min(3).max(10),
    created_by: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const groupMembersSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    group: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    user: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    role: z.enum(["admin", "member"]).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const tripsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    group: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    title: z.string().min(10).max(200),
    start_date: z.string().regex(DATETIME_REGEX),
    end_date: z.string().regex(DATETIME_REGEX),
    cover_image: z.string().optional(),
    created_by: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const timelineItemsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    trip: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    title: z.string().min(10).max(200),
    description: z.string().optional(),
    image: z.string().optional(),
    time: z.string().regex(DATETIME_REGEX),
    cost: z.number().optional(),
    created_by: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    created_from_poll: z.boolean().optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const pollsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    trip: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    title: z.string().min(10).max(200),
    description: z.string().optional(),
    target_time_slot: z.string().regex(DATETIME_REGEX),
    start_time: z.string().regex(DATETIME_REGEX),
    end_time: z.string().regex(DATETIME_REGEX),
    created_by: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    status: z.enum(["open", "closed", "scheduled", "staled"]).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const pollOptionsSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    poll: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    text: z.string().optional(),
    image: z.string().optional(),
    submitted_by: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    cost: z.number().optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const pollVotesSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    option: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    user: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    voted_at: z.string().regex(DATETIME_REGEX),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const chatMessagesSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    trip: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    user: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    text: z.string().min(1).max(500),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})


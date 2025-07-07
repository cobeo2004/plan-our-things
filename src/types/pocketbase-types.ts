/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	ChatMessages = "chat_messages",
	GroupMembers = "group_members",
	Groups = "groups",
	PollOptions = "poll_options",
	PollVotes = "poll_votes",
	Polls = "polls",
	Posts = "posts",
	TimelineItems = "timeline_items",
	Trips = "trips",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type ChatMessagesRecord = {
	created?: IsoDateString
	id: string
	text: string
	trip?: RecordIdString
	updated?: IsoDateString
	user?: RecordIdString
}

export enum GroupMembersRoleOptions {
	"admin" = "admin",
	"member" = "member",
}
export type GroupMembersRecord = {
	created?: IsoDateString
	group?: RecordIdString
	id: string
	role?: GroupMembersRoleOptions
	updated?: IsoDateString
	user?: RecordIdString
}

export type GroupsRecord = {
	code: string
	created?: IsoDateString
	created_by?: RecordIdString
	id: string
	name: string
	updated?: IsoDateString
}

export type PollOptionsRecord = {
	cost?: number
	created?: IsoDateString
	id: string
	image?: string
	poll?: RecordIdString
	submitted_by?: RecordIdString
	text?: string
	updated?: IsoDateString
}

export type PollVotesRecord = {
	created?: IsoDateString
	id: string
	option?: RecordIdString
	updated?: IsoDateString
	user?: RecordIdString
	voted_at: IsoDateString
}

export enum PollsStatusOptions {
	"open" = "open",
	"closed" = "closed",
	"scheduled" = "scheduled",
	"staled" = "staled",
}
export type PollsRecord = {
	created?: IsoDateString
	created_by?: RecordIdString
	description?: HTMLString
	end_time: IsoDateString
	id: string
	start_time: IsoDateString
	status?: PollsStatusOptions
	target_time_slot: IsoDateString
	title: string
	trip?: RecordIdString
	updated?: IsoDateString
}

export type PostsRecord = {
	created?: IsoDateString
	description?: HTMLString
	id: string
	title?: string
	updated?: IsoDateString
}

export type TimelineItemsRecord = {
	cost?: number
	created?: IsoDateString
	created_by?: RecordIdString
	created_from_poll?: boolean
	description?: HTMLString
	id: string
	image?: string
	time: IsoDateString
	title: string
	trip?: RecordIdString
	updated?: IsoDateString
}

export type TripsRecord = {
	cover_image?: string
	created?: IsoDateString
	created_by?: RecordIdString
	end_date: IsoDateString
	group?: RecordIdString
	id: string
	start_date: IsoDateString
	title: string
	updated?: IsoDateString
}

export type UsersRecord = {
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type ChatMessagesResponse<Texpand = unknown> = Required<ChatMessagesRecord> & BaseSystemFields<Texpand>
export type GroupMembersResponse<Texpand = unknown> = Required<GroupMembersRecord> & BaseSystemFields<Texpand>
export type GroupsResponse<Texpand = unknown> = Required<GroupsRecord> & BaseSystemFields<Texpand>
export type PollOptionsResponse<Texpand = unknown> = Required<PollOptionsRecord> & BaseSystemFields<Texpand>
export type PollVotesResponse<Texpand = unknown> = Required<PollVotesRecord> & BaseSystemFields<Texpand>
export type PollsResponse<Texpand = unknown> = Required<PollsRecord> & BaseSystemFields<Texpand>
export type PostsResponse<Texpand = unknown> = Required<PostsRecord> & BaseSystemFields<Texpand>
export type TimelineItemsResponse<Texpand = unknown> = Required<TimelineItemsRecord> & BaseSystemFields<Texpand>
export type TripsResponse<Texpand = unknown> = Required<TripsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	chat_messages: ChatMessagesRecord
	group_members: GroupMembersRecord
	groups: GroupsRecord
	poll_options: PollOptionsRecord
	poll_votes: PollVotesRecord
	polls: PollsRecord
	posts: PostsRecord
	timeline_items: TimelineItemsRecord
	trips: TripsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	chat_messages: ChatMessagesResponse
	group_members: GroupMembersResponse
	groups: GroupsResponse
	poll_options: PollOptionsResponse
	poll_votes: PollVotesResponse
	polls: PollsResponse
	posts: PostsResponse
	timeline_items: TimelineItemsResponse
	trips: TripsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'chat_messages'): RecordService<ChatMessagesResponse>
	collection(idOrName: 'group_members'): RecordService<GroupMembersResponse>
	collection(idOrName: 'groups'): RecordService<GroupsResponse>
	collection(idOrName: 'poll_options'): RecordService<PollOptionsResponse>
	collection(idOrName: 'poll_votes'): RecordService<PollVotesResponse>
	collection(idOrName: 'polls'): RecordService<PollsResponse>
	collection(idOrName: 'posts'): RecordService<PostsResponse>
	collection(idOrName: 'timeline_items'): RecordService<TimelineItemsResponse>
	collection(idOrName: 'trips'): RecordService<TripsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}

import { pgTable, unique, text, boolean, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const meetingsStatus = pgEnum("meetings_status", ['upcoming', 'active', 'processing', 'completed', 'cancelled'])


export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	interests: text(),
	hasCompletedOnboarding: boolean("has_completed_onboarding").notNull(),
	collegeName: text("college_name"),
	yearOfStudy: text("year_of_study"),
	branch: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	region: text().default('Bangalore'),
	avatarUrl: text("avatar_url"),
	bio: text(),
	googleAccessToken: text("google_access_token"),
	googleRefreshToken: text("google_refresh_token"),
	googleTokenExpiry: timestamp("google_token_expiry", { mode: 'string' }),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const agents = pgTable("agents", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	userId: text("user_id").notNull(),
	instructions: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "agents_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const meetings = pgTable("meetings", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	userId: text("user_id").notNull(),
	agentId: text("agent_id").notNull(),
	status: meetingsStatus().default('upcoming').notNull(),
	transcriptUrl: text("transcript_url"),
	recordingUrl: text("recording_url"),
	summary: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "meetings_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "meetings_agent_id_agents_id_fk"
		}).onDelete("cascade"),
]);

export const meetingSummaries = pgTable("meeting_summaries", {
	id: text().primaryKey().notNull(),
	meetingId: text("meeting_id").notNull(),
	userId: text("user_id").notNull(),
	topic: text(),
	summaryJson: text("summary_json").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.meetingId],
			foreignColumns: [meetings.id],
			name: "meeting_summaries_meeting_id_meetings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "meeting_summaries_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const channelMessages = pgTable("channel_messages", {
	id: text().primaryKey().notNull(),
	channelId: text("channel_id").notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "channel_messages_channel_id_channels_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "channel_messages_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const channels = pgTable("channels", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	region: text().notNull(),
	createdByUserId: text("created_by_user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [user.id],
			name: "channels_created_by_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const channelMembers = pgTable("channel_members", {
	id: text().primaryKey().notNull(),
	channelId: text("channel_id").notNull(),
	userId: text("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "channel_members_channel_id_channels_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "channel_members_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const activityEvents = pgTable("activity_events", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "activity_events_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const classSessions = pgTable("class_sessions", {
	id: text().primaryKey().notNull(),
	enrollmentId: text("enrollment_id").notNull(),
	sessionIndex: text("session_index").notNull(),
	title: text().notNull(),
	description: text(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	googleCalendarEventId: text("google_calendar_event_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.enrollmentId],
			foreignColumns: [courseEnrollments.id],
			name: "class_sessions_enrollment_id_course_enrollments_id_fk"
		}).onDelete("cascade"),
]);

export const courseEnrollments = pgTable("course_enrollments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	topic: text().notNull(),
	estimatedClassCount: text("estimated_class_count"),
	learningSpeed: text("learning_speed"),
	status: text().default('planned').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "course_enrollments_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

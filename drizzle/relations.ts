import { relations } from "drizzle-orm/relations";
import { user, account, agents, meetings, meetingSummaries, session, channels, channelMessages, channelMembers, activityEvents, courseEnrollments, classSessions } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	agents: many(agents),
	meetings: many(meetings),
	meetingSummaries: many(meetingSummaries),
	sessions: many(session),
	channelMessages: many(channelMessages),
	channels: many(channels),
	channelMembers: many(channelMembers),
	activityEvents: many(activityEvents),
	courseEnrollments: many(courseEnrollments),
}));

export const agentsRelations = relations(agents, ({one, many}) => ({
	user: one(user, {
		fields: [agents.userId],
		references: [user.id]
	}),
	meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({one, many}) => ({
	user: one(user, {
		fields: [meetings.userId],
		references: [user.id]
	}),
	agent: one(agents, {
		fields: [meetings.agentId],
		references: [agents.id]
	}),
	meetingSummaries: many(meetingSummaries),
}));

export const meetingSummariesRelations = relations(meetingSummaries, ({one}) => ({
	meeting: one(meetings, {
		fields: [meetingSummaries.meetingId],
		references: [meetings.id]
	}),
	user: one(user, {
		fields: [meetingSummaries.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const channelMessagesRelations = relations(channelMessages, ({one}) => ({
	channel: one(channels, {
		fields: [channelMessages.channelId],
		references: [channels.id]
	}),
	user: one(user, {
		fields: [channelMessages.userId],
		references: [user.id]
	}),
}));

export const channelsRelations = relations(channels, ({one, many}) => ({
	channelMessages: many(channelMessages),
	user: one(user, {
		fields: [channels.createdByUserId],
		references: [user.id]
	}),
	channelMembers: many(channelMembers),
}));

export const channelMembersRelations = relations(channelMembers, ({one}) => ({
	channel: one(channels, {
		fields: [channelMembers.channelId],
		references: [channels.id]
	}),
	user: one(user, {
		fields: [channelMembers.userId],
		references: [user.id]
	}),
}));

export const activityEventsRelations = relations(activityEvents, ({one}) => ({
	user: one(user, {
		fields: [activityEvents.userId],
		references: [user.id]
	}),
}));

export const classSessionsRelations = relations(classSessions, ({one}) => ({
	courseEnrollment: one(courseEnrollments, {
		fields: [classSessions.enrollmentId],
		references: [courseEnrollments.id]
	}),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({one, many}) => ({
	classSessions: many(classSessions),
	user: one(user, {
		fields: [courseEnrollments.userId],
		references: [user.id]
	}),
}));
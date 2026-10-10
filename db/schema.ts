import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const reports=sqliteTable('reports',{
 id:text('id').primaryKey(),clientId:text('client_id').notNull(),receiptHash:text('receipt_hash').notNull(),
 category:text('category').notNull(),description:text('description').notNull(),landmark:text('landmark').notNull(),
 lat:real('lat').notNull(),lon:real('lon').notNull(),observedAt:text('observed_at').notNull(),createdAt:text('created_at').notNull(),
 updatedAt:text('updated_at').notNull(),expiresAt:text('expires_at').notNull(),status:text('status').notNull().default('pending'),
 photoKey:text('photo_key'),photoHash:text('photo_hash'),photoType:text('photo_type'),checks:text('checks').notNull(),
 reviewNote:text('review_note'),reviewer:text('reviewer'),version:integer('version').notNull().default(1),demo:integer('demo').notNull().default(0)
},t=>[index('reports_status_time').on(t.status,t.expiresAt),index('reports_photo_hash').on(t.photoHash),uniqueIndex('reports_retry_key').on(t.clientId,t.receiptHash)]);
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),reportId:text('report_id').notNull(),actor:text('actor').notNull(),action:text('action').notNull(),note:text('note').notNull(),createdAt:text('created_at').notNull()});
export const rateLimits=sqliteTable('rate_limits',{id:text('id').primaryKey(),count:integer('count').notNull(),expiresAt:text('expires_at').notNull()});
export const sourceCache=sqliteTable('source_cache',{id:text('id').primaryKey(),body:text('body').notNull(),etag:text('etag'),fetchedAt:text('fetched_at').notNull()});
export const notices=sqliteTable('notices',{id:text('id').primaryKey(),kind:text('kind').notNull(),body:text('body').notNull(),createdAt:text('created_at').notNull(),expiresAt:text('expires_at').notNull(),status:text('status').notNull().default('active'),version:integer('version').notNull().default(1)});

import { z } from 'zod';

const RequirementsSchema = z.object({
  skills: z.array(z.string().max(100)).max(50).default([]),
  mcpServers: z.array(z.string().max(100)).max(50).default([]),
  platforms: z.array(z.string().max(100)).max(50).default([]),
}).optional();

export const CreatePromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  description: z.string().max(2000).default(''),
  tagIds: z.array(z.number().int().positive()).max(30).default([]),
  visibility: z.enum(['private', 'public']).default('private'),
  requirements: RequirementsSchema,
});

export const UpdatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(100000).optional(),
  description: z.string().max(2000).optional(),
  tagIds: z.array(z.number().int().positive()).max(30).optional(),
  visibility: z.enum(['private', 'public']).optional(),
  requirements: RequirementsSchema,
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
});

export const UpdateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const ChainStepSchema = z.object({
  promptId: z.number().int().positive(),
  stepOrder: z.number().int().nonnegative(),
  variableMap: z.record(z.string().max(500)).default({}),
});

export const CreateChainSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  steps: z.array(ChainStepSchema).max(50).default([]),
});

export const UpdateChainSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  steps: z.array(ChainStepSchema).max(50).optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  // plan is intentionally omitted — tier is set by payment flow, not self-declared
});

export const OtpRequestSchema = z.object({
  email: z.string().email(),
});

export const OtpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const RateSchema = z.object({
  rating: z.enum(['like', 'dislike']),
});

export const CreateCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.number().int().positive().optional(),
});

export const VoteCommentSchema = z.object({
  vote: z.enum(['up', 'down']),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;

export type CreatePromptDto = z.infer<typeof CreatePromptSchema>;
export type UpdatePromptDto = z.infer<typeof UpdatePromptSchema>;
export type CreateTagDto = z.infer<typeof CreateTagSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;
export type CreateChainDto = z.infer<typeof CreateChainSchema>;
export type UpdateChainDto = z.infer<typeof UpdateChainSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type OtpRequestDto = z.infer<typeof OtpRequestSchema>;
export type OtpVerifyDto = z.infer<typeof OtpVerifySchema>;

export interface UserRow {
  id: number;
  email: string;
  username: string;
  plan: 'pro' | 'enterprise' | null;
  created_at: number;
}

export interface PromptRow {
  id: number;
  title: string;
  content: string;
  description: string;
  created_at: number;
  updated_at: number;
  tag_ids: string | null;
  creator_id: number | null;
  creator_username: string | null;
  visibility: string;
  requirements: string | null;
  like_count: number;
  dislike_count: number;
  user_rating: string | null;
  view_count?: number;
  forked_from_id?: number | null;
  fork_count?: number;
  bookmarked?: number | null;
  vem_use_count?: number | null;
}

export interface TagRow {
  id: number;
  name: string;
  color: string;
  is_system: number;
  created_at: number;
}

export interface VersionRow {
  id: number;
  prompt_id: number;
  version: number;
  title: string;
  content: string;
  description: string;
  saved_at: number;
}

export interface ChainRow {
  id: number;
  name: string;
  description: string;
  creator_id: number | null;
  created_at: number;
  step_count?: number;
}

export interface ChainStepRow {
  id: number;
  chain_id: number;
  prompt_id: number;
  step_order: number;
  variable_map: string; // JSON string
  prompt_title: string;
  prompt_content: string;
}

export interface CommentRow {
  id: number;
  prompt_id: number;
  parent_id: number | null;
  body: string;
  author: string;
  author_badge: number | null;
  created_at: number;
  upvotes: number;
  downvotes: number;
  user_vote: string | null;
}

export interface CommentThread {
  id: number;
  prompt_id: number;
  parent_id: number | null;
  body: string;
  author: string;
  author_badge: 1 | 2 | 3 | null;
  created_at: number;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
  replies: CommentThread[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_score: number;
  prompt_count: number;
}

export interface BadgeRow {
  id: number;
  user_id: number;
  year: number;
  month: number;
  rank: 1 | 2 | 3;
  awarded_at: number;
}

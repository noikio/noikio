export interface Tag {
  id: number;
  name: string;
  color: string;
  is_system: number;
  created_at: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  plan: 'pro' | 'enterprise' | null;
}

export interface PromptRequirements {
  skills: string[];
  mcpServers: string[];
  platforms: string[];
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description: string;
  created_at: number;
  updated_at: number;
  tag_ids: number[];
  visibility: 'private' | 'public';
  requirements?: PromptRequirements;
  like_count: number;
  dislike_count: number;
  user_rating: 'like' | 'dislike' | null;
  creator_username: string | null;
  view_count?: number;
  forked_from_id?: number | null;
  fork_count?: number;
  bookmarked?: boolean;
  vem_use_count?: number;
}

export interface PromptVersion {
  id: number;
  prompt_id: number;
  version: number;
  title: string;
  content: string;
  description: string;
  saved_at: number;
}

export interface ChainStep {
  id: number;
  chain_id: number;
  prompt_id: number;
  step_order: number;
  variable_map: Record<string, string>;
  prompt: { id: number; title: string; content: string };
}

export interface Chain {
  id: number;
  name: string;
  description: string;
  created_at: number;
  step_count?: number;
  steps?: ChainStep[];
}

export interface Comment {
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
  replies: Comment[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_score: number;
  prompt_count: number;
}

export interface Badge {
  id: number;
  user_id: number;
  year: number;
  month: number;
  rank: 1 | 2 | 3;
  awarded_at: number;
}

export interface UserProfile {
  id: number;
  username: string;
  created_at: number;
  active_badge: 1 | 2 | 3 | null;
  badges: Badge[];
  public_prompts: Prompt[];
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'new_follower' | 'prompt_liked' | 'comment_reply' | 'badge_awarded';
  actor_id: number | null;
  actor_username: string | null;
  entity_id: number | null;
  entity_type: string | null;
  read: number;
  created_at: number;
}

export interface FeedResponse {
  items: Prompt[];
  next_cursor: number | null;
}

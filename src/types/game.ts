export type GameGenre = 
  | 'All'
  | '2 Player'
  | 'Action' 
  | 'Arcade' 
  | 'Puzzle' 
  | 'Driving' 
  | 'Retro' 
  | 'Shooter' 
  | 'Casual' 
  | 'Multiplayer' 
  | 'Sports'
  | 'Educational';

export interface GameControl {
  key: string;
  action: string;
}

export interface GameVersion {
  version: string;
  changelog: string;
  code: string;
  createdAt: string;
  author: string;
}

export interface GameComment {
  id: string;
  author: string;
  text: string;
  rating: number;
  createdAt: string;
  likes: number;
  isDev?: boolean;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: GameGenre;
  tags: string[];
  author: string;
  authorEmail?: string;
  currentVersion: string;
  versions: GameVersion[];
  code: string;
  type: 'html5' | 'embed';
  embedUrl?: string;
  coverImage?: string; // Custom front page / poster image (data URL, upload, or web URL)
  badge?: 'hot' | 'update' | 'new' | 'star' | 'stream' | 'none';
  thumbnailGradient: string;
  accentColor: string;
  iconName: string;
  likes: number;
  plays: number;
  rating: number;
  ratingsCount: number;
  comments: GameComment[];
  controls: GameControl[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

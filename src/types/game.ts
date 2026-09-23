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
  | 'Sports';

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


export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface MediaItem {
    id: string;
    type: PostType.IMAGE | PostType.VIDEO;
    url: string;
    file?: File; // Opcional para subidas locales
}

export interface Placements {
    facebook: boolean;
    instagram: boolean;
}

export type ToneType = 'Profesional' | 'Divertido' | 'Urgente' | 'Empático' | 'Lujo' | 'Inspirador';

export interface Targeting {
    ageMin: number;
    ageMax: number;
    locations: string;
    interests: string;
}

export interface Post {
  text: string;
  media: MediaItem[]; 
  placements?: Placements;
  targeting?: Targeting; 
  tone?: ToneType; 
}

export enum PostStatus {
  SCHEDULED = 'Programado',
  PUBLISHING = 'Publicando',
  PUBLISHED = 'Publicado',
  FAILED = 'Falló',
}

export enum ScheduleType {
  INTERVAL = 'INTERVAL',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Domingo a Sábado

interface IntervalSchedule {
  type: ScheduleType.INTERVAL;
  frequencyMinutes: number;
  randomize: boolean;
  startDate?: string; // YYYY-MM-DD
}

export interface SchedulePattern {
  id: number;
  days: DayOfWeek[];
  times: string[]; // HH:mm format, e.g., "09:00"
}

interface SpecificDaysSchedule {
  type: ScheduleType.SPECIFIC_DAYS;
  patterns: SchedulePattern[];
  startDate?: string; // YYYY-MM-DD
}

export type ScheduleOptions = IntervalSchedule | SpecificDaysSchedule;

export interface FacebookTarget {
    id: string;
    name: string;
    type: 'PAGE' | 'GROUP';
    avatar?: string; 
    accessToken?: string; // TOKEN REAL PARA PUBLICAR
}

export interface ScheduledPost {
  id: number;
  post: Post;
  schedule: ScheduleOptions;
  status: PostStatus;
  publishAt: Date;
  targets: FacebookTarget[];
}

export enum GenerationStatus {
    IDLE,
    LOADING,
    SUCCESS,
    ERROR,
}

export type AppView = 'DASHBOARD' | 'CREATE' | 'CONTENT';

export interface UserUsage {
    textCount: number;
    imageCount: number;
    videoCount: number;
    lastResetDate: string;
}

export const FREE_PLAN_LIMITS = {
    TEXT_DAILY: 1000, 
    IMAGE_DAILY: 50, 
    VIDEO_DAILY: 1,
};

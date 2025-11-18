export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface Post {
  text: string;
  media?: {
    type: PostType.IMAGE | PostType.VIDEO;
    url: string;
  };
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
}

export interface SchedulePattern {
  id: number;
  days: DayOfWeek[];
  times: string[]; // HH:mm format, e.g., "09:00"
}

interface SpecificDaysSchedule {
  type: ScheduleType.SPECIFIC_DAYS;
  patterns: SchedulePattern[];
}

export type ScheduleOptions = IntervalSchedule | SpecificDaysSchedule;


export interface ScheduledPost {
  id: number;
  post: Post;
  schedule: ScheduleOptions;
  status: PostStatus;
  publishAt: Date;
}

export enum GenerationStatus {
    IDLE,
    LOADING,
    SUCCESS,
    ERROR,
}

export type AppView = 'DASHBOARD' | 'CREATE' | 'CONTENT';

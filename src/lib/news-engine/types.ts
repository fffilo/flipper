export interface CleanArticle {
  id: string; // Hash compacto de 8 caracteres
  title: string;
  summary: string;
  description?: string;
  imageUrl: string;
  originalUrl: string;
  sourceName?: string;
  brandColor?: string;
  source: {
    id: string;
    name: string;
    slug: string;
    brandColor?: string;
  };
  publishedAt: string; // ISO 8601
  relativeTime?: string;
  dayBucket?: 'today' | 'yesterday' | 'older';
  category: string;
  region: 'br' | 'world';
  readingTimeMinutes?: number;
  relatedSources?: Array<{ name: string; url: string }>;
  isDivider?: boolean;
}

export interface FeedSourceConfig {
  id: string;
  name: string;
  url: string;
  category: 'general' | 'politics' | 'economy' | 'tech' | 'world';
  region: 'br' | 'world';
  brandColor: string;
  enabled?: boolean;
}

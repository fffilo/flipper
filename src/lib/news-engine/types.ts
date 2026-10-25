export interface CleanArticle {
  id: string;
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
  category: string;
  region: 'br' | 'world';
  readingTimeMinutes?: number;
  relatedSources?: Array<{ name: string; url: string }>;
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

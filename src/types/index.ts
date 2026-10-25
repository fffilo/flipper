export interface NewsArticle {
  id: string; // Hash compacto único
  title: string;
  imageUrl: string;
  description: string;
  summary?: string;
  articleText?: string;
  aiSummary?: string;
  isAiSummary?: boolean;
  originalUrl: string;
  sourceName?: string;
  source?: {
    id: string;
    name: string;
    slug: string;
    brandColor?: string;
  };
  feedUrl?: string;
  imageAiHint?: string;
  category?: string;
  region?: 'br' | 'world';
  publishedAt?: string;
  relativeTime?: string;
  dayBucket?: 'today' | 'yesterday' | 'older';
  brandColor?: string;
  relatedSources?: Array<{ name: string; url: string }>;
  isDivider?: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  isHidden?: boolean;
  category?: string;
  region?: 'br' | 'world';
  brandColor?: string;
}

export const DEFAULT_FEEDS: FeedSource[] = [
  {
    id: 'agencia-brasil',
    name: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    isHidden: false,
    category: 'general',
    region: 'br',
    brandColor: '#009b3a',
  },
  {
    id: 'bbc-brasil',
    name: 'BBC News Brasil',
    url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',
    isHidden: false,
    category: 'general',
    region: 'br',
    brandColor: '#bb1919',
  },
  {
    id: 'cnn-brasil',
    name: 'CNN Brasil',
    url: 'https://www.cnnbrasil.com.br/feed/',
    isHidden: false,
    category: 'general',
    region: 'br',
    brandColor: '#cc0000',
  },
  {
    id: 'g1-geral',
    name: 'G1',
    url: 'https://g1.globo.com/rss/g1/',
    isHidden: false,
    category: 'general',
    region: 'br',
    brandColor: '#c4170c',
  },
  {
    id: 'tecnoblog',
    name: 'Tecnoblog',
    url: 'https://tecnoblog.net/feed/',
    isHidden: false,
    category: 'tech',
    region: 'br',
    brandColor: '#ff8000',
  },
  {
    id: 'bbc-world',
    name: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    isHidden: false,
    category: 'world',
    region: 'world',
    brandColor: '#bb1919',
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    isHidden: false,
    category: 'tech',
    region: 'world',
    brandColor: '#e01258',
  },
  {
    id: 'dw-brasil',
    name: 'DW Brasil',
    url: 'https://rss.dw.com/rdf/rss-pt-br-all',
    isHidden: false,
    category: 'world',
    region: 'world',
    brandColor: '#0055aa',
  },
];

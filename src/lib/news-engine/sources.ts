import type { FeedSourceConfig } from './types';

export const SEED_SOURCES: FeedSourceConfig[] = [
  // Brasil - Notícias Gerais / Política / Economia
  {
    id: 'agencia-brasil',
    name: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    category: 'general',
    region: 'br',
    brandColor: '#009b3a',
    enabled: true,
  },
  {
    id: 'bbc-brasil',
    name: 'BBC News Brasil',
    url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',
    category: 'general',
    region: 'br',
    brandColor: '#bb1919',
    enabled: true,
  },
  {
    id: 'cnn-brasil',
    name: 'CNN Brasil',
    url: 'https://www.cnnbrasil.com.br/feed/',
    category: 'general',
    region: 'br',
    brandColor: '#cc0000',
    enabled: true,
  },
  {
    id: 'g1-geral',
    name: 'G1',
    url: 'https://g1.globo.com/rss/g1/',
    category: 'general',
    region: 'br',
    brandColor: '#c4170c',
    enabled: true,
  },

  // Tecnologia & Ciência
  {
    id: 'tecnoblog',
    name: 'Tecnoblog',
    url: 'https://tecnoblog.net/feed/',
    category: 'tech',
    region: 'br',
    brandColor: '#ff8000',
    enabled: true,
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    region: 'world',
    brandColor: '#e01258',
    enabled: true,
  },

  // Internacional / Mundo
  {
    id: 'bbc-world',
    name: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    region: 'world',
    brandColor: '#bb1919',
    enabled: true,
  },
  {
    id: 'dw-brasil',
    name: 'DW Brasil',
    url: 'https://rss.dw.com/rdf/rss-pt-br-all',
    category: 'world',
    region: 'world',
    brandColor: '#0055aa',
    enabled: true,
  },
];

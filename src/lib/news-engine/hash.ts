/**
 * Normaliza URLs removendo query strings de rastreamento e âncoras.
 */
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    // Remove parâmetros comuns de tracking de marketing / RSS
    const trackingPrefixes = ['utm_', 'at_', 'fbclid', 'gclid', 'ref', 'source', 'token'];
    const keysToDelete: string[] = [];

    url.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (trackingPrefixes.some(prefix => lower.startsWith(prefix))) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(k => url.searchParams.delete(k));
    url.hash = ''; // Remove âncoras #

    // Remove barra final
    let clean = url.toString().replace(/\/+$/, '');
    return clean.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Algoritmo FNV-1a (32-bit): gera um hash determinístico e compacto de 8 caracteres alfanuméricos.
 */
export function generateCompactHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiplica por FNV prime 32-bit: 16777619
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Converte para hexadecimal positivo de 8 caracteres
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Gera um ID único e consistente para qualquer matéria.
 */
export function getArticleUniqueId(originalUrl: string, title?: string): string {
  const cleanUrl = canonicalizeUrl(originalUrl);
  if (cleanUrl && cleanUrl !== '#') {
    return generateCompactHash(cleanUrl);
  }
  // Fallback para título normalizado se URL for inválida
  const cleanTitle = (title || '').toLowerCase().replace(/[^\w]/g, '');
  return generateCompactHash(cleanTitle);
}

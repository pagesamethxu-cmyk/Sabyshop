import { normalizeImageUrl } from './imageUrl';

/**
 * High quality SVG data URIs for popular digital product brands.
 * These load 100% offline, never 404, and render instantly.
 */
export const BRAND_ICONS = {
  discord: '/images/products/discord.svg',
  capcut: '/images/products/capcut.svg',
  netflix: '/images/products/netflix.svg',
  spotify: '/images/products/spotify.svg',
  youtube: '/images/products/youtube.svg',
  chatgpt: '/images/products/chatgpt.svg',
  canva: '/images/products/canva.svg',
  disney: '/images/products/disney.svg',
  apple: '/images/products/apple.svg',
  gemini: '/images/products/gemini.svg',
  claude: '/images/products/claude.svg',
  grok: '/images/products/grok.svg',
  alightmotion: '/images/products/alightmotion.svg',
  antigravity: '/images/products/antigravity.svg',
  zoom: '/images/products/zoom.svg',
  expressvpn: '/images/products/expressvpn.svg',
  surfshark: '/images/products/surfshark.svg',
  hma: '/images/products/hma.svg',
  nordvpn: '/images/products/nordvpn.svg',
  steam: '/images/products/steam.svg',
  adobe: '/images/products/adobe.svg',
  prime: '/images/products/prime.svg',
  telegram: '/images/products/telegram.svg'
};

/**
 * Resolves an image URL for a given product name and custom imageUrl.
 * Returns custom imageUrl from database if valid, or static local path / SVG for known brands.
 */
export const getProductImageUrl = (name = '', imageUrl = '') => {
  if (imageUrl && imageUrl.trim()) return normalizeImageUrl(imageUrl);

  const lower = (name || '').toLowerCase();

  // AI Tools
  if (lower.includes('chatgpt') || lower.includes('gpt') || lower.includes('openai')) return '/images/products/chatgpt.svg';
  if (lower.includes('claude') || lower.includes('anthropic')) return '/images/products/claude.svg';
  if (lower.includes('grok') || lower.includes('xai')) return '/images/products/grok.svg';
  if (lower.includes('gemini') || lower.includes('google gemini')) return '/images/products/gemini.svg';
  if (lower.includes('antigravity')) return '/images/products/antigravity.svg';

  // Video & Streaming & Music
  if (lower.includes('netflix')) return '/images/products/netflix.svg';
  if (lower.includes('youtube')) return '/images/products/youtube.svg';
  if (lower.includes('spotify')) return '/images/products/spotify.svg';
  if (lower.includes('apple') || lower.includes('apple music')) return '/images/products/apple.svg';
  if (lower.includes('disney')) return '/images/products/disney.svg';
  if (lower.includes('prime') || lower.includes('amazon')) return '/images/products/prime.svg';

  // Creative & Software
  if (lower.includes('canva')) return '/images/products/canva.svg';
  if (lower.includes('capcut')) return '/images/products/capcut.svg';
  if (lower.includes('alight') || lower.includes('alight motion')) return '/images/products/alightmotion.svg';
  if (lower.includes('adobe') || lower.includes('photoshop') || lower.includes('creative')) return '/images/products/adobe.svg';
  if (lower.includes('zoom')) return '/images/products/zoom.svg';

  // Social & Gaming
  if (lower.includes('discord') || lower.includes('nitro')) return '/images/products/discord.svg';
  if (lower.includes('steam')) return '/images/products/steam.svg';
  if (lower.includes('telegram')) return '/images/products/telegram.svg';

  // Specific VPNs (checked before generic 'vpn')
  if (lower.includes('hma') || lower.includes('hide my ass')) return '/images/products/hma.svg';
  if (lower.includes('express') || lower.includes('expressvpn')) return '/images/products/expressvpn.svg';
  if (lower.includes('surfshark')) return '/images/products/surfshark.svg';
  if (lower.includes('nord') || lower.includes('nordvpn')) return '/images/products/nordvpn.svg';
  if (lower.includes('vpn') || lower.includes('security')) return '/images/products/nordvpn.svg';

  return null;
};



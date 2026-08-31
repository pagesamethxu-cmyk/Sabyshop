/**
 * High quality SVG data URIs for popular digital product brands.
 * These load 100% offline, never 404, and render instantly.
 */
const BRAND_ICONS = {
  discord: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%235865F2"/><path d="M34.5 15.5C32.3 14.5 29.9 13.8 27.5 13.4C27.2 13.9 26.9 14.6 26.6 15.2C24.1 14.8 21.6 14.8 19.1 15.2C18.8 14.6 18.5 13.9 18.2 13.4C15.7 13.8 13.4 14.5 11.2 15.5C6.8 22.1 5.6 28.5 6.2 34.8C9.1 37 12 38.3 14.8 39.2C15.5 38.2 16.1 37.2 16.7 36.1C15.7 35.7 14.7 35.2 13.8 34.6C14 34.4 14.3 34.2 14.5 34C20.2 36.6 26.4 36.6 32 34C32.3 34.2 32.5 34.4 32.8 34.6C31.8 35.2 30.9 35.7 29.9 36.1C30.5 37.2 31.1 38.2 31.8 39.2C34.6 38.3 37.6 37 40.4 34.8C41.1 27.4 39.2 21.1 34.5 15.5ZM17.7 30.7C16 30.7 14.6 29.1 14.6 27.2C14.6 25.3 15.9 23.7 17.7 23.7C19.4 23.7 20.8 25.3 20.7 27.2C20.7 29.1 19.4 30.7 17.7 30.7ZM29.9 30.7C28.2 30.7 26.8 29.1 26.8 27.2C26.8 25.3 28.1 23.7 29.9 23.7C31.6 23.7 33 25.3 32.9 27.2C32.9 29.1 31.6 30.7 29.9 30.7Z" fill="white"/></svg>`,
  capcut: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230F0F12"/><g transform="translate(10, 10) scale(0.416666)" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="12" fill="none"><path d="M170 42 22 124v14c0 6.627 5.373 12 12 12h78c6.627 0 12-5.373 12-12v-9.5"/><path d="M170 150 22 68V54c0-6.627 5.373-12 12-12h78c6.627 0 12 5.373 12 12v9.5"/></g></svg>`,
  netflix: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="nflxGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="%23E50914"/><stop offset="100%" stopColor="%23990000"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="%23000000"/><g transform="translate(18, 16) scale(0.68)"><path fill="%23B81D24" d="M0 0h24v95H0z"/><path fill="%23B81D24" d="M70 0h24v95H70z"/><path fill="url(%23nflxGrad)" d="M0 0l70 95h24L24 0H0z"/></g></svg>`,
  spotify: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%231DB954"/><path d="M24 10C16.3 10 10 16.3 10 24C10 31.7 16.3 38 24 38C31.7 38 38 31.7 38 24C38 16.3 31.7 10 24 10ZM30.8 29.2C30.5 29.7 29.9 29.9 29.4 29.6C26 27.6 21.7 27.1 16.6 28.3C16 28.5 15.5 28.1 15.3 27.5C15.1 26.9 15.5 26.4 16.1 26.2C21.6 24.9 26.4 25.5 30.2 27.8C30.8 28.1 30.9 28.7 30.8 29.2ZM32.5 25.5C32.1 26.1 31.3 26.3 30.7 25.9C26.8 23.6 20.9 22.9 16.4 24.3C15.7 24.5 15 24.1 14.8 23.4C14.6 22.7 15 22 15.7 21.8C20.8 20.2 27.3 21 31.8 23.6C32.5 24 32.7 24.8 32.5 25.5ZM32.6 21.7C27.9 19 19.9 18.7 15.4 20.1C14.6 20.3 13.7 19.9 13.5 19.1C13.3 18.3 13.7 17.4 14.5 17.2C19.7 15.6 28.5 15.9 33.9 19.1C34.6 19.5 34.9 20.4 34.5 21.1C34.1 21.8 33.2 22 32.6 21.7Z" fill="white"/></svg>`,
  youtube: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23FF0000"/><path d="M38.5 16.5C38.5 16.5 38.1 14.1 37 13C35.6 11.5 34 11.5 33.3 11.4C28.7 11 22 11 22 11H22C22 11 15.3 11 10.7 11.4C10 11.5 8.4 11.5 7 13C5.9 14.1 5.5 16.5 5.5 16.5S5 19.3 5 22.1V24.7C5 27.5 5.5 30.3 5.5 30.3S5.9 32.7 7 33.8C8.4 35.3 10.3 35.2 11.1 35.4C13.9 35.6 22 35.7 22 35.7S28.7 35.6 33.3 35.3C34 35.2 35.6 35.2 37 33.7C38.1 32.6 38.5 30.2 38.5 30.2S39 27.4 39 24.6V22C39 19.3 38.5 16.5 38.5 16.5ZM19.5 28.5V18.5L29.5 23.5L19.5 28.5Z" fill="white"/></svg>`,
  chatgpt: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23FFFFFF"/><g fill="%23000000" transform="translate(18, 17) scale(1.6)"><path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zm-16.106-6.88a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132zm3.35-5.043a7.395 7.395 0 0 0-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zM16.071 18l4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18z"/></g></svg>`,
  canva: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%2300C4CC"/><text x="24" y="31" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="Arial">Ca</text></svg>`,
  disney: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23113CCF"/><text x="24" y="31" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="Georgia">D+</text></svg>`,
  apple: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23FC3C44"/><path d="M30 15H22V28C21.3 27.7 20.5 27.5 19.7 27.5C17.1 27.5 15 29.3 15 31.5C15 33.7 17.1 35.5 19.7 35.5C22.3 35.5 24.4 33.7 24.4 31.5V19H30V15Z" fill="white"/></svg>`,
  gemini: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gRichStar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="%23FF3366"/><stop offset="25%" stopColor="%23FF9900"/><stop offset="50%" stopColor="%2300E676"/><stop offset="75%" stopColor="%232979FF"/><stop offset="100%" stopColor="%23651FFF"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="%23FFFFFF"/><path d="M 50 14 C 50 33 60 43 78 50 C 60 57 50 67 50 86 C 50 67 40 57 22 50 C 40 43 50 33 50 14 Z" fill="url(%23gRichStar)"/></svg>`,
  steam: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23171a21"/><text x="24" y="31" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="Arial">ST</text></svg>`,
  minecraft: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23557A2B"/><text x="24" y="31" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="Arial">MC</text></svg>`,
  nordvpn: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%234687ED"/><path d="M24 12L36 34H28L24 26L20 34H12L24 12Z" fill="white"/></svg>`,
  adobe: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23FF0000"/><path d="M19 12H13V36H19V12ZM29 12H35V36H29V12ZM21 21L27 36H21V21Z" fill="white"/></svg>`
};

/**
 * Resolves an image URL for a given product name and custom imageUrl.
 * Returns custom imageUrl if valid, or static local path /images/products/ for known brands.
 */
export const getProductImageUrl = (name = '', imageUrl = '') => {
  if (imageUrl && imageUrl.trim()) return imageUrl;

  const lower = (name || '').toLowerCase();

  if (lower.includes('discord') || lower.includes('nitro')) return '/images/products/discord.svg';
  if (lower.includes('capcut')) return '/images/products/capcut.svg';
  if (lower.includes('netflix')) return '/images/products/netflix.svg';
  if (lower.includes('spotify')) return '/images/products/spotify.svg';
  if (lower.includes('youtube')) return '/images/products/youtube.svg';
  if (lower.includes('chatgpt') || lower.includes('gpt') || lower.includes('openai')) return '/images/products/chatgpt.svg';
  if (lower.includes('canva')) return '/images/products/canva.svg';
  if (lower.includes('disney')) return '/images/products/disney.svg';
  if (lower.includes('apple')) return BRAND_ICONS.apple;
  if (lower.includes('gemini')) return BRAND_ICONS.gemini;
  if (lower.includes('steam')) return '/images/products/steam.svg';
  if (lower.includes('minecraft')) return BRAND_ICONS.minecraft;
  if (lower.includes('nord') || lower.includes('vpn')) return '/images/products/nordvpn.svg';
  if (lower.includes('adobe') || lower.includes('creative')) return '/images/products/adobe.svg';

  return null;
};


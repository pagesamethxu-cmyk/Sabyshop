/**
 * Gets the backend origin (e.g. "https://api.sabyshop.com") from VITE_API_URL.
 */
export const getBackendOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const parsed = new URL(apiUrl);
      return parsed.origin;
    } catch {
      return '';
    }
  }
  return '';
};

/**
 * Normalizes any image or attachment URL into a valid accessible path.
 * Handles absolute URLs, relative API routes, relative upload directory paths,
 * and bare filenames (e.g. 'chat_1787396477205_8a6d3af7.jpg').
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();

  // If contains http://localhost:8080 or http://127.0.0.1:8080, replace with live backend origin in production
  const origin = getBackendOrigin();
  if (origin && (trimmed.startsWith('http://localhost:8080') || trimmed.startsWith('http://127.0.0.1:8080'))) {
    trimmed = trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):8080/, origin);
    return trimmed;
  }

  // If already absolute or special URI scheme
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Already prefixed API routes or uploads -> prepend backend origin if available
  if (
    trimmed.startsWith('/api/admin/uploads/') ||
    trimmed.startsWith('/api/seller/uploads/') ||
    trimmed.startsWith('/api/uploads/') ||
    trimmed.startsWith('/api/chat/attachments/') ||
    trimmed.startsWith('/uploads/')
  ) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }

  if (trimmed.startsWith('uploads/')) {
    return origin ? `${origin}/${trimmed}` : `/${trimmed}`;
  }

  // If starts with /api/
  if (trimmed.startsWith('/api/')) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }

  // If starts with leading slash / (e.g. /images/products/...)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Bare filename (e.g. chat_1787396477205_8a6d3af7.jpg or conv_1_178739_abc.png or uuid.jpg)
  return origin ? `${origin}/uploads/${trimmed}` : `/uploads/${trimmed}`;
};

/**
 * Checks if a string represents an image file URL.
 */
export const isImageMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const c = url.trim().toLowerCase();
  return (
    Boolean(c.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i)) ||
    c.includes('/uploads/chat_') ||
    c.includes('/uploads/img_') ||
    c.includes('/uploads/conv_') ||
    c.includes('/api/admin/uploads/') ||
    c.includes('/api/seller/uploads/') ||
    c.includes('/api/uploads/') ||
    c.includes('/api/chat/attachments/') ||
    c.startsWith('chat_') ||
    c.startsWith('conv_')
  );
};

/**
 * Checks if a string represents a video file URL.
 */
export const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const c = url.trim().toLowerCase();
  return Boolean(c.match(/\.(mp4|webm|mov|m4v)($|\?)/i));
};

/**
 * Safely extracts delivery proof URL from an order object or seller delivery note.
 */
export const extractDeliveryProofUrl = (order) => {
  if (!order) return null;
  if (order.deliveryProofUrl) {
    return normalizeImageUrl(order.deliveryProofUrl);
  }

  const note =
    order.sellerDeliveryNote ||
    order.items?.[0]?.account?.note ||
    order.manualAccountNote ||
    '';

  if (!note || typeof note !== 'string') return null;

  // Check [PROOF_URL:...] tag
  const matchProofTag = note.match(/\[PROOF_URL:(.*?)\]/i);
  if (matchProofTag && matchProofTag[1]) {
    return normalizeImageUrl(matchProofTag[1].trim());
  }

  // Check any URL or upload path in note
  const matchUrl = note.match(
    /(https?:\/\/[^\s\)]+|\/api\/admin\/uploads\/[^\s\)]+|\/api\/seller\/uploads\/[^\s\)]+|\/api\/uploads\/[^\s\)]+|\/api\/chat\/attachments\/[^\s\)]+|\/uploads\/[^\s\)]+|chat_[a-zA-Z0-9_\.-]+\.(?:jpg|jpeg|png|webp|gif)|conv_[a-zA-Z0-9_\.-]+\.(?:jpg|jpeg|png|webp|gif))/i
  );
  if (matchUrl && matchUrl[0]) {
    return normalizeImageUrl(matchUrl[0].trim());
  }

  return null;
};
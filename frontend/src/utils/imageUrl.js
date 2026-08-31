/**
 * Utility functions for safely handling and normalizing image and attachment URLs across the application.
 */

/**
 * Normalizes any image or attachment URL into a valid accessible path.
 * Handles absolute URLs, relative API routes, relative upload directory paths,
 * and bare filenames (e.g. 'chat_1787396477205_8a6d3af7.jpg').
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already absolute or special URI scheme
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Already prefixed API routes
  if (
    trimmed.startsWith('/api/admin/uploads/') ||
    trimmed.startsWith('/api/seller/uploads/') ||
    trimmed.startsWith('/api/uploads/') ||
    trimmed.startsWith('/api/chat/attachments/')
  ) {
    return trimmed;
  }

  // If starts with /uploads/ or uploads/
  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  if (trimmed.startsWith('uploads/')) {
    return '/' + trimmed;
  }

  // If starts with /api/
  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  // If starts with leading slash /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Bare filename (e.g. chat_1787396477205_8a6d3af7.jpg or conv_1_178739_abc.png or uuid.jpg)
  return `/uploads/${trimmed}`;
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
/** Shared server-side validation helpers for Socket.io handlers and tests. */

// Maximum decoded chat image size: 2 MiB.
const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

// Only PNG, JPEG and GIF Base64 data URLs are supported.
const CHAT_IMAGE_PATTERN = /^data:image\/(png|jpeg|gif);base64,/i;

/** Validate an optional chat image and enforce the 2 MiB size limit. */
function validChatImage(dataUrl) {
  // Images are optional for text-only messages.
  if (!dataUrl) return true;

  // Reject unsupported image formats or invalid data URLs.
  if (!CHAT_IMAGE_PATTERN.test(dataUrl)) return false;

  // Check the decoded Base64 payload size.
  const payload = dataUrl.split(',')[1] || '';
  return Buffer.byteLength(payload, 'base64') <= MAX_CHAT_IMAGE_BYTES;
}

module.exports = { validChatImage, MAX_CHAT_IMAGE_BYTES };
/**
 * Unit tests for Fabuloso chat image validation.
 *
 * These tests verify the same image format and size rules used by the Socket.io chat system without requiring a MongoDB
 *                                          connection or running application server.
 *
 * Chat images:
 * - May be omitted entirely.
 * - Must use PNG, JPEG or GIF Base64 data URLs when supplied.
 * - Must not exceed 2 MB after the Base64 data has been decoded.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

/**
 * Validate whether a chat image satisfies Fabuloso's image requirements.
 *
 * dataUrl:
 *   Base64 data URL representing the uploaded chat image.
 *
 * Empty value:
 *   Returns true because chat messages are allowed to contain text without an image.
 *
 * Regular expression:
 *   Requires the data URL to begin with an accepted image MIME type followed by the Base64 marker.
 *   Accepted formats are image/png, image/jpeg and image/gif.
 *
 * Buffer.byteLength():
 *   Calculates the size of the decoded Base64 image data rather than the longer encoded string.
 *
 * 2 * 1024 * 1024:
 *   Represents the maximum permitted image size of 2 MiB.
 *
 * @param {string} dataUrl Base64 image data URL to validate.
 * @returns {boolean} True when the image is absent or valid, otherwise false.
 */
function validChatImage(dataUrl) {
  // An image is optional, so an empty value is valid.
  if (!dataUrl) {
    return true;
  }

  // Reject data URLs that do not contain one of the supported image MIME types.
  if (!/^data:image\/(png|jpeg|gif);base64,/i.test(dataUrl)) {
    return false;
  }

  // Extract the Base64 payload, calculate its decoded size and enforce the 2 MB maximum.
  return Buffer.byteLength(
    dataUrl.split(',')[1] || '',
    'base64'
  ) <= 2 * 1024 * 1024;
}

/**
 * Verify that a supported PNG Base64 data URL passes validation.
 *
 * "aGVsbG8=" is a small valid Base64 payload, so it is well below the 2 MB limit.
 */
test('chat image accepts supported image data URLs', () => {
  assert.equal(
    validChatImage('data:image/png;base64,aGVsbG8='),
    true
  );
});

/**
 * Verify that unsupported image MIME types are rejected.
 *
 * SVG is deliberately used because Fabuloso only permits PNG, JPEG and GIF chat images.
 */
test('chat image rejects unsupported MIME types', () => {
  assert.equal(
    validChatImage('data:image/svg+xml;base64,aGVsbG8='),
    false
  );
});

/**
 * Verify that supported image types are still rejected when their decoded data exceeds 2 MB.
 *
 * Buffer.alloc():
 *   Creates a binary payload exactly one byte larger than the permitted maximum.
 *
 * toString('base64'):
 *   Encodes the oversized binary payload into the same Base64 representation received by the chat validation logic.
 */
test('chat image rejects payloads above 2 MB', () => {
  const oversized = Buffer
    .alloc(2 * 1024 * 1024 + 1)
    .toString('base64');

  assert.equal(
    validChatImage(`data:image/jpeg;base64,${oversized}`),
    false
  );
});
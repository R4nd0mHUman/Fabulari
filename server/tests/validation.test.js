/**
 * Backend unit tests for the production chat-image validation helper.
 *
 * These tests verify the same image format and size rules used by the Socket.io
 * chat system without requiring a MongoDB connection or running application server.
 *
 * Chat images:
 * - May be omitted entirely.
 * - Must use PNG, JPEG or GIF Base64 data URLs when supplied.
 * - Must not exceed 2 MiB after the Base64 data has been decoded.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { validChatImage, MAX_CHAT_IMAGE_BYTES } = require('../validation');

/**
 * Verify that an image is optional.
 *
 * An empty value is valid because chat messages are allowed to contain text
 * without an image.
 */
test('chat image permits an omitted image for text-only messages', () => {
  assert.equal(validChatImage(''), true);
});

/**
 * Verify that all supported image formats pass validation.
 *
 * The production validation helper accepts PNG, JPEG and GIF Base64 data URLs.
 *
 * "aGVsbG8=" is a small valid Base64 payload, so it is well below the 2 MiB limit.
 */
test('chat image accepts PNG, JPEG and GIF data URLs', () => {
  for (const type of ['png', 'jpeg', 'gif']) {
    assert.equal(validChatImage(`data:image/${type};base64,aGVsbG8=`), true);
  }
});

/**
 * Verify that unsupported image MIME types are rejected.
 *
 * SVG is deliberately used because Fabuloso only permits PNG, JPEG and GIF
 * chat images.
 */
test('chat image rejects unsupported MIME types', () => {
  assert.equal(validChatImage('data:image/svg+xml;base64,aGVsbG8='), false);
});

/**
 * Verify that a supported image exactly at the maximum permitted size passes validation.
 *
 * MAX_CHAT_IMAGE_BYTES represents the maximum permitted chat image size of 2 MiB.
 *
 * Buffer.alloc():
 *   Creates a binary payload exactly equal to the permitted maximum.
 *
 * toString('base64'):
 *   Encodes the binary payload into the Base64 representation received by the
 *   chat validation logic.
 */
test('chat image accepts a payload exactly at the 2 MiB limit', () => {
  const payload = Buffer.alloc(MAX_CHAT_IMAGE_BYTES).toString('base64');

  assert.equal(validChatImage(`data:image/png;base64,${payload}`), true);
});

/**
 * Verify that supported image types are rejected when their decoded data
 * exceeds the 2 MiB maximum.
 *
 * Buffer.alloc():
 *   Creates a binary payload exactly one byte larger than the permitted maximum.
 *
 * toString('base64'):
 *   Encodes the oversized binary payload into the same Base64 representation
 *   received by the chat validation logic.
 */
test('chat image rejects payloads above 2 MiB', () => {
  const payload = Buffer.alloc(MAX_CHAT_IMAGE_BYTES + 1).toString('base64');

  assert.equal(validChatImage(`data:image/jpeg;base64,${payload}`), false);
});
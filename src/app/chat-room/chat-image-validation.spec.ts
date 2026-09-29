import { describe, expect, it } from 'vitest'; // Imports Vitest utilities for defining and running unit tests.
import {
  MAX_CHAT_IMAGE_BYTES,
  validChatImageFile
} from './chat-image-validation'; // Imports the image validation helper and size limit.

// Defines the test suite for chat image validation.
describe('validChatImageFile', () => {

  // Tests that supported image formats within the size limit are accepted.
  it('accepts supported image formats within the size limit', () => {
    expect(
      validChatImageFile({ type: 'image/png', size: 1024 })
    ).toBe(true);

    expect(
      validChatImageFile({
        type: 'image/jpeg',
        size: MAX_CHAT_IMAGE_BYTES
      })
    ).toBe(true);

    expect(
      validChatImageFile({ type: 'image/gif', size: 50 })
    ).toBe(true);
  });

  // Tests that unsupported formats and oversized images are rejected.
  it('rejects unsupported formats and oversized files', () => {
    expect(
      validChatImageFile({
        type: 'image/svg+xml',
        size: 100
      })
    ).toBe(false);

    expect(
      validChatImageFile({
        type: 'image/png',
        size: MAX_CHAT_IMAGE_BYTES + 1
      })
    ).toBe(false);
  });
});
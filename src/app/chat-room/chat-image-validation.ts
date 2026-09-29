// Sets the maximum allowed chat image size to 2 MiB.
export const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

// Defines the image formats supported by chat uploads.
export const CHAT_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif'
] as const;

/** Checks that a chat image uses a supported format and is within the size limit. */
export function validChatImageFile(
  file: Pick<File, 'type' | 'size'>
): boolean {
  // Accept only supported image types that do not exceed 2 MiB.
  return (
    CHAT_IMAGE_TYPES.includes(
      file.type as typeof CHAT_IMAGE_TYPES[number]
    ) &&
    file.size <= MAX_CHAT_IMAGE_BYTES
  );
}
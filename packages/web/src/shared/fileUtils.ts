/**
 * File Utilities
 * Handles file type icons, size formatting, and MIME type detection.
 */

interface FileTypeInfo {
  icon: string; // Unicode icon character
  displayName: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'unknown';
}

/**
 * Get file type information based on extension or MIME type.
 */
export function getFileTypeInfo(
  filename: string | undefined,
  mimeType?: string
): FileTypeInfo {
  if (!filename && !mimeType) {
    return {
      icon: '📄',
      displayName: 'File',
      category: 'unknown',
    };
  }

  // Extract extension from filename
  const ext = filename
    ? filename.split('.').pop()?.toLowerCase()
    : extractExtensionFromMimeType(mimeType);

  // Map extensions to file type info
  const typeMap: Record<string, FileTypeInfo> = {
    // Documents
    pdf: { icon: '📕', displayName: 'PDF', category: 'document' },
    doc: { icon: '📄', displayName: 'Word Document', category: 'document' },
    docx: { icon: '📄', displayName: 'Word Document', category: 'document' },
    xls: { icon: '📊', displayName: 'Excel Sheet', category: 'document' },
    xlsx: { icon: '📊', displayName: 'Excel Sheet', category: 'document' },
    txt: { icon: '📝', displayName: 'Text File', category: 'document' },
    rtf: { icon: '📄', displayName: 'Rich Text', category: 'document' },
    csv: { icon: '📊', displayName: 'CSV File', category: 'document' },

    // Images
    jpg: { icon: '🖼️', displayName: 'Image (JPG)', category: 'image' },
    jpeg: { icon: '🖼️', displayName: 'Image (JPEG)', category: 'image' },
    png: { icon: '🖼️', displayName: 'Image (PNG)', category: 'image' },
    gif: { icon: '🖼️', displayName: 'Image (GIF)', category: 'image' },
    webp: { icon: '🖼️', displayName: 'Image (WebP)', category: 'image' },
    svg: { icon: '🖼️', displayName: 'Image (SVG)', category: 'image' },
    bmp: { icon: '🖼️', displayName: 'Image (BMP)', category: 'image' },
    tiff: { icon: '🖼️', displayName: 'Image (TIFF)', category: 'image' },
    ico: { icon: '🖼️', displayName: 'Icon File', category: 'image' },

    // Video
    mp4: { icon: '🎬', displayName: 'Video (MP4)', category: 'video' },
    avi: { icon: '🎬', displayName: 'Video (AVI)', category: 'video' },
    mov: { icon: '🎬', displayName: 'Video (MOV)', category: 'video' },
    mkv: { icon: '🎬', displayName: 'Video (MKV)', category: 'video' },
    wmv: { icon: '🎬', displayName: 'Video (WMV)', category: 'video' },
    flv: { icon: '🎬', displayName: 'Video (FLV)', category: 'video' },
    webm: { icon: '🎬', displayName: 'Video (WebM)', category: 'video' },

    // Audio
    mp3: { icon: '🔊', displayName: 'Audio (MP3)', category: 'audio' },
    wav: { icon: '🔊', displayName: 'Audio (WAV)', category: 'audio' },
    aac: { icon: '🔊', displayName: 'Audio (AAC)', category: 'audio' },
    flac: { icon: '🔊', displayName: 'Audio (FLAC)', category: 'audio' },
    m4a: { icon: '🔊', displayName: 'Audio (M4A)', category: 'audio' },
    ogg: { icon: '🔊', displayName: 'Audio (OGG)', category: 'audio' },

    // Archives
    zip: { icon: '📦', displayName: 'ZIP Archive', category: 'archive' },
    rar: { icon: '📦', displayName: 'RAR Archive', category: 'archive' },
    '7z': { icon: '📦', displayName: '7Z Archive', category: 'archive' },
    tar: { icon: '📦', displayName: 'TAR Archive', category: 'archive' },
    gz: { icon: '📦', displayName: 'GZIP Archive', category: 'archive' },
  };

  return (
    typeMap[ext || ''] || {
      icon: '📄',
      displayName: 'File',
      category: 'unknown',
    }
  );
}

/**
 * Extract file extension from MIME type.
 * Examples: "application/pdf" -> "pdf", "image/jpeg" -> "jpg"
 */
function extractExtensionFromMimeType(mimeType: string | undefined): string {
  if (!mimeType) return '';

  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'application/zip': 'zip',
    'application/x-rar': 'rar',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };

  return mimeToExt[mimeType] || '';
}

/**
 * Format bytes to human-readable file size.
 * Examples: 1024 -> "1 KB", 1536000 -> "1.5 MB"
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) {
    return '';
  }

  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, unitIndex);

  // Format with 1 decimal place if not bytes
  if (unitIndex === 0) {
    return `${Math.round(size)} ${units[unitIndex]}`;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get a combined display string for file with icon and size.
 * Example: "📕 Attachment.pdf (1.2 MB)"
 */
export function formatFileDisplay(
  filename: string | undefined,
  size?: number,
  mimeType?: string
): { icon: string; displayName: string; sizeStr: string; fullText: string } {
  const typeInfo = getFileTypeInfo(filename, mimeType);
  const sizeStr = size ? formatFileSize(size) : '';
  const fullText = [
    typeInfo.icon,
    filename || 'Attachment',
    sizeStr && `(${sizeStr})`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    icon: typeInfo.icon,
    displayName: typeInfo.displayName,
    sizeStr,
    fullText,
  };
}

/**
 * Check if a file is likely downloadable (has URL).
 */
export function isFileDownloadable(
  file:
    | {
        url?: string;
        path?: string;
        name?: string;
      }
    | undefined
): boolean {
  return !!(file?.url || file?.path);
}

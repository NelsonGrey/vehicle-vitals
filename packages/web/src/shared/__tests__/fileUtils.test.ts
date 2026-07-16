import { describe, expect, it } from 'vitest';
import {
  formatFileDisplay,
  formatFileSize,
  getFileTypeInfo,
  isFileDownloadable,
} from '../fileUtils';

describe('fileUtils', () => {
  describe('getFileTypeInfo', () => {
    it('should return generic file info for unknown type', () => {
      const info = getFileTypeInfo('document.xyz');
      expect(info.icon).toBe('📄');
      expect(info.displayName).toBe('File');
      expect(info.category).toBe('unknown');
    });

    it('should detect PDF files', () => {
      const info = getFileTypeInfo('contract.pdf');
      expect(info.icon).toBe('📕');
      expect(info.displayName).toBe('PDF');
      expect(info.category).toBe('document');
    });

    it('should detect Word documents', () => {
      const info = getFileTypeInfo('report.docx');
      expect(info.icon).toBe('📄');
      expect(info.displayName).toContain('Word');
      expect(info.category).toBe('document');
    });

    it('should detect Excel spreadsheets', () => {
      const info = getFileTypeInfo('data.xlsx');
      expect(info.icon).toBe('📊');
      expect(info.displayName).toContain('Excel');
      expect(info.category).toBe('document');
    });

    it('should detect image files', () => {
      const imageFiles = [
        'photo.jpg',
        'image.png',
        'graphic.gif',
        'photo.webp',
      ];
      imageFiles.forEach(filename => {
        const info = getFileTypeInfo(filename);
        expect(info.icon).toBe('🖼️');
        expect(info.category).toBe('image');
      });
    });

    it('should detect video files', () => {
      const info = getFileTypeInfo('movie.mp4');
      expect(info.icon).toBe('🎬');
      expect(info.category).toBe('video');
    });

    it('should detect audio files', () => {
      const info = getFileTypeInfo('song.mp3');
      expect(info.icon).toBe('🔊');
      expect(info.category).toBe('audio');
    });

    it('should detect archive files', () => {
      const info = getFileTypeInfo('archive.zip');
      expect(info.icon).toBe('📦');
      expect(info.category).toBe('archive');
    });

    it('should be case-insensitive', () => {
      const info1 = getFileTypeInfo('FILE.PDF');
      const info2 = getFileTypeInfo('file.pdf');
      expect(info1.icon).toBe(info2.icon);
      expect(info1.displayName).toBe(info2.displayName);
    });

    it('should handle files with no extension', () => {
      const info = getFileTypeInfo('Makefile');
      expect(info.icon).toBe('📄');
      expect(info.category).toBe('unknown');
    });

    it('should detect from MIME type when filename is missing', () => {
      const info = getFileTypeInfo(undefined, 'application/pdf');
      expect(info.icon).toBe('📕');
      expect(info.displayName).toBe('PDF');
    });
  });

  describe('formatFileSize', () => {
    it('should return empty string for undefined', () => {
      expect(formatFileSize(undefined)).toBe('');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2560)).toBe('2.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should format terabytes', () => {
      expect(formatFileSize(1099511627776)).toBe('1.0 TB');
    });

    it('should handle realistic file sizes', () => {
      // Small PDF
      expect(formatFileSize(245700)).toBe('239.9 KB');
      // Medium image
      expect(formatFileSize(3145728)).toBe('3.0 MB');
      // Large video
      expect(formatFileSize(536870912)).toBe('512.0 MB');
    });

    it('should round appropriately for decimal places', () => {
      expect(formatFileSize(1536000)).toBe('1.5 MB');
      expect(formatFileSize(1024000)).toBe('1000.0 KB');
    });
  });

  describe('formatFileDisplay', () => {
    it('should return object with all properties', () => {
      const result = formatFileDisplay('document.pdf', 245700);
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('displayName');
      expect(result).toHaveProperty('sizeStr');
      expect(result).toHaveProperty('fullText');
    });

    it('should include icon in display', () => {
      const result = formatFileDisplay('document.pdf');
      expect(result.icon).toBe('📕');
    });

    it('should include filename in fullText', () => {
      const result = formatFileDisplay('contract.pdf');
      expect(result.fullText).toContain('contract.pdf');
    });

    it('should include size in fullText when provided', () => {
      const result = formatFileDisplay('photo.jpg', 1048576);
      expect(result.fullText).toContain('1.0 MB');
    });

    it('should omit size from fullText when not provided', () => {
      const result = formatFileDisplay('document.pdf');
      expect(result.sizeStr).toBe('');
      expect(result.fullText).not.toMatch(/\(\d+/);
    });

    it('should format realistic attachment', () => {
      const result = formatFileDisplay('Invoice.pdf', 245700);
      expect(result.fullText).toMatch(/📕.*Invoice\.pdf.*239\.9 KB/);
    });

    it('should handle undefined filename', () => {
      const result = formatFileDisplay(undefined, 1024);
      expect(result.fullText).toContain('Attachment');
      expect(result.fullText).toContain('1.0 KB');
    });
  });

  describe('isFileDownloadable', () => {
    it('should return false for undefined', () => {
      expect(isFileDownloadable(undefined)).toBe(false);
    });

    it('should return false for object with no URL or path', () => {
      expect(isFileDownloadable({ name: 'file.pdf' })).toBe(false);
    });

    it('should return true when URL is present', () => {
      expect(
        isFileDownloadable({
          url: 'https://example.com/file.pdf',
          name: 'file.pdf',
        })
      ).toBe(true);
    });

    it('should return true when path is present', () => {
      expect(
        isFileDownloadable({
          path: 'storage/vehicles/VIN123/file.pdf',
          name: 'file.pdf',
        })
      ).toBe(true);
    });

    it('should return true when either URL or path exists', () => {
      const withUrl = isFileDownloadable({ url: 'https://...' });
      const withPath = isFileDownloadable({ path: 'storage/...' });
      expect(withUrl).toBe(true);
      expect(withPath).toBe(true);
    });
  });
});

import { describe, it, expect, afterAll } from 'vitest';
import { LocalStorageProvider } from '../src/services/storage/local-storage.provider.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('LocalStorageProvider', () => {
  const testDir = path.resolve('./test-uploads');
  const storage = new LocalStorageProvider(testDir);

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('uploads a file to disk and generates safe key', async () => {
    const buffer = Buffer.from('Hello, Campus Placement Platform!');
    const result = await storage.upload(buffer, 'test resume.pdf', 'application/pdf', 'resumes');

    expect(result.fileKey).toContain('resumes/');
    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.originalFilename).toBe('test resume.pdf');

    // Retrieve stream and consume it
    const stream = await storage.getStream(result.fileKey);
    expect(stream).toBeDefined();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString();
    expect(content).toBe('Hello, Campus Placement Platform!');

    // Cleanup file
    await storage.delete(result.fileKey);
  });

  it('prevents path traversal attacks', async () => {
    await expect(storage.getStream('../../etc/passwd')).rejects.toThrow();
  });
});

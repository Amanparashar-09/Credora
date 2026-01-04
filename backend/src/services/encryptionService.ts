import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const encryptionService = {
  /**
   * Encrypt file content
   */
  encryptFile(buffer: Buffer): { encryptedData: Buffer; iv: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
        iv
      );

      const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);

      return {
        encryptedData,
        iv: iv.toString('hex'),
      };
    } catch (error: any) {
      logger.error('File encryption failed:', error.message);
      throw new Error('Encryption failed');
    }
  },

  /**
   * Decrypt file content
   */
  decryptFile(encryptedData: Buffer, ivHex: string): Buffer {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
        iv
      );

      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decryptedData;
    } catch (error: any) {
      logger.error('File decryption failed:', error.message);
      throw new Error('Decryption failed');
    }
  },

  /**
   * Save encrypted file
   */
  async saveEncryptedFile(
    buffer: Buffer,
    studentAddress: string,
    fileName: string
  ): Promise<{ filePath: string; iv: string }> {
    try {
      const { encryptedData, iv } = this.encryptFile(buffer);

      // Create student-specific directory
      const studentDir = path.join(UPLOAD_DIR, studentAddress.toLowerCase());
      if (!fs.existsSync(studentDir)) {
        fs.mkdirSync(studentDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      const filePath = path.join(studentDir, uniqueFileName);

      // Write encrypted file
      fs.writeFileSync(filePath, encryptedData);

      logger.info('File encrypted and saved', {
        studentAddress,
        fileName: uniqueFileName,
      });

      return { filePath, iv };
    } catch (error: any) {
      logger.error('Failed to save encrypted file:', error.message);
      throw new Error('File save failed');
    }
  },

  /**
   * Read and decrypt file
   */
  async readEncryptedFile(filePath: string, ivHex: string): Promise<Buffer> {
    try {
      const encryptedData = fs.readFileSync(filePath);
      const decryptedData = this.decryptFile(encryptedData, ivHex);

      return decryptedData;
    } catch (error: any) {
      logger.error('Failed to read encrypted file:', error.message);
      throw new Error('File read failed');
    }
  },

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('File deleted', { filePath });
      }
    } catch (error: any) {
      logger.error('Failed to delete file:', error.message);
      throw new Error('File deletion failed');
    }
  },
};

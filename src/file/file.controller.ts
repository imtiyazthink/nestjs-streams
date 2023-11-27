import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';

@Controller('file')
export class FileController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const writeStreamEncrypted = fs.createWriteStream(
      'encrypted_' + file.originalname,
    );

    const key = crypto.randomBytes(32); // For AES-256, the key should be 32 bytes (256 bits)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Transform stream for encryption
    const encryptTransform = stream.pipeline(
      stream.Readable.from(file.buffer), // Create a readable stream from the file buffer
      cipher,
      writeStreamEncrypted,
      (err) => {
        if (err) {
          console.error('Encryption failed:', err);
        } else {
          console.log('Encryption successful');
        }
      },
    );

    return new Promise((resolve, reject) => {
      encryptTransform.on('finish', () => {
        resolve({ message: 'File uploaded and encrypted.' });
      });

      encryptTransform.on('error', (err) => {
        reject(err);
      });
    });
  }

  @Post('decrypt')
  @UseInterceptors(FileInterceptor('file'))
  async decryptFile(@UploadedFile() file: Express.Multer.File) {
    const writeStreamDecrypted = fs.createWriteStream(
      'decrypted_' + file.originalname,
    );
    const key = crypto.randomBytes(32); // For AES-256, the key should be 32 bytes (256 bits)
    const iv = crypto.randomBytes(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); // Use the same key and iv as used for encryption
    const decryptTransform = stream.pipeline(
      stream.Readable.from(file.buffer),
      decipher,
      writeStreamDecrypted,
      (err) => {
        if (err) {
          console.error('Decryption failed:', err);
        } else {
          console.log('Decryption successful');
        }
      },
    );

    return new Promise((resolve, reject) => {
      decryptTransform.on('finish', () => {
        resolve({ message: 'File decrypted.' });
      });

      decryptTransform.on('error', (err) => {
        reject(err);
      });
    });
  }
}

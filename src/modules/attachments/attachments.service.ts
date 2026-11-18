import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LocalStorageService } from './storage.service.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import type { UploadedFileDto } from './attachments.interface.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES =
  Number(process.env.MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024; // 5 MB

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    );
  }
  return false;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
  ) {}

  async upload(
    user: AuthUser,
    requestId: string,
    file: UploadedFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file was provided');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File exceeds maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file format: ${file.mimetype}. Allowed formats: JPEG, PNG, WEBP`,
      );
    }

    if (!validateMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'File contents do not match the expected image MIME signature',
      );
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request ${requestId} not found`);
    }

    if (request.universityId !== user.universityId) {
      throw new ForbiddenException('Cross-university upload is forbidden');
    }

    if (user.role === 'STUDENT' && request.reporterId !== user.id) {
      throw new ForbiddenException('You cannot upload attachments to another student’s request');
    }

    const ext = extname(file.originalname) || '.jpg';
    const storageKey = `${randomUUID()}${ext}`;

    await this.storage.save(file.buffer, storageKey);

    const attachment = await this.prisma.maintenanceAttachment.create({
      data: {
        requestId,
        uploaderId: user.id,
        storageKey,
        originalFilename: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
      },
    });

    return attachment;
  }

  async getFile(user: AuthUser, attachmentId: string) {
    const attachment = await this.prisma.maintenanceAttachment.findUnique({
      where: { id: attachmentId },
      include: { request: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.request.universityId !== user.universityId && user.role !== 'ADMIN') {
      throw new ForbiddenException('Cross-university access denied');
    }

    if (user.role === 'STUDENT' && attachment.request.reporterId !== user.id) {
      throw new ForbiddenException('Private attachment access denied');
    }

    const buffer = await this.storage.get(attachment.storageKey);

    return {
      buffer,
      mimeType: attachment.mimeType,
      filename: attachment.originalFilename,
    };
  }
}

import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import type { UploadedFileDto } from './attachments.interface.js';

@ApiTags('Attachments & File Uploads')
@ApiBearerAuth('sessionCookie')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}

  @Post(':requestId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image attachment for a maintenance request' })
  async upload(
    @CurrentUser() user: AuthUser,
    @Param('requestId') requestId: string,
    @UploadedFile() file: UploadedFileDto,
  ) {
    return this.service.upload(user, requestId, file);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Securely view or download a private attachment' })
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.service.getFile(user, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.filename)}"`,
    );
    res.send(file.buffer);
  }
}

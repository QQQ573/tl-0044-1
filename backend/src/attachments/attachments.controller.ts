import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Express } from 'express';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto, UploadAttachmentDto } from './dto/attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('附件管理')
@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        transferId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({ summary: '上传附件' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadAttachmentDto,
    @CurrentUser() user: User,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.upload(file, query.transferId, user);
  }

  @Get('transfer/:transferId')
  @ApiOperation({ summary: '获取调拨申请的附件列表' })
  findByTransferId(@Param('transferId') transferId: string): Promise<AttachmentResponseDto[]> {
    return this.attachmentsService.findByTransferId(transferId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '获取附件下载链接（带签名）' })
  getDownloadUrl(@Param('id') id: string): Promise<{ url: string }> {
    return this.attachmentsService.getDownloadUrl(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除附件' })
  remove(@Param('id') id: string): Promise<void> {
    return this.attachmentsService.remove(id);
  }
}

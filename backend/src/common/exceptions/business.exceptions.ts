import { ConflictException, NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateTransferException extends ConflictException {
  constructor(skuId: string, batchNo: string) {
    super(`SKU ${skuId} 批次 ${batchNo} 已存在进行中的调拨申请`);
  }
}

export class TransferNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`调拨申请 ${id} 不存在`);
  }
}

export class InvalidStatusTransitionException extends ForbiddenException {
  constructor(from: string, to: string) {
    super(`不允许的状态流转: ${from} -> ${to}`);
  }
}

export class OptimisticLockException extends HttpException {
  constructor(private readonly latestData?: any) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: '数据已被修改，请刷新后重试',
        error: 'Conflict',
        latestData,
      },
      HttpStatus.CONFLICT,
    );
  }

  getLatestData() {
    return this.latestData;
  }
}

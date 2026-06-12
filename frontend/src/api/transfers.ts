import request from '@/utils/request';
import { Transfer, TransferStatus } from '@/types';

export interface CreateTransferDto {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  skuId: string;
  batchNo: string;
  quantity: number;
  reason?: string;
  remark?: string;
  submitForApproval?: boolean;
}

export interface UpdateTransferDto {
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  skuId?: string;
  batchNo?: string;
  quantity?: number;
  reason?: string;
  remark?: string;
}

export interface ApproveTransferDto {
  version: number;
  decision: TransferStatus.PENDING_SHIPMENT | TransferStatus.REJECTED;
  rejectionReason?: string;
}

export interface ShipTransferDto {
  logisticsCompany: string;
  trackingNo: string;
}

export interface QueryTransferDto {
  status?: TransferStatus;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  skuId?: string;
  transferNo?: string;
  applicantId?: string;
}

export interface TransferListResponse {
  data: Transfer[];
  total: number;
}

export const createTransfer = (data: CreateTransferDto): Promise<Transfer> => {
  return request.post('/transfers', data);
};

export const getTransferList = (
  params: QueryTransferDto & { page?: number; limit?: number },
): Promise<TransferListResponse> => {
  return request.get('/transfers', { params });
};

export const getTransferDetail = (id: string): Promise<Transfer> => {
  return request.get(`/transfers/${id}`);
};

export const updateTransfer = (id: string, data: UpdateTransferDto): Promise<Transfer> => {
  return request.put(`/transfers/${id}`, data);
};

export const submitForApproval = (id: string): Promise<Transfer> => {
  return request.post(`/transfers/${id}/submit`);
};

export const approveTransfer = (id: string, data: ApproveTransferDto): Promise<Transfer> => {
  return request.post(`/transfers/${id}/approve`, data);
};

export const shipTransfer = (id: string, data: ShipTransferDto): Promise<Transfer> => {
  return request.post(`/transfers/${id}/ship`, data);
};

export const receiveTransfer = (id: string): Promise<Transfer> => {
  return request.post(`/transfers/${id}/receive`);
};

export const deleteTransfer = (id: string): Promise<void> => {
  return request.delete(`/transfers/${id}`);
};

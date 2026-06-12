import request from '@/utils/request';
import { Warehouse, Sku, Attachment, LogisticsTracking } from '@/types';

export interface WarehouseListResponse {
  data: Warehouse[];
  total: number;
}

export const getWarehouseList = (params?: { page?: number; limit?: number }): Promise<WarehouseListResponse> => {
  return request.get('/warehouses', { params });
};

export const getSkuList = (params?: { page?: number; limit?: number }): Promise<{ data: Sku[]; total: number }> => {
  return request.get('/skus', { params });
};

export const getAttachments = (transferId: string): Promise<Attachment[]> => {
  return request.get(`/attachments/transfer/${transferId}`);
};

export const uploadAttachment = (file: File, transferId?: string): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);
  if (transferId) {
    formData.append('transferId', transferId);
  }
  return request.post('/attachments/upload', formData, {
    params: transferId ? { transferId } : undefined,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAttachment = (id: string): Promise<void> => {
  return request.delete(`/attachments/${id}`);
};

export const getLogisticsTrackings = (transferId: string): Promise<LogisticsTracking[]> => {
  return request.get(`/logistics/transfer/${transferId}`);
};

export const createLogisticsTracking = (data: {
  transferId: string;
  timestamp: string;
  location: string;
  latitude?: string;
  longitude?: string;
  status: string;
  description?: string;
  operator?: string;
}): Promise<LogisticsTracking> => {
  return request.post('/logistics/tracking', data);
};

export const generateMockLogistics = (transferId: string, pointCount?: number): Promise<LogisticsTracking[]> => {
  return request.post('/logistics/tracking/mock', { transferId, pointCount });
};

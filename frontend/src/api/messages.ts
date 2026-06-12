import request from '@/utils/request';
import { Message, MessageListResponse, AuditLog } from '@/types';

export const getMessages = (params?: {
  read?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<MessageListResponse> => {
  return request.get('/messages', { params });
};

export const getUnreadCount = (): Promise<{ count: number }> => {
  return request.get('/messages/unread-count');
};

export const markAsRead = (id: string): Promise<Message> => {
  return request.put(`/messages/${id}/read`);
};

export const markAllAsRead = (): Promise<{ affected: number }> => {
  return request.put('/messages/read-all');
};

export const batchMarkAsRead = (ids: string[]): Promise<{ affected: number }> => {
  return request.put('/messages/batch-read', { ids });
};

export const getAuditLogs = (transferId: string, params?: { page?: number; limit?: number }): Promise<{ data: AuditLog[]; total: number }> => {
  return request.get(`/audit/transfer/${transferId}`, { params });
};

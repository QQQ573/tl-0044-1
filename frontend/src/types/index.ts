export enum UserRole {
  REGION_MANAGER = 'region_manager',
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  FINANCE = 'finance',
}

export interface User {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  email?: string;
}

export enum TransferStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_SHIPMENT = 'pending_shipment',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export const TransferStatusLabel: Record<TransferStatus, string> = {
  [TransferStatus.DRAFT]: '草稿',
  [TransferStatus.PENDING_APPROVAL]: '待审核',
  [TransferStatus.PENDING_SHIPMENT]: '待出库',
  [TransferStatus.IN_TRANSIT]: '在途',
  [TransferStatus.COMPLETED]: '已入库',
  [TransferStatus.REJECTED]: '已驳回',
};

export const TransferStatusColor: Record<TransferStatus, string> = {
  [TransferStatus.DRAFT]: 'default',
  [TransferStatus.PENDING_APPROVAL]: 'warning',
  [TransferStatus.PENDING_SHIPMENT]: 'processing',
  [TransferStatus.IN_TRANSIT]: 'blue',
  [TransferStatus.COMPLETED]: 'success',
  [TransferStatus.REJECTED]: 'error',
};

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  SHIP = 'ship',
  RECEIVE = 'receive',
  DELETE = 'delete',
  LOGISTICS_UPDATE = 'logistics_update',
  ATTACHMENT_UPLOAD = 'attachment_upload',
  ATTACHMENT_DELETE = 'attachment_delete',
}

export const AuditActionLabel: Record<AuditAction, string> = {
  [AuditAction.CREATE]: '创建',
  [AuditAction.UPDATE]: '编辑',
  [AuditAction.SUBMIT]: '提交审核',
  [AuditAction.APPROVE]: '审核通过',
  [AuditAction.REJECT]: '审核驳回',
  [AuditAction.SHIP]: '确认出库',
  [AuditAction.RECEIVE]: '确认入库',
  [AuditAction.DELETE]: '删除',
  [AuditAction.LOGISTICS_UPDATE]: '物流更新',
  [AuditAction.ATTACHMENT_UPLOAD]: '上传附件',
  [AuditAction.ATTACHMENT_DELETE]: '删除附件',
};

export interface AuditLog {
  id: string;
  action: AuditAction;
  transferId?: string;
  transferNo?: string;
  oldStatus?: string;
  newStatus?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  remark?: string;
  metaData?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export enum MessageType {
  TRANSFER_SUBMITTED = 'transfer_submitted',
  TRANSFER_APPROVED = 'transfer_approved',
  TRANSFER_REJECTED = 'transfer_rejected',
  TRANSFER_SHIPPED = 'transfer_shipped',
  TRANSFER_RECEIVED = 'transfer_received',
  LOGISTICS_TIMEOUT = 'logistics_timeout',
  SYSTEM = 'system',
}

export const MessageTypeLabel: Record<MessageType, string> = {
  [MessageType.TRANSFER_SUBMITTED]: '调拨提交',
  [MessageType.TRANSFER_APPROVED]: '审核通过',
  [MessageType.TRANSFER_REJECTED]: '审核驳回',
  [MessageType.TRANSFER_SHIPPED]: '已出库',
  [MessageType.TRANSFER_RECEIVED]: '已入库',
  [MessageType.LOGISTICS_TIMEOUT]: '物流超时',
  [MessageType.SYSTEM]: '系统通知',
};

export const MessageTypeIcon: Record<MessageType, string> = {
  [MessageType.TRANSFER_SUBMITTED]: '📝',
  [MessageType.TRANSFER_APPROVED]: '✅',
  [MessageType.TRANSFER_REJECTED]: '❌',
  [MessageType.TRANSFER_SHIPPED]: '🚚',
  [MessageType.TRANSFER_RECEIVED]: '📦',
  [MessageType.LOGISTICS_TIMEOUT]: '⚠️',
  [MessageType.SYSTEM]: '🔔',
};

export enum MessageChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
}

export interface Message {
  id: string;
  type: MessageType;
  recipientId: string;
  title: string;
  content: string;
  metaData?: Record<string, any>;
  read: boolean;
  readAt?: string;
  channel: MessageChannel;
  transferId?: string;
  transferNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  data: Message[];
  total: number;
  unreadCount: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  isActive: boolean;
}

export interface Sku {
  id: string;
  skuCode: string;
  skuName: string;
  brand: string;
  model?: string;
  description?: string;
}

export interface TransferItem {
  id: string;
  transferId: string;
  skuId: string;
  batchNo: string;
  quantity: number;
  sku?: Sku;
}

export interface Transfer {
  id: string;
  transferNo: string;
  status: TransferStatus;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  sourceWarehouse?: Warehouse;
  targetWarehouse?: Warehouse;
  skuId: string;
  batchNo: string;
  quantity: number;
  reason?: string;
  remark?: string;
  applicantId?: string;
  applicant?: User;
  approverId?: string;
  approver?: User;
  approvedAt?: string;
  rejectionReason?: string;
  shippedAt?: string;
  receivedAt?: string;
  logisticsCompany?: string;
  trackingNo?: string;
  items?: TransferItem[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
}

export interface LogisticsTracking {
  id: string;
  transferId: string;
  timestamp: string;
  location: string;
  latitude?: string;
  longitude?: string;
  status: string;
  description?: string;
  operator?: string;
}

export interface SseMessage {
  type: 'heartbeat' | 'message';
  data: {
    timestamp?: number;
    message?: Message;
  };
}


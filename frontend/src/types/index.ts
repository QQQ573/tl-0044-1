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

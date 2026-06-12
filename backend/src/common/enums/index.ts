export enum UserRole {
  REGION_MANAGER = 'region_manager',
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  FINANCE = 'finance',
}

export enum TransferStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_SHIPMENT = 'pending_shipment',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export const TRANSFER_STATUS_FLOW: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.DRAFT]: [TransferStatus.PENDING_APPROVAL],
  [TransferStatus.PENDING_APPROVAL]: [
    TransferStatus.PENDING_SHIPMENT,
    TransferStatus.REJECTED,
  ],
  [TransferStatus.PENDING_SHIPMENT]: [TransferStatus.IN_TRANSIT],
  [TransferStatus.IN_TRANSIT]: [TransferStatus.COMPLETED],
  [TransferStatus.COMPLETED]: [],
  [TransferStatus.REJECTED]: [],
};

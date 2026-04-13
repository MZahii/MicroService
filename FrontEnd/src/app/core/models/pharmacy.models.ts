export interface Medication {
  medicationId?: number;
  name: string;
  form: string;
  pediatricDosage: string;
}

export interface Batch {
  batchId?: number;
  batchNumber: string;
  manufactureDate?: string;
  expirationDate: string;
  quantity: number;
  medicationId?: number;
  expired?: boolean;
}

export interface Stock {
  stockId?: number;
  batchId: number;
  quantityAvailable: number;
}

export interface DispenseRequest {
  batchId: number;
  quantity: number;
  //patientId: string;
  //prescriptionId: string;
}

export interface StockTransferRequest {
  sourceBatchId: number;
  targetBatchId: number;
  quantity: number;
  reason?: string;
}

export interface StockTransferResult {
  sourceBatchId: number;
  targetBatchId: number;
  quantityTransferred: number;
  sourceQuantityAvailable: number;
  targetQuantityAvailable: number;
  reason?: string;
}

export interface Supplier {
  supplierId?: number;
  name: string;
  contactInfo: string;
}

export interface DispensationLog {
  id?: number;
  batchId: number;
  quantity: number;
  dispensedAt: string;
}

export interface SupplyOrder {
  orderId?: number;
  supplierId?: number;
  medicationId: number;
  orderDate?: string;
  status?: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  orderedQuantity: number;
}

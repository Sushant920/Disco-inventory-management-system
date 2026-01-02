export type VolumeUnit = 'ml' | 'l';

export interface Product {
  id: string;
  title: string;
  volume: number;
  volumeUnit: VolumeUnit;
  category: 'wine' | 'beer' | 'spirits' | 'non-liquor' | 'misc';
  price: number;
  cost?: number | null;
  sku?: string | null;
  defaultBarcodeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Barcode {
  id: string;
  productId: string;
  code: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  change: number;
  reason: 'intake' | 'sale' | 'adjustment' | 'return';
  referenceId?: string | null;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  units: number;
  unitPrice: number;
  barcodeId?: string | null;
  createdAt: string;
}

export interface EarningsLog {
  id: string;
  saleId: string;
  productId: string;
  amount: number;
  createdAt: string;
}

export interface Settings {
  id: string;
  currency: string;
  scanDefaultQty: number;
  lowStockThreshold: number;
  dataPath: string;
  backupPath?: string | null;
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummary {
  product: Product;
  barcodes: Barcode[];
  onHand: number;
  lastTransactionAt?: string;
}

export interface SaleInput {
  barcode: string;
  units?: number;
}

export interface ReportFilters {
  from?: string;
  to?: string;
}

export interface SalesReportItem {
  productId: string;
  title: string;
  revenue: number;
  units: number;
}


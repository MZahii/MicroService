import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Medication, Batch, Stock,
  DispenseRequest, DispensationLog, Supplier, SupplyOrder, StockTransferRequest, StockTransferResult
} from '../models/pharmacy.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/pharmacy`;

  // ─── Medications ────────────────────────────────────────────────────────────
  getMedications(): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.base}/medications`);
  }
  getMedication(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.base}/medications/${id}`);
  }
  createMedication(med: Medication): Observable<Medication> {
    return this.http.post<Medication>(`${this.base}/medications`, med);
  }
  updateMedication(id: number, med: Medication): Observable<Medication> {
    return this.http.put<Medication>(`${this.base}/medications/${id}`, med);
  }
  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/medications/${id}`);
  }

  // ─── Batches ────────────────────────────────────────────────────────────────
  getBatches(medicationId: number): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.base}/medications/${medicationId}/batches`);
  }
  addBatch(medicationId: number, batch: Batch): Observable<Batch> {
    return this.http.post<Batch>(`${this.base}/medications/${medicationId}/batches`, batch);
  }
  getExpiredBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.base}/medications/batches/expired`);
  }
  getExpiringSoon(days = 30): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.base}/medications/batches/expiring-soon`,
      { params: new HttpParams().set('days', days) });
  }

  // ─── Stock ──────────────────────────────────────────────────────────────────
  getAllStock(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.base}/stock`);
  }
  getStockByBatch(batchId: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.base}/stock/batches/${batchId}`);
  }
  initializeStock(batchId: number, quantity: number): Observable<Stock> {
    return this.http.post<Stock>(`${this.base}/stock/batches/${batchId}/initialize`, {},
      { params: new HttpParams().set('quantity', quantity) });
  }
  getLowStock(threshold = 10): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.base}/stock/low`,
      { params: new HttpParams().set('threshold', threshold) });
  }
  getOutOfStock(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.base}/stock/out-of-stock`);
  }
  dispense(request: DispenseRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.base}/stock/dispense`, request);
  }
  adjustStock(batchId: number, delta: number, reason: string): Observable<Stock> {
    return this.http.patch<Stock>(`${this.base}/stock/batches/${batchId}/adjust`, { delta, reason });
  }
  transferStock(request: StockTransferRequest): Observable<StockTransferResult> {
    return this.http.post<StockTransferResult>(`${this.base}/stock/transfer`, request);
  }
  getDispensationHistory(date?: string): Observable<DispensationLog[]> {
    const params = date ? new HttpParams().set('date', date) : new HttpParams();
    return this.http.get<DispensationLog[]>(`${this.base}/stock/dispensations`, { params });
  }

  // ─── Suppliers ──────────────────────────────────────────────────────────────
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.base}/suppliers`);
  }
  createSupplier(s: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.base}/suppliers`, s);
  }
  updateSupplier(id: number, s: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.base}/suppliers/${id}`, s);
  }
  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/suppliers/${id}`);
  }
  getOrdersForSupplier(supplierId: number): Observable<SupplyOrder[]> {
    return this.http.get<SupplyOrder[]>(`${this.base}/suppliers/${supplierId}/orders`);
  }
  placeOrder(supplierId: number, order: SupplyOrder): Observable<SupplyOrder> {
    return this.http.post<SupplyOrder>(`${this.base}/suppliers/${supplierId}/orders`, order);
  }
  markDelivered(orderId: number): Observable<SupplyOrder> {
    return this.http.patch<SupplyOrder>(`${this.base}/suppliers/orders/${orderId}/deliver`, {});
  }
  cancelOrder(orderId: number): Observable<SupplyOrder> {
    return this.http.patch<SupplyOrder>(`${this.base}/suppliers/orders/${orderId}/cancel`, {});
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { Stock, DispenseRequest, Batch, StockTransferRequest } from '../../../../core/models/pharmacy.models';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock.component.html'
})
export class StockComponent implements OnInit {
  private svc = inject(PharmacyService);

  stocks = signal<Stock[]>([]);
  lowStock = signal<Stock[]>([]);
  outOfStock = signal<Stock[]>([]);
  expiredBatches = signal<Batch[]>([]);
  activeTab = signal<'all' | 'low' | 'out' | 'expired'>('all');
  loading = signal(false);

  batchMedicationMap: Record<number, string> = {};
  batchDetailsMap: Record<number, Batch> = {};

  showDispense = false;
  dispenseForm: Partial<DispenseRequest> = {};

  showInit = false;
  initBatchId = 0;
  initQty = 0;

  showAdjust = false;
  adjustBatchId = 0;
  adjustDelta = 0;
  adjustReason = '';

  showTransfer = false;
  transferForm: Partial<StockTransferRequest> = {};

  alertOutDismissed = false;
  alertLowDismissed = false;

  toast = signal('');
  toastOk = signal(true);

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.alertOutDismissed = false;
    this.alertLowDismissed = false;
    this.svc.getAllStock().subscribe({ next: d => { this.stocks.set(d); this.loading.set(false); } });
    this.svc.getLowStock(10).subscribe({ next: d => this.lowStock.set(d) });
    this.svc.getOutOfStock().subscribe({ next: d => this.outOfStock.set(d) });
    this.svc.getExpiredBatches().subscribe({ next: d => this.expiredBatches.set(d) });
    this.loadBatchMedicationMap();
  }

  loadBatchMedicationMap() {
    this.svc.getMedications().subscribe({ next: medications => {
      if (medications.length === 0) return;
      const calls = medications.map(m => this.svc.getBatches(m.medicationId!));
      forkJoin(calls).subscribe({ next: batchArrays => {
        const map: Record<number, string> = {};
        const details: Record<number, Batch> = {};
        batchArrays.forEach((batches, i) => {
          batches.forEach(b => {
            if (b.batchId != null) {
              map[b.batchId] = medications[i].name;
              details[b.batchId] = { ...b, medicationId: medications[i].medicationId };
            }
          });
        });
        this.batchMedicationMap = map;
        this.batchDetailsMap = details;
      }});
    }});
  }

  get currentList(): Stock[] {
    if (this.activeTab() === 'low') return this.lowStock();
    if (this.activeTab() === 'out') return this.outOfStock();
    return this.stocks();
  }

  stockLevel(s: Stock): 'ok' | 'low' | 'out' {
    if (s.quantityAvailable === 0) return 'out';
    if (s.quantityAvailable <= 10) return 'low';
    return 'ok';
  }

  dispense() {
    this.svc.dispense(this.dispenseForm as DispenseRequest).subscribe({
      next: () => { this.showDispense = false; this.loadAll(); this.notify('Dispensed successfully', true); },
      error: (e) => this.notify(e?.error?.message || 'Dispense failed', false)
    });
  }

  initStock() {
    this.svc.initializeStock(this.initBatchId, this.initQty).subscribe({
      next: () => { this.showInit = false; this.loadAll(); this.notify('Stock initialized', true); },
      error: (e) => this.notify(e?.error?.message || 'Already initialized', false)
    });
  }

  adjust() {
    this.svc.adjustStock(this.adjustBatchId, this.adjustDelta, this.adjustReason).subscribe({
      next: () => { this.showAdjust = false; this.loadAll(); this.notify('Stock adjusted', true); },
      error: () => this.notify('Adjustment failed', false)
    });
  }

  openTransfer(source: Stock) {
    this.transferForm = {
      sourceBatchId: source.batchId,
      targetBatchId: undefined,
      quantity: undefined,
      reason: ''
    };
    this.showTransfer = true;
  }

  get transferOptions(): Array<{ batchId: number; label: string }> {
    const sourceBatchId = Number(this.transferForm.sourceBatchId);
    if (!sourceBatchId) return [];
    const sourceBatch = this.batchDetailsMap[sourceBatchId];
    if (!sourceBatch?.medicationId) return [];

    return Object.values(this.batchDetailsMap)
      .filter((batch) =>
        batch.batchId != null
        && batch.batchId !== sourceBatchId
        && batch.medicationId === sourceBatch.medicationId
        && !batch.expired
      )
      .sort((a, b) => String(a.expirationDate ?? '').localeCompare(String(b.expirationDate ?? '')))
      .map((batch) => ({
        batchId: batch.batchId!,
        label: `${batch.batchNumber} | expires ${batch.expirationDate ?? '-'}`
      }));
  }

  get transferSourceLabel(): string {
    const sourceBatchId = Number(this.transferForm.sourceBatchId);
    if (!sourceBatchId) return '-';
    return this.batchMedicationMap[sourceBatchId] || `Batch ${sourceBatchId}`;
  }

  get canSubmitTransfer(): boolean {
    const quantity = Number(this.transferForm.quantity);
    return !!this.transferForm.sourceBatchId
      && !!this.transferForm.targetBatchId
      && quantity > 0;
  }

  transfer() {
    const sourceBatchId = Number(this.transferForm.sourceBatchId);
    const targetBatchId = Number(this.transferForm.targetBatchId);
    const quantity = Number(this.transferForm.quantity);
    const reason = (this.transferForm.reason ?? '').trim();

    if (!sourceBatchId || !targetBatchId || !quantity || quantity <= 0) {
      this.notify('Please select both batches and enter a positive quantity', false);
      return;
    }

    this.svc.transferStock({
      sourceBatchId,
      targetBatchId,
      quantity,
      reason: reason || 'manual stock transfer'
    }).subscribe({
      next: () => {
        this.showTransfer = false;
        this.loadAll();
        this.notify('Stock transferred successfully', true);
      },
      error: (e) => this.notify(e?.error?.message || 'Transfer failed', false)
    });
  }

  notify(msg: string, ok: boolean) {
    this.toast.set(msg); this.toastOk.set(ok);
    setTimeout(() => this.toast.set(''), 3500);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { Stock, DispenseRequest, Batch, Medication } from '../../../../core/models/pharmacy.models';

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

  showDispense = false;
  dispenseForm: Partial<DispenseRequest> = {};

  // Init modal state
  showInit = false;
  initMedications = signal<Medication[]>([]);
  initSelectedMedId: number | null = null;
  initBatches = signal<Batch[]>([]);
  initBatchesLoading = signal(false);
  initSelectedBatch: Batch | null = null;
  initQty = 1;

  showAdjust = false;
  adjustBatchId = 0;
  adjustDelta = 0;
  adjustReason = '';

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
        batchArrays.forEach((batches, i) => {
          batches.forEach(b => { if (b.batchId != null) map[b.batchId] = medications[i].name; });
        });
        this.batchMedicationMap = map;
      }});
    }});
  }

  openInit() {
    this.initSelectedMedId = null;
    this.initSelectedBatch = null;
    this.initBatches.set([]);
    this.initQty = 1;
    this.showInit = true;
    this.svc.getMedications().subscribe({ next: d => this.initMedications.set(d) });
  }

  onInitMedChange() {
    this.initSelectedBatch = null;
    this.initBatches.set([]);
    if (!this.initSelectedMedId) return;
    this.initBatchesLoading.set(true);
    this.svc.getBatches(this.initSelectedMedId).subscribe({
      next: d => { this.initBatches.set(d); this.initBatchesLoading.set(false); },
      error: () => this.initBatchesLoading.set(false)
    });
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
    if (!this.initSelectedBatch || !this.initQty) return;
    this.svc.initializeStock(this.initSelectedBatch.batchId!, this.initQty).subscribe({
      next: () => { this.showInit = false; this.loadAll(); this.notify('Stock initialized', true); },
      error: (e) => this.notify(e?.error?.message || 'Already initialized or error', false)
    });
  }

  adjust() {
    this.svc.adjustStock(this.adjustBatchId, this.adjustDelta, this.adjustReason).subscribe({
      next: () => { this.showAdjust = false; this.loadAll(); this.notify('Stock adjusted', true); },
      error: () => this.notify('Adjustment failed', false)
    });
  }

  notify(msg: string, ok: boolean) {
    this.toast.set(msg); this.toastOk.set(ok);
    setTimeout(() => this.toast.set(''), 3500);
  }
}
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { Medication, Supplier, SupplyOrder } from '../../../../core/models/pharmacy.models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html'
})
export class SuppliersComponent implements OnInit {
  private svc = inject(PharmacyService);

  suppliers = signal<Supplier[]>([]);
  orders = signal<SupplyOrder[]>([]);
  selectedSupplier: Supplier | null = null;
  loading = signal(false);

  showSupplierModal = false;
  editMode = false;
  currentSupplier: Partial<Supplier> = {};

  showOrderModal = false;
  newOrder: Partial<SupplyOrder> = {};
  medications = signal<Medication[]>([]);
  medicationMap = computed(() => {
    const map: Record<number, string> = {};
    this.medications().forEach(m => { if (m.medicationId != null) map[m.medicationId] = m.name; });
    return map;
  });

  toast = signal('');
  toastOk = signal(true);

  ngOnInit() { this.load(); this.loadMedications(); }

  load() {
    this.loading.set(true);
    this.svc.getSuppliers().subscribe({ next: d => { this.suppliers.set(d); this.loading.set(false); } });
  }

  loadMedications() {
    this.svc.getMedications().subscribe({ next: d => this.medications.set(d) });
  }

  openAdd() { this.editMode = false; this.currentSupplier = { name: '', contactInfo: '' }; this.showSupplierModal = true; }
  openEdit(s: Supplier) { this.editMode = true; this.currentSupplier = { ...s }; this.showSupplierModal = true; }

  save() {
    const obs = this.editMode
      ? this.svc.updateSupplier(this.currentSupplier.supplierId!, this.currentSupplier as Supplier)
      : this.svc.createSupplier(this.currentSupplier as Supplier);
    obs.subscribe({
      next: () => { this.showSupplierModal = false; this.load(); this.notify(`Supplier ${this.editMode ? 'updated' : 'created'}`, true); },
      error: () => this.notify('Operation failed', false)
    });
  }

  delete(s: Supplier) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    this.svc.deleteSupplier(s.supplierId!).subscribe({
      next: () => { if (this.selectedSupplier?.supplierId === s.supplierId) this.selectedSupplier = null; this.load(); this.notify('Deleted', true); }
    });
  }

  selectSupplier(s: Supplier) {
    this.selectedSupplier = s;
    this.svc.getOrdersForSupplier(s.supplierId!).subscribe({ next: d => this.orders.set(d) });
  }

  medicationName(id: number): string {
    // eslint-disable-next-line eqeqeq
    const m = this.medications().find(x => x.medicationId == id);
    return m ? m.name : `#${id}`;
  }

  openOrder() {
    this.newOrder = { medicationId: undefined as any, orderedQuantity: 1 };
    if (this.medications().length === 0) {
      this.loadMedications();
    }
    this.showOrderModal = true;
  }

  placeOrder() {
    this.svc.placeOrder(this.selectedSupplier!.supplierId!, this.newOrder as SupplyOrder).subscribe({
      next: () => { this.showOrderModal = false; this.selectSupplier(this.selectedSupplier!); this.notify('Order placed', true); },
      error: () => this.notify('Order failed', false)
    });
  }

  deliver(orderId: number) {
    this.svc.markDelivered(orderId).subscribe({
      next: () => { this.selectSupplier(this.selectedSupplier!); this.notify('Marked as delivered — stock updated', true); }
    });
  }

  cancel(orderId: number) {
    this.svc.cancelOrder(orderId).subscribe({
      next: () => { this.selectSupplier(this.selectedSupplier!); this.notify('Order cancelled', true); }
    });
  }

  statusBadge(s: string): string {
    if (s === 'DELIVERED') return 'bg-soft-success text-success';
    if (s === 'CANCELLED') return 'bg-soft-danger text-danger';
    return 'bg-soft-warning text-warning';
  }

  notify(msg: string, ok: boolean) {
    this.toast.set(msg); this.toastOk.set(ok);
    setTimeout(() => this.toast.set(''), 3000);
  }
}

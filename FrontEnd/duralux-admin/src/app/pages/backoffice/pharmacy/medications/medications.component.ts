import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { Medication, Batch } from '../../../../core/models/pharmacy.models';

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medications.component.html'
})
export class MedicationsComponent implements OnInit {
  private svc = inject(PharmacyService);

  medications = signal<Medication[]>([]);
  loading = signal(false);

  showModal = false;
  editMode = false;
  currentMed: Partial<Medication> = {};

  showBatchModal = false;
  selectedMed: Medication | null = null;
  batches = signal<Batch[]>([]);
  newBatch: Partial<Batch> = {};

  toast = signal('');
  toastOk = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getMedications().subscribe({
      next: d => { this.medications.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.editMode = false;
    this.currentMed = { name: '', form: 'tablet', pediatricDosage: '' };
    this.showModal = true;
  }

  openEdit(med: Medication) {
    this.editMode = true;
    this.currentMed = { ...med };
    this.showModal = true;
  }

  save() {
    const obs = this.editMode
      ? this.svc.updateMedication(this.currentMed.medicationId!, this.currentMed as Medication)
      : this.svc.createMedication(this.currentMed as Medication);

    obs.subscribe({
      next: () => { this.showModal = false; this.load(); this.notify(`Medication ${this.editMode ? 'updated' : 'created'}`, true); },
      error: () => this.notify('Operation failed', false)
    });
  }

  delete(med: Medication) {
    if (!confirm(`Delete "${med.name}"?`)) return;
    this.svc.deleteMedication(med.medicationId!).subscribe({
      next: () => { this.load(); this.notify('Deleted', true); },
      error: () => this.notify('Delete failed', false)
    });
  }

  openBatches(med: Medication) {
    this.selectedMed = med;
    this.newBatch = { batchNumber: '', quantity: 0, expirationDate: '' };
    this.showBatchModal = true;
    this.loadBatches();
  }

  loadBatches() {
    this.svc.getBatches(this.selectedMed!.medicationId!).subscribe({
      next: d => this.batches.set(d)
    });
  }

  addBatch() {
    this.svc.addBatch(this.selectedMed!.medicationId!, this.newBatch as Batch).subscribe({
      next: () => { this.newBatch = { batchNumber: '', quantity: 0, expirationDate: '' }; this.loadBatches(); this.notify('Batch added', true); },
      error: () => this.notify('Failed to add batch', false)
    });
  }

  notify(msg: string, ok: boolean) {
    this.toast.set(msg); this.toastOk.set(ok);
    setTimeout(() => this.toast.set(''), 3000);
  }
}

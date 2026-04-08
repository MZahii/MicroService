import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { DispensationLog } from '../../../../core/models/pharmacy.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dispensations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dispensations.component.html'
})
export class DispensationsComponent implements OnInit {
  private svc = inject(PharmacyService);

  logs = signal<DispensationLog[]>([]);
  loading = signal(false);
  selectedDate = new Date().toISOString().split('T')[0]; // today yyyy-MM-dd

  batchMedicationMap: Record<number, string> = {};
  batchNumberMap: Record<number, string> = {};

  ngOnInit() {
    this.loadMaps();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getDispensationHistory(this.selectedDate).subscribe({
      next: d => { this.logs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadMaps() {
    this.svc.getMedications().subscribe({ next: medications => {
      if (medications.length === 0) return;
      const calls = medications.map(m => this.svc.getBatches(m.medicationId!));
      forkJoin(calls).subscribe({ next: batchArrays => {
        const nameMap: Record<number, string> = {};
        const numMap: Record<number, string> = {};
        batchArrays.forEach((batches, i) => {
          batches.forEach(b => {
            if (b.batchId != null) {
              nameMap[b.batchId] = medications[i].name;
              numMap[b.batchId] = b.batchNumber;
            }
          });
        });
        this.batchMedicationMap = nameMap;
        this.batchNumberMap = numMap;
      }});
    }});
  }

  get totalDispensed(): number {
    return this.logs().reduce((sum, l) => sum + l.quantity, 0);
  }

  get distinctBatches(): number {
    return new Set(this.logs().map(l => l.batchId)).size;
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  goToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.load();
  }

  isToday(): boolean {
    return this.selectedDate === new Date().toISOString().split('T')[0];
  }
}
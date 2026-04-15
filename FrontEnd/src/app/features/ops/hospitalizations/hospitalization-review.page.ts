import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HospitalizationCaseDto, OpsApiService } from '../../../core/services/ops-api.service';

@Component({
  selector: 'app-hospitalization-review-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hospitalization-review.page.html',
  styleUrl: './hospitalization-review.page.scss'
})
export class HospitalizationReviewPage implements OnInit {
  hospitalization: HospitalizationCaseDto | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private opsApi: OpsApiService
  ) {}

  ngOnInit(): void {
    const hospitalizationId = this.route.snapshot.paramMap.get('id');
    if (!hospitalizationId) {
      this.error = 'Hospitalization id is missing.';
      return;
    }
    this.load(hospitalizationId);
  }

  load(hospitalizationId: string): void {
    this.loading = true;
    this.error = '';
    this.opsApi.getHospitalizationProgress(hospitalizationId).subscribe({
      next: (item) => {
        this.hospitalization = item;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load hospitalization progress.';
        this.loading = false;
      }
    });
  }

  taskStatusClass(status?: string): string {
    if (status === 'DONE') return 'bg-soft-success text-success';
    if (status === 'NOT_DONE') return 'bg-soft-danger text-danger';
    return 'bg-soft-warning text-warning';
  }

  caseStatusClass(status?: string): string {
    if (status === 'ACTIVE') return 'bg-soft-primary text-primary';
    if (status === 'COMPLETED') return 'bg-soft-success text-success';
    if (status === 'CANCELLED') return 'bg-soft-danger text-danger';
    return 'bg-soft-warning text-warning';
  }
}

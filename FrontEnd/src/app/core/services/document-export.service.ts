import { Injectable } from '@angular/core';

export interface DocumentSummaryItem {
  label: string;
  value: string | number;
}

export interface DocumentTableColumn {
  key: string;
  label: string;
}

export interface DocumentExportConfig {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  generatedAt?: Date;
  summary?: DocumentSummaryItem[];
  columns: DocumentTableColumn[];
  rows: Record<string, string | number | null | undefined>[];
  emptyText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentExportService {
  printDocument(config: DocumentExportConfig): void {
    this.openDocument(config, true);
  }

  exportPdf(config: DocumentExportConfig): void {
    this.openDocument(config, true);
  }

  private openDocument(config: DocumentExportConfig, autoPrint: boolean): void {
    const html = this.buildDocumentHtml(config, autoPrint);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, '_blank');
    if (!popup) return;
    const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 10000);
    popup.addEventListener('load', cleanup, { once: true });
  }

  private buildDocumentHtml(config: DocumentExportConfig, autoPrint: boolean): string {
    const generatedAt = config.generatedAt ?? new Date();
    const logoUrl = `${window.location.origin}/assets/backoffice/images/logo/Logo_fin.png`;
    const summaryHtml = this.buildSummaryHtml(config.summary ?? []);
    const tableHtml = this.buildTableHtml(config.columns, config.rows, config.emptyText ?? 'No records found.');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${this.escapeHtml(config.title)}</title>
          <style>
            :root {
              --brand: #1d4ed8;
              --brand-soft: #eff6ff;
              --text: #0f172a;
              --muted: #64748b;
              --border: #cbd5e1;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: var(--text);
              font-family: "Segoe UI", Tahoma, Arial, sans-serif;
              font-size: 13px;
              line-height: 1.45;
              background: #f8fafc;
            }
            .page {
              width: 100%;
              max-width: 1100px;
              margin: 0 auto;
              padding: 24px;
              background: #fff;
            }
            .doc-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              border-bottom: 2px solid var(--brand);
              padding-bottom: 14px;
              margin-bottom: 14px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand img {
              width: 44px;
              height: 44px;
              object-fit: contain;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 700;
              color: #0b1739;
              margin: 0;
            }
            .brand-sub {
              margin: 2px 0 0 0;
              color: var(--muted);
              font-size: 12px;
            }
            .meta {
              text-align: right;
              color: var(--muted);
              font-size: 12px;
            }
            .doc-title {
              margin: 6px 0 0 0;
              font-size: 22px;
              color: #0b1739;
            }
            .doc-subtitle {
              margin: 4px 0 14px 0;
              color: var(--muted);
              font-size: 13px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
              gap: 10px;
              margin: 0 0 16px 0;
            }
            .summary-card {
              border: 1px solid var(--border);
              background: var(--brand-soft);
              border-radius: 8px;
              padding: 10px;
            }
            .summary-card .label {
              color: var(--muted);
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: .04em;
            }
            .summary-card .value {
              margin-top: 4px;
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            thead th {
              text-align: left;
              padding: 10px 8px;
              background: #f1f5f9;
              color: #0b1739;
              font-size: 12px;
              border: 1px solid var(--border);
            }
            tbody td {
              padding: 8px;
              border: 1px solid var(--border);
              vertical-align: top;
            }
            tbody tr:nth-child(even) td {
              background: #f8fafc;
            }
            .empty {
              text-align: center;
              color: var(--muted);
              padding: 16px;
            }
            .doc-footer {
              border-top: 1px solid var(--border);
              margin-top: 16px;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: var(--muted);
              font-size: 11px;
            }
            @page {
              size: A4;
              margin: 14mm;
            }
            @media print {
              body {
                background: #fff;
              }
              .page {
                max-width: none;
                padding: 0;
              }
              .doc-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #fff;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="doc-header">
              <div>
                <div class="brand">
                  <img src="${logoUrl}" alt="Clinic Logo" />
                  <div>
                    <h1 class="brand-title">NephrosPaidi Clinic</h1>
                    <p class="brand-sub">Hospital Management System</p>
                  </div>
                </div>
                <h2 class="doc-title">${this.escapeHtml(config.title)}</h2>
                ${config.subtitle ? `<p class="doc-subtitle">${this.escapeHtml(config.subtitle)}</p>` : ''}
              </div>
              <div class="meta">
                <div><strong>Generated:</strong> ${this.escapeHtml(this.formatDateTime(generatedAt))}</div>
                <div><strong>Generated By:</strong> ${this.escapeHtml(config.generatedBy || 'System')}</div>
              </div>
            </div>
            ${summaryHtml}
            ${tableHtml}
            <div class="doc-footer">
              <span>NephrosPaidi Clinic · Confidential Document</span>
              <span>Export generated on ${this.escapeHtml(this.formatDateTime(generatedAt))}</span>
            </div>
          </div>
          <script>
            ${autoPrint ? 'setTimeout(function(){ window.focus(); window.print(); }, 400);' : ''}
          </script>
        </body>
      </html>
    `;
  }

  private buildSummaryHtml(summary: DocumentSummaryItem[]): string {
    if (!summary.length) return '';
    const cards = summary.map((item) => `
      <div class="summary-card">
        <div class="label">${this.escapeHtml(item.label)}</div>
        <div class="value">${this.escapeHtml(String(item.value))}</div>
      </div>
    `).join('');
    return `<div class="summary-grid">${cards}</div>`;
  }

  private buildTableHtml(
    columns: DocumentTableColumn[],
    rows: Record<string, string | number | null | undefined>[],
    emptyText: string
  ): string {
    const head = columns.map((column) => `<th>${this.escapeHtml(column.label)}</th>`).join('');
    if (!rows.length) {
      return `
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody><tr><td class="empty" colspan="${columns.length}">${this.escapeHtml(emptyText)}</td></tr></tbody>
        </table>
      `;
    }

    const body = rows.map((row) => `
      <tr>
        ${columns.map((column) => `<td>${this.escapeHtml(String(row[column.key] ?? '-'))}</td>`).join('')}
      </tr>
    `).join('');

    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

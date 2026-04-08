import { Routes } from '@angular/router';
import { MedicationsComponent } from './medications/medications.component';
import { StockComponent } from './stock/stock.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { DispensationsComponent } from './dispensations/dispensations.component';

export const PHARMACY_ROUTES: Routes = [
  { path: '', redirectTo: 'medications', pathMatch: 'full' },
  { path: 'medications', component: MedicationsComponent },
  { path: 'stock', component: StockComponent },
  { path: 'suppliers', component: SuppliersComponent },
  { path: 'dispensations', component: DispensationsComponent },
];

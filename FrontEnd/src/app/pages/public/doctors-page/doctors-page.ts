import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doctors-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './doctors-page.html'
})
export class DoctorsPageComponent {}
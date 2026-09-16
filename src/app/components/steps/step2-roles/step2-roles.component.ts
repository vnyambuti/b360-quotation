import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationStateService } from '../../../services/quotation-state.service';

@Component({
  selector: 'app-step2-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step2-roles.component.html',
})
export class Step2RolesComponent {
  state = inject(QuotationStateService);
}

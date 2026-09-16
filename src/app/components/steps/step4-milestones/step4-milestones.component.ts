import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { PaymentFrequency } from '../../../models/quotation.models';

@Component({
  selector: 'app-step4-milestones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step4-milestones.component.html',
})
export class Step4MilestonesComponent {
  state = inject(QuotationStateService);

  readonly frequencies: PaymentFrequency[] = ['Weekly', 'Monthly', 'Annually'];
}

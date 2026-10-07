import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationStateService } from '../../services/quotation-state.service';
import { lineTotal } from '../../models/quotation.models';

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotation-preview.component.html',
})
export class QuotationPreviewComponent {
  state = inject(QuotationStateService);
  readonly lineTotal = lineTotal;
}

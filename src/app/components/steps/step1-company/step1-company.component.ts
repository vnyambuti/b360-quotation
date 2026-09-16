import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { LogoUploadComponent } from '../../logo-upload/logo-upload.component';

@Component({
  selector: 'app-step1-company',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoUploadComponent],
  templateUrl: './step1-company.component.html',
})
export class Step1CompanyComponent {
  state = inject(QuotationStateService);

  onLogoChange(dataUrl: string | null) {
    this.state.updateCompany({ logoDataUrl: dataUrl });
  }
}

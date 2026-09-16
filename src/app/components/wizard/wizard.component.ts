import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationStateService } from '../../services/quotation-state.service';
import { Step1CompanyComponent } from '../steps/step1-company/step1-company.component';
import { Step2RolesComponent } from '../steps/step2-roles/step2-roles.component';
import { Step3ChannelsComponent } from '../steps/step3-channels/step3-channels.component';
import { Step3DutiesComponent } from '../steps/step3-duties/step3-duties.component';
import { Step4MilestonesComponent } from '../steps/step4-milestones/step4-milestones.component';
import { QuotationPreviewComponent } from '../quotation-preview/quotation-preview.component';

interface WizardStep {
  label: string;
  isValid: () => boolean;
}

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [
    CommonModule,
    Step1CompanyComponent,
    Step2RolesComponent,
    Step3ChannelsComponent,
    Step3DutiesComponent,
    Step4MilestonesComponent,
    QuotationPreviewComponent,
  ],
  templateUrl: './wizard.component.html',
})
export class WizardComponent {
  state = inject(QuotationStateService);

  readonly currentStep = signal(0);

  readonly steps: WizardStep[] = [
    { label: 'Company & Client', isValid: () => !!this.state.company().name && !!this.state.client().name },
    { label: 'Select Roles', isValid: () => this.state.selectedRoleIds().length > 0 },
    { label: 'Channels', isValid: () => this.state.selectedChannelIds().length > 0 },
    { label: 'Duties & Pricing', isValid: () => this.state.lineItems().length > 0 },
    { label: 'Payment Cycle', isValid: () => this.state.paymentCycleValid() },
    { label: 'Review', isValid: () => true },
  ];

  readonly isLastStep = computed(() => this.currentStep() === this.steps.length - 1);
  readonly canGoNext = computed(() => this.steps[this.currentStep()].isValid());

  goTo(index: number) {
    if (index <= this.currentStep() || this.steps.slice(0, index).every((s) => s.isValid())) {
      this.currentStep.set(index);
    }
  }

  next() {
    if (this.canGoNext() && !this.isLastStep()) {
      this.currentStep.update((s) => s + 1);
    }
  }

  back() {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }
}

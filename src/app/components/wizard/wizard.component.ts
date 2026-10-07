import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationStateService } from '../../services/quotation-state.service';
import { PublicQuoteService } from '../../services/public-quote.service';
import { ConfettiService } from '../../services/confetti.service';
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
  private readonly publicQuote = inject(PublicQuoteService);
  private readonly confetti = inject(ConfettiService);

  readonly currentStep = signal(0);

  readonly steps: WizardStep[] = [
    {
      label: 'Company & Client',
      isValid: () => this.state.providerDetailsLoaded() && !!this.state.client().name,
    },
    { label: 'Select Roles', isValid: () => this.state.selectedRoleIds().length > 0 },
    { label: 'Channels', isValid: () => this.state.selectedChannelIds().length > 0 },
    { label: 'Duties & Pricing', isValid: () => this.state.lineItemsValid() },
    { label: 'Payment Cycle', isValid: () => this.state.paymentCycleValid() },
    { label: 'Review', isValid: () => true },
  ];

  readonly isLastStep = computed(() => this.currentStep() === this.steps.length - 1);
  readonly canGoNext = computed(() => this.steps[this.currentStep()].isValid());

  readonly isPublishing = computed(() => this.state.publishStatus() === 'loading');
  readonly isPublished = computed(() => this.state.publishStatus() === 'success');

  /** Publishing is a one-shot action: blocked while invalid, in flight, or already done. */
  readonly canPublish = computed(
    () => this.state.paymentCycleValid() && !this.isPublishing() && !this.isPublished(),
  );

  readonly publishLabel = computed(() => {
    if (this.isPublishing()) return 'Publishing…';
    if (this.isPublished()) return 'Quotation published';
    return 'Publish Quotation';
  });

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

  /** Posts the assembled quote to the public-quote endpoint, then celebrates if it went through. */
  publishQuote() {
    if (!this.canPublish()) return;

    this.state.startPublish();
    this.publicQuote.publish(this.state.publicQuotePayload()).subscribe({
      next: (result) => {
        this.state.succeedPublish(result);
        void this.confetti.celebrate();
      },
      error: (err: HttpErrorResponse) => this.state.failPublish(readPublishError(err)),
    });
  }
}

function readPublishError(err: HttpErrorResponse): string {
  const body = err.error as
    | { message?: string; error?: string; errors?: Record<string, string[]> }
    | null;
  const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
  if (firstFieldError) return firstFieldError;
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  if (err.status === 0) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.status === 401 || err.status === 403) {
    return 'You are not allowed to publish this quotation.';
  }
  if (err.status === 422) {
    return 'The quotation was rejected as invalid. Review the details and try again.';
  }
  return 'Something went wrong while publishing the quotation. Please try again.';
}

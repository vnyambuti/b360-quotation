import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Mock } from 'vitest';
import { WizardComponent } from './wizard.component';
import { PublicQuoteService } from '../../services/public-quote.service';
import { ProviderService } from '../../services/provider.service';
import { ConfettiService } from '../../services/confetti.service';
import { QuotationStateService } from '../../services/quotation-state.service';
import { PublicQuotePayload, PublicQuoteResult } from '../../models/public-quote.models';

const RESULT: PublicQuoteResult = {
  id: 7,
  slug: 'q-2026-482',
  publicUrl: 'https://quotes.example.com/q-2026-482',
  message: 'Quotation published.',
};

describe('WizardComponent', () => {
  let component: WizardComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<WizardComponent>>;
  let state: QuotationStateService;
  let publish: Mock<(payload: PublicQuotePayload) => Observable<PublicQuoteResult>>;
  let celebrate: Mock<() => Promise<void>>;

  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) => {
    const found = Array.from(el().querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes(label),
    );
    if (!found) throw new Error(`No button labelled "${label}".`);
    return found as HTMLButtonElement;
  };

  async function setUp(result: Observable<PublicQuoteResult>) {
    publish = vi.fn(() => result);
    celebrate = vi.fn(async () => {});

    TestBed.configureTestingModule({
      imports: [WizardComponent],
      providers: [
        { provide: PublicQuoteService, useValue: { publish } },
        { provide: ConfettiService, useValue: { celebrate } },
        {
          provide: ProviderService,
          useValue: { getProviders: () => of([]), getProvider: () => of({ data: null }) },
        },
      ],
    });

    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(QuotationStateService);
    await fixture.whenStable();
  }

  /** Seeds just enough state for the review step to be reachable and valid. */
  function seedQuote() {
    state.updateClient({ name: 'Bluewave Media' });
    state.updateCompany({ name: 'Acme Digital' });
    state.updatePaymentCycle({ frequency: 'Monthly', cycleCount: 2 });
    component.currentStep.set(5);
    fixture.detectChanges();
  }

  it('posts the current quote and celebrates once the API responds', async () => {
    await setUp(of(RESULT));
    seedQuote();

    button('Publish Quotation').click();
    await fixture.whenStable();
    fixture.detectChanges();

    const payload = publish.mock.calls[0][0];
    expect(payload.client.name).toBe('Bluewave Media');
    expect(payload.grandTotal).toBe(state.grandTotal());
    expect(payload.payments).toHaveLength(2);
    expect(typeof payload.dateIssued).toBe('string');

    expect(celebrate).toHaveBeenCalledTimes(1);
    expect(state.publishStatus()).toBe('success');
    expect(el().textContent).toContain(RESULT.publicUrl);
    expect(button('Quotation published').disabled).toBe(true);
  });

  it('ignores a second publish once the quote is live', async () => {
    await setUp(of(RESULT));
    seedQuote();

    button('Publish Quotation').click();
    await fixture.whenStable();
    component.publishQuote();
    await fixture.whenStable();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  it('reports a failure and offers a retry instead of celebrating', async () => {
    await setUp(
      throwError(
        () =>
          new HttpErrorResponse({ status: 422, error: { errors: { grandTotal: ['Too low.'] } } }),
      ),
    );
    seedQuote();

    button('Publish Quotation').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(celebrate).not.toHaveBeenCalled();
    expect(state.publishStatus()).toBe('error');
    expect(el().textContent).toContain('Too low.');
    expect(button('Retry')).toBeTruthy();
    expect(el().textContent).not.toContain(RESULT.publicUrl);
  });

  it('blocks publishing while the payment cycle is invalid', async () => {
    await setUp(of(RESULT));
    state.updateClient({ name: 'Bluewave Media' });
    state.paymentCycle.set({ frequency: 'Monthly', cycleCount: 0 });
    component.currentStep.set(5);
    fixture.detectChanges();

    expect(button('Publish Quotation').disabled).toBe(true);
    expect(publish).not.toHaveBeenCalled();
  });
});

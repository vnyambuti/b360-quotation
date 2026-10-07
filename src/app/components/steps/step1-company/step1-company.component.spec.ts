import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Step1CompanyComponent } from './step1-company.component';
import { ProviderService } from '../../../services/provider.service';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { GetProviderData, ProviderProfile } from '../../../models/provider.models';

const DIRECTORY: ProviderProfile[] = [
  { id: 1, name: 'Acme Digital', email: 'hello@acmedigital.co', phone: '254700000001' },
  { id: 2, name: 'Bluewave Media', email: 'hi@bluewave.co', phone: '254700000002' },
  { id: 3, name: 'Crestline', email: 'team@crestline.co', phone: '254700000003' },
];

const DETAIL: GetProviderData = {
  provider: DIRECTORY[0],
  titles: [
    {
      id: 5,
      key: 'social-media',
      name: 'Social Media Manager',
      description: 'Manages content',
      dutyIds: ['sm-content-calendar'],
    },
  ],
  duties: [
    {
      id: 9,
      key: 'sm-content-calendar',
      name: 'Content calendar planning',
      defaultPrice: 50000,
      interval: 'Monthly',
      titleId: 5,
      titleName: 'Social Media Manager',
      channelIds: ['instagram'],
    },
  ],
  channels: [{ id: 15, key: 'instagram', name: 'Instagram', titleIds: ['social-media'] }],
};

describe('Step1CompanyComponent', () => {
  let component: Step1CompanyComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<Step1CompanyComponent>>;
  let state: QuotationStateService;
  let getProvider: (email: string) => unknown;

  const el = () => fixture.nativeElement as HTMLElement;
  const buttons = () => Array.from(el().querySelectorAll('button'));
  const buttonLabels = () => buttons().map((b) => (b.textContent ?? '').trim());
  const clickLabel = (label: string) => {
    const target = buttons().find((b) => (b.textContent ?? '').includes(label));
    if (!target)
      throw new Error(`No button labelled "${label}". Saw: ${buttonLabels().join(' | ')}`);
    target.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    getProvider = vi.fn(() => of({ data: DETAIL }));
    TestBed.configureTestingModule({
      imports: [Step1CompanyComponent],
      providers: [
        {
          provide: ProviderService,
          useValue: { getProviders: () => of(DIRECTORY), getProvider },
        },
      ],
    });

    fixture = TestBed.createComponent(Step1CompanyComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(QuotationStateService);
    await fixture.whenStable();
  });

  it('renders one tile per provider with an initial-letter placeholder', () => {
    expect(state.providerList()).toEqual(DIRECTORY);

    const avatars = el().querySelectorAll('span.flex.h-12');
    expect(avatars.length).toBe(3);
    expect(Array.from(avatars).map((a) => a.textContent?.trim())).toEqual(['A', 'B', 'C']);

    expect(el().textContent).toContain('hello@acmedigital.co');
  });

  it('gives each provider a stable colour', () => {
    const classes = Array.from(el().querySelectorAll('span.flex.h-12')).map((a) => a.className);
    expect(classes[0]).toContain(tintForAgain('Acme Digital'));
    expect(classes[0]).not.toBe(classes[1]);
  });

  it('hides the letterhead details until the user asks for them', () => {
    expect(component.detailsOpen()).toBe(false);
    // The client + quote sections still render; only the provider letterhead is hidden.
    expect(el().querySelector('input[placeholder="Acme Consulting Ltd"]')).toBeNull();
    expect(el().querySelector('input[placeholder="Street, City, Country"]')).toBeNull();
    expect(buttonLabels().some((l) => l.includes('Edit details'))).toBe(false);
  });

  it('loads the catalog and prefills the company when a tile is picked', () => {
    el().querySelectorAll('button')[0].click();
    fixture.detectChanges();

    expect(getProvider).toHaveBeenCalledWith('hello@acmedigital.co');
    expect(state.companyLocked()).toBe(true);
    expect(state.company().name).toBe('Acme Digital');
    expect(state.roleLibrary()[0].id).toBe('social-media');

    // Still collapsed, and the picked tile is marked.
    expect(component.detailsOpen()).toBe(false);
    expect(el().textContent).toContain('Selected');
  });

  it('reveals the details panel on demand, with the name locked and address editable', async () => {
    el().querySelectorAll('button')[0].click();
    fixture.detectChanges();
    clickLabel('Edit details');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.detailsOpen()).toBe(true);

    const name = el().querySelector('input[placeholder="Acme Consulting Ltd"]') as HTMLInputElement;
    expect(name.value).toBe('Acme Digital');
    expect(name.disabled).toBe(true);

    const address = el().querySelector(
      'input[placeholder="Street, City, Country"]',
    ) as HTMLInputElement;
    expect(address.disabled).toBe(false);
  });

  it('clears the selection back to an unselected directory', () => {
    el().querySelectorAll('button')[0].click();
    fixture.detectChanges();
    component.clearSelection();
    fixture.detectChanges();

    expect(state.providerDetailsLoaded()).toBe(false);
    expect(el().textContent).not.toContain('Selected');
  });
});

/** Mirrors the component's private hash so the tint assertion is meaningful. */
function tintForAgain(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ['emerald', 'sky', 'amber', 'violet', 'rose', 'teal'][hash % 6] + '-100';
}

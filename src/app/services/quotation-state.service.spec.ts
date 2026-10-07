import { TestBed } from '@angular/core/testing';
import { QuotationStateService } from './quotation-state.service';
import { GetProviderData } from '../models/provider.models';

const SAMPLE: GetProviderData = {
  provider: { id: 1, name: 'admin', email: 'test3hunnit@gmail.com', phone: '254724000000' },
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

describe('QuotationStateService provider lookup', () => {
  let state: QuotationStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(QuotationStateService);
  });

  it('starts empty and unlocked', () => {
    expect(state.providerDetailsLoaded()).toBe(false);
    expect(state.companyLocked()).toBe(false);
    expect(state.roleLibrary()).toEqual([]);
    expect(state.channelCatalog()).toEqual([]);
  });

  it('prefills and locks the company details on a successful lookup', () => {
    state.applyProvider(SAMPLE);

    expect(state.lookupStatus()).toBe('success');
    expect(state.companyLocked()).toBe(true);
    expect(state.providerDetailsLoaded()).toBe(true);
    expect(state.company()).toMatchObject({
      name: 'admin',
      email: 'test3hunnit@gmail.com',
      phone: '254724000000',
    });
    expect(state.roleLibrary()[0].id).toBe('social-media');
    expect(state.channelCatalog()[0].id).toBe('instagram');
  });

  it('prices new line items from the duty default price and interval', () => {
    state.applyProvider(SAMPLE);
    state.toggleRole('social-media');

    expect(state.lineItems()).toEqual([
      expect.objectContaining({
        roleId: 'social-media',
        dutyId: 'sm-content-calendar',
        unitPrice: 50000,
        interval: 'Monthly',
      }),
    ]);
  });

  it('discards selections from the previous catalog on re-lookup', () => {
    state.applyProvider(SAMPLE);
    state.toggleRole('social-media');
    state.toggleChannel('instagram');
    state.updateClient({ name: 'Client' });

    state.applyProvider(SAMPLE);

    expect(state.selectedRoleIds()).toEqual([]);
    expect(state.selectedChannelIds()).toEqual([]);
    expect(state.lineItems()).toEqual([]);
    expect(state.client().name).toBe('Client');
  });

  it('keeps the company unlocked when a lookup fails', () => {
    state.startLookup(7);
    expect(state.lookupStatus()).toBe('loading');
    expect(state.pendingProviderId()).toBe(7);

    state.failLookup('No provider account matched that email. Try another one.');

    expect(state.lookupStatus()).toBe('error');
    expect(state.lookupError()).toBe('No provider account matched that email. Try another one.');
    expect(state.pendingProviderId()).toBeNull();
    expect(state.companyLocked()).toBe(false);
    expect(state.providerDetailsLoaded()).toBe(false);
  });

  it('tracks which directory tile is loading', () => {
    state.startLookup(7);
    state.applyProvider(SAMPLE);
    expect(state.pendingProviderId()).toBeNull();
  });

  it('stores the provider directory', () => {
    state.setProviderList([SAMPLE.provider]);
    expect(state.listStatus()).toBe('success');
    expect(state.providerList()).toEqual([SAMPLE.provider]);
  });

  it('reports a failed directory load', () => {
    state.failProviderList('We could not load the list of providers. Please try again.');
    expect(state.listStatus()).toBe('error');
    expect(state.providerList()).toEqual([]);
  });

  it('clears the prefilled details when the user asks to change email', () => {
    state.applyProvider(SAMPLE);
    state.updateCompany({ address: 'Somewhere' });

    state.resetProvider();

    expect(state.provider()).toBeNull();
    expect(state.lookupStatus()).toBe('idle');
    expect(state.companyLocked()).toBe(false);
    expect(state.company()).toMatchObject({ name: '', phone: '', email: '', address: 'Somewhere' });
    expect(state.roleLibrary()).toEqual([]);
  });
});

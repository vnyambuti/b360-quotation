import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { ProviderService } from '../../../services/provider.service';
import { ProviderProfile } from '../../../models/provider.models';
import { LogoUploadComponent } from '../../logo-upload/logo-upload.component';
import { shrinkDataUrl } from '../../../data/logo';

const TINTS = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];

/** Picks a stable colour per provider so the directory doesn't look uniform. */
function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** Stand-in avatar label: the first letter of the provider's name. */
function initialFor(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

@Component({
  selector: 'app-step1-company',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoUploadComponent],
  templateUrl: './step1-company.component.html',
})
export class Step1CompanyComponent implements OnInit {
  state = inject(QuotationStateService);
  private readonly providers = inject(ProviderService);

  /** The provider's letterhead fields start hidden — the tile carries the essentials. */
  readonly detailsOpen = signal(false);
  readonly skeletons = [1, 2, 3, 4];

  readonly isListLoading = computed(() => this.state.listStatus() === 'loading');

  /** Directory tiles: initial-letter placeholder plus the selected/pending flags. */
  readonly tiles = computed(() => {
    const selectedId = this.state.provider()?.id;
    const pendingId = this.state.pendingProviderId();
    return this.state.providerList().map((provider) => ({
      provider,
      initial: initialFor(provider.name),
      tint: tintFor(provider.name || ''),
      selected: provider.id === selectedId,
      pending: provider.id === pendingId,
    }));
  });

  /** The selected provider, rendered as an avatar in the summary bar. */
  readonly selectedTile = computed(() => {
    const provider = this.state.provider();
    if (!provider) return null;
    return {
      provider,
      initial: initialFor(provider.name),
      tint: tintFor(provider.name || ''),
    };
  });

  /** Summary shown once a provider is picked, so the user can see what came back. */
  readonly providerSummary = computed(() => {
    if (!this.state.provider()) return '';
    return `${this.state.roleLibrary().length} roles, ${this.state.providerDuties().length} duties, ${this.state.channelCatalog().length} channels`;
  });

  ngOnInit() {
    if (this.state.listStatus() === 'loading' || this.state.listStatus() === 'success') return;
    this.loadProviders();
  }

  loadProviders() {
    this.state.listStatus.set('loading');
    this.state.listError.set(null);
    this.providers.getProviders().subscribe({
      next: (providers) => this.state.setProviderList(providers),
      error: (err: HttpErrorResponse) => this.state.failProviderList(readListError(err)),
    });
  }

  selectProvider(provider: ProviderProfile) {
    if (this.state.provider()?.id === provider.id) {
      this.detailsOpen.set(true);
      return;
    }
    this.state.startLookup(provider.id);
    this.providers.getProvider(provider.email).subscribe({
      next: (res) => {
        if (!res?.data?.provider) {
          this.state.failLookup('No provider account matched that email. Try another one.');
          return;
        }
        this.state.applyProvider(res.data);
      },
      error: (err: HttpErrorResponse) => this.state.failLookup(readApiError(err)),
    });
  }

  clearSelection() {
    this.state.resetProvider();
    this.detailsOpen.set(false);
  }

  async onLogoChange(dataUrl: string | null) {
    if (!dataUrl) {
      this.state.updateCompany({ logoDataUrl: null });
      return;
    }
    try {
      this.state.updateCompany({ logoDataUrl: await shrinkDataUrl(dataUrl) });
    } catch {
      this.state.updateCompany({ logoDataUrl: dataUrl }); // keep the original if resizing fails
    }
  }
}

function readListError(err: HttpErrorResponse): string {
  if (err.status === 0) return "Couldn't reach the server. Check your connection and try again.";
  return 'We could not load the list of providers. Please try again.';
}

function readApiError(err: HttpErrorResponse): string {
  const body = err.error as { message?: string; error?: string } | null;
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  if (err.status === 0) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.status === 404) {
    return 'No provider account matched that email. Try another one.';
  }
  if (err.status === 422) {
    return 'That email address is not valid. Try another one.';
  }
  return 'Something went wrong while fetching your details. Please try again.';
}

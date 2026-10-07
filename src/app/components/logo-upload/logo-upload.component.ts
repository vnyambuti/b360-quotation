import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Longest edge, in pixels, of the logo we keep. Logos render tiny on the quote, so anything
 *  larger is dead weight — and base64 inflates the original by 4/3 before it is even sent. */
const MAX_EDGE = 512;

/** Ceiling on the picked file, before we shrink it. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-upload.component.html',
})
export class LogoUploadComponent {
  @Input() logoDataUrl: string | null = null;
  @Output() logoChange = new EventEmitter<string | null>();

  isDragging = false;
  error: string | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Reset first, so re-picking the same file after a Remove still fires `change`.
    input.value = '';
    void this.handleFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0] ?? null;
    void this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  removeLogo() {
    this.logoDataUrl = null;
    this.logoChange.emit(null);
  }

  private async handleFile(file: File | null) {
    this.error = null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error = 'Please upload an image file (PNG, JPG or SVG).';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.error = 'Logo must be under 2MB.';
      return;
    }

    // Vector logos are already compact, and rasterising SVG through a canvas is unreliable.
    if (file.type === 'image/svg+xml') {
      this.emit(await this.readAsDataUrl(file));
      return;
    }

    try {
      this.emit(await this.shrink(file));
    } catch {
      // Decode or canvas failed. Keep the original rather than dropping the upload.
      this.emit(await this.readAsDataUrl(file));
    }
  }

  /** Scales the image down to `MAX_EDGE` and re-encodes it as PNG. */
  private async shrink(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2d context unavailable');
      ctx.drawImage(bitmap, 0, 0, width, height);

      return canvas.toDataURL('image/png');
    } finally {
      bitmap.close();
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
      reader.readAsDataURL(file);
    });
  }

  private emit(dataUrl: string) {
    this.logoDataUrl = dataUrl;
    this.logoChange.emit(dataUrl);
  }
}
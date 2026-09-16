import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    this.handleFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.handleFile(file);
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

  private handleFile(file: File | null) {
    this.error = null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error = 'Please upload an image file (PNG, JPG, SVG).';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error = 'Logo must be under 2MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.logoDataUrl = dataUrl;
      this.logoChange.emit(dataUrl);
    };
    reader.readAsDataURL(file);
  }
}

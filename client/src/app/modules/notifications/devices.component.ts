import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceTokenAdmin } from '../../services/data.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css'
})
export class DevicesComponent {
  readonly pageSizeOptions = [10, 25, 50];
  @Input() devices: DeviceTokenAdmin[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Output() onRefresh = new EventEmitter<void>();

  pageSize = 10;
  pageIndex = 1;

  get totalPages() {
    return Math.max(1, Math.ceil(this.devices.length / this.pageSize));
  }

  get currentPage() {
    return Math.min(this.pageIndex, this.totalPages);
  }

  get paginatedDevices() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.devices.slice(start, start + this.pageSize);
  }

  setPageSize(value: string) {
    const nextSize = Number(value);
    this.pageSize = this.pageSizeOptions.includes(nextSize) ? nextSize : 10;
    this.pageIndex = 1;
  }

  goToPreviousPage() {
    this.pageIndex = Math.max(1, this.currentPage - 1);
  }

  goToNextPage() {
    this.pageIndex = Math.min(this.totalPages, this.currentPage + 1);
  }
}

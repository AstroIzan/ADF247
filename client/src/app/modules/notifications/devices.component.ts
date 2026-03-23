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
  @Input() devices: DeviceTokenAdmin[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Output() onRefresh = new EventEmitter<void>();
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

@Component({
  selector: 'app-time24',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="t24">
      <select class="t24-sel" aria-label="Hora" [disabled]="disabled" (change)="onHour($any($event.target).value)">
        <option value="" [selected]="hour === ''">--</option>
        @for (h of hours; track h) { <option [value]="h" [selected]="h === hour">{{ h }}</option> }
      </select>
      <span class="t24-sep">:</span>
      <select class="t24-sel" aria-label="Minuts" [disabled]="disabled" (change)="onMinute($any($event.target).value)">
        <option value="" [selected]="minute === ''">--</option>
        @for (m of minutes; track m) { <option [value]="m" [selected]="m === minute">{{ m }}</option> }
      </select>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; }
    .t24 { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .t24-sel { flex: 1 1 0; min-width: 0; width: 100%; box-sizing: border-box; min-height: 46px; padding: 8px 6px; font-size: 1rem; text-align: center; }
    .t24-sep { font-weight: 700; }
  `],
})
export class Time24Component {
  readonly hours = HOURS;
  readonly minutes = MINUTES;
  hour = '';
  minute = '';
  @Input() disabled = false;
  @Input() set value(raw: string | null | undefined) {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(raw ?? ''));
    this.hour = match ? match[1].padStart(2, '0') : '';
    this.minute = match ? match[2] : '';
  }
  @Output() valueChange = new EventEmitter<string>();

  onHour(hour: string) {
    this.hour = hour;
    this.valueChange.emit(hour ? `${hour}:${this.minute || '00'}` : '');
  }

  onMinute(minute: string) {
    this.minute = minute;
    this.valueChange.emit(minute ? `${this.hour || '00'}:${minute}` : '');
  }
}

@Component({
  selector: 'app-datetime24',
  standalone: true,
  imports: [Time24Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dt24">
      <input type="date" class="dt24-date" [disabled]="disabled" [value]="date" (change)="onDate($any($event.target).value)" />
      <app-time24 [disabled]="disabled" [value]="time" (valueChange)="onTime($event)" />
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; }
    .dt24 { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 8px; min-width: 0; }
    .dt24-date { width: 100%; min-width: 0; box-sizing: border-box; min-height: 46px; font-size: 1rem; }
    @media (max-width: 480px) { .dt24 { grid-template-columns: minmax(0, 1fr); } }
  `],
})
export class Datetime24Component {
  date = '';
  time = '';
  @Input() disabled = false;
  @Input() set value(raw: string | null | undefined) {
    const [date = '', time = ''] = String(raw ?? '').split('T');
    this.date = date.slice(0, 10);
    this.time = time.slice(0, 5);
  }
  @Output() valueChange = new EventEmitter<string>();

  onDate(date: string) {
    this.date = date;
    this.emit();
  }

  onTime(time: string) {
    this.time = time;
    this.emit();
  }

  private emit() {
    this.valueChange.emit(this.date ? `${this.date}T${this.time || '00:00'}` : '');
  }
}

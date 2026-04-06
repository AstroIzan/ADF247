import { Component, ElementRef, NgZone, ViewChild, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService, LogSearchItem, LogSearchResponse } from '../../services/data.service';
import { LogsAccessService } from '../../services/logs-access.service';

type LogsIndex = 'applogs' | 'accesslogs';
type LogsLevel = 'all' | 'info' | 'warn' | 'error';

type FieldStat = {
  name: string;
  count: number;
  kind: string;
  sample: string;
};

type HistogramBucket = {
  key: string;
  label: string;
  count: number;
  heightPct: number;
  startMs: number;
  endMs: number;
  showLabel: boolean;
};

type ExpandedFieldEntry = {
  field: string;
  value: string;
};

type SummaryEntry = {
  label: string;
  value: string;
};

type HistogramTick = {
  value: number;
  label: string;
};

type HistogramXAxisTick = {
  key: string;
  label: string;
  leftPct: number;
};

type HistogramScale = {
  stepSize: number;
  max: number;
  steps: number;
};

type HistogramHoverPosition = {
  x: number;
  y: number;
};

const PINNED_FIELDS_KEY = 'logs.pinnedFields.v1';
const DEFAULT_PINNED_FIELDS = ['service', 'environment', 'level', 'message', 'path', 'statusCode'];
const MINUTE_MS = 60 * 1000;
const DEFAULT_HISTOGRAM_GROUP_MINUTES = 5;
const HISTOGRAM_GROUP_OPTIONS = [1, 5, 10, 15, 30, 60] as const;
const HISTOGRAM_MIN_BUCKET_PIXEL_WIDTH = 14;
const HISTOGRAM_BUCKET_GAP_PX = 4;
const HISTOGRAM_FALLBACK_WIDTH_PX = 900;
const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_MAX_ENTRIES = 30;

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class LogsComponent {
  readonly logs = signal<LogSearchItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly index = signal<LogsIndex>('applogs');
  readonly level = signal<LogsLevel>('all');
  readonly source = signal('');
  readonly query = signal('');
  private queryDraftValue = '';
  readonly from = signal(this.toDateTimeLocal(new Date(Date.now() - 12 * 60 * 60 * 1000)));
  readonly to = signal(this.toDateTimeLocal(new Date()));
  readonly offset = signal(0);
  readonly hasMore = signal(false);
  readonly nextOffset = signal<number | null>(null);
  readonly timePreset = signal<'1h' | '12h' | '24h' | '7d' | 'custom'>('12h');
  readonly histogramGroupMinutes = signal(DEFAULT_HISTOGRAM_GROUP_MINUTES);
  readonly histogramPlotWidthPx = signal(HISTOGRAM_FALLBACK_WIDTH_PX);

  readonly selectedLog = signal<LogSearchItem | null>(null);
  readonly expandedRowTimestamp = signal<string | null>(null);
  readonly fieldSearch = signal('');
  readonly pinnedSummaryFields = signal<string[]>(this.readPinnedFields());
  readonly hoveredHistogramBucket = signal<HistogramBucket | null>(null);
  readonly hoveredHistogramPosition = signal<HistogramHoverPosition | null>(null);
  private readonly searchCache = new Map<string, { expiresAt: number; response: LogSearchResponse }>();
  private histogramResizeObserver: ResizeObserver | null = null;
  private autoFiltersInitialized = false;
  private autoFiltersDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private queryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private histogramHoverRafId: number | null = null;
  private pendingHistogramHoverPosition: HistogramHoverPosition | null = null;
  private activeSearchSubscription: Subscription | null = null;
  private loadRequestSeq = 0;
  private queryInputNative: HTMLInputElement | null = null;
  private queryInputListener: ((event: Event) => void) | null = null;
  private readonly logObjectIds = new WeakMap<LogSearchItem, string>();
  private nextLogObjectId = 1;

  @ViewChild('histBarsEl')
  set histBarsElement(element: ElementRef<HTMLElement> | undefined) {
    this.histogramResizeObserver?.disconnect();
    this.histogramResizeObserver = null;

    if (!element?.nativeElement) {
      return;
    }

    const target = element.nativeElement;
    this.histogramPlotWidthPx.set(Math.max(1, Math.round(target.clientWidth || HISTOGRAM_FALLBACK_WIDTH_PX)));
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry ? Math.round(entry.contentRect.width) : Math.round(target.clientWidth);
      if (Number.isFinite(width) && width > 0) {
        this.histogramPlotWidthPx.set(width);
      }
    });
    observer.observe(target);
    this.histogramResizeObserver = observer;
  }

  @ViewChild('queryInputEl')
  set queryInputElement(element: ElementRef<HTMLInputElement> | undefined) {
    if (this.queryInputNative && this.queryInputListener) {
      this.queryInputNative.removeEventListener('input', this.queryInputListener);
    }

    this.queryInputNative = element?.nativeElement || null;
    if (!this.queryInputNative) {
      this.queryInputListener = null;
      return;
    }

    this.queryInputNative.value = this.queryDraftValue;

    this.queryInputListener = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const next = String(target?.value || '');
      this.queryDraftValue = next;

      if (this.queryDebounceTimer != null) {
        clearTimeout(this.queryDebounceTimer);
      }

      this.queryDebounceTimer = setTimeout(() => {
        this.queryDebounceTimer = null;
        if (this.query() === next) {
          return;
        }

        this.ngZone.run(() => {
          this.query.set(next);
        });
      }, 700);
    };

    this.ngZone.runOutsideAngular(() => {
      this.queryInputNative?.addEventListener('input', this.queryInputListener as (event: Event) => void);
    });
  }

  readonly histogramBucketCapacity = computed(() => {
    const width = this.histogramPlotWidthPx();
    const slot = HISTOGRAM_MIN_BUCKET_PIXEL_WIDTH + HISTOGRAM_BUCKET_GAP_PX;
    return Math.max(8, Math.floor((width + HISTOGRAM_BUCKET_GAP_PX) / slot));
  });

  readonly availableHistogramGroupOptions = computed<number[]>(() => {
    const fromDate = this.parseLocalDateTimeInput(this.from());
    const toDate = this.parseLocalDateTimeInput(this.to());
    const rangeMinutes = this.resolveRangeMinutes(fromDate, toDate);
    const capacity = this.histogramBucketCapacity();

    const options = HISTOGRAM_GROUP_OPTIONS.filter((minutes) => Math.ceil(rangeMinutes / minutes) <= capacity);
    return options.length ? [...options] : [60];
  });

  readonly levelStats = computed(() => {
    const counters: Record<string, number> = { info: 0, warn: 0, error: 0 };
    for (const log of this.logs()) {
      const key = String(log.level || 'info').toLowerCase();
      if (key in counters) {
        counters[key] += 1;
      }
    }
    return counters;
  });

  readonly topServices = computed(() => this.aggregateTop(this.logs().map((log) => log.service || 'unknown')));
  readonly topSources = computed(() => this.aggregateTop(this.logs().map((log) => log.source || 'unknown')));
  readonly topPaths = computed(() => this.aggregateTop(this.logs().map((log) => log.path || 'unknown')));

  readonly fieldStats = computed<FieldStat[]>(() => {
    const counters = new Map<string, number>();
    const sampleByField = new Map<string, unknown>();

    for (const log of this.logs()) {
      for (const [key, value] of Object.entries(log)) {
        if (key === 'context') {
          continue;
        }

        if (value === null || value === undefined || value === '') {
          continue;
        }

        counters.set(key, (counters.get(key) || 0) + 1);
        if (!sampleByField.has(key)) {
          sampleByField.set(key, value);
        }
      }

      if (log.context && typeof log.context === 'object') {
        for (const [ctxKey, ctxValue] of Object.entries(log.context)) {
          if (ctxValue === null || ctxValue === undefined || ctxValue === '') {
            continue;
          }

          const fullName = `context.${ctxKey}`;
          counters.set(fullName, (counters.get(fullName) || 0) + 1);
          if (!sampleByField.has(fullName)) {
            sampleByField.set(fullName, ctxValue);
          }
        }
      }
    }

    return Array.from(counters.entries())
      .map(([name, count]) => {
        const sample = sampleByField.get(name);
        return {
          name,
          count,
          kind: this.detectFieldKind(sample),
          sample: this.stringifySample(sample),
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  readonly popularFields = computed(() => this.fieldStats().slice(0, 8));

  readonly filteredFields = computed(() => {
    const search = this.fieldSearch().trim().toLowerCase();
    if (!search) {
      return this.fieldStats();
    }

    return this.fieldStats().filter((field) => field.name.toLowerCase().includes(search));
  });

  readonly histogramBuckets = computed<HistogramBucket[]>(() => {
    const points = this.logs()
      .map((log) => this.resolveTimestampMs(log))
      .filter((value): value is number => Number.isFinite(value));

    const fromDate = this.parseLocalDateTimeInput(this.from());
    const toDate = this.parseLocalDateTimeInput(this.to());
    const explicitRangeValid = Boolean(fromDate && toDate && toDate.getTime() >= fromDate.getTime());

    if (!points.length && !explicitRangeValid) {
      return [];
    }

    const minSource = explicitRangeValid ? (fromDate as Date).getTime() : Math.min(...points);
    const maxSource = explicitRangeValid ? (toDate as Date).getTime() : Math.max(...points);
    const rangeMsSource = Math.max(this.getHistogramStepMs(), maxSource - minSource + 1);
    const step = this.resolveHistogramStepMs(rangeMsSource);
    const min = Math.floor(minSource / step) * step;
    const max = (Math.ceil((maxSource + 1) / step) * step) - 1;
    const rangeMs = Math.max(step, max - min + 1);
    const bucketCount = Math.max(1, Math.ceil(rangeMs / step));

    const buckets = new Array(bucketCount).fill(0);
    for (const point of points) {
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((point - min) / step)));
      buckets[index] += 1;
    }

    const maxCount = Math.max(...buckets);
    const scale = this.getHistogramScale(maxCount);
    const labelStep = Math.max(1, Math.ceil(bucketCount / 10));
    const spanMs = Math.max(0, max - min);
    const formatLabel = spanMs > (24 * 60 * 60 * 1000)
      ? (value: number) => this.formatHistogramDateLabel(value, true)
      : (value: number) => this.formatHistogramDateLabel(value, false);

    return buckets.map((count, index) => {
      const start = min + (index * step);
      const end = start + step - 1;
      const label = formatLabel(start);
      return {
        key: `${start}-${index}`,
        label,
        count,
        heightPct: count <= 0 ? 0 : (scale.max > 0 ? (count / scale.max) * 100 : 0),
        startMs: start,
        endMs: end,
        showLabel: index % labelStep === 0 || index === bucketCount - 1,
      };
    });
  });

  readonly histogramYAxisTicks = computed<HistogramTick[]>(() => {
    const buckets = this.histogramBuckets();
    if (!buckets.length) {
      return [];
    }

    const max = Math.max(...buckets.map((bucket) => bucket.count));
    if (max <= 0) {
      return [];
    }

    const scale = this.getHistogramScale(max);
    const ticks: HistogramTick[] = [];

    for (let i = scale.steps; i >= 0; i -= 1) {
      const value = scale.stepSize * i;
      ticks.push({
        value,
        label: this.formatHistogramTick(value),
      });
    }

    return ticks;
  });

  readonly histogramXAxisTicks = computed<HistogramXAxisTick[]>(() => {
    const buckets = this.histogramBuckets();
    if (!buckets.length) {
      return [];
    }

    const first = buckets[0];
    const last = buckets[buckets.length - 1];
    const includeDay = (last.endMs - first.startMs) > (24 * 60 * 60 * 1000);
    const desiredTickCount = 8;
    const every = Math.max(1, Math.ceil((buckets.length - 1) / Math.max(1, desiredTickCount - 1)));
    const ticks: HistogramXAxisTick[] = [];

    for (let i = 0; i < buckets.length; i += every) {
      const bucket = buckets[i];
      const leftPct = buckets.length === 1 ? 0 : (i * 100) / (buckets.length - 1);
      ticks.push({
        key: `x-${bucket.startMs}-${i}`,
        label: this.formatHistogramDateLabel(bucket.startMs, includeDay),
        leftPct,
      });
    }

    if (ticks[ticks.length - 1]?.leftPct !== 100) {
      ticks.push({
        key: `x-${last.startMs}-last`,
        label: this.formatHistogramDateLabel(last.startMs, includeDay),
        leftPct: 100,
      });
    }

    return ticks;
  });

  readonly hoveredHistogramBucketLabel = computed(() => {
    const bucket = this.hoveredHistogramBucket();
    if (!bucket) {
      return '';
    }

    return `${bucket.label} · ${this.formatHistogramTick(bucket.count)} registres`;
  });

  readonly activeFilterChips = computed(() => {
    const chips: { id: string; label: string }[] = [];

    if (this.level() !== 'all') {
      chips.push({ id: 'level', label: `level:${this.level()}` });
    }

    if (this.source().trim()) {
      chips.push({ id: 'source', label: `source:${this.source().trim()}` });
    }

    if (this.query().trim()) {
      chips.push({ id: 'query', label: this.query().trim() });
    }

    if (this.timePreset() === 'custom') {
      chips.push({ id: 'time', label: 'rang: custom' });
    }

    return chips;
  });

  constructor(
    private dataService: DataService,
    public logsAccessService: LogsAccessService,
    private ngZone: NgZone,
  ) {
    this.queryDraftValue = this.query();

    effect(() => {
      const allowed = this.availableHistogramGroupOptions();
      const current = this.histogramGroupMinutes();
      if (!allowed.includes(current)) {
        this.histogramGroupMinutes.set(allowed[0] || DEFAULT_HISTOGRAM_GROUP_MINUTES);
      }
    });

    effect(() => {
      const snapshot = {
        index: this.index(),
        level: this.level(),
        source: this.source().trim(),
        query: this.query().trim(),
        from: this.from(),
        to: this.to(),
      };

      if (!this.autoFiltersInitialized) {
        this.autoFiltersInitialized = true;
        return;
      }

      void snapshot;
      this.scheduleAutoFiltersReload();
    });

    this.logsAccessService.refresh();
    this.loadLogs();
  }

  get selectedColumnsLabel(): string {
    const fields = this.pinnedSummaryFields().map((field) => this.getSummaryFieldLabel(field));
    if (!fields.length) {
      return 'Sense camps fixats';
    }

    if (fields.length <= 3) {
      return fields.join(' · ');
    }

    return `${fields[0]} · ${fields[1]} · +${fields.length - 2}`;
  }

  get pageLabel(): string {
    const from = this.total() === 0 ? 0 : this.offset() + 1;
    const to = Math.min(this.total(), this.offset() + this.logs().length);
    return `${from}-${to} de ${this.total()}`;
  }

  private aggregateTop(values: string[]) {
    const map = new Map<string, number>();
    for (const value of values) {
      map.set(value, (map.get(value) || 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));
  }

  onIndexChange(value: string) {
    this.index.set(value === 'accesslogs' ? 'accesslogs' : 'applogs');
  }

  onLevelChange(value: string) {
    if (value === 'info' || value === 'warn' || value === 'error') {
      this.level.set(value);
      return;
    }
    this.level.set('all');
  }

  clearFilters() {
    this.timePreset.set('12h');
    this.level.set('all');
    this.source.set('');
    if (this.queryDebounceTimer != null) {
      clearTimeout(this.queryDebounceTimer);
      this.queryDebounceTimer = null;
    }
    this.query.set('');
    this.setQueryDraftValue('');
    this.from.set(this.toDateTimeLocal(new Date(Date.now() - 12 * 60 * 60 * 1000)));
    this.to.set(this.toDateTimeLocal(new Date()));
    this.offset.set(0);
    this.hasMore.set(false);
    this.nextOffset.set(null);
  }

  setPreset(preset: '1h' | '12h' | '24h' | '7d' | 'custom') {
    this.timePreset.set(preset);

    if (preset === 'custom') {
      return;
    }

    const now = new Date();
    const offsetByPreset: Record<'1h' | '12h' | '24h' | '7d', number> = {
      '1h': 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const fromDate = new Date(now.getTime() - offsetByPreset[preset]);
    this.from.set(this.toDateTimeLocal(fromDate));
    this.to.set(this.toDateTimeLocal(now));
  }

  onCustomDateChanged() {
    this.timePreset.set('custom');
  }

  onHistogramGroupMinutesChange(value: unknown) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      this.histogramGroupMinutes.set(DEFAULT_HISTOGRAM_GROUP_MINUTES);
      return;
    }

    const normalized = Math.max(1, Math.floor(next));
    const allowed = this.availableHistogramGroupOptions();
    if (allowed.includes(normalized)) {
      this.histogramGroupMinutes.set(normalized);
      return;
    }

    const fallback = allowed.find((option) => option >= normalized) || allowed[allowed.length - 1] || DEFAULT_HISTOGRAM_GROUP_MINUTES;
    this.histogramGroupMinutes.set(fallback);
  }

  goToPreviousPage() {
    if (this.offset() <= 0) {
      return;
    }

    const pageStep = Math.max(1, this.logs().length || this.total() || 1);
    this.offset.set(Math.max(0, this.offset() - pageStep));
    this.loadLogs();
  }

  goToNextPage() {
    if (!this.hasMore() || this.nextOffset() == null) {
      return;
    }

    this.offset.set(this.nextOffset() || 0);
    this.loadLogs();
  }

  loadLogs(options?: { resetOffset?: boolean }) {
    if (options?.resetOffset) {
      this.offset.set(0);
    }

    const request = {
      index: this.index(),
      level: this.level(),
      source: this.source(),
      q: this.query(),
      from: this.toApiIso(this.from()),
      to: this.toApiIso(this.to()),
      offset: this.offset(),
    };

    const requestKey = this.getSearchRequestKey(request);
    const cached = this.getCachedSearchResponse(requestKey);
    if (cached) {
      this.applySearchResponse(cached);
      return;
    }

    this.activeSearchSubscription?.unsubscribe();
    this.activeSearchSubscription = null;

    const requestSeq = ++this.loadRequestSeq;
    this.loading.set(true);
    this.error.set('');

    this.activeSearchSubscription = this.dataService.searchLogs(request).subscribe({
      next: (response) => {
        if (requestSeq !== this.loadRequestSeq) {
          return;
        }

        this.setCachedSearchResponse(requestKey, response);
        this.applySearchResponse(response);
        this.activeSearchSubscription = null;
      },
      error: (err) => {
        if (requestSeq !== this.loadRequestSeq) {
          return;
        }

        this.logs.set([]);
        this.total.set(0);
        this.offset.set(0);
        this.hasMore.set(false);
        this.nextOffset.set(null);
        this.selectedLog.set(null);
        this.error.set(err.message || 'No s\'ha pogut carregar el visor de logs.');
        this.loading.set(false);
        this.activeSearchSubscription = null;
      },
    });
  }

  selectLog(log: LogSearchItem) {
    this.selectedLog.set(log);
  }

  toggleRowDetails(log: LogSearchItem) {
    const rowId = this.getLogId(log);
    if (this.expandedRowTimestamp() === rowId) {
      this.expandedRowTimestamp.set(null);
      return;
    }

    this.expandedRowTimestamp.set(rowId);
    this.selectedLog.set(log);
  }

  isRowExpanded(log: LogSearchItem): boolean {
    return this.expandedRowTimestamp() === this.getLogId(log);
  }

  getLogId(log: LogSearchItem): string {
    const existing = this.logObjectIds.get(log);
    if (existing) {
      return existing;
    }

    const ts = log.timestamp || log.serverTimestamp || log.clientTimestamp || 'no-ts';
    const base = `${ts}-${log.service || 'svc'}-${log.level || 'info'}`;
    const id = `${base}-${this.nextLogObjectId++}`;
    this.logObjectIds.set(log, id);
    return id;
  }

  getRowTimestampLabel(log: LogSearchItem): string {
    const date = this.resolveTimestampDate(log);
    if (!date) {
      return '-';
    }

    return date.toLocaleString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  getRowSummaryEntries(log: LogSearchItem): SummaryEntry[] {
    const parts: SummaryEntry[] = [];

    for (const field of this.pinnedSummaryFields()) {
      const value = this.readFieldValue(log, field);
      if (value == null || value === '') {
        continue;
      }

      parts.push({
        label: this.getSummaryFieldLabel(field),
        value: field === 'message'
          ? this.truncateSummaryMessage(this.formatSummaryValue(value))
          : this.formatSummaryValue(value),
      });
    }

    if (!parts.length && log.message) {
      return [{ label: 'message', value: String(log.message) }];
    }

    return parts;
  }

  readFieldValue(log: LogSearchItem, fieldName: string): unknown {
    if (fieldName.startsWith('context.')) {
      const key = fieldName.slice('context.'.length);
      return log.context?.[key];
    }

    return (log as unknown as Record<string, unknown>)[fieldName];
  }

  togglePinnedField(fieldName: string) {
    const current = new Set(this.pinnedSummaryFields());
    if (current.has(fieldName)) {
      current.delete(fieldName);
    } else {
      current.add(fieldName);
    }

    const next = Array.from(current).slice(0, 12);
    this.pinnedSummaryFields.set(next);
    this.writePinnedFields(next);
  }

  isPinnedField(fieldName: string): boolean {
    return this.pinnedSummaryFields().includes(fieldName);
  }

  appendFieldToQuery(fieldName: string) {
    const token = `${fieldName}:`;
    const current = this.queryDraftValue.trim();
    if (!current) {
      this.setQueryDraftValue(token);
      this.query.set(token);
      return;
    }

    if (current.includes(token)) {
      return;
    }

    const next = `${current} ${token}`.trim();
    this.setQueryDraftValue(next);
    this.query.set(next);
  }

  removeFilterChip(chipId: string) {
    if (chipId === 'level') {
      this.level.set('all');
    }

    if (chipId === 'source') {
      this.source.set('');
    }

    if (chipId === 'query') {
      if (this.queryDebounceTimer != null) {
        clearTimeout(this.queryDebounceTimer);
        this.queryDebounceTimer = null;
      }
      this.query.set('');
      this.setQueryDraftValue('');
    }

    if (chipId === 'time') {
      this.setPreset('12h');
    }
  }

  onHistogramBucketEnter(bucket: HistogramBucket, event: MouseEvent) {
    if (bucket.count <= 0) {
      this.hoveredHistogramBucket.set(null);
      this.hoveredHistogramPosition.set(null);
      return;
    }

    this.hoveredHistogramBucket.set(bucket);
    this.scheduleHistogramHoverPosition(this.resolveHistogramPopoverPosition(event));
  }

  onHistogramBucketMove(bucket: HistogramBucket, event: MouseEvent) {
    if (bucket.count <= 0) {
      return;
    }

    if (this.hoveredHistogramBucket()?.key !== bucket.key) {
      this.hoveredHistogramBucket.set(bucket);
    }

    this.scheduleHistogramHoverPosition(this.resolveHistogramPopoverPosition(event));
  }

  onHistogramBucketLeave(event: MouseEvent) {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget?.closest('.hist-mini-pop')) {
      return;
    }

    this.hoveredHistogramBucket.set(null);
    this.pendingHistogramHoverPosition = null;
    if (this.histogramHoverRafId != null) {
      cancelAnimationFrame(this.histogramHoverRafId);
      this.histogramHoverRafId = null;
    }
    this.hoveredHistogramPosition.set(null);
  }

  onHistogramPopoverLeave() {
    this.hoveredHistogramBucket.set(null);
    this.pendingHistogramHoverPosition = null;
    if (this.histogramHoverRafId != null) {
      cancelAnimationFrame(this.histogramHoverRafId);
      this.histogramHoverRafId = null;
    }
    this.hoveredHistogramPosition.set(null);
  }

  onHistogramBucketClick(bucket: HistogramBucket) {
    if (bucket.count <= 0) {
      return;
    }

    const range = this.resolveBucketObservedRange(bucket);
    const nextFrom = this.toDateTimeLocalFloorMinute(new Date(range.fromMs));
    const nextTo = this.toDateTimeLocalCeilMinute(new Date(range.toMs));

    if (this.timePreset() === 'custom' && this.from() === nextFrom && this.to() === nextTo) {
      return;
    }

    this.timePreset.set('custom');
    this.from.set(nextFrom);
    this.to.set(nextTo);
    this.offset.set(0);
    this.loadLogs({ resetOffset: true });
  }

  isHistogramBucketHovered(bucket: HistogramBucket): boolean {
    return this.hoveredHistogramBucket()?.key === bucket.key;
  }

  getTimeWindowLabel(): string {
    const from = this.from();
    const to = this.to();
    if (!from || !to) {
      return 'Sense finestra temporal';
    }

    const fromDate = this.parseLocalDateTimeInput(from);
    const toDate = this.parseLocalDateTimeInput(to);
    if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return 'Finestra temporal no valida';
    }

    return `${fromDate.toLocaleString('ca-ES')} - ${toDate.toLocaleString('ca-ES')}`;
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.logs(), null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `logs-${this.index()}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
  }

  exportCsv() {
    const headers = ['timestamp', 'index', 'level', 'service', 'source', 'message', 'path', 'statusCode', 'durationMs', 'ip'];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = this.logs().map((log) => {
      const timestamp = log.timestamp || log.serverTimestamp || log.clientTimestamp || '';
      return [
        timestamp,
        log.index,
        log.level,
        log.service,
        log.source || '',
        log.message || '',
        log.path || '',
        log.statusCode ?? '',
        log.durationMs ?? '',
        log.ip || '',
      ].map(escape).join(',');
    });

    const csv = `${headers.join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `logs-${this.index()}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`);
  }

  formatLogJson(log: LogSearchItem | null): string {
    if (!log) {
      return '';
    }

    return JSON.stringify(log, null, 2);
  }

  getExpandedEntries(log: LogSearchItem): ExpandedFieldEntry[] {
    const preferredOrder = [
      'index',
      'timestamp',
      'serverTimestamp',
      'clientTimestamp',
      'level',
      'service',
      'source',
      'message',
      'path',
      'method',
      'statusCode',
      'durationMs',
      'ip',
      'userAgent',
      'userId',
    ];

    const rows: ExpandedFieldEntry[] = [];
    const used = new Set<string>();

    for (const key of preferredOrder) {
      const value = this.readFieldValue(log, key);
      if (value === undefined) {
        continue;
      }

      rows.push({ field: key, value: this.formatExpandedValue(value) });
      used.add(key);
    }

    for (const [key, value] of Object.entries(log)) {
      if (used.has(key) || key === 'context') {
        continue;
      }

      rows.push({ field: key, value: this.formatExpandedValue(value) });
    }

    if (log.context && typeof log.context === 'object') {
      for (const [ctxKey, ctxValue] of Object.entries(log.context)) {
        rows.push({ field: `context.${ctxKey}`, value: this.formatExpandedValue(ctxValue) });
      }
    }

    return rows;
  }

  trackExpandedField(_: number, entry: ExpandedFieldEntry): string {
    return entry.field;
  }

  private resolveTimestampDate(log: LogSearchItem): Date | null {
    const raw = log.timestamp || log.serverTimestamp || log.clientTimestamp;
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private resolveTimestampMs(log: LogSearchItem): number | null {
    const date = this.resolveTimestampDate(log);
    return date ? date.getTime() : null;
  }

  private toDateTimeLocal(date: Date): string {
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
    return local.toISOString().slice(0, 16);
  }

  private toDateTimeLocalFloorMinute(date: Date): string {
    const next = new Date(date);
    next.setSeconds(0, 0);
    return this.toDateTimeLocal(next);
  }

  private toDateTimeLocalCeilMinute(date: Date): string {
    const next = new Date(date);
    if (next.getSeconds() > 0 || next.getMilliseconds() > 0) {
      next.setMinutes(next.getMinutes() + 1);
    }
    next.setSeconds(0, 0);
    return this.toDateTimeLocal(next);
  }

  private parseLocalDateTimeInput(value: string): Date | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);

    const parsed = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toApiIso(value: string): string | undefined {
    const parsed = this.parseLocalDateTimeInput(value);
    return parsed ? parsed.toISOString() : undefined;
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private readPinnedFields(): string[] {
    try {
      const raw = localStorage.getItem(PINNED_FIELDS_KEY);
      if (!raw) {
        return [...DEFAULT_PINNED_FIELDS];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [...DEFAULT_PINNED_FIELDS];
      }

      const clean = parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
      return clean.length ? clean.slice(0, 12) : [...DEFAULT_PINNED_FIELDS];
    } catch {
      return [...DEFAULT_PINNED_FIELDS];
    }
  }

  private writePinnedFields(items: string[]) {
    localStorage.setItem(PINNED_FIELDS_KEY, JSON.stringify(items));
  }

  private detectFieldKind(value: unknown): string {
    if (value == null) {
      return 'unknown';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (value instanceof Date) {
      return 'date';
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return 'date';
      }
      return 'string';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'object') {
      return 'object';
    }

    return 'unknown';
  }

  private stringifySample(value: unknown): string {
    if (value == null) {
      return '-';
    }

    if (typeof value === 'string') {
      return value.length > 36 ? `${value.slice(0, 33)}...` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return `array(${value.length})`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      return keys.length ? `{${keys.slice(0, 2).join(', ')}}` : '{}';
    }

    return String(value);
  }

  private formatExpandedValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private getSummaryFieldLabel(fieldName: string): string {
    if (fieldName === 'level') {
      return 'log.level';
    }

    if (fieldName === 'service') {
      return 'application';
    }

    return fieldName;
  }

  private formatSummaryValue(value: unknown): string {
    if (value == null) {
      return '-';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private truncateSummaryMessage(value: string): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= 220) {
      return normalized;
    }

    return `${normalized.slice(0, 217)}...`;
  }

  formatHistogramCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  private formatHistogramTick(value: number): string {
    return this.formatHistogramCount(value);
  }

  private getHistogramScale(maxValue: number): HistogramScale {
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      return { stepSize: 5, max: 25, steps: 5 };
    }

    const steps = 5;
    const stepSize = Math.max(5, Math.ceil(maxValue / steps / 5) * 5);
    return {
      stepSize,
      max: stepSize * steps,
      steps,
    };
  }

  private resolveHistogramStepMs(rangeMs: number): number {
    return Math.max(MINUTE_MS, this.getHistogramStepMs());
  }

  private getHistogramStepMs(): number {
    return this.histogramGroupMinutes() * MINUTE_MS;
  }

  private resolveRangeMinutes(fromDate: Date | null, toDate: Date | null): number {
    if (!fromDate || !toDate) {
      return 12 * 60;
    }

    const diffMs = Math.max(0, toDate.getTime() - fromDate.getTime());
    return Math.max(1, Math.ceil(diffMs / MINUTE_MS));
  }

  private formatHistogramDateLabel(timestampMs: number, includeDay: boolean): string {
    const date = new Date(timestampMs);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    if (!includeDay) {
      return `${hh}:${mm}`;
    }

    const dd = String(date.getDate()).padStart(2, '0');
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mo} ${hh}:${mm}`;
  }

  private resolveBucketObservedRange(bucket: HistogramBucket): { fromMs: number; toMs: number } {
    let minMs = Number.POSITIVE_INFINITY;
    let maxMs = Number.NEGATIVE_INFINITY;

    for (const log of this.logs()) {
      const ts = this.resolveTimestampMs(log);
      if (ts == null || ts < bucket.startMs || ts > bucket.endMs) {
        continue;
      }

      if (ts < minMs) {
        minMs = ts;
      }
      if (ts > maxMs) {
        maxMs = ts;
      }
    }

    if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
      return { fromMs: bucket.startMs, toMs: bucket.endMs };
    }

    return { fromMs: minMs, toMs: maxMs };
  }

  private resolveHistogramPopoverPosition(event: MouseEvent): HistogramHoverPosition {
    const tooltipWidth = 210;
    const tooltipHeight = 64;
    const margin = 12;
    const padding = 8;

    let x = event.clientX + margin;
    let y = event.clientY - tooltipHeight - margin;

    if (x + tooltipWidth > window.innerWidth - padding) {
      x = event.clientX - tooltipWidth - margin;
    }

    if (x < padding) {
      x = padding;
    }

    if (y < padding) {
      y = event.clientY + margin;
    }

    if (y + tooltipHeight > window.innerHeight - padding) {
      y = Math.max(padding, window.innerHeight - tooltipHeight - padding);
    }

    return { x, y };
  }

  private scheduleAutoFiltersReload() {
    if (this.autoFiltersDebounceTimer != null) {
      clearTimeout(this.autoFiltersDebounceTimer);
    }

    this.autoFiltersDebounceTimer = setTimeout(() => {
      this.autoFiltersDebounceTimer = null;
      this.loadLogs({ resetOffset: true });
    }, 450);
  }

  private setQueryDraftValue(value: string) {
    this.queryDraftValue = String(value || '');
    if (!this.queryInputNative) {
      return;
    }

    if (this.queryInputNative.value !== this.queryDraftValue) {
      this.queryInputNative.value = this.queryDraftValue;
    }
  }

  private scheduleHistogramHoverPosition(next: HistogramHoverPosition) {
    this.pendingHistogramHoverPosition = next;

    if (this.histogramHoverRafId != null) {
      return;
    }

    this.histogramHoverRafId = requestAnimationFrame(() => {
      this.histogramHoverRafId = null;
      const pending = this.pendingHistogramHoverPosition;
      this.pendingHistogramHoverPosition = null;
      if (!pending) {
        return;
      }

      const current = this.hoveredHistogramPosition();
      if (current && Math.abs(current.x - pending.x) < 1 && Math.abs(current.y - pending.y) < 1) {
        return;
      }

      this.hoveredHistogramPosition.set(pending);
    });
  }

  private applySearchResponse(response: LogSearchResponse) {
    this.logs.set(Array.isArray(response?.items) ? response.items : []);
    this.total.set(Number(response?.total || 0));
    this.offset.set(Number(response?.offset || 0));
    this.hasMore.set(Boolean(response?.hasMore));
    this.nextOffset.set(typeof response?.nextOffset === 'number' ? response.nextOffset : null);
    this.selectedLog.set(this.logs().length > 0 ? this.logs()[0] : null);
    this.expandedRowTimestamp.set(null);
    this.loading.set(false);
  }

  ngOnDestroy() {
    this.histogramResizeObserver?.disconnect();
    this.histogramResizeObserver = null;

    if (this.queryInputNative && this.queryInputListener) {
      this.queryInputNative.removeEventListener('input', this.queryInputListener);
    }
    this.queryInputListener = null;
    this.queryInputNative = null;

    this.activeSearchSubscription?.unsubscribe();
    this.activeSearchSubscription = null;

    if (this.autoFiltersDebounceTimer != null) {
      clearTimeout(this.autoFiltersDebounceTimer);
      this.autoFiltersDebounceTimer = null;
    }

    if (this.queryDebounceTimer != null) {
      clearTimeout(this.queryDebounceTimer);
      this.queryDebounceTimer = null;
    }

    if (this.histogramHoverRafId != null) {
      cancelAnimationFrame(this.histogramHoverRafId);
      this.histogramHoverRafId = null;
    }
  }

  private getSearchRequestKey(request: {
    index: 'applogs' | 'accesslogs';
    level?: 'info' | 'warn' | 'error' | 'all';
    source?: string;
    q?: string;
    from?: string;
    to?: string;
    offset?: number;
    limit?: number;
  }): string {
    return JSON.stringify({
      index: request.index,
      level: request.level || 'all',
      source: request.source || '',
      q: request.q || '',
      from: request.from || '',
      to: request.to || '',
      offset: request.offset || 0,
      limit: request.limit || '',
    });
  }

  private getCachedSearchResponse(key: string): LogSearchResponse | null {
    const cached = this.searchCache.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.searchCache.delete(key);
      return null;
    }

    return cached.response;
  }

  private setCachedSearchResponse(key: string, response: LogSearchResponse) {
    this.searchCache.set(key, {
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
      response,
    });

    if (this.searchCache.size <= SEARCH_CACHE_MAX_ENTRIES) {
      return;
    }

    const firstKey = this.searchCache.keys().next().value;
    if (firstKey) {
      this.searchCache.delete(firstKey);
    }
  }

}

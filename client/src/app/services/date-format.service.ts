import { Injectable } from '@angular/core';

/**
 * Service to format dates in European format (DD/MM/YYYY HH:MM 24H)
 * Centralized date formatting to ensure consistency across the application
 */
@Injectable({
  providedIn: 'root'
})
export class DateFormatService {

  /**
   * Format date to DD/MM/YYYY HH:MM (24-hour format)
   * @param date Date object or ISO string
   * @returns Formatted date string or empty string if invalid
   */
  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      let result = '';
      
      // If it's a string, extract parts directly from ISO format
      if (typeof date === 'string') {
        // Match ISO 8601 format: YYYY-MM-DDTHH:MM:SS or similar
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (match) {
          // Extract: YYYY, MM, DD, HH, MM
          const [, year, month, day, hours, minutes] = match;
          // Format as DD/MM/YYYY HH:MM
          result = `${day}/${month}/${year} ${hours}:${minutes}`;
          console.log(`[DateFormatService] ISO String: ${date} -> ${result}`);
          return result;
        }
      }
      
      // Fallback: parse as Date object
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      result = `${day}/${month}/${year} ${hours}:${minutes}`;
      console.log(`[DateFormatService] Date Object: ${date} -> ${result}`);
      return result;
    } catch (err) {
      console.error(`[DateFormatService] Error formatting date: ${date}`, err);
      return '';
    }
  }

  /**
   * Format date to DD/MM/YYYY only
   * @param date Date object or ISO string
   * @returns Formatted date string or empty string if invalid
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      // Handle ISO 8601 strings specially to avoid timezone issues
      if (typeof date === 'string') {
        const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          return `${this.pad(parseInt(day, 10))}/${this.pad(parseInt(month, 10))}/${year}`;
        }
      }
      
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      return this.pad(d.getDate()) + '/' +
             this.pad(d.getMonth() + 1) + '/' +
             d.getFullYear();
    } catch {
      return '';
    }
  }

  /**
   * Format time to HH:MM (24-hour format)
   * @param date Date object or ISO string
   * @returns Formatted time string or empty string if invalid
   */
  formatTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      // Handle ISO 8601 strings specially to avoid timezone issues
      if (typeof date === 'string') {
        const timeMatch = date.match(/T(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          return `${hours}:${minutes}`;
        }
      }
      
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      return this.pad(d.getHours()) + ':' + this.pad(d.getMinutes());
    } catch {
      return '';
    }
  }

  /**
   * Format duration in milliseconds to human-readable format
   * @param durationMs Duration in milliseconds
   * @returns Formatted duration (e.g., "1h 30m" or "45s")
   */
  formatDuration(durationMs: number | null | undefined): string {
    if (!durationMs || durationMs < 0) return '0s';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get month name in Spanish/Catalan locale
   * @param monthIndex 0-based month index (0 = January, 11 = December)
   * @param locale Locale string (default: 'ca-ES')
   * @returns Month name
   */
  getMonthName(monthIndex: number, locale: string = 'ca-ES'): string {
    const date = new Date(2000, monthIndex, 1);
    return date.toLocaleDateString(locale, { month: 'long' });
  }

  /**
   * Get weekday name in Spanish/Catalan locale
   * @param dayIndex 0-based day index (0 = Sunday, 1 = Monday, etc.)
   * @param locale Locale string (default: 'ca-ES')
   * @returns Weekday name
   */
  getWeekdayName(dayIndex: number, locale: string = 'ca-ES'): string {
    const date = new Date(2000, 0, 2 + dayIndex); // 2000-01-02 is Sunday
    return date.toLocaleDateString(locale, { weekday: 'short' });
  }

  /**
   * Pad number with leading zero if needed
   * @param num Number to pad
   * @returns Padded string (e.g., 5 -> "05")
   */
  private pad(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }

  /**
   * Convert date to ISO format for API communication (YYYY-MM-DD)
   * @param date Date object or ISO string
   * @returns ISO date string or empty string if invalid
   */
  toISODate(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  /**
   * Convert date to ISO datetime format for API communication (YYYY-MM-DDTHH:MM:SS)
   * @param date Date object or ISO string
   * @returns ISO datetime string or empty string if invalid
   */
  toISODateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      return d.toISOString().slice(0, 19);
    } catch {
      return '';
    }
  }
}

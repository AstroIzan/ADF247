import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  nCarnet: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    nCarnet: string;
    nIndicatiu?: string;
    name: string;
    lastName?: string;
    roles: {
      isCapOperatiu?: boolean;
      isCapColla?: boolean;
      isAdmin?: boolean;
      isGroc?: boolean;
    } | Array<{
      id: number;
      nCarnet: string;
      isCapOperatiu: boolean;
      isCapColla: boolean;
      isAdmin: boolean;
      isGroc: boolean;
    }>;
  };
}

export interface CurrentUser {
  id: number;
  nCarnet: string;
  nIndicatiu?: string;
  name: string;
  lastName?: string;
  roles: {
    isCapOperatiu?: boolean;
    isCapColla?: boolean;
    isAdmin?: boolean;
    isGroc?: boolean;
  } | Array<{
    isCapOperatiu?: boolean;
    isCapColla?: boolean;
    isAdmin?: boolean;
    isGroc?: boolean;
  }>;
}

export interface BasicUserCache {
  id: number;
  nIndicatiu?: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3001/api';
  private readonly TOKEN_KEY = 'accessToken';
  private readonly USER_KEY = 'currentUser';
  private readonly BASIC_USER_CACHE_KEY = 'basicUserCache';
  
  public currentUser = signal<CurrentUser | null>(null);
  public isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStoredSession();
  }

  private checkStoredSession() {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.ensureBasicUserCache();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.persistSession(response);
      }),
      catchError(err => this.handleError(err))
    );
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/refresh`, {}).pipe(
      tap(response => {
        this.persistSession(response);
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.BASIC_USER_CACHE_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser();
  }

  getBasicUserCache(): BasicUserCache | null {
    const raw = localStorage.getItem(this.BASIC_USER_CACHE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as BasicUserCache;
        if (typeof parsed?.id === 'number') {
          return parsed;
        }
      } catch {
        // Si hay cache corrupta, la reconstruimos desde currentUser cuando sea posible.
      }
    }

    const user = this.getCurrentUser();
    if (!user) {
      return null;
    }

    const rebuilt = this.buildBasicUserCache(user);
    localStorage.setItem(this.BASIC_USER_CACHE_KEY, JSON.stringify(rebuilt));
    return rebuilt;
  }

  getCachedUserId(): number | null {
    return this.getBasicUserCache()?.id ?? null;
  }

  getCachedNIndicatiu(): string | null {
    return this.getBasicUserCache()?.nIndicatiu ?? null;
  }

  getCachedIsAdmin(): boolean {
    return this.getBasicUserCache()?.isAdmin ?? false;
  }

  getCachedNCarnet(): string | null {
    const user = this.getCurrentUser();
    return user?.nCarnet ?? null;
  }

  getCachedName(): string | null {
    const user = this.getCurrentUser();
    return user?.name ?? null;
  }

  isAdmin(): boolean {
    return this.getCachedIsAdmin();
  }

  private getStoredUser(): CurrentUser | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private handleError(error: any) {
    const errorMessage = error.error?.message || error.message || 'Error en la autenticación';
    return throwError(() => new Error(errorMessage));
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private persistSession(response: LoginResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);

    const basic = this.buildBasicUserCache(response.user);
    localStorage.setItem(this.BASIC_USER_CACHE_KEY, JSON.stringify(basic));
  }

  private ensureBasicUserCache() {
    if (localStorage.getItem(this.BASIC_USER_CACHE_KEY)) {
      return;
    }

    const user = this.getCurrentUser();
    if (!user) {
      return;
    }

    const basic = this.buildBasicUserCache(user);
    localStorage.setItem(this.BASIC_USER_CACHE_KEY, JSON.stringify(basic));
  }

  private buildBasicUserCache(user: CurrentUser | LoginResponse['user']): BasicUserCache {
    return {
      id: user.id,
      nIndicatiu: user.nIndicatiu,
      isAdmin: this.resolveIsAdmin(user.roles),
    };
  }

  private resolveIsAdmin(roles: CurrentUser['roles'] | LoginResponse['user']['roles']): boolean {
    if (!roles) {
      return false;
    }

    if (Array.isArray(roles)) {
      return Boolean(roles[0]?.isAdmin);
    }

    return Boolean(roles.isAdmin);
  }
}

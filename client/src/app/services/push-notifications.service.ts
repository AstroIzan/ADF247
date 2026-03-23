import { Injectable, computed, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, Messaging, onMessage } from 'firebase/messaging'
import { HttpService } from './http.service'
import { AuthService } from './auth.service'
import { isNotificationsConfigReady, notificationsConfig } from '../config/notifications.config'

type DeviceTokenRecord = {
  id: number
  token: string
  platform?: string
  isActive: boolean
  lastSeenAt?: string
  createdAt?: string
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private messaging: Messaging | null = null
  private foregroundListenerBound = false

  readonly isSupported = signal(false)
  readonly permission = signal<NotificationPermission | 'unsupported'>('default')
  readonly loading = signal(false)
  readonly errorMessage = signal('')
  readonly infoMessage = signal('')
  readonly currentToken = signal('')
  readonly registeredTokens = signal<DeviceTokenRecord[]>([])
  readonly modalVisible = signal(false)

  readonly hasRegisteredCurrentToken = computed(() => {
    const token = this.currentToken()
    if (!token) {
      return false
    }

    return this.registeredTokens().some((device) => device.isActive && device.token === token)
  })

  readonly needsSetup = computed(() => {
    if (!this.authService.isLoggedIn()) {
      return false
    }

    if (!isNotificationsConfigReady() || !('Notification' in window)) {
      return false
    }

    // Show modal whenever permission is not granted yet
    if (this.permission() !== 'granted') {
      return true
    }

    // Permission granted but FCM not supported — nothing more we can do
    if (!this.isSupported()) {
      return false
    }

    return !this.hasRegisteredCurrentToken()
  })

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
  ) {}

  async initAndSyncToken() {
    await this.syncState({ openModalIfNeeded: true })
  }

  async ensurePermissionAndDeviceOnHomeEntry() {
    if (!this.authService.isLoggedIn()) {
      return
    }

    this.errorMessage.set('')
    this.infoMessage.set('')

    // --- Step 1: sync checks only (no async, cannot fail) ---
    if (!isNotificationsConfigReady() || !('Notification' in window)) {
      this.isSupported.set(false)
      this.permission.set('unsupported')
      this.modalVisible.set(false)
      return
    }

    // --- Step 2: ask permission IMMEDIATELY before any network calls ---
    const browserPermission = Notification.permission
    if (browserPermission === 'default') {
      const result = await Notification.requestPermission()
      this.permission.set(result)
    } else {
      this.permission.set(browserPermission)
    }

    // --- Step 3: load registered tokens (wrapped — must not block step 2) ---
    try {
      await this.refreshRegisteredTokens()
    } catch {
      this.registeredTokens.set([])
    }

    // --- Step 4: check Firebase FCM support (only needed for token) ---
    let fcmSupported = false
    try {
      fcmSupported = await isSupported()
    } catch {
      fcmSupported = false
    }
    this.isSupported.set(fcmSupported)

    // --- Step 5: get + register FCM token if everything is ready ---
    if (this.permission() === 'granted' && fcmSupported) {
      try {
        const token = this.currentToken() || await this.resolveCurrentToken()
        if (token) {
          this.currentToken.set(token)
          if (!this.hasRegisteredCurrentToken()) {
            await this.registerToken(token)
            await this.refreshRegisteredTokens()
            this.infoMessage.set('Dispositiu registrat correctament per rebre notificacions.')
          }
        }
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'No s\'ha pogut completar el registre automàtic del dispositiu.')
      }
    } else if (this.permission() === 'granted' && !fcmSupported) {
      this.errorMessage.set('Aquest navegador no és compatible amb el servei de missatges push (FCM). Les notificacions en segon pla no estaran disponibles.')
    } else if (this.permission() === 'denied') {
      this.errorMessage.set('Notificacions bloquejades al navegador. Cal activar-les manualment a la configuració del lloc.')
    }

    this.modalVisible.set(this.needsSetup())
  }

  async syncState(options: { openModalIfNeeded?: boolean } = {}) {
    this.errorMessage.set('')
    this.infoMessage.set('')

    if (!this.authService.isLoggedIn()) {
      this.resetState()
      return
    }

    if (!isNotificationsConfigReady()) {
      this.isSupported.set(false)
      this.permission.set('unsupported')
      this.modalVisible.set(false)
      return
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      this.isSupported.set(false)
      this.permission.set('unsupported')
      this.modalVisible.set(false)
      return
    }

    const supported = await isSupported()
    this.isSupported.set(supported)

    if (!supported) {
      this.permission.set('unsupported')
      this.modalVisible.set(false)
      return
    }

    this.permission.set(Notification.permission)
    await this.refreshRegisteredTokens()

    if (this.permission() === 'granted') {
      try {
        const token = await this.resolveCurrentToken()
        this.currentToken.set(token || '')

        // If the browser has permission and token, ensure this session/device is linked in backend.
        if (token && !this.hasRegisteredCurrentToken()) {
          await this.registerToken(token)
          await this.refreshRegisteredTokens()
        }
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'No s\'ha pogut obtenir el token del dispositiu.')
        this.currentToken.set('')
      }
    } else {
      this.currentToken.set('')
    }

    if (options.openModalIfNeeded) {
      this.modalVisible.set(this.needsSetup())
    }
  }

  openSetupModal() {
    if (!this.authService.isLoggedIn()) {
      return
    }

    this.modalVisible.set(true)
  }

  closeSetupModal() {
    this.modalVisible.set(false)
  }

  async requestPermissionAndRegister() {
    this.loading.set(true)
    this.errorMessage.set('')
    this.infoMessage.set('')

    try {
      await this.ensureSupportedOrThrow()

      if (this.permission() !== 'granted') {
        const permission = await Notification.requestPermission()
        this.permission.set(permission)

        if (permission !== 'granted') {
          throw new Error('Els permisos de notificació no estan concedits. Cal acceptar-los al navegador.')
        }
      }

      const token = await this.resolveCurrentToken()
      if (!token) {
        throw new Error('No s\'ha pogut generar el token del dispositiu.')
      }

      await this.registerToken(token)
      this.currentToken.set(token)
      await this.refreshRegisteredTokens()
      this.modalVisible.set(false)
      this.infoMessage.set('Dispositiu registrat correctament per rebre notificacions.')
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No s\'ha pogut registrar el dispositiu.')
      this.modalVisible.set(true)
    } finally {
      this.loading.set(false)
    }
  }

  private async ensureSupportedOrThrow() {
    if (!this.authService.isLoggedIn()) {
      throw new Error('Has d\'iniciar sessió abans de registrar notificacions.')
    }

    if (!this.isSupported()) {
      throw new Error('Aquest navegador no suporta notificacions push per a aquesta aplicació.')
    }
  }

  private async refreshRegisteredTokens() {
    if (!this.authService.isLoggedIn()) {
      this.registeredTokens.set([])
      return
    }

    const devices = await firstValueFrom(this.httpService.get<DeviceTokenRecord[]>('/notifications/device-tokens'))
    this.registeredTokens.set(Array.isArray(devices) ? devices : [])
  }

  private async registerToken(token: string) {
    await firstValueFrom(this.httpService.post('/notifications/device-token', {
      token,
      platform: this.resolvePlatform(),
      userAgent: navigator.userAgent,
    }))
  }

  private async resolveCurrentToken() {
    const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const firebaseApp = getApps().length > 0
      ? getApp()
      : initializeApp(notificationsConfig.firebase)

    this.messaging = getMessaging(firebaseApp)
    this.bindForegroundListener()

    return getToken(this.messaging, {
      vapidKey: notificationsConfig.vapidKey,
      serviceWorkerRegistration,
    })
  }

  private bindForegroundListener() {
    if (!this.messaging || this.foregroundListenerBound) {
      return
    }

    onMessage(this.messaging, (payload) => {
      const title = payload.notification?.title || 'ADF247'
      const body = payload.notification?.body || ''

      this.infoMessage.set(`Notificació rebuda: ${title}`)

      if (this.permission() === 'granted' && typeof Notification !== 'undefined') {
        try {
          new Notification(title, { body })
        } catch {
          // Ignore display errors in foreground notifications.
        }
      }
    })

    this.foregroundListenerBound = true
  }

  private resolvePlatform() {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('android')) {
      return 'android'
    }

    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios')) {
      return 'ios'
    }

    if (userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux')) {
      return 'desktop'
    }

    return 'web'
  }

  private resetState() {
    this.isSupported.set(false)
    this.permission.set('default')
    this.loading.set(false)
    this.errorMessage.set('')
    this.infoMessage.set('')
    this.currentToken.set('')
    this.registeredTokens.set([])
    this.modalVisible.set(false)
  }
}
import { Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, Messaging } from 'firebase/messaging'
import { HttpService } from './http.service'
import { AuthService } from './auth.service'
import { isNotificationsConfigReady, notificationsConfig } from '../config/notifications.config'

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private messaging: Messaging | null = null
  private initialized = false

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
  ) {}

  async initAndSyncToken() {
    if (this.initialized) {
      return
    }

    if (!this.authService.isLoggedIn()) {
      return
    }

    if (!isNotificationsConfigReady()) {
      return
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return
    }

    const supported = await isSupported()
    if (!supported) {
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const firebaseApp = getApps().length > 0
      ? getApp()
      : initializeApp(notificationsConfig.firebase)

    this.messaging = getMessaging(firebaseApp)

    const fcmToken = await getToken(this.messaging, {
      vapidKey: notificationsConfig.vapidKey,
      serviceWorkerRegistration,
    })

    if (!fcmToken) {
      return
    }

    await firstValueFrom(this.httpService.post('/notifications/device-token', {
      token: fcmToken,
      platform: this.resolvePlatform(),
      userAgent: navigator.userAgent,
    }))

    this.initialized = true
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
}

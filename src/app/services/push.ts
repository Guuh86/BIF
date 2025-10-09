import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed
} from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class PushService {
  private listenersRegistered = false;
  private deviceId: string | null = null;

  constructor(private firestore: Firestore) {}

  async initPush() {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('PushNotifications não disponível no web. Use Firebase Web Push para PWA.');
      return;
    }

    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    const info = await Device.getId();
    this.deviceId = info?.identifier ?? `device_${Date.now()}`;

    await PushNotifications.requestPermissions();
    await LocalNotifications.requestPermissions();

    if (Capacitor.getPlatform() === 'android') {
      await this.createNotificationChannel();
      await FCM.subscribeTo({ topic: 'allUsers' });
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token: Token) => {
      if (!this.deviceId) return;
      const ref = doc(this.firestore, `userTokens/${this.deviceId}`);
      await setDoc(
        ref,
        {
          token: token.value,
          topics: ['allUsers'],
          updatedAt: new Date()
        },
        { merge: true }
      );
      console.log('Token salvo/atualizado no Firestore:', this.deviceId);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('📩 Push recebido em foreground:', notification);

      const data = notification.data || {};
      const title = notification.title || 'Nova notificação';
      const body = notification.body || data.mensagem || '';

      const notificationId = Math.floor(Date.now() / 1000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title,
            body,
            smallIcon: 'res://ic_launcher'
          },
        ],
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('🔔 Notificação clicada:', action.notification);
    });
  }

  private async createNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Default',
        description: 'Canal principal de notificações',
        importance: 5,
        visibility: 1,
        sound: 'default'
      });
      console.log('✅ Canal de notificações criado com sucesso');
    } catch (err) {
      console.error('Erro ao criar canal de notificações:', err);
    }
  }
}

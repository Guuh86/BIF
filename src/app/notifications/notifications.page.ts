import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { NotificationService } from '../services/notification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit {

  notifications: any[] = [];
  groupedNotifications: { date: string, items: any[] }[] = [];
  items !: any[];

  loading: any

  private pageSize = 8;
  private currentIndex = 0;
  private allNotifications: any[] = [];
  hasMore: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private modalCtrl: ModalController,
    private alert: AlertController,
    private toast: ToastController,
  ) { }

  ngOnInit() {
    this.loading = true;
    this.notificationService.getNotification().subscribe(data => {
      this.allNotifications = data;
      this.currentIndex = 0;
      this.notifications = [];
      this.loadMoreNotifications();
      this.loading = false;
    });
  }

  loadMoreNotifications() {
    const next = this.allNotifications.slice(this.currentIndex, this.currentIndex + this.pageSize);

    this.notifications = [...this.notifications, ...next];
    this.currentIndex += this.pageSize;

    this.groupData();

    this.hasMore = this.currentIndex < this.allNotifications.length;
  }

  private groupData() {
    const grouped = this.notifications.reduce((acc: any, noti: any) => {

      if (!noti || typeof noti !== 'object') {
        console.warn("Notificação inválida (não é objeto):", noti);
        return acc;
      }

      const timestamp = noti.timestamp;
      let date: Date | null = null;

      if (timestamp?.toDate instanceof Function) {
        date = timestamp.toDate();
      }
      else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      }
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      else if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
      if (!date || isNaN(date.getTime())) {
        console.warn("Timestamp inválido:", timestamp);
        return acc;
      }

      const key = date.toISOString().split('T')[0];

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(noti);
      return acc;
    }, {} as { [key: string]: any[] });

    this.groupedNotifications = Object.keys(grouped).map(date => ({
      date,
      items: grouped[date]
    }));
  }


  loadMore(event: any) {
    this.loadMoreNotifications();

    event.target.complete();
    if (!this.hasMore) {
      event.target.disabled = true;
    }
  }

  async sendNotificationImprevisto() {
    const alert = await this.alert.create({
      header: 'Atenção!',
      message: 'Deseja realmente emitir o alerta "Pneu Furado"?',
      buttons: [
        {
          text: 'NÃO',
          role: 'cancel',
          handler: () => {
            this.showToast('Alerta cancelado com sucesso!');
            this.modalCtrl.dismiss();
          }
        },
        {
          text: 'SIM',
          handler: () => {
            this.notificationService.createNotification('imprevisto', 'Motorista-CAPAR.01');
            this.showToast('Alerta enviado com sucesso!');
            this.modalCtrl.dismiss();
          }
        }
      ]
    });

    await alert.present();
  }

  async createNotificationNoRoute() {
    const alert = await this.alert.create({
      header: 'Atenção!',
      message: 'Deseja realmente emitir o alerta "Não haverá rota"?',
      buttons: [
        {
          text: 'NÃO',
          role: 'cancel',
          handler: () => {
            this.showToast('Alerta cancelado com sucesso!');
            this.modalCtrl.dismiss();
          }
        },
        {
          text: 'SIM',
          handler: () => {
            this.notificationService.createNotification('noroute', 'Motorista-CAPAR.01');
            this.showToast('Alerta enviado com sucesso!');
            this.modalCtrl.dismiss();
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string) {
    const toast = await this.toast.create({
      message: msg,
      duration: 2000
    });
    await toast.present();
  }

  closeModal() {
    return this.modalCtrl.dismiss();
  }
}

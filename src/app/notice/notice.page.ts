import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notice',
  templateUrl: './notice.page.html',
  styleUrls: ['./notice.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true
})
export class NoticePage implements OnInit {

  segmentValue: string = 'create';
  notifications: any[] = [];
  groupedNotifications: { date: string, items: any[] }[] = [];

  private pageSize = 8;   
  private currentIndex = 0; 
  private allNotifications: any[] = []; 
  hasMore: boolean = false; 

  constructor(
    private notificationService: NotificationService,
    private alert: AlertController,
    private toast: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.notificationService.getNotification().subscribe(data => {
      this.allNotifications = data;
      this.currentIndex = 0;
      this.notifications = [];
      this.loadMoreNotifications(); 
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
      const date = new Date(noti?.timestamp?.seconds * 1000)
        .toISOString()
        .split('T')[0];

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(noti);
      return acc;
    }, {} as { [key: string]: any[] });

    this.groupedNotifications = Object.keys(grouped).map(date => ({
      date,
      items: grouped[date]
    }));
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
          }
        },
        {
          text: 'SIM',
          handler: () => {
            this.notificationService.createNotification('imprevisto', 'Motorista-CAPAR.01');
            this.showToast('Alerta enviado com sucesso!');
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
          }
        },
        {
          text: 'SIM',
          handler: () => {
            this.notificationService.createNotification('noroute', 'Motorista-CAPAR.01');
            this.showToast('Alerta enviado com sucesso!');
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

  back() {
    this.router.navigateByUrl('/home');
  }

  loadMore() {
    this.loadMoreNotifications();
  }

}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NotificationService } from '../services/notification';
import {
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';

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

  private pageSize = 8;
  private currentIndex = 0;
  private allNotifications: any[] = [];
  hasMore: boolean = false;

  constructor(
    private notificationService: NotificationService,
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

  loadMore() {
    this.loadMoreNotifications();
  } 

}

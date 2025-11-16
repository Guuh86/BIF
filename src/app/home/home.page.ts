import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
})

export class HomePage implements OnInit {

  segmentValue: string = 'aluno';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alert: AlertController
  ) {}
  
  ngOnInit(): void {}

  ionViewWillEnter() {
    this.segmentValue = 'aluno';
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  async presentAlertConfirm() {
    const alert = await this.alert.create({
      header: 'Atenção!',
      message: 'Deseja realmente sair do sistema?',
      buttons: [
        {
          text: 'NÃO',
          role: 'cancel',
          handler: () => {
            return
          }
        },
        {
          text: 'SIM',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


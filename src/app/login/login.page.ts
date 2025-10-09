import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    FormsModule
  ]
})

export class LoginPage {
  cpf = '';
  senha = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async login() {
    const loading = await this.loadingCtrl.create({ message: 'Entrando. Aguarde...' });
    await loading.present();

    try {
      await this.auth.loginWithCpf(this.cpf, this.senha);
      await loading.dismiss();
      this.router.navigate(['/home']);
    } catch (err) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'CPF ou senha inválidos',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }
}



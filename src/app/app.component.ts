import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushService } from './services/push';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit{
  constructor(
    private pushService: PushService
  ) {}

  ngOnInit(): void {
    this.pushService.initPush();    
  }

  async requestLocationPermission() {
    try {
      const permission = await Geolocation.requestPermissions();
      console.log('Permissão de localização:', permission);
    } catch (err) {
      console.error('Erro ao pedir permissão de localização:', err);
    }
  }

}

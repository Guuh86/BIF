import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { LocationService } from '../services/location';
import { NotificationService } from '../services/notification';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { ref, onValue } from '@angular/fire/database';

declare const google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MapPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  private map!: google.maps.Map;

  userCircle: google.maps.Circle | null = null;
  private userMarker: google.maps.Marker | null = null;
  private watchId: string | null = null;


  constructor(
    private locationService: LocationService,
    private toastCtrl: ToastController,
    private alert: AlertController,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  async ngOnInit() {
    this.locationService.startTracking();
    await this.notificationService.createNotification('inicio_rota', 'Motorista-CAPAR.01');
    this.showToast('Rota iniciada com sucesso!');
  }

  async ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15,
      center: { lat: -2.9115717367163416, lng: -41.75890300847825 },
      disableDefaultUI: true,
    });

    this.afterRouteDraw();
  }

  async afterRouteDraw() {
    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 7000,
        },
        (pos, err) => {
          if (err) return console.error('Erro ao obter localização:', err);
          if (!pos) return;

          const userLatLng = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          if (this.userMarker) {
            this.userMarker.setPosition(userLatLng);
            if (this.userCircle) this.userCircle.setCenter(userLatLng);
          } else {
            this.userMarker = new google.maps.Marker({
              position: userLatLng,
              map: this.map,
              title: 'Você está aqui',
              icon: {
                url: "https://cdn-icons-png.flaticon.com/512/10903/10903014.png ",
                scaledSize: new google.maps.Size(40, 40)
              }
            });

            this.userCircle = new google.maps.Circle({
              center: userLatLng,
              radius: 1,
              strokeColor: '#000000',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              fillColor: '#ffffff',
              fillOpacity: 0.2,
              map: this.map,
            });
          }
        }
      );
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
    }
  }

  async stopTracking() {
    const alert = await this.alert.create({
      header: 'Atenção!',
      message:
        'Deseja realmente encerrar a rota!? Todos os alunos receberão uma notificação avisando o fim da rota',
      buttons: [
        {
          text: 'NÃO',
          role: 'cancel',
          handler: () => this.showToast('A rota não foi encerrada!'),
        },
        {
          text: 'SIM',
          handler: () => {
            this.locationService.stopTracking();
            this.notificationService.createNotification('fim_rota', 'Motorista-CAPAR.01');
            this.showToast('Rota finalizada com sucesso!');
            this.router.navigate(['/home']);
          },
        },
      ],
    });
    await alert.present();
  }

  ngOnDestroy() {
    if (this.watchId) Geolocation.clearWatch({ id: this.watchId });
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'dark',
      position: 'top',
    });
    toast.present();
  }
}

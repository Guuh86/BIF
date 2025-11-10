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
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;

  userCircle: google.maps.Circle | null = null;
  private userMarker: google.maps.Marker | null = null;
  private watchId: string | null = null;

  private deviceMarkers: Map<string, google.maps.Marker> = new Map();

  constructor(
    private locationService: LocationService,
    private notificationService: NotificationService,
    private toastCtrl: ToastController,
    private alert: AlertController,
    private router: Router
  ) {}

  async ngOnInit() {
    this.locationService.startTracking();
    await this.notificationService.createNotification('inicio_rota', 'Motorista-CAPAR.01');
    this.showToast('Rota iniciada com sucesso!');
  }

  async ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: { lat: -2.9057, lng: -41.7754 },
      disableDefaultUI: true,
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      preserveViewport: true,
    });

    this.drawRoute();
    this.afterRouteDraw();
    this.listenForAllDevices(); 
  }

  drawRoute() {
    this.directionsService.route(
      {
        origin: { lat: -2.947877, lng: -41.731758 },
        destination: { lat: -2.947236, lng: -41.731624 },
        waypoints: [
          { location: { lat: -2.948677, lng: -41.730980 } },
          { location: { lat: -2.949046, lng: -41.730615 } },
          { location: { lat: -2.948623246886427, lng: -41.73043817197814 } },
          { location: { lat: -2.9359248990124276, lng: -41.730129427642794 } },
          { location: { lat: -2.9443748872818243, lng: -41.7283460498024 } },
          { location: { lat: -2.920513086167887, lng: -41.729893090025236 } },
          { location: { lat: -2.9202773547490293, lng: -41.72989946943922 } },
          { location: { lat: -2.92032195263953, lng: -41.73012274852487 } },
          { location: { lat: -2.920258241019785, lng: -41.73308924661261 } },
          { location: { lat: -2.9199740980227626, lng: -41.73848669969051 } },
          { location: { lat: -2.919783507251914, lng: -41.742534253106925 } },
          { location: { lat: -2.919579859698079, lng: -41.746882054864685 } },
          { location: { lat: -2.9192423444443825, lng: -41.75408490322049 } },
          { location: { lat: -2.9098213926989334, lng: -41.753667556835225 } },
          { location: { lat: -2.909513983225512, lng: -41.75362609070148 } },
          { location: { lat: -2.9094343434491727, lng: -41.754541535294564 } },
          { location: { lat: -2.908592488109952, lng: -41.77348857155337 } },
          { location: { lat: -2.9083070274897573, lng: -41.78019238500674 } },
          { location: { lat: -2.9162534183161113, lng: -41.78055285570347 } },
          { location: { lat: -2.917172099782723, lng: -41.76895749036511 } },
          { location: { lat: -2.928901825402463, lng: -41.75360766036199 } },
        ],
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      },
      (result: any, status: string) => {
        if (status === 'OK') {
          const bounds = result.routes[0].bounds;
          const path = result.routes[0].overview_path;
          this.map.fitBounds(bounds);

          const polyline = new google.maps.Polyline({
            path: [],
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: this.map,
          });

          let step = 0;
          const interval = setInterval(() => {
            if (step < path.length) {
              polyline.getPath().push(path[step]);
              step++;
            } else clearInterval(interval);
          }, 17);
        } else console.error('Erro ao calcular rota:', status);
      }
    );
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
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#000000',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
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

   listenForAllDevices() {
    const dbRef = ref(this.locationService['db'], 'locations');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(([deviceId, info]: [string, any]) => {
        const position = { lat: info.lat, lng: info.lng };

        if (this.deviceMarkers.has(deviceId)) {
          this.deviceMarkers.get(deviceId)!.setPosition(position);
        } else {
            const marker = new google.maps.Marker({
            position,
            map: this.map,
            title: `Dispositivo: ${deviceId}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            },
          });
          this.deviceMarkers.set(deviceId, marker);
        }
      });
    });
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

import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { LocationService } from '../services/location';

declare const google: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MapsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  private map!: google.maps.Map;
  marker!: google.maps.Marker;
  private intervalId: any;

  drawnPolyline: google.maps.Polyline | null = null;
  private polylineIntervalId: any = null;
  directionsService = new google.maps.DirectionsService();

  disableBtn = false;

  constructor(
    private locationService: LocationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  async ngOnInit() {
    
  }

  async ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15,
      center: { lat: -2.9115717367163416, lng: -41.75890300847825 },
      disableDefaultUI: true,
    });

    const coords = await this.locationService.getBusLocation();
    if (!coords) return;

    this.marker = new google.maps.Marker({
      position: { lat: coords.lat, lng: coords.lng },
      map: this.map,
      title: 'Usuário',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: 'white'
      }
    });

    this.map.setCenter({ lat: coords.lat, lng: coords.lng });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.polylineIntervalId) {
      clearInterval(this.polylineIntervalId);
      this.polylineIntervalId = null;
    }
  }

  private directionsRoutePromise(request: google.maps.DirectionsRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') resolve(result);
        else reject(status);
      });
    });
  }

  private animatePolyline(path: google.maps.LatLng[], pushPerTick = 3, intervalMs = 17): Promise<void> {
    return new Promise((resolve) => {
      if (!this.drawnPolyline) return resolve();
      if (!path || !path.length) return resolve();

      let step = 0;
      if (this.polylineIntervalId) {
        clearInterval(this.polylineIntervalId);
        this.polylineIntervalId = null;
      }

      this.polylineIntervalId = setInterval(() => {
        for (let k = 0; k < pushPerTick && step < path.length; k++) {
          this.drawnPolyline!.getPath().push(path[step++]);
        }

        if (step >= path.length) {
          if (this.polylineIntervalId) {
            clearInterval(this.polylineIntervalId);
            this.polylineIntervalId = null;
          }
          setTimeout(() => resolve(), 50);
        }
      }, intervalMs);
    });
  }

  private async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      cssClass: 'custom-loading-bottom',
      duration: 0
    });
    await loading.present();
    return loading;
  }

  async drawIfpiRoute() {
    if (this.disableBtn) return;
    this.disableBtn = true;
    const loading = await this.showLoading('Desenhando rota...');

    if (this.drawnPolyline) {
      this.drawnPolyline.setMap(null);
      this.drawnPolyline = null;
    }
    if (this.polylineIntervalId) {
      clearInterval(this.polylineIntervalId);
      this.polylineIntervalId = null;
    }

    const waypointsData = await this.locationService.getWaypoints('locationsIF');
    
    const waypoints = waypointsData.map(loc => ({
      location: { lat: loc.lat, lng: loc.lng }
    }));

    try {
      const result = await this.directionsRoutePromise({
        origin: { lat: -2.947877, lng: -41.731758 },
        destination: { lat: -2.947236, lng: -41.731624 },
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      });

      const path = result.routes[0].overview_path;
      const bounds = result.routes[0].bounds;
      this.map.fitBounds(bounds);
      const center = bounds.getCenter();
      this.map.setZoom(14);
      this.map.panTo(center);

      this.drawnPolyline = new google.maps.Polyline({
        path: [],
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: this.map,
      });

      await this.animatePolyline(path);
    } catch (err) {
      console.error('Erro ao calcular/desenhar rota IFPI:', err);
    } finally {
      this.disableBtn = false;
      await loading.dismiss();
    }
  }

  async drawWagnerRoute() {
    if (this.disableBtn) return;
    this.disableBtn = true;
    const loading = await this.showLoading('Desenhando rota...');

    if (this.drawnPolyline) {
      this.drawnPolyline.setMap(null);
      this.drawnPolyline = null;
    }
    if (this.polylineIntervalId) {
      clearInterval(this.polylineIntervalId);
      this.polylineIntervalId = null;
    }

    const waypointsData = await this.locationService.getWaypoints('locationsWG');
    
    const waypoints = waypointsData.map(loc => ({
      location: { lat: loc.lat, lng: loc.lng }
    }));

    try {
      const result = await this.directionsRoutePromise({
        origin: { lat: -2.947877, lng: -41.731758 },
        destination: { lat: -2.947236, lng: -41.731624 },
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      });

      const path = result.routes[0].overview_path;
      const bounds = result.routes[0].bounds;
      this.map.fitBounds(bounds);
      const center = bounds.getCenter();
      this.map.setZoom(14);
      this.map.panTo(center);

      this.drawnPolyline = new google.maps.Polyline({
        path: [],
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: this.map,
      });

      await this.animatePolyline(path);
    } catch (err) {
      console.error('Erro ao calcular/desenhar rota Wagner:', err);
    } finally {
      this.disableBtn = false;
      await loading.dismiss();
    }
  }

  showMarkers = false;
  markers: google.maps.Marker[] = [];
  infoWindow: google.maps.InfoWindow | any;

  async addMarkers() {
    const loading = await this.showLoading('Carregando paradas...');
    if (!this.map) return;
    if (!this.infoWindow) this.infoWindow = new google.maps.InfoWindow();

    if (this.markers.length > 0) {
      this.markers.forEach(marker => marker.setMap(this.map));
      await loading.dismiss();
      return;
    }

    const locs = await this.locationService.getMarkers();

    locs.forEach((loc: any) => {
      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: this.map,
        title: loc.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "red",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "green",
        },
      });

      marker.addListener("click", () => {
        this.infoWindow!.setContent(`<div style="color: green;">${loc.title}</div>`);
        this.infoWindow!.open(this.map, marker);
      });

      this.markers.push(marker);
      loading.dismiss();
    });
  }

  async toggleMarkers(event: any) {
    const checked = event.detail.checked;
    if (checked) {
      this.addMarkers();
    } else {
      const loading = await this.showLoading('Removendo paradas...');
      this.removeMarkers();
      loading.dismiss();
    }
  }

  removeMarkers() {
    if (this.infoWindow) this.infoWindow.close();
    this.markers.forEach((m) => m.setMap(null));
  }

  async alertParadas() {
    const alert = await this.alertCtrl.create({
      header: 'Paradas',
      subHeader: 'Entenda como funciona:',
      message: `
      Os pontos mostrados no mapa são as paradas mais usadas pelos alunos. 
      Se você desce em algum ponto mas ele não está sendo exposto no mapa você 
      pode usar a opção "Solicitar Parada" na página inicial para solicitar uma 
      adição ou atualização.
    `,
      cssClass: 'alert-custom',
      buttons: ['OK'],
      animated: true
    });
    await alert.present();
  }

}

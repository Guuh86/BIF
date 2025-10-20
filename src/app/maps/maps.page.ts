import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';
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
    FormsModule
  ]
})
export class MapsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  private map!: google.maps.Map;
  marker!: google.maps.Marker;
  private intervalId: any;

  drawnPolyline: google.maps.Polyline | null = null;
  private _polylineIntervalId: any = null;
  directionsService = new google.maps.DirectionsService();

  showMarkers = false;
  markers: google.maps.Marker[] = [];
  private _markerTimers: any[] = [];

  disableBtn = false;
  isTogglingMarkers = false;

  constructor(
    private locationService: LocationService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() { }

  async ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15,
      center: { lat: -2.9115717367163416, lng: -41.75890300847825 },
      disableDefaultUI: true
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

    const locations = [
      { lat: -2.9359248990124276, lng: -41.730129427642794 },
      { lat: -2.9443748872818243, lng: -41.7283460498024 },
      { lat: -2.92032195263953, lng: -41.73012274852487 },
      { lat: -2.919783507251914, lng: -41.742534253106925 },
      { location: { lat: -2.9098213926989334, lng: -41.753667556835225 } },
      { location: { lat: -2.909513983225512, lng: -41.75362609070148 } },
    ];

    this.markers = locations.map(
      (pos: any) =>
        new google.maps.Marker({
          position: pos.location ? pos.location : pos,
          map: null,
          title: 'Ponto',
        })
    );

    this.map.setCenter({ lat: coords.lat, lng: coords.lng });

    this.intervalId = setInterval(async () => {
      const updated = await this.locationService.getBusLocation();
      if (updated) {
        this.animateMarker(this.marker, { lat: updated.lat, lng: updated.lng });
      }
    }, 5000);
  }

  animateMarker(marker: google.maps.Marker, newPosition: { lat: number; lng: number }) {
    const DELAY = 10;
    const steps = 50;

    const currentPos = marker.getPosition()!;
    const latDiff = newPosition.lat - currentPos.lat();
    const lngDiff = newPosition.lng - currentPos.lng();

    let i = 0;
    const interval = setInterval(() => {
      i++;
      const lat = currentPos.lat() + (latDiff * i) / steps;
      const lng = currentPos.lng() + (lngDiff * i) / steps;
      marker.setPosition(new google.maps.LatLng(lat, lng));

      if (i >= steps) clearInterval(interval);
    }, DELAY);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this._polylineIntervalId) {
      clearInterval(this._polylineIntervalId);
      this._polylineIntervalId = null;
    }
    this.clearAllMarkerTimers();
  }

  async toggleMarkers(event: any) {
    if (this.isTogglingMarkers) {
      event.detail.checked = this.showMarkers;
      return;
    }

    this.isTogglingMarkers = true;
    this.showMarkers = event.detail.checked;

    const loading = await this.loadingCtrl.create({
      message: this.showMarkers ? 'Exibindo paradas...' : 'Removendo paradas...',
      spinner: 'dots',
      cssClass: 'custom-loading-bottom'
    });
    await loading.present();

    if (this.showMarkers) {
      await this.animateMarkersDrop().catch((e) => console.error(e));
    } else {
      this.clearAllMarkerTimers();
      this.markers.forEach((m) => {
        m.setMap(null);
        m.setAnimation(null);
      });
    }

    await loading.dismiss();
    this.isTogglingMarkers = false;
  }

  private clearAllMarkerTimers() {
    if (this._markerTimers && this._markerTimers.length) {
      this._markerTimers.forEach((t) => clearTimeout(t));
      this._markerTimers = [];
    }
  }

  private animateMarkersDrop(): Promise<void> {
    return new Promise((resolve) => {
      this.clearAllMarkerTimers();

      const total = this.markers.length;
      if (total === 0) {
        resolve();
        return;
      }

      let finished = false;
      this.markers.forEach((marker, i) => {
        const t = setTimeout(() => {
          marker.setMap(this.map);
          marker.setAnimation(google.maps.Animation.DROP);

          setTimeout(() => marker.setAnimation(null), 700);

          if (i === total - 1 && !finished) {
            finished = true;
            setTimeout(() => resolve(), 300);
          }
        }, i * 150);

        this._markerTimers.push(t);
      });
    });
  }

  bounceMarker(marker: google.maps.Marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 2000);
  }

  private _directionsRoutePromise(request: google.maps.DirectionsRequest): Promise<any> {
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
      if (this._polylineIntervalId) {
        clearInterval(this._polylineIntervalId);
        this._polylineIntervalId = null;
      }

      this._polylineIntervalId = setInterval(() => {
        for (let k = 0; k < pushPerTick && step < path.length; k++) {
          this.drawnPolyline!.getPath().push(path[step++]);
        }

        if (step >= path.length) {
          if (this._polylineIntervalId) {
            clearInterval(this._polylineIntervalId);
            this._polylineIntervalId = null;
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
    if (this._polylineIntervalId) {
      clearInterval(this._polylineIntervalId);
      this._polylineIntervalId = null;
    }

    try {
      const result = await this._directionsRoutePromise({
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
    if (this._polylineIntervalId) {
      clearInterval(this._polylineIntervalId);
      this._polylineIntervalId = null;
    }

    try {
      const result = await this._directionsRoutePromise({
        origin: { lat: -2.947877, lng: -41.731758 },
        destination: { lat: -2.947236, lng: -41.731624 },
        waypoints: [
          { location: { lat: -2.947644109324968, lng: -41.732010962558896 } },
          { location: { lat: -2.9293528343514526, lng: -41.75317442205254 } },
          { location: { lat: -2.929084963902733, lng: -41.75339436319749 } },
          { location: { lat: -2.9288144146745823, lng: -41.753481534980494 } },
          { location: { lat: -2.9286402988148423, lng: -41.753492263820775 } },
          { location: { lat: -2.928539847337747, lng: -41.75359284665453 } },
          { location: { lat: -2.9283402836966, lng: -41.75358614113251 } },
          { location: { lat: -2.9271911179965597, lng: -41.753430573024794 } },
          { location: { lat: -2.92474277495048, lng: -41.75374439146269 } },
          { location: { lat: -2.9233873442170535, lng: -41.75405820990104 } },
          { location: { lat: -2.92255694121055, lng: -41.75427815105528 } },
          { location: { lat: -2.9214050907956626, lng: -41.754256693189525 } },
          { location: { lat: -2.909837945994983, lng: -41.75367942459697 } },
          { location: { lat: -2.909750886562799, lng: -41.75360029943049 } },
          { location: { lat: -2.9096397183432976, lng: -41.75355201965167 } },
          { location: { lat: -2.9095164957557142, lng: -41.75361236936023 } },
          { location: { lat: -2.9094789932667555, lng: -41.75375452644605 } },
          { location: { lat: -2.90950845956443, lng: -41.75387656695203 } },
          { location: { lat: -2.909389108616155, lng: -41.75541123521259 } },
          { location: { lat: -2.9092248326066277, lng: -41.75959821692646 } },
          { location: { lat: -2.9089365050430183, lng: -41.76604883266247 } },
          { location: { lat: -2.908595663889159, lng: -41.77351284543938 } },
        ],
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

}

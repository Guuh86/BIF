import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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
export class MapsPage implements OnInit, OnDestroy {

  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  private map!: google.maps.Map;
  marker!: google.maps.Marker;
  private intervalId: any;

  drawnPolyline: google.maps.Polyline | null = null;
  directionsService = new google.maps.DirectionsService();

  showMarkers = false;
  markers: google.maps.Marker[] = [];

  constructor(
    private locationService: LocationService
  ) { }

  async ngOnInit() { }

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
      { lat: -2.947877, lng: -41.731758 },
      { lat: -2.949046, lng: -41.730615 },
      { lat: -2.9359248990124276, lng: -41.730129427642794 },
      { lat: -2.9443748872818243, lng: -41.7283460498024 },
      { lat: -2.92032195263953, lng: -41.73012274852487 },
      { lat: -2.919783507251914, lng: -41.742534253106925 },
    ];

    this.markers = locations.map(
      (pos) =>
        new google.maps.Marker({
          position: pos,
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
  }

  toggleMarkers() {
    if (this.showMarkers) {
      this.animateMarkersDrop();
    } else {
      this.markers.forEach((m) => {
        m.setMap(null);
        m.setAnimation(null);
      });
    }
  }

  animateMarkersDrop() {
    this.markers.forEach((marker, i) => {
      setTimeout(() => {
        marker.setMap(this.map);
        marker.setAnimation(google.maps.Animation.DROP);
      }, i * 150);
    });
  }

  bounceMarker(marker: google.maps.Marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 2000);
  }

  drawIfpiRoute() {
    if (this.drawnPolyline) {
      this.drawnPolyline.setMap(null);
      this.drawnPolyline = null;
    }

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
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          const path = result.routes[0].overview_path;
          const bounds = result.routes[0].bounds;

          this.map.fitBounds(bounds);

          this.drawnPolyline = new google.maps.Polyline({
            path: [],
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: this.map,
          });

          let step = 0;
          const interval = setInterval(() => {
            if (step < path.length) {
              this.drawnPolyline!.getPath().push(path[step]);
              step++;
            } else {
              clearInterval(interval);
            }
          }, 17);
        } else {
          console.error('Erro ao calcular rota:', status);
        }
      }
    );
  }

  drawWagnerRoute() {
    if (this.drawnPolyline) {
      this.drawnPolyline.setMap(null);
      this.drawnPolyline = null;
    }

    this.directionsService.route(
      {
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
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          const path = result.routes[0].overview_path;
          const bounds = result.routes[0].bounds;

          this.map.fitBounds(bounds);

          this.drawnPolyline = new google.maps.Polyline({
            path: [],
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: this.map,
          });

          let step = 0;
          const interval = setInterval(() => {
            if (step < path.length) {
              this.drawnPolyline!.getPath().push(path[step]);
              step++;
            } else {
              clearInterval(interval);
            }
          }, 17);
        } else {
          console.error('Erro ao calcular rota:', status);
        }
      }
    );
  }
}

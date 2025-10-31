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

  ngOnInit() { }

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

    try {
      const result = await this.directionsRoutePromise({
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
    if (this.polylineIntervalId) {
      clearInterval(this.polylineIntervalId);
      this.polylineIntervalId = null;
    }

    try {
      const result = await this.directionsRoutePromise({
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

  locations = [
    { lat: -2.9105388673732775, lng: -41.75363791122939, title: 'Premium Barbearia' },
    { lat: -2.909399850703596, lng: -41.754568174499965, title: 'UFDPar' },
    { lat: -2.9090531987900605, lng: -41.76056850667942, title: 'Carvalho Supermercado - São Sebastião' },
    { lat: -2.9088861855462014, lng: -41.76557476812334, title: 'Léo Informática' },
    { lat: -2.908568256061045, lng: -41.7730000255458, title: 'Igreja São Sebastião' },
    { lat: -2.908346487088809, lng: -41.78046254451946, title: 'Funeral Prev' },
    { lat: -2.914763813193808, lng: -41.780610417244596, title: 'Central de Flagrantes' },
    { lat: -2.916550717862867, lng: -41.77853197143502, title: 'Padaria - Nova Parnaíba' },
    { lat: -2.916823687204202, lng: -41.77361753371875, title: 'Corpo de Bombeiros' },
    { lat: -2.916948118055292, lng: -41.7718467152921, title: 'Pousada Roma' },
    { lat: -2.917650387711384, lng: -41.76868463556799, title: 'Salão Social' },
    { lat: -2.9212269979516012, lng: -41.76283876313319, title: 'Márcia Boutique' },
    { lat: -2.9238240829894226, lng: -41.75974761600307, title: 'Bela Opção' },
    { lat: -2.9288241262553365, lng: -41.753410021502404, title: 'Terminal Rodoviário' },
    { lat: -2.9293622051199533, lng: -41.75322898501406, title: 'Frangaria Todo Dia' },
    { lat: -2.9312024284247418, lng: -41.75110154379117, title: 'PHB Rastreamento' },
    { lat: -2.923147813555859, lng: -41.754118196417124, title: 'Parada Sem Nome :(' },
    { lat: -2.919422078935264, lng: -41.754101253483384, title: 'Sempre Bella Cosméticos' },
    //BUS IFPI
    { lat: -2.9275403389654757, lng: -41.72990725194302, title: 'Fórum Desembargador Salmon Lustosa' },
    { lat: -2.920598783713492, lng: -41.729851505194645, title: 'Espetinho II Irmãos' },
    { lat: -2.920113675683989, lng: -41.734319156905784, title: 'Lac Lanches - Conjunto Betânia' },
    { lat: -2.909837945994983, lng: -41.75367942459697, title: 'Elizeu Martins - Av. João Silva Filho' },
    { lat: -2.919385011571612, lng: -41.7505285764135, title: 'Cemitério - Av. João Silva Filho' },
    { lat: -2.9193346621209297, lng: -41.75134849234292, title: 'Pet Rações' },
    { lat: -2.919227180211744, lng: -41.75325562506041, title: 'Cruzamento R. Horizonte e Av. João Silva Filho' },
  ];

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

    this.locations.forEach((loc) => {
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

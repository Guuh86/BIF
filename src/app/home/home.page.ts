import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  map: any;
  userMarker: google.maps.Marker | null = null;
  private watchId: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alert: AlertController
  ) { }

  ngOnInit(): void { }

  async ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15,
      center: { lat: -2.9115717367163416, lng: -41.75890300847825 },
      disableDefaultUI: true,
    });
  }

}


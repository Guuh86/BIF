import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class InfoPage implements OnInit {

  deviceModel: string | undefined;

  constructor() { }

  async ngOnInit() {
    const info = await Device.getInfo();
    console.log('Device info:', info);
    this.deviceModel = info.model;
  }
}

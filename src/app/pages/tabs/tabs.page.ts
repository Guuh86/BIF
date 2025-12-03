import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonTabs } from "@ionic/angular";

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule,
    FormsModule
  ]
})
export class TabsPage implements OnInit {

  @ViewChild('tabs', { static: true }) tabs !: IonTabs;
  selectedTab: any;

  constructor() { }

  ngOnInit() {
  }

  setCurrentTab(){
    this.selectedTab = this.tabs.getSelected;
  }

}

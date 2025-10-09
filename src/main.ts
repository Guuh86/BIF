import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth, browserLocalPersistence } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

addIcons(allIcons);

export const firebaseConfig = {
  apiKey: "AIzaSyDwTfAQCmOC4AAktZydDchN07h1y47nYi0",
  authDomain: "busif-7c277.firebaseapp.com",
  databaseURL: "https://busif-7c277-default-rtdb.firebaseio.com",
  projectId: "busif-7c277",
  storageBucket: "busif-7c277.appspot.com",
  messagingSenderId: "611590824958",
  appId: "1:611590824958:web:dbe82a77aae266114d96af",
  measurementId: "G-V0SF12RWQT"
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => {
      const auth = getAuth();
      auth.setPersistence(browserLocalPersistence);
      return auth;
    }),
    provideDatabase(() => getDatabase()),
  ],
});

import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, set, get, child, getDatabase, onValue } from '@angular/fire/database';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})

export class LocationService {
  private isTracking = false;
  private watchId: string | null = null;

  constructor(
    private auth: Auth,
    private db: Database
  ) { }

  async startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    const user = this.auth.currentUser;
    if (!user) {
      console.error('Usuário não logado. Rastreamento não iniciado.');
      this.isTracking = false;
      return;
    }

    const platform = Capacitor.getPlatform();

    this.watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      },
      async (pos: Position | null, err?: any) => {
        if (err) {
          console.error('Erro ao obter localização:', err);
          return;
        }
        if (!pos) return;

        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          user: user.uid
        };

        try {
          await set(ref(this.db, `locations`), coords);
          console.log(`(${platform}) Localização enviada:`, coords);
        } catch (dbErr) {
          console.error('Erro ao salvar localização:', dbErr);
        }
      }
    );

    console.log(`Rastreamento iniciado (${platform})`);
  }


  async getBusLocation(): Promise<any> {
    try {
      const snapshot = await get(ref(this.db, `locations/`));

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Localização lida do Firebase:', data);
        return data;
      } else {
        console.log('Nenhuma localização encontrada.');
        return null;
      }
    } catch (err) {
      console.error('Erro ao ler localização:', err);
      return null;
    }
  }

  listenBusLocation(callback: (data: any) => void) {
    const locationRef = ref(this.db, 'locations');

    onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
  }

  async getWaypoints(dbName: any) {
    const dbRef = ref(this.db);
    const snapshot = await get(child(dbRef, `${dbName}`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data).map((loc: any) => loc.location);
    } else {
      return [];
    }
  }

  async getMarkers() {
    const db = getDatabase();
    const snapshot = await get(ref(db, 'mapMarkers'));
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  async stopTracking() {
    this.isTracking = false;

    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    console.log('Rastreamento parado');
  }
}

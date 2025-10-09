import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, set, get } from '@angular/fire/database';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device'; // <--- Import do plugin

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private isTracking = false;
  private watchId: string | null = null;

  constructor(
    private auth: Auth,
    private db: Database
  ) {}

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

        const deviceInfo = await Device.getId();
    const deviceId = deviceInfo.identifier;

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
          user: user.uid, 
          device: deviceId 
        };

        try {
          await set(ref(this.db, `locations/${deviceId}`), coords);
          console.log(`(${platform}) Localização enviada com ID do dispositivo:`, coords);
        } catch (dbErr) {
          console.error('Erro ao salvar localização:', dbErr);
        }
      }
    );

    console.log(`Rastreamento iniciado (${platform})`);
  }

  async getBusLocation(): Promise<any> {
    const deviceInfo = await Device.getId();
    const deviceId = deviceInfo.identifier;

    try {
      const snapshot = await get(ref(this.db, `locations/${deviceId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Localização lida do Firebase:', data);
        return data;
      } else {
        console.log('Nenhuma localização encontrada para este dispositivo.');
        return null;
      }
    } catch (err) {
      console.error('Erro ao ler localização:', err);
      return null;
    }
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

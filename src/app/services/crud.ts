import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

export interface UserData {
  nome: string;
  cpf: string;
  email: string;
  fotoUrl: string;
}

@Injectable({
  providedIn: 'root'
})

export class CrudService {
  constructor(private firestore: Firestore) { }

  async createOrUpdateUser(user: UserData) {
    const ref = doc(this.firestore, `users/${user.cpf}`);
    await setDoc(ref, user, { merge: true });
  }

  async getUserByCpf(cpf: string): Promise<UserData | null> {
    const ref = doc(this.firestore, `users/${cpf}`);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserData) : null;
  }  
}

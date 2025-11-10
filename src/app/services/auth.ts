import { Injectable } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { CrudService } from './crud';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUser$ = new BehaviorSubject<User | null>(null);
  private loaded = false;

  constructor(private auth: Auth, private crud: CrudService) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser$.next(user);
      this.loaded = true;
    });
  }

  async loginWithCpf(cpf: string, password: string) {
    const user = await this.crud.getUserByCpf(cpf);
    if (!user) throw new Error('Usuário não encontrado');

    return signInWithEmailAndPassword(this.auth, user.email, password);
  }

  async loginWithMatricula(matricula: string, password: string) {
    const user = await this.crud.getUserByMatricula(matricula);
    if (!user) throw new Error('Usuário não encontrado');

    return signInWithEmailAndPassword(this.auth, user.email, password);
  }

  async logout() {
    await signOut(this.auth);
    this.currentUser$.next(null);
  }

  get user(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getUserId(): string | null {
    const user = this.currentUser$.getValue();
    return user ? user.uid : null;
  }

  async waitForAuthState(): Promise<User | null> {
    return new Promise(resolve => {
      const check = () => {
        if (this.loaded) {
          resolve(this.currentUser$.value);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

}

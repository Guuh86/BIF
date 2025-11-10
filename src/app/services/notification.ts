import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, orderBy } from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

export interface Aviso {
  id?: string;
  tipo: 'inicio_rota' | 'fim_rota' | 'imprevisto' | 'noroute';
  mensagem: string;
  timestamp: any;
  criadoPor: string;
}

@Injectable({ providedIn: 'root' })

export class NotificationService {

  constructor(private firestore: Firestore) { }

  async createNotification(
    tipo: Aviso['tipo'],
    criadoPor: string
  ) {
    let mensagem: string;

    switch (tipo) {
      case 'inicio_rota':
        mensagem = 'Uma rota foi iniciada! Fique atento ao mapa.';
        break;
      case 'fim_rota':
        mensagem = 'A rota foi finalizada com sucesso! Alunos, fiquem atentos aos seus pertences.';
        break;
      case 'imprevisto':
        mensagem = 'Atenção! Ocorreu um imprevisto durante a rota.';
        break;
      case 'noroute':
        mensagem = 'Não há rota ativa no momento.';
        break;
      default:
        mensagem = 'Aviso do sistema.';
        break;
    }

    const avisosRef = collection(this.firestore, 'notifications');

    return await addDoc(avisosRef, {
      tipo,
      mensagem,
      timestamp: serverTimestamp(),
      criadoPor
    } as Aviso);
  }


  getNotification() {
    const avisosRef = collection(this.firestore, 'notifications');
    const q = query(avisosRef, orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Aviso[]>;
  }
}

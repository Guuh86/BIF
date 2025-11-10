import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  setDoc,
  docData,
  collectionData
} from '@angular/fire/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface ReportData {
  title: string;
  desc: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private firestore: Firestore) { }

  async uploadImage(file: File, onProgress: (percent: number) => void): Promise<string> {
    const storage = getStorage();
    const filePath = `reports/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        error => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async createReport(rep: ReportData, userId: any) {
    const userReportsRef = collection(this.firestore, `reports/${userId}/userReports`);
    const docRef = await addDoc(userReportsRef, rep);
    console.log('Report criado com ID:', docRef.id);
    return docRef.id;
  }

  getMyReports(userId: any): Observable<ReportData[]> {
    const userReportsRef = collection(this.firestore, `reports/${userId}/userReports`);
    return collectionData(userReportsRef, { idField: 'id' }) as Observable<ReportData[]>;
  }

  getReportById(id: any): Observable<ReportData | null> {
    const ref = doc(this.firestore, `reports/${id}`);
    return docData(ref) as Observable<ReportData | null>;
  }

  async getAllReports(): Promise<ReportData[]> {
    const ref = collection(this.firestore, 'reports');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => doc.data() as ReportData);
  }
}

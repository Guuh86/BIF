import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs,

} from '@angular/fire/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

export interface ReportData {
  title: string;
  desc: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private firestore: Firestore) {}

  // Recebe um callback para informar o progresso (%)
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

  async createReport(rep: ReportData) {
    const ref = collection(this.firestore, 'reports');
    const docRef = await addDoc(ref, rep);
    console.log('Novo ID:', docRef.id);
    return docRef.id;
  }

  async getReportById(id: string): Promise<ReportData | null> {
    const ref = doc(this.firestore, `reports/${id}`);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as ReportData) : null;
  }

  async getAllReports(): Promise<ReportData[]> {
    const ref = collection(this.firestore, 'reports');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => doc.data() as ReportData);
  }
}

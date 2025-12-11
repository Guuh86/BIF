import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ReportService, ReportData } from '../services/report';
import { getAuth } from 'firebase/auth';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class InfoPage implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  deviceModel: string | undefined;
  reportForm!: FormGroup;
  selectedFile!: File | null;
  uploadProgress: number = 0;

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private reportService: ReportService,
    private toastCtrl: ToastController
  ) {
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      desc: ['', Validators.required],
      imageUrl: ['']
    });
  }

  async ngOnInit() {
    const info = await Device.getInfo();
    console.log('Device info:', info);
    this.deviceModel = info.model;
  }

  selectedFileName: any;

  triggerFileInput() {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    input.click();
  }

  fileSelected(event: any) {
    const file = event.target.files[0];
    console.log("FILE:", file);
    this.selectedFileName = file ? file.name : null;
    if (file) this.selectedFile = file;
  }

  async saveReport() {
    if (!this.reportForm.valid) {
      console.log('Formulário inválido');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando relatório...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      let imageUrl = '';

      if (this.selectedFile) {
        imageUrl = await this.reportService.uploadImage(this.selectedFile, (progress) => {
          this.uploadProgress = Math.round(progress);
          loading.message = `Enviando imagem... ${this.uploadProgress}%`;
        });
      }

      const data: ReportData = {
        ...this.reportForm.value,
        imageUrl
      };


      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      await this.reportService.createReport(data, uid);

      this.reportForm.reset();
      this.selectedFile = null;
      if (this.fileInput) this.fileInput.nativeElement.value = '';

      this.showToast('Erro relatado com sucesso! Obrigado por ajudar o BusIF');
    } catch (err) {
      console.error(err);
      this.showToast('Ocorreu um erro ao enviar o relatório.');
      this.closeModal();
    } finally {
      loading.dismiss();
      this.closeModal();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      duration: 1800,
      message
    });
    await toast.present();
  }

  closeModal() {
    const modal = document.querySelector('#modalBug') as HTMLIonModalElement;
    modal?.dismiss();
  }
}

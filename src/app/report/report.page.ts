import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { ReportService, ReportData } from '../services/report';
import { CommonModule } from '@angular/common';
import { getAuth } from 'firebase/auth';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ReportPage implements OnInit {

  reportForm!: FormGroup;
  selectedFile!: File | null;
  uploadProgress: number = 0;
  myReports: any;

  isModalOpen = false;
  modalData: any;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) { }

  ngOnInit() {
    this.getMyReports();
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      desc: ['', Validators.required],
      imageUrl: ['']
    });
  }

  setOpen(isOpen: boolean, data?: any) {
    this.isModalOpen = isOpen;
    if (data) {
      this.modalData = data;
    }
  }

  getMyReports() {
    const userX = this.authService.getUserId();
    console.log(userX);

    this.reportService.getMyReports(userX).subscribe(reports => {
      this.myReports = reports;
      console.log('Relatórios em tempo real:', this.myReports);
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
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
    } finally {
      loading.dismiss();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      duration: 1800,
      message
    });
    await toast.present();
  }
}

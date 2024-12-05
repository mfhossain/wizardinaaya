import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaintingComponent } from '../painting/painting.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faHeart } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, PaintingComponent, FontAwesomeModule],
  template: `
    <div class="camera-container">
      <div class="wizard-section" *ngIf="!isVideoPlaying && !capturedImage">
        <img src="assets/wizard_inaaya.png" alt="Inaaya Wizard" class="wizard-image">
        <button (click)="startCamera()" class="cute-button">
          <div class="button-content">
            <fa-icon [icon]="cameraIcon" class="camera-icon"></fa-icon>
            <div class="hearts">
              <fa-icon [icon]="heartIcon" class="heart heart1"></fa-icon>
              <fa-icon [icon]="heartIcon" class="heart heart2"></fa-icon>
              <fa-icon [icon]="heartIcon" class="heart heart3"></fa-icon>
            </div>
            <span>Click to Open Camera</span>
          </div>
        </button>
      </div>

      <video #video [hidden]="!isVideoPlaying" class="camera-preview"></video>
      <canvas #canvas hidden></canvas>

      <div class="camera-controls" *ngIf="isVideoPlaying">
        <button (click)="capturePhoto()" class="action-button">Take Photo</button>
      </div>
      <div class="camera-controls" *ngIf="capturedImage">
        <button (click)="retakePhoto()" class="action-button">Retake Photo</button>
      </div>

      <div *ngIf="capturedImage" class="captured-content">
        <img [src]="capturedImage" class="captured-image" />
        <app-painting [baseImage]="capturedImage"></app-painting>
      </div>
    </div>
  `,
  styles: [`
    .camera-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .wizard-section {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      width: 100%;
      max-width: 640px;
    }

    .wizard-image {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);
    }

    .camera-preview {
      width: 100%;
      max-width: 640px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .camera-controls {
      margin: 1rem 0;
      display: flex;
      gap: 1rem;
    }

    .cute-button {
      padding: 1.5rem 2rem;
      background: linear-gradient(45deg, #9370DB, #800080);
      border: none;
      border-radius: 50px;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      transition: transform 0.3s, box-shadow 0.3s;
      box-shadow: 0 4px 15px rgba(128, 0, 128, 0.3);
      animation: pulse 2s infinite;
      margin-top: -1rem;
    }

    .cute-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(128, 0, 128, 0.4);
    }

    .button-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .camera-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .hearts {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .heart {
      position: absolute;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
    }

    .heart1 {
      animation: float1 3s ease-in-out infinite;
    }

    .heart2 {
      animation: float2 4s ease-in-out infinite;
    }

    .heart3 {
      animation: float3 3.5s ease-in-out infinite;
    }

    .action-button {
      padding: 0.5rem 1rem;
      background-color: #800080;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }

    .action-button:hover {
      background-color: #9370DB;
    }

    .captured-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      max-width: 640px;
    }

    .captured-image {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes float1 {
      0%, 100% { transform: translate(-20px, -20px); }
      50% { transform: translate(-10px, -30px); }
    }

    @keyframes float2 {
      0%, 100% { transform: translate(20px, -20px); }
      50% { transform: translate(30px, -30px); }
    }

    @keyframes float3 {
      0%, 100% { transform: translate(0, -20px); }
      50% { transform: translate(0, -30px); }
    }
  `]
})
export class CameraComponent implements OnInit, OnDestroy {
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  isVideoPlaying = false;
  capturedImage: string | null = null;

  // Font Awesome icons
  cameraIcon = faCamera;
  heartIcon = faHeart;

  ngOnInit() {
    this.video = document.querySelector('video')!;
    this.canvas = document.querySelector('canvas')!;
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user'
        }
      });

      this.video.srcObject = this.stream;
      this.video.play();
      this.isVideoPlaying = true;
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  }

  capturePhoto() {
    if (!this.isVideoPlaying) return;

    const context = this.canvas.getContext('2d')!;
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.capturedImage = this.canvas.toDataURL('image/png');

    this.stopCamera();
  }

  retakePhoto() {
    this.capturedImage = null;
    this.startCamera();
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isVideoPlaying = false;
    this.video.srcObject = null;
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}

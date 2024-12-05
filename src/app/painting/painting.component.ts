import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaintBrush, faEraser, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-painting',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="painting-container">
      <canvas #paintCanvas class="paint-canvas"></canvas>
      <div class="controls">
        <div class="brush-controls">
          <div class="color-group">
            <button 
              *ngFor="let color of colors" 
              [style.background-color]="color"
              [class.selected]="brushColor === color"
              (click)="selectColor(color)" 
              class="color-button">
            </button>
          </div>
          <div class="size-group">
            <input 
              type="range" 
              [(ngModel)]="brushSize" 
              min="1" 
              max="50" 
              (input)="updateBrushSize()">
            <span>{{brushSize}}px</span>
          </div>
        </div>
        <div class="action-buttons">
          <button (click)="clearCanvas()" class="icon-button">
            <fa-icon [icon]="eraserIcon"></fa-icon>
            Clear
          </button>
          <button (click)="saveImage()" class="icon-button">
            <fa-icon [icon]="saveIcon"></fa-icon>
            Save
          </button>
          <button (click)="undoLastStroke()" class="icon-button" [disabled]="!canUndo">
            <fa-icon [icon]="undoIcon"></fa-icon>
            Undo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .painting-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .paint-canvas {
      border: 1px solid #ccc;
      border-radius: 8px;
      cursor: crosshair;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      width: 100%;
    }

    .brush-controls {
      display: flex;
      gap: 2rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      padding: 1rem;
      border-radius: 8px;
      width: 100%;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .color-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-button {
      width: 40px;
      height: 40px;
      border: 2px solid #fff;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s, border-color 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .color-button:hover {
      transform: scale(1.1);
    }

    .color-button.selected {
      border-color: #333;
      transform: scale(1.1);
    }

    .size-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .icon-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #FF1493;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .icon-button:hover {
      background-color: #FF69B4;
    }

    .icon-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    input[type="range"] {
      width: 100px;
    }
  `]
})
export class PaintingComponent implements AfterViewInit {
  @ViewChild('paintCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() baseImage: string = '';

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private strokes: ImageData[] = [];
  private currentStroke: ImageData | null = null;

  colors = ['#FF69B4', '#FF0000', '#800080']; // Pink, Red, Purple
  brushColor = '#FF69B4'; // Default to pink
  brushSize = 5;
  canUndo = false;

  // Font Awesome icons
  brushIcon = faPaintBrush;
  eraserIcon = faEraser;
  saveIcon = faSave;
  undoIcon = faUndo;

  selectColor(color: string) {
    this.brushColor = color;
    this.updateBrushColor();
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Load the base image
    if (this.baseImage) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        // Save initial state
        this.saveState();
      };
      img.src = this.baseImage;
    }

    this.setupEventListeners();
  }

  private setupEventListeners() {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => this.draw(e));
    canvas.addEventListener('mouseup', () => this.stopDrawing());
    canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.startDrawing(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.draw(mouseEvent);
    });

    canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  private startDrawing(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.isDrawing = true;
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    
    // Save the current state before starting a new stroke
    this.currentStroke = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  private stopDrawing() {
    if (this.isDrawing && this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.canUndo = true;
    }
    this.isDrawing = false;
  }

  updateBrushColor() {
    this.ctx.strokeStyle = this.brushColor;
  }

  updateBrushSize() {
    this.ctx.lineWidth = this.brushSize;
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the base image
    if (this.baseImage) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
        this.saveState();
      };
      img.src = this.baseImage;
    }
    this.canUndo = false;
    this.strokes = [];
  }

  private saveState() {
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.strokes = [imageData];
    this.canUndo = false;
  }

  undoLastStroke() {
    if (this.strokes.length > 1) {
      this.strokes.pop(); // Remove the last stroke
      const canvas = this.canvasRef.nativeElement;
      this.ctx.putImageData(this.strokes[this.strokes.length - 1], 0, 0);
      this.canUndo = this.strokes.length > 1;
    }
  }

  saveImage() {
    const canvas = this.canvasRef.nativeElement;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'painted-photo.png';
    link.href = image;
    link.click();
  }
}

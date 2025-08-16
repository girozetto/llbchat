import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModelPullProgress,
  OllamaModel,
} from '../../core/interfaces/ollama.interface';
import { OllamaService } from '../../core/services/ollama.service';

@Component({
  selector: 'app-model-manager',
  imports: [CommonModule, FormsModule],
  templateUrl: './model-manager.component.html',
  styleUrl: './model-manager.component.css',
})
export class ModelManagerComponent implements OnInit {
  models: OllamaModel[] = [];
  newModelName = '';
  isPulling = false;
  pullProgress: ModelPullProgress | null = null;
  isDeleting = new Set<string>();

  constructor(private ollamaService: OllamaService) {}

  ngOnInit() {
    this.refreshModels();
  }

  async refreshModels() {
    this.models = await this.ollamaService.getModels();
  }

  async pullModel() {
    if (!this.newModelName.trim() || this.isPulling) return;

    this.isPulling = true;
    this.pullProgress = null;

    try {
      const progressStream = await this.ollamaService.pullModel(
        this.newModelName.trim()
      );

      progressStream.subscribe({
        next: (progress) => {
          this.pullProgress = progress;
        },
        complete: () => {
          this.isPulling = false;
          this.newModelName = '';
          this.pullProgress = null;
          this.refreshModels();
        },
        error: (error) => {
          console.error('Erro ao baixar modelo:', error);
          this.isPulling = false;
          this.pullProgress = null;
        },
      });
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      this.isPulling = false;
    }
  }

  async deleteModel(modelName: string) {
    if (this.isDeleting.has(modelName)) return;

    this.isDeleting.add(modelName);
    const success = await this.ollamaService.deleteModel(modelName);

    if (success) {
      await this.refreshModels();
    }

    this.isDeleting.delete(modelName);
  }

  getProgressPercentage(): number {
    if (!this.pullProgress?.total || !this.pullProgress?.completed) {
      return 0;
    }
    return Math.round(
      (this.pullProgress.completed / this.pullProgress.total) * 100
    );
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

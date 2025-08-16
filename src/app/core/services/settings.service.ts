import { Injectable, signal, VERSION } from '@angular/core';
import { AppSettings } from '../interfaces/app-settings.interface';
import { OllamaService } from './ollama.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'ollama-settings';

  // defaults
  private readonly defaultSettings: AppSettings = {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: '',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    theme: 'light',
    autoScroll: true,
    showTimestamps: true,
    streamingEnabled: true,
  };

  // state reativo
  settings = signal<AppSettings>(this.loadSettingsFromStorage());
  browserInfo = signal(this.detectBrowserInfo());
  angularInfo = signal(this.getAngularVersion());

  constructor() {}

  /** Carregar configs do localStorage */
  private loadSettingsFromStorage(): AppSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...this.defaultSettings, ...JSON.parse(saved) };
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    }
    return this.defaultSettings;
  }

  /** Salvar configs no localStorage */
  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      this.settings.set(settings);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  }

  /** Resetar para defaults */
  resetToDefaults() {
    this.settings.set(this.defaultSettings);
    this.saveSettings(this.defaultSettings);
  }

  /** Exportar para arquivo JSON */
  exportSettings() {
    const dataStr = JSON.stringify(this.settings(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ollama-settings.json';
    link.click();
  }

  /** Importar de arquivo JSON */
  importSettings(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const merged = { ...this.settings(), ...imported };
        this.saveSettings(merged);
      } catch (err) {
        console.error('Erro ao importar configurações:', err);
      }
    };
    reader.readAsText(file);
  }

  /** Limpar cache/localStorage */
  clearCache() {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.clear();
    this.resetToDefaults();
  }

  /** Detectar navegador */
  private detectBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Desconhecido';
  }

  private getAngularVersion(): string {
    return VERSION.full;
  }
}

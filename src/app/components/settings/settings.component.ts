import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { OllamaService } from '../../core/services/ollama.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  constructor(
    public settingsService: SettingsService,
    public ollamaService: OllamaService
  ) {
    this.ollamaService.checkConnection();
  }

  // acesso direto ao signal
  get settings() {
    return this.settingsService.settings();
  }

  onSave() {
    this.settingsService.saveSettings(this.settings);
    alert('Configurações salvas com sucesso!');
  }

  onReset() {
    if (confirm('Restaurar configurações padrão?')) {
      this.settingsService.resetToDefaults();
    }
  }

  onExport() {
    this.settingsService.exportSettings();
  }

  onImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.settingsService.importSettings(file);
      alert('Configurações importadas!');
    }
  }

  onClearCache() {
    if (confirm('Limpar todo o cache?')) {
      this.settingsService.clearCache();
      alert('Cache limpo com sucesso!');
      location.reload();
    }
  }
}

import { Component } from '@angular/core';
import { SettingsComponent } from './components/settings/settings.component';
import { ModelManagerComponent } from './components/model-manager/model-manager.component';
import { ChatComponent } from './components/chat/chat.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ChatComponent,
    ModelManagerComponent,
    SettingsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  activeTab: 'chat' | 'models' | 'settings' = 'chat';
  version = 'LLGZChat-v1.0';
}

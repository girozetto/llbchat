import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  ChatMessage,
  OllamaModel,
} from '../../core/interfaces/ollama.interface';
import { OllamaService } from '../../core/services/ollama.service';
import { SettingsService } from '../../core/services/settings.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  inputMessage = '';
  selectedModel = '';
  models: OllamaModel[] = [];
  isStreaming = false;
  streamingContent = '';
  streamingThought = '';
  streamingAnswer = '';

  thoughtsAccordionExpanded = false;

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    public ollamaService: OllamaService,
    public settingsService: SettingsService
  ) {
    // efeito reativo: se settings mudar, sincroniza no componente
    effect(() => {
      const s = this.settingsService.settings();
      this.selectedModel = s.defaultModel || this.selectedModel;
      this.shouldScrollToBottom = s.autoScroll;
    });
  }

  async ngOnInit() {
    const isConnected = await this.ollamaService.checkConnection();

    this.subscriptions.push(
      this.ollamaService.getModelsObservable().subscribe((models) => {
        this.models = models;

        // se há defaultModel nas configs, usa ele
        const defaultModel = this.settingsService.settings().defaultModel;

        if (defaultModel && models.some((m) => m.name === defaultModel)) {
          this.selectedModel = defaultModel;
        } else if (models.length && !this.selectedModel) {
          this.selectedModel = models[0].name;
        }
      })
    );

    if (isConnected) await this.refreshModels();
  }

  ngAfterViewChecked() {
    if (
      this.shouldScrollToBottom &&
      this.settingsService.settings().autoScroll
    ) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async refreshModels() {
    await this.ollamaService.getModels();
  }

  onModelChange() {
    // salva modelo escolhido nas configs
    const s = {
      ...this.settingsService.settings(),
      defaultModel: this.selectedModel,
    };
    this.settingsService.saveSettings(s);
  }

  clearChat() {
    this.messages = [];
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private processText(text: string): { thoughts: string; response: string } {
    let thoughts = '';
    let response = '';
    console.log('Processing text:', text);
    // Extrair todos os blocos <think>...</think>
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    let match;
    while ((match = thinkRegex.exec(text))) {
      thoughts += match[1].trim() + ' ';
    }

    // Identificar se há um bloco <think> aberto sem fechamento
    const openThinkRegex = /<think>([\s\S]*)$/;
    const openMatch = text.match(openThinkRegex);
    if (openMatch) {
      thoughts += openMatch[1].trim();
      text = text.replace(openThinkRegex, '').trim();
    }

    // Remover os blocos <think>...</think> do texto original para obter a resposta
    response = text.replace(thinkRegex, '').trim();
    console.log('Extracted thoughts:', thoughts);
    console.log('Extracted response:', response);
    return {
      thoughts: thoughts.trim(),
      response,
    };
  }

  async sendMessage() {
    const settings = this.settingsService.settings();

    if (!this.inputMessage.trim() || !this.selectedModel || this.isStreaming) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.inputMessage.trim(),
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    this.inputMessage = '';
    this.isStreaming = true;
    this.streamingContent = '';
    this.streamingThought = '';
    this.streamingAnswer = '';
    this.shouldScrollToBottom = true;

    try {
      // decide se vai usar streaming ou não conforme configs
      if (settings.streamingEnabled) {
        const stream = await this.ollamaService.chatWithStreaming({
          model: this.selectedModel,
          messages: this.messages.slice(),
        });

        this.subscriptions.push(
          stream.subscribe({
            next: (chunk) => {
              this.streamingContent += chunk;
              const result = this.processText(this.streamingContent);
              this.streamingThought = result.thoughts;
              this.streamingAnswer = result.response;
              this.shouldScrollToBottom = true;
            },
            complete: () => {
              this.pushAssistantMessage(this.streamingContent);
            },
            error: (error) => {
              console.error('Erro no streaming:', error);
              this.pushAssistantMessage(
                'Erro ao processar mensagem. Verifique se o Ollama está rodando.'
              );
            },
          })
        );
      } else {
        // fallback sem streaming
        const response = await firstValueFrom(
          this.ollamaService.chat({
            model: this.selectedModel,
            messages: this.messages.slice(),
            options: {
              temperature: settings.temperature,
              top_p: settings.topP,
              top_k: settings.topK,
              num_ctx: settings.maxTokens,
            },
          })
        );

        this.pushAssistantMessage(
          response?.message?.content || 'Sem resposta.'
        );
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      this.isStreaming = false;
    }
  }

  private pushAssistantMessage(content: string) {
    const { response, thoughts } = this.processText(content);
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      thought: thoughts,
      content: response,
      timestamp: new Date(),
    };
    this.messages.push(assistantMessage);
    this.streamingContent = '';
    this.streamingThought = '';
    this.streamingAnswer = '';
    this.isStreaming = false;
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Erro ao rolar para baixo:', err);
    }
  }

  toggleThoughtsAccordion() {
    this.thoughtsAccordionExpanded = !this.thoughtsAccordionExpanded;
  }
}

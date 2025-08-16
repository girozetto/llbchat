import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, Subject, BehaviorSubject } from 'rxjs';

import {
  OllamaModel,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  ModelPullProgress,
} from '../interfaces/ollama.interface';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class OllamaService {
  private defaultBaseUrl = 'http://localhost:11434/api';

  // Signals
  connectionStatus = signal(false);
  private modelsSubject = new BehaviorSubject<OllamaModel[]>([]);

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) {
    this.checkConnection();
  }

  get baseUrl(): string {
    return (
      `${this.settingsService.settings().ollamaUrl}/api` || this.defaultBaseUrl
    );
  }

  // ✅ Verificar conexão
  async checkConnection(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/tags`));
      this.connectionStatus.set(true);
      return true;
    } catch {
      this.connectionStatus.set(false);
      return false;
    }
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/tags`)
      );

      const models = response?.models || [];
      this.modelsSubject.next(models);
      return models;
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      return [];
    }
  }

  // ✅ Listar modelos
  getModelsObservable(): Observable<OllamaModel[]> {
    return this.modelsSubject.asObservable();
  }

  // ✅ Monta request com settings aplicados
  private applySettingsToRequest(
    request: Partial<OllamaChatRequest | OllamaGenerateRequest>
  ) {
    const s = this.settingsService.settings();

    return {
      ...request,
      options: {
        temperature: s.temperature,
        top_p: s.topP,
        top_k: s.topK,
        num_predict: s.maxTokens,
        ...(request as any).options, // merge se já veio algo
      },
    };
  }

  // ✅ Chat sem streaming
  chat(request: OllamaChatRequest): Observable<OllamaChatResponse> {
    const finalRequest = this.applySettingsToRequest(request);
    return this.http.post<OllamaChatResponse>(`${this.baseUrl}/chat`, {
      ...finalRequest,
      stream: false,
    });
  }

  // ✅ Chat com streaming (respeita configs)
  async chatWithStreaming(
    request: OllamaChatRequest
  ): Promise<Observable<string>> {
    const s = this.settingsService.settings();
    const finalRequest = this.applySettingsToRequest(request);

    // se streamingEnabled estiver off → cai pro modo não-streaming
    if (!s.streamingEnabled) {
      const resp = await firstValueFrom(
        this.chat(finalRequest as OllamaChatRequest)
      );
      const subject = new Subject<string>();
      subject.next(resp.message?.content ?? '');
      subject.complete();
      return subject.asObservable();
    }

    const streamSubject = new Subject<string>();
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...finalRequest, stream: true }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        this.readStream(reader, decoder, streamSubject);
      }
    } catch (error) {
      console.error('Erro no chat streaming:', error);
      streamSubject.error(error);
    }
    return streamSubject.asObservable();
  }

  // ✅ Geração com streaming
  async generateWithStreaming(
    request: OllamaGenerateRequest
  ): Promise<Observable<string>> {
    const s = this.settingsService.settings();
    const finalRequest = this.applySettingsToRequest(request);

    // se streamingEnabled estiver off → cai pro modo não-streaming
    if (!s.streamingEnabled) {
      const resp: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/generate`, {
          ...finalRequest,
          stream: false,
        })
      );
      const subject = new Subject<string>();
      subject.next(resp.response ?? '');
      subject.complete();
      return subject.asObservable();
    }

    const streamSubject = new Subject<string>();
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...finalRequest, stream: true }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        this.readStream(reader, decoder, streamSubject);
      }
    } catch (error) {
      streamSubject.error(error);
    }
    return streamSubject.asObservable();
  }

  // ✅ Pull de modelo (sem settings)
  async pullModel(modelName: string): Promise<Observable<ModelPullProgress>> {
    const progressSubject = new Subject<ModelPullProgress>();
    try {
      const response = await fetch(`${this.baseUrl}/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        this.readPullStream(reader, decoder, progressSubject);
      }
    } catch (error) {
      progressSubject.error(error);
    }
    return progressSubject.asObservable();
  }

  // ✅ Deletar modelo
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/delete`, {
          body: { name: modelName },
        })
      );
      await this.getModels();
      return true;
    } catch {
      return false;
    }
  }

  // Helpers para streams
  private async readStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    subject: Subject<string>
  ) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              subject.next(data.message.content);
            } else if (data.response) {
              subject.next(data.response);
            }
            if (data.done) {
              subject.complete();
              return;
            }
          } catch {
            console.warn('Erro ao parsear linha:', line);
          }
        }
      }
    } catch (error) {
      subject.error(error);
    } finally {
      reader.releaseLock();
    }
  }

  private async readPullStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    subject: Subject<ModelPullProgress>
  ) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            subject.next(data);
            if (data.status === 'success' || data.error) {
              subject.complete();
              return;
            }
          } catch {
            console.warn('Erro ao parsear progresso:', line);
          }
        }
      }
    } catch (error) {
      subject.error(error);
    } finally {
      reader.releaseLock();
    }
  }
}

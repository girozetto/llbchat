export interface AppSettings {
  ollamaUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  theme: 'light' | 'dark';
  autoScroll: boolean;
  showTimestamps: boolean;
  streamingEnabled: boolean;
}

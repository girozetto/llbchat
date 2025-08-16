export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  thought?: string;
  content: string;
  timestamp?: Date;
}

export interface OllamaChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_ctx?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface ModelPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

# LLBChat with Ollama and Angular

Uma aplicação Angular standalone moderna para interagir com a API do Ollama, oferecendo uma interface completa para chat com modelos de IA.

## ✨ Características

- **Interface Moderna**: Design responsivo e intuitivo
- **Chat em Tempo Real**: Streaming de respostas para uma experiência fluida
- **Gerenciamento de Modelos**: Baixe, visualize e remova modelos Ollama
- **Configurações Avançadas**: Ajuste parâmetros como temperature, top-p, top-k
- **Tema Escuro/Claro**: Interface adaptável às suas preferências
- **Standalone Components**: Arquitetura Angular moderna
- **TypeScript**: Totalmente tipado para melhor desenvolvimento

## 🚀 Instalação e Uso

### Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **Angular CLI** (v17 ou superior)
3. **Ollama** instalado e rodando (https://ollama.ai)

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli

# Verificar se o Ollama está rodando
curl http://localhost:11434/api/tags
```

### Configuração do Projeto

```bash
# Criar novo projeto Angular
ng new ollama-chat --standalone --routing=false --style=css

# Navegar para o diretório
cd ollama-chat

# Instalar dependências
npm install
```

### Estrutura de Arquivos

```
src/
├── app/
│   ├── components/
│   │   ├── chat/
│   │   │   └── chat.component.ts
│   │   ├── model-manager/
│   │   │   └── model-manager.component.ts
│   │   └── settings/
│   │       └── settings.component.ts
│   ├── interfaces/
│   │   └── ollama.interface.ts
│   ├── services/
│   │   └── ollama.service.ts
│   └── app.component.ts
├── main.ts
├── styles.css
└── index.html
```

### Executar a Aplicação

```bash
# Modo desenvolvimento
ng serve

# Com proxy para evitar CORS (recomendado)
ng serve --proxy-config proxy.conf.json

# Acesse http://localhost:4200
```

## 🔧 Configuração do Ollama

### Instalação do Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Baixe o instalador do site oficial
```

### Baixar Modelos

```bash
# Modelos recomendados
ollama pull llama3        # Modelo geral (4.7GB)
ollama pull mistral       # Modelo rápido (4.1GB)
ollama pull codellama     # Para código (3.8GB)
ollama pull phi3          # Modelo leve (2.3GB)

# Listar modelos instalados
ollama list

# Executar Ollama (se não estiver rodando)
ollama serve
```

### Configurar CORS (se necessário)

Se encontrar problemas de CORS, configure o Ollama:

```bash
# Linux/macOS
export OLLAMA_ORIGINS="*"
ollama serve

# Windows
set OLLAMA_ORIGINS=*
ollama serve
```

## 🛠️ Funcionalidades

### 1. Chat Interface

- Streaming de respostas em tempo real
- Histórico de conversas
- Suporte a múltiplas linhas
- Timestamps das mensagens
- Rolagem automática

### 2. Gerenciador de Modelos

- Visualizar modelos instalados
- Baixar novos modelos com barra de progresso
- Remover modelos não utilizados
- Informações detalhadas (tamanho, família, parâmetros)

### 3. Configurações Avançadas

- URL customizada do Ollama
- Parâmetros de geração (temperature, top-p, top-k)
- Tema claro/escuro
- Exportar/importar configurações
- Informações do sistema

## 📡 API do Ollama

A aplicação utiliza as seguintes APIs:

- `GET /api/tags` - Listar modelos
- `POST /api/chat` - Chat com streaming
- `POST /api/generate` - Geração de texto
- `POST /api/pull` - Baixar modelo
- `DELETE /api/delete` - Remover modelo

## 🎨 Personalização

### Temas

Modifique as variáveis CSS em `styles.css`:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
}
```

### Componentes

Todos os componentes são standalone e podem ser facilmente customizados ou reutilizados.

## 🔍 Solução de Problemas

### Ollama não está rodando

```bash
# Verificar status
ps aux | grep ollama

# Iniciar manualmente
ollama serve
```

### Erro de CORS

```bash
# Configurar CORS
export OLLAMA_ORIGINS="http://localhost:4200"
ollama serve
```

### Porta ocupada

```bash
# Usar porta diferente
ng serve --port 4201
```

## 📝 Build para Produção

```bash
# Build otimizado
ng build --configuration production

# Servir arquivos estáticos
npx http-server dist/ollama-chat
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🔗 Links Úteis

- [Ollama Official](https://ollama.ai)
- [Angular Documentation](https://angular.io)
- [TypeScript Documentation](https://typescriptlang.org)

---

**Desenvolvido com ❤️ usando Angular e TypeScript**

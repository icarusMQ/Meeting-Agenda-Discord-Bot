# Discord Meeting Agenda Manager

> Gerencie sugestões de pauta, aprovações e resetamento automático com este bot de Discord.

---

## 🇺🇸 English

### 🚀 Overview

This project implements a Discord bot that:

1. Automatically generates a **weekly agenda** with configurable reset schedule.
2. Allows members to submit agenda suggestions via `/sugerir`.
3. Lets authorized users approve suggestions via `/aprovar`.
4. Displays the current agenda with approved items via `/pauta`.
5. Maintains a history of previous agendas via `/historico`.
6. Allows administrators to manage authorized users via `/autorizar` and `/desautorizar`.
7. Runs 24/7 in a Docker container, easily deployable on cloud platforms like DigitalOcean.
8. Includes comprehensive logging and error handling.
9. Provides health check endpoints for container monitoring.
10. Supports custom reset scheduling for each guild.

---

### 📦 Features

- **Submit suggestions**: `/sugerir texto:"Suggestion description"`
- **Approve items**: `/aprovar` (restricted to authorized users)
- **View agenda**: `/pauta`
- **View history**: `/historico listar`
- **Manage authorized users**: `/autorizar`, `/desautorizar`, `/autorizados`
- **Reset agenda**: `/resetar` (with confirmation)
- **Configurable auto-reset**: Set custom day and time for agenda reset via `/configreset`
- **Health checks**: HTTP server for container monitoring
- **Logging & error handling**: Comprehensive event tracking
- **Confirmation dialogs**: For destructive operations
- **Docker deployment**: Lightweight Node.js image
- **Guild-specific settings**: Each Discord server can have different configurations

---

### 🎯 Requirements

- Node.js v16+
- npm or Yarn
- Docker (for deployment)
- Access to Discord Developer Portal (to configure the bot)

---

### 📁 Project Structure

```plaintext
meeting-agenda-discord-bot/
├── src/
│   ├── commands/         # Command handlers (autorizar, pauta, resetar, etc.)
│   ├── events/           # Event listeners (ready, interactionCreate)
│   ├── utils/            # Utilities (agenda, logger, errorHandler, settings)
│   └── index.js          # Bot entrypoint
├── scripts/
│   └── deploy-commands.js # Register slash commands
├── data/
│   ├── settings.json     # Global settings
│   └── guilds/           # Guild-specific data
├── logs/                 # Application logs (created on first run)
├── .github/
│   └── workflows/        # CI pipeline configuration
├── .env.example          # Sample environment variables file
├── .gitignore
├── Dockerfile            # Docker image configuration
├── package.json
└── README.md             # This file
```

---

### ⚙️ Setup

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in:
   ```env
   BOT_TOKEN=your_discord_bot_token
   GUILD_ID=your_server_id_for_development
   LEADER_ROLE_ID=leader_role_id
   AUTHORIZED_ROLE_ID=authorized_role_id
   NOTIFICATION_CHANNEL_ID=channel_for_automated_notifications
   SUGGESTION_CHANNEL_ID=channel_to_show_new_suggestions
   DEBUG=false
   PORT=8080
   ```
3. In the Discord Developer Portal, enable required **Intents** (Message Content, Server Members, etc.)
4. Install dependencies:
   ```bash
   npm install
   ```
5. Register slash commands:
   ```bash
   npm run deploy-commands
   ```

---

### 💻 Local Run

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run in production
npm start
```

---

### 🐳 Docker

#### Build the image
```bash
docker build -t meeting-agenda-bot:latest .
```

#### Run container
```bash
docker run -p 8080:8080 --env-file .env meeting-agenda-bot:latest
```

---

### 📋 Commands

| Command | Description | Access |
|---------|-------------|--------|
| `/ajuda` | Shows help information | Everyone |
| `/pauta` | Shows current agenda | Everyone |
| `/sugerir` | Submit a suggestion | Everyone |
| `/historico listar` | View previous agendas | Everyone |
| `/aprovar` | Approve a suggestion | Authorized users |
| `/autorizados` | List authorized users | Authorized users |
| `/autorizar` | Authorize a user | Admins/Leaders |
| `/desautorizar` | Remove authorization | Admins/Leaders |
| `/resetar` | Reset the agenda or suggestions | Admins |
| `/historico limpar` | Clear agenda history | Admins |
| `/configreset` | Configure reset schedule | Admins |

---

### 🔄 Automatic Reset

The bot can automatically reset the agenda on a configurable schedule:

- Each Discord server can set its own reset day and time
- Default: Reset occurs every Sunday at 00:00
- Use `/configreset configurar` to change the schedule
- Use `/configreset status` to view the current configuration

---

### 🏥 Health Checks

For cloud deployments, the bot includes a health check endpoint:

- HTTP server runs on port 8080 (configurable via PORT env variable)
- GET /health endpoint returns 200 OK when the bot is running
- Suitable for container monitoring in platforms like DigitalOcean

---

## 🇧🇷 Português

> Gerencie sugestões de pauta, aprovações e resetamento automático com este bot de Discord.

---

### 🚀 Visão Geral

Este projeto implementa um bot para Discord que:

1. Gera uma **pauta semanal** automaticamente com agendamento configurável.
2. Permite que membros submetam sugestões de pauta via `/sugerir`.
3. Permite que usuários autorizados aprovem sugestões via `/aprovar`.
4. Exibe a pauta atual com itens aprovados via `/pauta`.
5. Mantém um histórico de pautas anteriores via `/historico`.
6. Permite que administradores gerenciem usuários autorizados via `/autorizar` e `/desautorizar`.
7. Roda 24/7 em um contêiner Docker, facilmente implantável em plataformas cloud como DigitalOcean.
8. Inclui sistema completo de logs e tratamento de erros.
9. Fornece endpoints de verificação de saúde para monitoramento de contêineres.
10. Suporta agendamento de reset personalizado para cada servidor.

---

### 📦 Recursos

- **Submissão de sugestões**: `/sugerir texto:"Descrição da sugestão"`
- **Aprovação de itens**: `/aprovar` (restrito a usuários autorizados)
- **Visualização da pauta**: `/pauta`
- **Visualização do histórico**: `/historico listar`
- **Gerenciamento de usuários autorizados**: `/autorizar`, `/desautorizar`, `/autorizados`
- **Reset da pauta**: `/resetar` (com confirmação)
- **Auto-reset configurável**: Defina dia e hora personalizados para reset da pauta via `/configreset`
- **Verificações de saúde**: Servidor HTTP para monitoramento de contêineres
- **Logs e tratamento de erros**: Rastreamento abrangente de eventos
- **Diálogos de confirmação**: Para operações destrutivas
- **Deploy via Docker**: Imagem leve baseada em Node.js
- **Configurações específicas por servidor**: Cada servidor Discord pode ter diferentes configurações

---

### 🎯 Pré-requisitos

- Node.js v16+
- NPM ou Yarn
- Docker (para deploy)
- Acesso ao Discord Developer Portal (para configurar o bot)

---

### 📁 Estrutura do Projeto

```plaintext
meeting-agenda-discord-bot/
├── src/
│   ├── commands/         # Handlers de comandos (autorizar, pauta, resetar, etc.)
│   ├── events/           # Listeners de eventos (ready, interactionCreate)
│   ├── utils/            # Utilitários (agenda, logger, errorHandler, settings)
│   └── index.js          # Ponto de entrada do bot
├── scripts/
│   └── deploy-commands.js # Registrar comandos slash
├── data/
│   ├── settings.json     # Configurações globais
│   └── guilds/           # Dados específicos por servidor
├── logs/                 # Logs da aplicação (criado na primeira execução)
├── .github/
│   └── workflows/        # Configuração do pipeline de CI
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore
├── Dockerfile            # Configuração para criar a imagem Docker
├── package.json
└── README.md             # Este arquivo
```

---

### ⚙️ Configuração

1. Clone este repositório
2. Copie `.env.example` para `.env` e preencha:
   ```env
   BOT_TOKEN=seu_token_do_discord_bot
   GUILD_ID=id_do_servidor_para_desenvolvimento
   LEADER_ROLE_ID=id_do_papel_de_lider
   AUTHORIZED_ROLE_ID=id_do_papel_de_autorizado
   NOTIFICATION_CHANNEL_ID=canal_para_notificacoes_automaticas
   SUGGESTION_CHANNEL_ID=canal_para_mostrar_novas_sugestoes
   DEBUG=false
   PORT=8080
   ```
3. No Discord Developer Portal, habilite os **Intents** necessários (Message Content, Server Members, etc.)
4. Instale as dependências:
   ```bash
   npm install
   ```
5. Registre os comandos slash:
   ```bash
   npm run deploy-commands
   ```

---

### 💻 Execução Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (com nodemon)
npm run dev

# Rodar em produção
npm start
```

---

### 🐳 Docker

#### Build da imagem
```bash
docker build -t meeting-agenda-bot:latest .
```

#### Executar container
```bash
docker run -p 8080:8080 --env-file .env meeting-agenda-bot:latest
```

---

### 📋 Comandos

| Comando | Descrição | Acesso |
|---------|-----------|--------|
| `/ajuda` | Mostra informações de ajuda | Todos |
| `/pauta` | Mostra a pauta atual | Todos |
| `/sugerir` | Enviar uma sugestão | Todos |
| `/historico listar` | Ver pautas anteriores | Todos |
| `/aprovar` | Aprovar uma sugestão | Usuários autorizados |
| `/autorizados` | Listar usuários autorizados | Usuários autorizados |
| `/autorizar` | Autorizar um usuário | Admins/Líderes |
| `/desautorizar` | Remover autorização | Admins/Líderes |
| `/resetar` | Resetar a pauta ou sugestões | Admins |
| `/historico limpar` | Limpar histórico de pautas | Admins |
| `/configreset` | Configurar agendamento de reset | Admins |

---

### 🔄 Reset Automático

O bot pode resetar a pauta automaticamente em um cronograma configurável:

- Cada servidor Discord pode definir seu próprio dia e hora de reset
- Padrão: Reset ocorre todo domingo às 00:00
- Use `/configreset configurar` para alterar o agendamento
- Use `/configreset status` para ver a configuração atual

---

### 🏥 Verificações de Saúde

Para implantações em nuvem, o bot inclui um endpoint de verificação de saúde:

- Servidor HTTP roda na porta 8080 (configurável via variável de ambiente PORT)
- GET /health retorna 200 OK quando o bot está em execução
- Adequado para monitoramento de contêineres em plataformas como DigitalOcean

---


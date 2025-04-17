# Discord Meeting Agenda Manager

> Gerencie sugestões de pauta, aprovações e deploy contínuo com este bot de Discord.

---

## 🇺🇸 English

### 🚀 Overview

This project implements a Discord bot that:

1. Automatically generates a **weekly agenda** (reset every week).
2. Allows members to submit agenda suggestions via `/sugerir`.
3. Lets leader(s) approve or reject suggestions via `/aprovar <id>`.
4. Displays the current agenda with approved items via `/pauta`.
5. Runs 24/7 in a Docker container, easily deployable on DigitalOcean App Platform.
6. Includes **CI** with GitHub Actions for linting, tests, and Docker image builds.

---

### 📦 Features

- **Submit suggestions**: `/sugerir texto:"Suggestion description"`
- **Approve items**: `/aprovar id:<number>` (restricted to leader role)
- **View agenda**: `/pauta`
- **Auto-reset**: weekly cron job resetting the agenda
- **Logging & error handling**: via utility modules
- **Docker deployment**: lightweight Node.js image
- **GitHub Actions CI**: lint, test, and build Docker image

---

### 🎯 Requirements

- Node.js v18+
- npm or Yarn
- Docker (for local tests and image build)
- DigitalOcean account (optional, for deployment)
- Access to Discord Developer Portal (to configure the bot)

---

### 📁 Project Structure

```plaintext
discord-bot/
├── src/
│   ├── commands/         # Command handlers (ping, sugerir, aprovar, pauta)
│   ├── events/           # Event listeners (ready, interactionCreate)
│   ├── utils/            # Helpers (logger, database, etc.)
│   ├── config/           # Default settings (cron schedule, paths)
│   └── index.js          # Bot entrypoint
├── .env.example          # Sample environment variables file
├── .gitignore
├── Dockerfile            # Docker image configuration
├── package.json
├── package-lock.json
├── README.md             # This file
└── .github/
    └── workflows/        # CI: lint, tests, Docker build
```

---

### ⚙️ Setup

1. Rename `.env.example` to `.env` and fill in:
   ```env
   BOT_TOKEN=<your_bot_token>
   CLIENT_ID=<your_application_id>
   GUILD_ID=<your_server_id_for_guild_commands>
   LEADER_ROLE_ID=<leader_role_id>
   ```
2. In the Discord Developer Portal, enable required **Intents** (Message Content, Members, etc.).

---

### 💻 Local Run

```bash
# Install dependencies
npm ci

# Run in development mode (with nodemon)
npm run dev

# Run in production
env-cmd -f .env node src/index.js
```

---

### 🐳 Docker

#### Build the image
```bash
docker build -t discord-bot:latest .
```

#### Test container locally
```bash
# Using your local .env file
docker run --env-file .env discord-bot:latest
```

---

### 🚀 Deploy on DigitalOcean App Platform

1. Commit and push to GitHub.  
2. In the DigitalOcean dashboard, **Create App** → select your GitHub repo.  
3. It will detect your Dockerfile—configure:  
   - **Service type**: Worker  
   - **Instance size**: 512MB (or as needed)  
   - **Environment variables**: set `BOT_TOKEN`, `LEADER_ROLE_ID`, etc.  
4. Enable **Auto-deploy** (rebuild on every push).  
5. Your app will launch on a 24/7 instance.

---

### 📈 CI with GitHub Actions

The workflow `.github/workflows/ci.yml`:

1. Checks out the code  
2. Sets up Node.js 18  
3. Runs `npm ci`  
4. Lints (if ESLint config present)  
5. Runs tests (`npm test`)  
6. Builds the Docker image  
7. _Optional_: Pushes to Docker Hub (configure `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets)

---

### 🤝 Contributing

1. Fork this repository.  
2. Create a branch: `git checkout -b feat/your-feature`.  
3. Commit your changes: `git commit -m "feat: your feature description"`.  
4. Push to your branch: `git push origin feat/your-feature`.  
5. Open a Pull Request and describe your changes.

---

## 🇧🇷 Português

> Gerencie sugestões de pauta, aprovações e deploy contínuo com este bot de Discord.

---

### 🚀 Visão Geral

Este projeto implementa um bot para Discord que:

1. Gera uma **pauta semanal** vazia automaticamente (resetada toda semana).
2. Permite que membros submetam sugestões de pauta via `/sugerir`.
3. Permite que o líder(s) aprove ou rejeite sugestões via `/aprovar <id>`.
4. Exibe a pauta atual com itens aprovados via `/pauta`.
5. Roda 24/7 em um contêiner Docker, facilmente implantável no DigitalOcean App Platform.
6. Possui **CI** com GitHub Actions para lint, testes e build de imagem Docker.

---

### 📦 Recursos

- **Submissão de sugestões**: `/sugerir texto:"Descrição da sugestão"`
- **Aprovação de itens**: `/aprovar id:<número>` (restrito a papel de líder)
- **Visualização da pauta**: `/pauta`
- **Reset automático**: cron job semanal redefinindo a agenda
- **Logs e tratamento de erros**: via sistema de utilitários
- **Deploy via Docker**: imagem leve baseada em Node.js
- **Integração GitHub Actions**: lint, testes e build de imagem

---

### 🎯 Pré-requisitos

- Node.js v18+
- NPM ou Yarn
- Docker (para testes locais e build de imagem)
- Conta no DigitalOcean (opcional, para deploy)
- Acesso ao Discord Developer Portal (para configurar o bot)

---

### 📁 Estrutura do Projeto

```plaintext
discord-bot/
├── src/
│   ├── commands/         # Handlers de comandos (ping, sugerir, aprovar, pauta)
│   ├── events/           # Listeners de eventos (ready, interactionCreate)
│   ├── utils/            # Helpers (logger, banco de dados, etc.)
│   ├── config/           # Configurações padrão (cron schedule, paths)
│   └── index.js          # Ponto de entrada do bot
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore
├── Dockerfile            # Configuração para criar a imagem Docker
├── package.json
├── package-lock.json
├── README.md             # Este arquivo
└── .github/
    └── workflows/        # CI: lint, testes, build Docker
```

---

### ⚙️ Configuração

1. Renomeie `.env.example` para `.env` e preencha:
   ```env
   BOT_TOKEN=<seu_token_do_bot>
   CLIENT_ID=<seu_application_id>
   GUILD_ID=<ID_do_servidor_para_registro_de_comandos>
   LEADER_ROLE_ID=<ID_do_papel_do_líder>
   ```
2. No Discord Developer Portal, habilite os **Intents** necessários (Message Content, Members, etc.).

---

### 💻 Execução Local

```bash
# Instalar dependências
npm ci

# Rodar em modo desenvolvimento (com nodemon)
npm run dev

# Rodar produção
env-cmd -f .env node src/index.js
```

---

### 🐳 Docker

#### Build da imagem
```bash
docker build -t discord-bot:latest .
```

#### Testar container local
```bash
# Usa seu .env local
docker run --env-file .env discord-bot:latest
```

---

### 🚀 Deploy no DigitalOcean App Platform

1. Faça commit e push no GitHub.  
2. No painel do DigitalOcean, **Create App** → selecione seu repo GitHub.  
3. Detecte Dockerfile e configure:  
   - **Service**: Worker  
   - **Instance size**: 512MB (ou conforme necessidade)  
   - **Environment variables**: defina `BOT_TOKEN`, `LEADER_ROLE_ID`, etc.  
4. Defina **Autodeploy** para `ON` (rebuild a cada push).  
5. O app iniciará automaticamente em instância 24/7.

---

### 📈 CI com GitHub Actions

O workflow `.github/workflows/ci.yml` faz:

1. Checkout do código  
2. Setup Node.js 18  
3. `npm ci`  
4. Lint (se `.eslintrc.*` existir)  
5. Testes (`npm test`)  
6. Build da imagem Docker  
7. _Opcional_: Push para Docker Hub (configurar secrets `DOCKER_USERNAME` e `DOCKER_PASSWORD`)

---

### 🤝 Contribuindo

1. Faça um fork deste repositório.  
2. Crie uma branch: `git checkout -b feat/nova-funcionalidade`.  
3. Commit suas alterações: `git commit -m "feat: descrição da mudança"`.  
4. Push para a branch: `git push origin feat/nova-funcionalidade`.  
5. Abra um Pull Request e descreva sua proposta.

---

### 📝 Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---


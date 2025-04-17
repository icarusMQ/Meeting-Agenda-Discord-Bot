# Discord Bot Pauta Manager

> Gerencie sugestões de pauta, aprovações e deploy contínuo com este bot de Discord.

---

## 🚀 Visão Geral

Este projeto implementa um bot para Discord que:

1. Gera uma **pauta semanal** vazia automaticamente (resetada toda semana).
2. Permite que membros submetam sugestões de pauta via `/sugerir`.
3. Permite que o líder(s) aprove ou rejeite sugestões via `/aprovar <id>`.
4. Exibe a pauta atual com itens aprovados via `/pauta`.
5. Roda 24/7 em um contêiner Docker, facilmente implantável no DigitalOcean App Platform.
6. Possui **CI** com GitHub Actions para lint, testes e build de imagem Docker.

---

## 📦 Recursos

- **Submissão de sugestões**: `/sugerir texto:"Descrição da sugestão"`
- **Aprovação de itens**: `/aprovar id:<número>` (restrito a papel de líder)
- **Visualização da pauta**: `/pauta`
- **Reset automático**: cron job semanal redefinindo a agenda
- **Logs e tratamento de erros**: via sistema de utilitários
- **Deploy via Docker**: imagem leve baseada em Node.js
- **Integração GitHub Actions**: lint, testes e build de imagem

---

## 🎯 Pré-requisitos

- Node.js v18+
- NPM ou Yarn
- Docker (para testes locais e build de imagem)
- Conta no DigitalOcean (opcional, para deploy)
- Acesso ao Discord Developer Portal (para configurar o bot)

---

## 📁 Estrutura do Projeto

```
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

## ⚙️ Configuração

1. Renomeie `.env.example` para `.env` e preencha:
   ```env
   BOT_TOKEN=<seu_token_do_bot>
   GUILD_ID=<ID_do_servidor_para_registro_de_comandos>
   LEADER_ROLE_ID=<ID_do_papel_do_líder>
   ```
2. No Discord Developer Portal, habilite os **Intents** necessários (Message Content, Members, etc.).

---

## 💻 Execução Local

```bash
# Instalar dependências
npm ci

# Rodar em modo développement (com nodemon)
npm run dev

# Rodar produção
env-cmd -f .env node src/index.js
```

---

## 🐳 Docker

### Build da imagem

```bash
docker build -t discord-bot:latest .
```

### Testar container local

```bash
# Usa seu .env local
docker run --env-file .env discord-bot:latest
```

---

## 🚀 Deploy no DigitalOcean App Platform

1. Faça commit e push no GitHub.
2. No painel do DigitalOcean, **Create App** → selecione seu repo GitHub.
3. Detecte Dockerfile e configure:
   - **Service**: Worker
   - **Instance size**: 512MB (ou conforme necessidade)
   - **Environment variables**: defina `BOT_TOKEN`, `LEADER_ROLE_ID`, etc.
4. Defina **Autodeploy** para `ON` (rebuild a cada push).
5. Crie e o app iniciará automaticamente em instância 24/7.

---

## 📈 CI com GitHub Actions

O workflow `.github/workflows/ci.yml` faz:

1. Checkout do código
2. Setup Node.js 18
3. `npm ci`
4. Lint (se `.eslintrc.*` existir)
5. Testes (`npm test`)
6. Build da imagem Docker
7. *Opcional*: Push para Docker Hub (configurar secrets `DOCKER_USERNAME` e `DOCKER_PASSWORD`)

---

## 🤝 Contribuindo

1. Faça um fork deste repositório.
2. Crie uma branch: `git checkout -b feat/nova-funcionalidade`.
3. Commit suas alterações: `git commit -m "feat: descrição da mudança"`.
4. Push para a branch: `git push origin feat/nova-funcionalidade`.
5. Abra um Pull Request e descreva sua proposta.

---

## 📝 Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

*Feito com ❤️ por você.*

icaro M.


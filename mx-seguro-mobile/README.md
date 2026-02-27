# MX Seguro Mobile MVP+

Aplicativo informativo híbrido de crowdsourcing e monitoramento sobre zonas de risco e conflitos no México. Esta versão ("MVP+" / V3) foca em segurança de interface, resiliência offline, responsabilidade de moderação (servidor Node Express) e mapas dinâmicos e internacionalizados (i18n).

## Estrutura do Monorepo

O projeto está dividido em duas frentes independentes:
1. **Frontend**: Aplicação híbrida mobile (React Native + Expo).
2. **Backend**: Servidor REST Node/Express na subpasta `server/`.

---

## 🚀 Como Rodar o Servidor (Backend API)

O MX Seguro agora não depende mais de mocks estáticos no app, consultando um sistema centralizado de alertas com limitação de *rate limit* e proteção Anti-Spam.

1. Navegue para a pasta do servidor:
```bash
cd server
```
2. Instale as dependências:
```bash
npm install
```
3. Inicie o servidor:
```bash
node index.js
```
* A API ficará disponível em `http://LAN_IP:3000/api`. 
* **Novo na V4:** A API agora exige um banco de dados PostgreSQL. Você deve definir a URL da sua base de dados no arquivo `server/.env`:
```env
DATABASE_URL="postgresql://postgres:sua-senha@db.supabase.co:5432/postgres"
```
Execute as migrações usando o Prisma antes de rodar o servidor: `npx prisma migrate dev`
* Para acessar o painel de moderação e aprovar/rejeitar reports de usuários localmente, navegue para `http://localhost:3000/admin`.

### ☁️ Deploy em Nuvem (Produção 24/7 no Render + Supabase)
Para hospedar gratuitamente sua API de forma definitiva:

1. **Suba o código para o GitHub**
   Crie um repositório no seu GitHub e suba todo o projeto (backend e frontend).
   
2. **Conecte ao Render**
   - Acesse [Render.com](https://render.com/) e crie uma conta.
   - Clique em **New** > **Web Service**.
   - Conecte o repositório do GitHub que você acabou de criar.
   - Como temos um arquivo `server/render.yaml`, o Render já saberá ler que a pasta raiz da API é `server/`, usando o comando de build `npm install && npx prisma generate && npx prisma migrate deploy` e start `node index.js`.

3. **Configuração de Variáveis (Environment)**
   Na tela de criação do serviço no Render (seção *Environment Variables*), você deve obrigatoriamente adicionar:
   - `DATABASE_URL`: Cole a string de conexão do Supabase (A mesma que você usou no `.env` local, com o formato `postgresql://postgres...`).
   - `PORT`: Recomenda-se colocar `3000`.

4. **Publicação (Deploy)**
   Clique em **Create Web Service**. Aguarde cerca de 2-4 minutos até os logs informarem que o servidor está rodando na porta 3000 e a migration foi aplicada.

5. **Testando Endpoints de Produção**
   Quando finalizar, o Render fornecerá um link HTTPS no topo (ex: `https://seu-backend.onrender.com`).
   Teste diretamente no seu navegador as seguintes rotas:
   - `https://seu-backend.onrender.com/api/status`
   - `https://seu-backend.onrender.com/api/incidents`
   - `https://seu-backend.onrender.com/api/risk?zoomLevel=far`

---

## 📱 Como Rodar o Aplicativo (Frontend Mobile - V3)

No desenvolvimento local, o App consome por padrão um IP fallback de LAN (`10.0.0.101`). Para testar em dispositivos físicos sem problemas de DNS, configurações estritas no React Native ou bloqueios de CORS, recomendamos o uso de um **Túnel HTTP**:

1. No terminal do seu Computador, se não estiver usando a nuvem (Render), crie um túnel usando `localtunnel` ou `ngrok` apontando para o servidor local:
```bash
npx localtunnel --port 3000
```
2. Crie/Edite o arquivo `.env` na raiz do projeto mobile (`mx-seguro-mobile/.env` ou `.env.production`) com a sua API de preferência:
```env
# MODO DESENVOLVIMENTO
EXPO_PUBLIC_API_URL=https://meu-tunel.loca.lt/api

# MODO PRODUÇÃO NUVEM (V4)
# EXPO_PUBLIC_API_URL=https://mx-seguro-api.onrender.com/api
```

4. Navegue para a pasta raíz do App se não estiver, instale e rode limpando o cache:
```bash
cd mx-seguro-mobile
npm install
npx expo start -c
```

**Troubleshooting de Rede (Offline Fallback):**
Se o App não conseguir alcançar a `API_URL` definida no boot, ele entrará em modo **"Cache Local Ativo"** renderizando um banner no mapa e servindo a última snapshot do `AsyncStorage`. 
Para checar qual ENV o expo embutiu, abra a aba "Perfil e Assinatura" e **dê um clique longo** no título superior para abrir a aba secreta de **Diagnóstico**.

---

## 🌍 Internacionalização (Idiomas)
O UX conta com suporte automático via AsyncStorage para i18n. Você pode alterar a linguagem do App instantaneamente na aba de Perfil (`ES`, `PT`, `EN`).

## 🗺️ Mapa Híbrido (UX/Segurança)
A aplicação previne mapeamento tático nocivo.
- Cidades inteiras têm apenas marcadores coloridos simplificados (`Zoom OUT: "far"`).
- Uma vez aproximado, o mapa desenha overlays em Grid Célula ou expõe contagem anônima agrupada por categoria (`Zoom IN: "close"`). Detalhes exibem fonte da informação e Nível de Confiança sistêmica.

---
*Desenvolvido seguindo protocolos estritos de isenção de precisão tática.*

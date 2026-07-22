# SmartNotes

Plataforma de produtividade pessoal com quadros visuais, editor de notas e calendario.

## Stack

**Frontend:** HTML, CSS e JavaScript puro (sem frameworks)  
**Backend:** Node.js + Express + PostgreSQL  
**Deploy:** Netlify (frontend) + Railway (backend + banco)

## Funcionalidades

- Quadro interativo com zoom, arrastar e soltar, e undo/redo
- Editor de notas rich text com checklists e paleta de cores
- Calendario mensal com criacao e edicao de eventos
- Autenticacao com JWT e senhas com bcrypt
- Tema claro/escuro persistido no banco

## Rodando localmente

**Pre-requisitos:** Node.js 18+, PostgreSQL 14+

```bash
# 1. Clone o repositorio
git clone https://github.com/gweissrs/SmartNotes.git
cd SmartNotes

# 2. Crie o banco de dados
psql -U postgres -c "CREATE DATABASE smartnotes"
psql -U postgres -d smartnotes -f server/src/schema.sql

# 3. Configure o backend
cd server
npm install
copy .env.example .env
```

Edite o `.env`:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/smartnotes
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=7d
```

```bash
npm run dev  # inicia o servidor em http://localhost:3001
```

```bash
# 4. Abra o frontend (na raiz do projeto)
npx serve . -p 3000
# Acesse: http://localhost:3000/login.html
```

## Deploy

**Backend (Railway):**
1. Conecte o repositorio e defina o Root Directory como `server`
2. Adicione o plugin PostgreSQL
3. Configure as variaveis: `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALLOWED_ORIGINS`

**Frontend (Netlify):**
1. Importe o repositorio com Publish directory `.` e Build command vazio
2. Atualize a URL da API em `js/config.js` com o endereco do Railway

## Autor

**Guilherme Weiss** — [github.com/gweissrs](https://github.com/gweissrs)

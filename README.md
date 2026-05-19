# CarbuApp – Frontend
### Sistema de Gestão para Oficinas Automotivas
**Projeto Integrador – UNASP 2026/1**

---

# Sobre o Projeto

O **CarbuApp** é um sistema web para gestão de oficinas automotivas de pequeno porte.

O frontend é responsável pela interface visual do sistema, permitindo que mecânicos e gestores da oficina possam:

- Registrar entrada de veículos com laudo de vistoria
- Gerenciar Ordens de Serviço (OS) com fluxo completo
- Gerenciar clientes e veículos
- Criar e acompanhar orçamentos vinculados às OS
- Visualizar histórico técnico por veículo (timeline)
- Acompanhar status das OS via Kanban
- Gerar PDFs de orçamento
- Fazer upload de fotos nas OS
- Usar templates de serviços frequentes

O sistema foi pensado para oficinas que ainda trabalham com papel ou planilhas simples.

Clientes de referência:
**Commenale Motorsports**
**Apocalypse Custom**

---

# Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite**
- **React Router v7**
- **Axios**
- **TanStack Query v5** (cache e gerenciamento de estado servidor)
- **React Hot Toast**
- **CSS Custom (Global Styles)**

---

# Arquitetura do Frontend

O frontend consome a API do backend via **HTTP REST**.

Backend utilizado:
Node.js + Express + Prisma

A comunicação é feita via **Axios**, com autenticação usando **JWT**.

O cache de dados é gerenciado pelo **TanStack Query**, evitando requisições desnecessárias ao navegar entre páginas (staleTime: 2 minutos).

---

# Funcionalidades da Interface

## Autenticação

- Login com token JWT
- Armazenamento do token no navegador
- Proteção de rotas privadas
- Logout
- Suporte a múltiplos roles: SUPERADMIN, ADMIN, MECANICO

---

## Dashboard

Exibe um resumo da oficina:

- Total de clientes, veículos, OS e orçamentos
- CTA de acesso rápido "Entrada de Veículo"
- Últimas OS com status colorido
- Últimos orçamentos

---

## Entrada de Veículo

Wizard de 3 passos para abertura de OS:

1. Busca ou criação de cliente
2. Seleção ou criação de veículo
3. Laudo de entrada (opcional) + dados da OS

Ao finalizar, navega direto para a OSDetalhe.

---

## Ordens de Serviço (OS)

- Listagem com status colorido
- OSDetalhe com 3 abas:
  - **Orçamentos** — criação com dropdown "Usar template", troca de status inline
  - **Laudo de Entrada** — diagrama interativo com 15 zonas de avaria
  - **Fotos** — upload, preview com lightbox, remoção
- Troca de status direto no cabeçalho da OS

---

## Kanban de OS

- 5 colunas: Aberta / Em andamento / Aguardando peças / Concluída / Cancelada
- Cards com dados do veículo e cliente
- Troca de status via PATCH na API

---

## Clientes

CRUD completo com detalhe mostrando veículos vinculados.

---

## Veículos

CRUD completo com detalhe mostrando:

- OS relacionadas com status
- Orçamentos relacionados
- Timeline cronológica (OS + orçamentos)

---

## Orçamentos

- Listagem com filtro por status (Pendente / Aprovado / Rejeitado / Executado)
- Troca de status inline
- Edição de itens
- Geração de PDF
- Envio pelo WhatsApp

---

## Administração (ADMIN)

- Upload e remoção de logo da oficina
- Gerenciamento de usuários (criar, editar, ativar/desativar, reset de senha)
- **Templates de serviços** — cadastro de modelos reutilizáveis para orçamentos

---

# Estrutura do Projeto

```
src/
  components/
    BottomNav.tsx
    ChecklistAvarias.tsx
    ConfirmModal.tsx
    FAB.tsx
    FotoUpload.tsx
    GlobalSearch.tsx
    Layout.tsx
    Skeleton.tsx
  contexts/
    AuthContext.tsx
  pages/
    Admin.tsx
    ClienteDetalhe.tsx
    Clientes.tsx
    Dashboard.tsx
    EntradaVeiculo.tsx
    KanbanOS.tsx
    Landing.tsx
    Login.tsx
    OrcamentoDetalhe.tsx
    Orcamentos.tsx
    OSDetalhe.tsx
    Registros.tsx
    Superadmin.tsx
    SuperadminOficina.tsx
    SuperadminUsuarios.tsx
    VeiculoDetalhe.tsx
    Veiculos.tsx
  routes/
    AppRoutes.tsx
    PrivateRoute.tsx
  services/
    api.ts
  styles/
    global.css
```

---

# Como Rodar o Frontend

## 1 - Instalar dependências
```bash
npm install
```

## 2 - Configurar variável de ambiente
```bash
# Criar arquivo .env na raiz
VITE_API_URL=http://localhost:3333
```

## 3 - Rodar aplicação
```bash
npm run dev
```

## 4 - Abrir no navegador
```
http://localhost:5173
```

---

# Integração com Backend

O frontend depende da API do backend.

Certifique-se que o backend esteja rodando:
```
http://localhost:3333
```

Repositório do backend:
https://github.com/thiagoprsilva/carbuapp-backend

---

# Infraestrutura de Produção

**URL Frontend:** https://carbuapp.com.br

Deploy automático via GitHub Actions:
- `git push` → SSH no VPS → `git pull` + `npm install` + `npm run build` → copia `dist/` para `/var/www/carbuapp/`

---

# Status Atual do Frontend

✔ Login funcional com roles (SUPERADMIN / ADMIN / MECANICO)
✔ Dashboard integrado com CTA de entrada de veículo
✔ Wizard de entrada de veículo (3 passos)
✔ OS como entidade central (Fase 1.6)
✔ CRUD completo de clientes e veículos
✔ Kanban de OS com 5 colunas
✔ Laudo de entrada com diagrama interativo
✔ Upload de fotos nas OS
✔ Timeline do veículo
✔ Navegação mobile (BottomNav + FAB)
✔ Orçamentos com PDF e WhatsApp
✔ Templates de serviços reutilizáveis
✔ TanStack Query com cache e skeleton loading
✔ Layout responsivo (sidebar drawer + cards mobile)

Frontend considerado **MVP funcional completo**.

---

# Informações Acadêmicas

**Curso:** Análise e Desenvolvimento de Sistemas
**Instituição:** UNASP

Projeto Integrador – 2026/1

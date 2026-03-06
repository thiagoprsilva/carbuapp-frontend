# CarbuApp – Frontend  
### Sistema de Gestão para Oficinas Automotivas  
**Projeto Integrador – UNASP 2026/1**

---

# Sobre o Projeto

O **CarbuApp** é um sistema web para gestão de oficinas automotivas de pequeno porte.

O frontend é responsável pela interface visual do sistema, permitindo que mecânicos e gestores da oficina possam:

- Gerenciar clientes
- Controlar veículos
- Registrar histórico técnico
- Criar orçamentos
- Gerar PDFs de orçamento
- Consultar dados da oficina

O sistema foi pensado para oficinas que ainda trabalham com papel ou planilhas simples.

Cliente de referência:  
**Commenale Motorsports**  
**Apocalypse Custom**

---

# Tecnologias Utilizadas

- **React**
- **TypeScript**
- **Vite**
- **React Router**
- **Axios**
- **CSS Custom (Global Styles)**

---

# Arquitetura do Frontend

O frontend consome a API do backend via **HTTP REST**.

Backend utilizado:
# CarbuApp – Frontend  
### Sistema de Gestão para Oficinas Automotivas  
**Projeto Integrador – UNASP 2026/1**

---

# Sobre o Projeto

O **CarbuApp** é um sistema web para gestão de oficinas automotivas de pequeno porte.

O frontend é responsável pela interface visual do sistema, permitindo que mecânicos e gestores da oficina possam:

- Gerenciar clientes
- Controlar veículos
- Registrar histórico técnico
- Criar orçamentos
- Gerar PDFs de orçamento
- Consultar dados da oficina

O sistema foi pensado para oficinas que ainda trabalham com papel ou planilhas simples.

Cliente de referência:  
**Commenale Motorsports**  
**Apocalypse Custom**

---

# Tecnologias Utilizadas

- **React**
- **TypeScript**
- **Vite**
- **React Router**
- **Axios**
- **CSS Custom (Global Styles)**

---

# Arquitetura do Frontend

O frontend consome a API do backend via **HTTP REST**.

Backend utilizado:
Node.js + Express + Prisma


A comunicação é feita via **Axios**, com autenticação usando **JWT**.

---

# Funcionalidades da Interface

## Autenticação

- Login com token JWT
- Armazenamento do token no navegador
- Proteção de rotas privadas
- Logout

---

## Dashboard

Exibe um resumo da oficina:

- Total de clientes
- Total de veículos
- Total de registros técnicos
- Total de orçamentos

Também apresenta:

- Últimos registros técnicos
- Últimos orçamentos

---

## Clientes

CRUD completo:

- Criar cliente
- Listar clientes
- Editar cliente
- Remover cliente

Tela de **Detalhe do Cliente** exibe:

- Informações do cliente
- Veículos vinculados

---

## Veículos

CRUD completo:

- Criar veículo
- Listar veículos
- Editar veículo
- Remover veículo

Tela de **Detalhe do Veículo** exibe:

- Dados do veículo
- Histórico técnico
- Orçamentos relacionados

---

## Registros Técnicos

Permite registrar histórico de manutenção do veículo.

Campos:

- Categoria
- Descrição
- Data do serviço
- Observações

Pode ser gerado manualmente ou a partir de um orçamento.

---

## Orçamentos

Permite criar orçamentos com múltiplos itens.

Funcionalidades:

- Adicionar itens
- Calcular subtotal automaticamente
- Editar orçamento
- Excluir orçamento
- Gerar PDF
- Gerar registro técnico a partir do orçamento

---

# Estrutura do Projeto
src/
components/
contexts/
pages/
Dashboard.tsx
Clientes.tsx
ClienteDetalhe.tsx
Veiculos.tsx
VeiculoDetalhe.tsx
Registros.tsx
Orcamentos.tsx
services/
api.ts
layouts/
Layout.tsx
styles/
global.css


---

# Como Rodar o Frontend

## 1 - Instalar dependências
npm install
## 2 - Rodar aplicação
npm run dev
## 3 - Abrir no navegador
http://localhost:5173


---

# Integração com Backend

O frontend depende da API do backend.

Certifique-se que o backend esteja rodando:
http://localhost:3333

Repositório do backend:
https://github.com/thiagoprsilva/carbuapp-backend


---

# Status Atual do Frontend

✔ Login funcional  
✔ Dashboard integrado  
✔ CRUD completo de clientes  
✔ CRUD completo de veículos  
✔ Histórico técnico funcional  
✔ Sistema de orçamentos com itens  
✔ Geração de PDF  
✔ Layout com sidebar  

Frontend considerado **MVP funcional completo**.

---

# Informações Acadêmicas

**Aluno:** Thiago Pereira Silva  
**RA:** 060242  
**Turma:** GTADSI53B  
**Curso:** Análise e Desenvolvimento de Sistemas  
**Instituição:** UNASP 

Projeto Integrador – 2026/1

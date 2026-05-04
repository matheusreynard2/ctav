# CTAV - Frontend

Interface React (Vite) para gerenciamento de pacientes da API CTAV.

## Pré-requisitos

- Node.js 18+
- Backend Spring Boot rodando em `http://localhost:8080`

## Instalação

```bash
cd frontend
npm install
```

## Executar em modo de desenvolvimento

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```

## Funcionalidades

- Listagem de pacientes em tabela
- Cadastro de novo paciente
- Edição de paciente existente
- Exclusão com confirmação
- Validação de campos obrigatórios
- Mensagens de sucesso/erro
- Layout responsivo

## Configuração da API

A URL base da API está em `src/api.js`. Por padrão aponta para `http://localhost:8080/api`.

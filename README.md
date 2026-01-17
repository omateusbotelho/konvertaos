# Konverta OS

Sistema de gestão de vendas e clientes (CRM/ERP) construído para agências de marketing.

## Stack Tecnológica

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Build Tool:** Vite

## Configuração e Execução Local

Para rodar o projeto localmente, siga os passos abaixo:

1. **Clonar o Repositório:**

   ```bash
   git clone https://github.com/omateusbotelho/konvertaos.git
   cd konvertaos
   ```

2. **Instalar Dependências:**

   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente:**

   Crie um arquivo `.env` na raiz do projeto com suas chaves do Supabase:

   ```
   VITE_SUPABASE_URL="SUA_URL_SUPABASE"
   VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_SUPABASE"
   ```

4. **Iniciar o Servidor de Desenvolvimento:**

   ```bash
   npm run dev
   ```

O aplicativo estará disponível em `http://localhost:8080`.

## Estrutura do Projeto

- `src/pages`: Componentes de página (rotas).
- `src/components`: Componentes reutilizáveis (UI, Layout, etc.).
- `src/hooks`: Lógica de negócio e acesso a dados (React Query).
- `supabase`: Migrações e Edge Functions do Supabase.

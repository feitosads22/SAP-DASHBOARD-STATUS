# SAP PMO Control Tower

Starter React + Vite + TypeScript conectado ao Supabase V4.1.

## Rodar localmente

1. Instale Node.js 20+.
2. Copie `.env.example` para `.env.local`.
3. Preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Execute:
   `npm install`
   `npm run dev`

O dashboard consulta `public.v_project_dashboard`.

## Deploy Vercel

Suba este projeto para GitHub e importe o repositório no Vercel.
Em Vercel > Settings > Environment Variables, cadastre as mesmas duas variáveis.

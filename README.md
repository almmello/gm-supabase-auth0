# Next.js Auth0 Supabase Todo App

Neste tutorial, vamos construir um aplicativo de tarefas (Todo) moderno usando Next.js 15, Auth0 e Supabase. O projeto demonstra como integrar diferentes serviços de forma eficiente, mantendo a segurança e a escalabilidade.

## Visão Geral

O objetivo é criar um aplicativo onde cada usuário gerencia suas próprias tarefas de forma segura. Vamos explorar:

- Integração entre Next.js, Auth0 e Supabase
- Autenticação moderna com Auth0
- Autorização eficiente usando Row Level Security (RLS)
- Comunicação segura entre serviços com JWT
- Funções PostgreSQL para validação de usuários

## Créditos

Este tutorial é baseado no excelente artigo [Using Next.js and Auth0 with Supabase](https://auth0.com/blog/using-nextjs-and-auth0-with-supabase/) por Jon Meyers. Adaptamos o conteúdo para usar Next.js 15 e Tailwind CSS, mantendo os conceitos fundamentais do tutorial original.

## Pré-requisitos

Este tutorial não assume experiência prévia com essas tecnologias; no entanto, você precisará ter o Node.js instalado. Além disso, planeje ter contas para os serviços gerenciados abaixo (Auth0 e Supabase). Ambos são gratuitos no momento e não exigem cartão de crédito.

## Tecnologias Utilizadas

### Next.js
Framework React moderno que simplifica o desenvolvimento web, oferecendo recursos como Server-Side Rendering e API Routes. Sua arquitetura nos permite implementar funcionalidades server-side de forma elegante, mantendo a segurança sem a complexidade de gerenciar servidores dedicados.

### Auth0
Plataforma robusta de autenticação e autorização que oferece uma solução completa para gerenciamento de usuários. Escolhemos Auth0 por sua confiabilidade e vasta experiência no mercado, além de sua excelente integração com React e Next.js.

### Supabase
Plataforma open-source que oferece uma alternativa poderosa ao Firebase. Além do armazenamento de dados e autenticação, oferece recursos como storage de arquivos e subscriptions em tempo real. Neste tutorial, focamos no banco de dados PostgreSQL e suas capacidades de autorização.

### Por que usar Auth0 com Supabase?

Uma das grandes vantagens do Supabase é sua flexibilidade. Embora ofereça autenticação própria, podemos facilmente integrá-lo com outros serviços de autenticação. Isso é especialmente útil quando:

- Você já possui uma base de usuários no Auth0
- Sua equipe tem experiência prévia com Auth0
- Precisa integrar com outros sistemas que usam Auth0

Esta flexibilidade demonstra o poder da arquitetura modular do Supabase.

## Auth0

Primeiro, precisamos criar uma conta gratuita no Auth0. Uma vez no dashboard, precisamos criar um novo Tenant para nosso projeto.

Um tenant é uma maneira de isolar nossos usuários e configurações de outros aplicativos que temos no Auth0.

1. Clique no nome da sua conta no canto superior esquerdo e selecione "Create tenant" no dropdown.
2. Dê ao seu tenant um Domain único.
3. Defina a Region mais próxima de você.
4. Deixe o Environment Tag definido como Development.

> Em uma aplicação de produção, você quer que sua região esteja o mais próximo possível da maioria dos seus usuários.

### Criando uma Aplicação

1. Selecione Applications > Applications no menu lateral.
2. Clique em + Create Application.
3. Dê um nome (pode ser o mesmo do Tenant).
4. Selecione Regular Web Applications.
5. Clique em Create.

### Configurando a Aplicação

Na página da aplicação que você é redirecionado:
1. Selecione a aba Settings.
2. Role até a seção Application URIs.
3. Adicione:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
4. Vá para Advanced Settings > OAuth e confirme que:
   - JSON Web Token (JWT) Signature Algorithm está definido como RS256.
   - OIDC Conformant está habilitado.
5. Certifique-se de salvar suas alterações.

## Next.js

A maneira mais rápida de criar uma aplicação Next.js é usando o pacote create-next-app:

```bash
npx create-next-app@latest gm-supabase-auth0
```

Responda às perguntas de configuração:

```text
Would you like to use TypeScript? › No
Would you like to use ESLint? › Yes
Would you like to use Tailwind CSS? › Yes
Would you like to use src/ directory? › No
Would you like to use App Router? › No
Would you like to customize the default import alias (@/*)? › No
Would you like to use Turbopack for next dev? › No
```

Substitua o conteúdo de `pages/index.js` com:

```jsx
const Index = () => {
  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
      Working!
    </div>
  );
};

export default Index;
```

Execute o projeto em modo de Desenvolvimento:

```bash
npm run dev
```

E confirme que está funcionando em [http://localhost:3000](http://localhost:3000).

## Autenticação

Vamos integrar o pacote nextjs-auth0. Este é um wrapper conveniente em torno do Auth0 JS SDK, mas construído especificamente para Next.js:

```bash
npm i @auth0/nextjs-auth0
```

Crie uma nova pasta em `pages/api/auth/` e adicione um arquivo chamado `[...auth0].js` com o seguinte conteúdo:

```javascript
// pages/api/auth/[...auth0].js
import { handleAuth } from "@auth0/nextjs-auth0";

export default handleAuth();
```

O `[...auth0].js` é uma rota catch all. Isso significa que qualquer url que comece com `/api/auth0` carregará este componente — `/api/auth0`, `/api/auth0/login`, `/api/auth0/some/deeply/nested/url` etc. Este é um dos recursos incríveis que o nextjs-auth0 nos dá de graça! Chamar `handleAuth()` automaticamente cria uma coleção de rotas convenientes — como `/login` e `/logout` — e toda a lógica necessária para lidar com tokens e sessões.

Substitua o conteúdo de `pages/_app.js` com:

```javascript
// pages/_app.js
import "@/styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}
```

Crie um arquivo `.env.local` na raiz do projeto e adicione:

```env
AUTH0_SECRET=generate-this-below
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<name-of-your-tenant>.<region-you-selected>.auth0.com
AUTH0_CLIENT_ID=get-from-auth0-dashboard
AUTH0_CLIENT_SECRET=get-from-auth0-dashboard
```

Gere um `AUTH0_SECRET` seguro executando:

```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

`AUTH0_CLIENT_ID` e `AUTH0_CLIENT_SECRET` podem ser encontrados em Applications > Settings > Basic Information no Dashboard do Auth0.

Você precisará encerrar o servidor Next.js e executar o comando `npm run dev` novamente sempre que novas variáveis de ambiente forem adicionadas ao arquivo `.env.local`.

Vamos atualizar nosso `pages/index.js` para adicionar a capacidade de entrar e sair:

```javascript
// pages/index.js
// Componente inicial com autenticação básica
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";

const Index = ({ user }) => {
  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
      <p className="text-lg flex items-center justify-between">
        <span>Bem-vindo {user.name}!</span>
        <Link 
          href="/api/auth/logout" 
          className="text-blue-400 hover:text-blue-300 underline ml-2"
        >
          Sair
        </Link>
      </p>
    </div>
  );
};

// Protege a rota e adiciona o usuário às props
export const getServerSideProps = withPageAuthRequired();

export default Index;
```

Muito limpo! O `withPageAuthRequired` verifica se temos um usuário conectado e lida com o redirecionamento para a página de Login se não houver. Se tivermos um usuário, ele passa automaticamente o objeto user para nosso componente Index como uma prop.

## Configurando o Backend com Supabase

O Supabase oferece uma plataforma robusta para nosso backend, combinando a flexibilidade do PostgreSQL com a simplicidade de uma API moderna. Vamos configurar nossa instância:

1. Acesse https://supabase.com e crie uma conta gratuita
2. No dashboard, crie um novo projeto:
   - Escolha um nome descritivo
   - Defina uma senha forte para o banco de dados
   - Selecione a região mais próxima da sua região Auth0 para minimizar latência

> Dica: A senha definida aqui é crucial pois será usada para acessos administrativos ao PostgreSQL.

### Configuração do Ambiente

O Supabase fornece todas as credenciais necessárias na página de configuração do projeto. Adicione-as ao seu arquivo `.env.local`:

```env
# Credenciais do Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SIGNING_SECRET=seu-jwt-secret

# Prefixo NEXT_PUBLIC permite uso no cliente
```

### Estrutura do Projeto e Sistema de Migrações

O projeto segue uma estrutura organizada para facilitar o desenvolvimento e manutenção:

```
gm-supabase-auth0/
├── pages/                    # Páginas e API routes do Next.js
│   ├── api/                  # Endpoints da API
│   │   └── auth/            # Rotas de autenticação
│   ├── _app.js              # Configuração global do Next.js
│   └── index.js             # Página principal
├── public/                   # Arquivos estáticos
├── styles/                   # Estilos globais
├── utils/                    # Utilitários e helpers
│   └── supabase.js          # Cliente Supabase
└── supabase/                # Configurações do Supabase
    ├── migrations/          # Migrações do banco de dados
    └── config.toml          # Configuração do Supabase

```

#### Sistema de Migrações do Supabase

O Supabase utiliza um sistema robusto de migrações baseado em SQL puro, permitindo total controle sobre a evolução do banco de dados. Cada migração é um arquivo SQL numerado sequencialmente que representa uma mudança específica no schema ou nos dados.

##### Por que usar Migrações?

As migrações oferecem várias vantagens:

1. Controle de Versão:
   - Histórico completo de mudanças no banco
   - Facilidade para reverter alterações
   - Documentação automática da evolução do schema

2. Colaboração:
   - Múltiplos desenvolvedores podem trabalhar em paralelo
   - Conflitos são facilmente identificados e resolvidos
   - Mudanças são aplicadas na ordem correta

3. Ambientes:
   - Replicação exata entre desenvolvimento e produção
   - Facilidade para criar ambientes de teste
   - Consistência garantida entre instâncias

##### Configurando o CLI do Supabase

O Supabase CLI é nossa ferramenta principal para gerenciar migrações:

```bash
npm install --save-dev supabase
```

O CLI oferece comandos para:
- `migration new`: Criar nova migração
- `db push`: Aplicar migrações pendentes
- `db reset`: Reverter todas as migrações
- `db status`: Verificar estado das migrações

Inicialize a estrutura de migrações:

```bash
npx supabase init
```

Isso criará:
- Pasta `supabase/migrations/` para os arquivos SQL
- Arquivo `config.toml` com configurações do projeto
- Estrutura básica para começar a versionar o banco

Crie uma nova migração para a tabela todos:

```sql
-- supabase/migrations/20240112000000_create_todos_table.sql
-- Cria a tabela de todos
CREATE TABLE IF NOT EXISTS public.todos (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    content text,
    user_id text,
    is_complete boolean DEFAULT false
);
```

`content` será o texto exibido para nosso todo, `user_id` será o usuário que possui o todo, e `is_complete` indicará se o todo está concluído. Estamos definindo o valor padrão como false, como assumiríamos para um novo todo.

### Adicionando Dados Iniciais

Vamos adicionar alguns todos de exemplo:

```sql
-- supabase/migrations/20240112000001_seed_todos.sql
-- Insere todos iniciais
INSERT INTO public.todos (content, is_complete)
VALUES 
    ('Mostrar como criar projeto Supabase', false),
    ('Demonstrar integração com Auth0', false),
    ('Completar o tutorial', false);
```

### Funções PostgreSQL para Autenticação

O PostgreSQL oferece recursos poderosos de programação que podemos aproveitar para melhorar nossa segurança. Vamos criar uma função especializada para extrair informações de autenticação do JWT:

```sql
-- supabase/migrations/20240112000002_create_auth_user_id_function.sql
-- Primeiro, garante que o schema auth existe
CREATE SCHEMA IF NOT EXISTS auth;

-- Cria ou substitui a função auth.user_id()
create or replace function auth.user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'userId', '')::text;
$$ language sql stable;
```

Esta função implementa várias práticas recomendadas:

1. Isolamento de Responsabilidade:
   - Usa um schema dedicado para funções de autenticação
   - Mantém a lógica de autenticação centralizada

2. Segurança:
   - Retorna `null` para tokens inválidos
   - Usa `stable` para garantir consistência em transações

3. Performance:
   - Executa a validação no nível do banco
   - Evita múltiplas chamadas de API

### Implementando Segurança com Row Level Security (RLS)

O PostgreSQL oferece um recurso poderoso chamado Row Level Security (RLS), que o Supabase aproveita para implementar autorização no nível do banco de dados. Esta abordagem traz várias vantagens:

- Segurança consistente independente da origem da requisição
- Performance otimizada por eliminar filtros na aplicação
- Regras centralizadas e fáceis de auditar

Primeiro, habilitamos RLS na nossa tabela:

```sql
-- supabase/migrations/20240112000003_enable_rls.sql
-- Habilita RLS na tabela todos
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
```

### Definindo Políticas de Acesso

Com RLS habilitado, precisamos definir políticas que especificam exatamente quais registros cada usuário pode acessar. Nossas políticas implementam o princípio do menor privilégio:

```sql
-- supabase/migrations/20240112000004_add_rls_policies.sql
-- Política para SELECT: usuários só veem seus próprios todos
CREATE POLICY "users can select their own todos" ON public.todos
    FOR SELECT
    USING (auth.user_id() = user_id);

-- Política para INSERT: usuários só criam todos para si mesmos
CREATE POLICY "users can insert their own todos" ON public.todos
    FOR INSERT
    WITH CHECK (auth.user_id() = user_id);
```

Estas políticas garantem que:
- Usuários só podem ver suas próprias tarefas
- Usuários só podem criar tarefas associadas ao seu ID
- Tentativas de acessar dados de outros usuários são automaticamente bloqueadas

Execute as migrações:

```bash
npx supabase db push --db-url postgresql://postgres:[SEU-PASSWORD]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres --debug
```

## Integrando Auth0 com Supabase

Agora que temos nossa estrutura básica configurada, precisamos integrar o Auth0 com o Supabase. O desafio é que cada serviço usa seu próprio sistema de autenticação. Vamos resolver isso usando JWT (JSON Web Tokens).

### Entendendo a Integração

Quando um usuário faz login via Auth0:
1. Auth0 gera um token com o ID do usuário
2. Precisamos criar um novo token que o Supabase aceite
3. Usamos este token para todas as requisições ao Supabase

### Implementando JWT

Primeiro, instale a biblioteca jsonwebtoken:

```bash
npm i jsonwebtoken
```

Agora vamos atualizar nosso handler do Auth0 para gerar o token do Supabase após o login:

```javascript
// pages/api/auth/[...auth0].js
// Importa as funções necessárias
import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Função executada após o login bem-sucedido
const afterCallback = async (req, res, session) => {
  // Cria o payload do JWT com o ID do usuário e expiração
  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expira em 1 hora
  };

  // Assina o token com o segredo do Supabase
  session.user.accessToken = jwt.sign(
    payload,
    process.env.SUPABASE_SIGNING_SECRET
  );

  return session;
};

// Configura o handler com nosso callback
export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
```

### Configurando o Cliente Supabase

Com o JWT implementado, podemos configurar o cliente Supabase para usar o token em todas as requisições. Primeiro, instale a biblioteca:

```bash
npm i @supabase/supabase-js
```

Crie uma nova pasta chamada `utils` e adicione um arquivo chamado `supabase.js`:

```javascript
// utils/supabase.js
import { createClient } from "@supabase/supabase-js";

const getSupabase = async (accessToken) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  return supabase;
};

export { getSupabase };
```

Este cliente:
- Usa as credenciais do Supabase
- Adiciona o JWT em todas as requisições
- Gerencia a conexão com o banco de dados

## Implementação Final do Frontend

Agora vamos implementar a versão final do nosso componente com a funcionalidade de adicionar todos:

```jsx
// pages/index.js
// Importações necessárias
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";
import { useState } from "react";

const Index = ({ user, todos }) => {
  const [content, setContent] = useState("");
  const [allTodos, setAllTodos] = useState([...todos]);

  // Função para adicionar novo todo
  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = await getSupabase(user.accessToken);

    const { data } = await supabase
      .from("todos")
      .insert({ content, user_id: user.sub })
      .select();

    setAllTodos([...allTodos, data[0]]);
    setContent("");
  };

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-2xl space-y-6">
        {/* Cabeçalho */}
        <p className="text-lg flex items-center justify-between">
          <span>Bem-vindo {user.name}!</span>
          <Link 
            href="/api/auth/logout" 
            className="text-blue-400 hover:text-blue-300 underline ml-2"
          >
            Sair
          </Link>
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            onChange={(e) => setContent(e.target.value)}
            value={content}
            placeholder="Adicione uma nova tarefa..."
            className="flex-1 p-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Adicionar
          </button>
        </form>

        {/* Lista de Todos */}
        <div className="space-y-4">
          {allTodos?.length > 0 ? (
            allTodos.map((todo) => (
              <div 
                key={todo.id} 
                className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700 text-white"
              >
                {todo.content}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">
              Você completou todas as tarefas!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const {
      user: { accessToken },
    } = await getSession(req, res);

    const supabase = await getSupabase(accessToken);

    const { data: todos } = await supabase.from("todos").select();

    return {
      props: { todos },
    };
  },
});

export default Index;
```

## Conclusão

Neste tutorial, construímos uma aplicação moderna e segura que demonstra a integração de várias tecnologias poderosas:

### Arquitetura e Segurança
- **Auth0**: Gerenciamento robusto de autenticação e identidade
- **Supabase**: Backend flexível com PostgreSQL e Row Level Security
- **JWT**: Comunicação segura entre serviços com tokens assinados

### Frontend e UX
- **Next.js 15**: Framework React moderno com SSR
- **Tailwind CSS**: Estilização moderna e responsiva
- **React Hooks**: Gerenciamento eficiente de estado

### Boas Práticas
- Segurança em múltiplas camadas
- Autorização no nível do banco de dados
- Isolamento de responsabilidades
- Performance otimizada

Esta implementação serve como base sólida para aplicações que necessitam de autenticação robusta e controle granular de acesso a dados.

## Créditos

Este tutorial é uma adaptação do tutorial original [Using Next.js and Auth0 with Supabase](https://auth0.com/blog/using-nextjs-and-auth0-with-supabase/), atualizado para usar Next.js 15 e Tailwind CSS.

Adaptação por Alexandre Monteiro de Mello

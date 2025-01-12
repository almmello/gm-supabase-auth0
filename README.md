# Next.js Auth0 Supabase Todo App

> Esta é uma adaptação modernizada do tutorial [Using Next.js and Auth0 with Supabase](https://auth0.com/blog/using-nextjs-and-auth0-with-supabase/), utilizando Next.js 15 e Tailwind CSS.

## Visão Geral

Neste tutorial, vamos explorar o uso de Next.js, Auth0 e Supabase para construir um aplicativo Todo clássico. Cada usuário só poderá ver seus próprios todos, então precisaremos implementar autenticação, autorização e um banco de dados.

Este tutorial cobrirá:
- Configuração do Auth0, Next.js e Supabase para trabalhar em conjunto
- Uso da biblioteca nextjs-auth0 para autenticação
- Implementação de políticas Row Level Security (RLS) para autorização
- O que é JWT e como assinar nosso próprio
- Uso de Funções PostgreSQL para extrair valores de um JWT

## Pré-requisitos

Este tutorial não assume experiência prévia com essas tecnologias; no entanto, você precisará ter o Node.js instalado. Além disso, planeje ter contas para os serviços gerenciados abaixo (Auth0 e Supabase). Ambos são gratuitos no momento e não exigem cartão de crédito.

## Stack

### Next.js
Um framework React que facilita a construção de aplicativos web eficientes. Também nos dá a capacidade de escrever lógica server-side — que precisaremos para garantir que nosso aplicativo seja seguro — sem precisar manter nosso próprio servidor.

### Auth0
Uma solução de autenticação e autorização que facilita o gerenciamento de usuários e a segurança de aplicativos. É uma solução extremamente testada e madura para auth.

### Supabase
Um backend-as-a-service open-source, que permite construir um aplicativo em um fim de semana e escalar para milhões. É um wrapper conveniente em torno de uma coleção de ferramentas open-source que permitem armazenamento de banco de dados, armazenamento de arquivos, autenticação, autorização e assinaturas em tempo real. Embora todos estes sejam ótimos recursos, este tutorial usará apenas armazenamento de banco de dados e autorização.

### "Espere, se o Supabase lida com auth, por que estamos usando Auth0?"

Um dos pontos fortes do Supabase é a falta de vendor lock-in. Talvez você já tenha usuários no Auth0, sua empresa tem muita experiência com ele, ou você está interagindo com outros aplicativos que o utilizam. Qualquer componente do Supabase pode ser trocado por um serviço similar e hospedado em qualquer lugar.

Então vamos fazer exatamente isso!

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
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";

const Index = ({ user }) => {
  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
      <p className="text-lg flex items-center justify-between">
        <span>Welcome {user.name}!</span>
        <Link 
          href="/api/auth/logout" 
          className="text-blue-400 hover:text-blue-300 underline ml-2"
        >
          Logout
        </Link>
      </p>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired();

export default Index;
```

Muito limpo! O `withPageAuthRequired` verifica se temos um usuário conectado e lida com o redirecionamento para a página de Login se não houver. Se tivermos um usuário, ele passa automaticamente o objeto user para nosso componente Index como uma prop.

## JWT e Autenticação

### Entendendo JWTs

Um JWT (JSON Web Token) codifica um objeto JSON em uma string que podemos usar para enviar dados entre diferentes serviços.

Por padrão, os dados em um JWT não são criptografados ou privados, apenas codificados.

#### Por que precisamos de JWT?

O segredo de assinatura usado pelo Auth0 não corresponde ao segredo de assinatura do Supabase. Embora não estejamos usando o Supabase para autenticação, ele ainda usa o segredo para verificar o JWT a cada solicitação de dados.

Para resolver isso, vamos:
1. Pegar a propriedade sub (ID do usuário) do Auth0
2. Assinar um novo token usando o segredo que o Supabase espera

Instale a biblioteca jsonwebtoken:

```bash
npm i jsonwebtoken
```

### Implementando JWT com Auth0

Vamos atualizar nosso arquivo `/pages/api/auth/[...auth0].js` para incluir a lógica de JWT:

```javascript
// pages/api/auth/[...auth0].js
import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

const afterCallback = async (req, res, session) => {
  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  session.user.accessToken = jwt.sign(
    payload,
    process.env.SUPABASE_SIGNING_SECRET
  );

  return session;
};

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

Este arquivo:
- Importa as funções necessárias do Auth0 e jsonwebtoken
- Cria uma função afterCallback que será executada após o login
- Pega o ID do usuário (sub) do Auth0
- Cria um novo token com expiração de 1 hora
- Assina o token com o segredo do Supabase
- Adiciona o token à sessão do usuário

É importante fazer logout e login novamente após implementar esta mudança para que o novo token seja gerado.

### Verificando a Implementação

Para confirmar se tudo está funcionando:

1. Faça logout da aplicação (clique em Logout ou acesse `/api/auth/logout`)
2. Faça login novamente
3. Verifique o ID do seu usuário no Auth0 Dashboard (User Management > Users)
4. Copie o user_id e atualize os todos existentes no Supabase com este ID
5. Recarregue a aplicação - você deve ver seus todos agora
6. Tente adicionar um novo todo - ele deve aparecer na lista imediatamente

## Supabase

Acesse o Supabase em https://supabase.com para criar uma conta gratuita no Supabase. No dashboard, clique em New project e escolha sua Organization.

Digite um nome e senha, e selecione uma região geograficamente próxima à que você escolheu para sua região do Auth0.

> Certifique-se de escolher uma senha segura, pois esta será a senha do seu banco de dados PostgreSQL.

Levará alguns minutos para o Supabase provisionar todos os bits em segundo plano, mas esta página exibe convenientemente todos os valores que precisamos para configurar nosso aplicativo Next.js.

Você também pode obtê-los a qualquer momento nas configurações de API do seu projeto.

Adicione estes valores ao arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SIGNING_SECRET=your-jwt-secret
```

### Criando a Tabela com Migrações

Vamos usar o Supabase CLI para gerenciar nossas migrações:

```bash
npm install --save-dev supabase
```

Inicialize a estrutura de migrações:

```bash
npx supabase init
```

Crie uma nova migração para a tabela todos:

```sql
-- supabase/migrations/20240112000000_create_todos_table.sql
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
INSERT INTO public.todos (content, is_complete)
VALUES 
    ('Show how to create Supabase project', false),
    ('Demonstrate Auth0 integration', false),
    ('Complete the tutorial', false);
```

### PostgreSQL Functions

Vamos criar uma função helper no PostgreSQL para extrair o usuário atual logado do JWT da requisição. 

Crie uma nova migração:

```sql
-- supabase/migrations/20240112000002_create_auth_user_id_function.sql
CREATE SCHEMA IF NOT EXISTS auth;

create or replace function auth.user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'userId', '')::text;
$$ language sql stable;
```

Esta função:
- Cria um novo schema auth se não existir
- Cria uma função chamada user_id
- Retorna o userId do JWT atual
- Retorna vazio se não houver userId no JWT

### Habilitando Row Level Security (RLS)

O Supabase usa PostgreSQL por baixo dos panos, o que nos permite usar o Row Level Security. RLS permite escrever regras de autorização no próprio banco de dados, tornando-o mais eficiente e seguro.

Crie uma nova migração para habilitar RLS:

```sql
-- supabase/migrations/20240112000003_enable_rls.sql
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
```

### Configurando Políticas de Acesso

Agora vamos adicionar as políticas que definem quem pode acessar quais dados:

```sql
-- supabase/migrations/20240112000004_add_rls_policies.sql
-- Política para SELECT
CREATE POLICY "users can select their own todos" ON public.todos
    FOR SELECT
    USING (auth.user_id() = user_id);

-- Política para INSERT
CREATE POLICY "users can insert their own todos" ON public.todos
    FOR INSERT
    WITH CHECK (auth.user_id() = user_id);
```

Execute as migrações:

```bash
npx supabase db push --db-url postgresql://postgres:[SEU-PASSWORD]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres --debug
```

### Configurando o Cliente Supabase

Vamos voltar ao nosso aplicativo Next.js e instalar a biblioteca supabase-js:

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

## Implementação Final

Agora vamos implementar a versão final do nosso componente com a funcionalidade de adicionar todos:

```jsx
// pages/index.js
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";
import { useState } from "react";

const Index = ({ user, todos }) => {
  const [content, setContent] = useState("");
  const [allTodos, setAllTodos] = useState([...todos]);

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
        <p className="text-lg flex items-center justify-between">
          <span>Welcome {user.name}!</span>
          <Link 
            href="/api/auth/logout" 
            className="text-blue-400 hover:text-blue-300 underline ml-2"
          >
            Logout
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            onChange={(e) => setContent(e.target.value)}
            value={content}
            placeholder="Add a new todo..."
            className="flex-1 p-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </form>

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
              You have completed all todos!
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

Agora temos uma aplicação Next.js funcional usando:

- Auth0 para autenticação
- Supabase com políticas RLS para autorização
- Tailwind CSS para estilização
- JWT para comunicação segura entre serviços
- PostgreSQL functions para validação de usuários

## Créditos

Este tutorial é uma adaptação do tutorial original [Using Next.js and Auth0 with Supabase](https://auth0.com/blog/using-nextjs-and-auth0-with-supabase/), atualizado para usar Next.js 15 e Tailwind CSS.

Adaptação por Alexandre Monteiro de Mello

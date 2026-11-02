# Catálogo Interativo 2.0 — GJLM Books

Aplicativo de livros em **React Native + Expo + TypeScript**, com dados públicos da [Open Library](https://openlibrary.org/developers/api). Permite criar conta, buscar livros, explorar um catálogo paginado, guardar favoritos, registrar leituras e avaliar cada livro de 1 a 5 estrelas.

## Como executar

### Pré-requisitos

- Node.js 24.12.0 ou superior e npm.
- Git para clonar o repositório.
- Expo Go compatível com o projeto, instalado no celular, ou um emulador/simulador configurado.
- Conexão com a internet para consultar os livros da Open Library.

### Instalação e inicialização

Clone o repositório, acesse a pasta do projeto, instale as dependências e inicie o Expo:

```bash
git clone https://github.com/mirellahaisi/booksgjlm.git
cd booksgjlm
npm ci
npx expo start
```

Após iniciar o Expo, será exibido um QR Code no terminal. Escaneie o código com o Expo Go para abrir o aplicativo no celular.

O celular e o computador devem estar na mesma rede. Caso haja problemas de conexão, tente:

```bash
npx expo start --tunnel
```

Também é possível executar o aplicativo em um ambiente configurado:

```bash
npm run android
npm run ios
npm run web
```

## Configuração

### Modo local (padrão)

O aplicativo funciona no **modo local**, sem necessidade de configurar o Firebase ou criar um arquivo `.env`. Basta abrir o app e criar uma conta local na tela de cadastro. A biblioteca (favoritos, livros lidos e notas) fica salva no AsyncStorage, separada por usuário.

### Modo nuvem (Firebase Auth + Firestore)

Para utilizar a autenticação e a sincronização com o Firebase, siga os passos abaixo.

1. **No console do Firebase**, crie (ou use) um projeto, habilite **Authentication → E-mail/senha** e crie o banco **Cloud Firestore**.
2. **Aplique as regras** do arquivo [`firestore.rules`](firestore.rules) ao Firestore do projeto. Elas restringem a coleção `users/{uid}/books` ao dono dos dados.
3. **Copie o arquivo de exemplo** para `.env`, na raiz do projeto:

   ```bash
   cp .env.example .env
   ```

   No Windows (PowerShell): `Copy-Item .env.example .env`

4. **Preencha os valores** no `.env` com os dados do seu aplicativo web Firebase (Configurações do projeto → Seus aplicativos).
5. **Ative o modo nuvem** definindo, no mesmo `.env`:

   ```env
   EXPO_PUBLIC_USE_FIREBASE=true
   ```

6. **Reinicie o Expo** para ele ler as novas variáveis (pare o servidor com `Ctrl + C` e rode de novo, limpando o cache):

   ```bash
   npx expo start -c
   ```

7. **Cadastre uma conta** no aplicativo. No modo nuvem, o cadastro e o login passam pelo Firebase Authentication, e a biblioteca é sincronizada no Firestore.

Observações:

- Contas criadas no modo local **não são migradas** para o Firebase. Cadastre uma conta nova após ativar o modo nuvem.
- Para voltar ao modo local, defina `EXPO_PUBLIC_USE_FIREBASE=false` (ou remova a linha) e reinicie o Expo.
- O arquivo `.env` é ignorado pelo Git e **não deve ser commitado**. As variáveis `EXPO_PUBLIC_` entram no bundle do aplicativo, então nunca coloque nelas credenciais administrativas ou chaves privadas.

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/components` | Cards, grade, botões, textos escaláveis, checkbox, avaliação, capa ampliada e feedback |
| `src/screens` | Login/cadastro, catálogo, favoritos/lidos e detalhes |
| `src/navigation` | Stack Navigator e acesso condicionado à sessão |
| `src/contexts` | Sessão e biblioteca global por usuário |
| `src/hooks` | Carregamento, erro, paginação, cancelamento e repetição de requisições |
| `src/services` | Axios/Open Library, autenticação, AsyncStorage, SecureStore e Firebase opcional |
| `src/utils` | Limpeza de texto e mensagens de erro |
| `tests` | API, paginação, autenticação, persistência e semântica dos controles |

## API e dados

- **Catálogo e busca:** `GET https://openlibrary.org/search.json`, com `q`, `page`, `limit=20`, campos necessários, categoria e idioma opcionais.
- **Detalhe:** `GET https://openlibrary.org/works/{id}.json`; uma busca complementar pelo ID recupera autores e número de edições.
- **Capas:** `https://covers.openlibrary.org/b/id/{coverId}-M.jpg?default=false`, usando o tamanho `L` nos detalhes.

A API não exige chave para essas consultas. Títulos e descrições mantêm o idioma fornecido; HTML e links Markdown são limpos antes de exibir.


# Catálogo Interativo 2.0 — GJLM Books

Aplicativo de livros em **React Native + Expo + TypeScript**, com dados públicos da
[Open Library](https://openlibrary.org/developers/api). Permite criar conta, buscar
livros, explorar um catálogo paginado, guardar favoritos, registrar leituras e
avaliar cada livro de 1 a 5 estrelas.

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

### Configuração

O aplicativo funciona no modo local, sem necessidade de configurar o Firebase ou criar um arquivo `.env`.

Para utilizar os recursos de autenticação e sincronização com Firebase, é necessário configurar as variáveis disponíveis no arquivo `.env.example`.

## Organização

| Pasta                               | Responsabilidade                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| [src/components](./src/components/) | Cards, grade, botões, textos escaláveis, checkbox, avaliação, capa ampliada e feedback |
| [src/screens](./src/screens/)       | Login/cadastro, catálogo, favoritos/lidos e detalhes                                   |
| [src/navigation](./src/navigation/) | Stack Navigator e acesso condicionado à sessão                                         |
| [src/contexts](./src/contexts/)     | Sessão e biblioteca global por usuário                                                 |
| [src/hooks](./src/hooks/)           | Carregamento, erro, paginação, cancelamento e repetição de requisições                 |
| [src/services](./src/services/)     | Axios/Open Library, autenticação, AsyncStorage, SecureStore e Firebase opcional        |
| [src/utils](./src/utils/)           | Limpeza de texto e mensagens de erro                                                   |
| [tests](./tests/)                   | API, paginação, autenticação, persistência e semântica dos controles                   |

## API e dados

- Catálogo e busca: `GET https://openlibrary.org/search.json`, com `q`, `page`,
  `limit=20`, campos necessários, categoria e idioma opcionais.
- Detalhe: `GET https://openlibrary.org/works/{id}.json`; uma busca complementar
  pelo ID recupera autores e número de edições.
- Capas: `https://covers.openlibrary.org/b/id/{coverId}-M.jpg?default=false`,
  usando o tamanho `L` nos detalhes.
- A API não exige chave para essas consultas. Títulos e descrições mantêm o
  idioma fornecido; HTML e links Markdown são limpos antes de exibir.

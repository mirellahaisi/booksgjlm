# Catálogo Interativo 2.0 — GJLM Books

Aplicativo de livros em **React Native + Expo + TypeScript**, com dados públicos da
[Open Library](https://openlibrary.org/developers/api). Permite criar conta, buscar
livros, explorar um catálogo paginado, guardar favoritos, registrar leituras e
avaliar cada livro de 1 a 5 estrelas.

## Relação com o trabalho anterior

O [GJLM Gallery](https://github.com/leostall/gjlm-gallery) é a referência de estrutura
funcional. Aquele projeto usa Flutter e obras de arte do Cleveland Museum of Art.
Este usa React Native e livros da Open Library: **o tema e a API são diferentes**.
A busca aqui apresenta uma lista de resultados; a pessoa escolhe qual livro abrir.

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


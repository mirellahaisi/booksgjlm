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

## Rodar no Mac e no celular

Pré-requisito: Node.js >= 24.12.0, conforme [package.json](./package.json).
Na pasta deste aplicativo:

```bash
npm ci
npx expo login
npm start
```

Instale o Expo Go no celular e entre com a mesma conta Expo usada no terminal.
Mantenha Mac e celular no mesmo Wi-Fi. No iPhone, leia o QR code com a Câmera;
no Android, use o leitor do Expo Go. Se a rede bloquear a conexão:

```bash
npm start -- --tunnel
```

O login do Expo permite abrir o projeto. O cadastro dentro do GJLM Books é uma
conta diferente, usada para sua biblioteca. Sem Firebase ativado, crie uma conta
local no próprio aplicativo. Esse modo funciona sem arquivo de ambiente.

Se o Expo Go informar incompatibilidade de SDK, confira a versão suportada pelo
app instalado antes de alterar as dependências do projeto.

Para o navegador:

```bash
npm run web
```

Ao abrir a pasta pai no VS Code, **Terminal → Executar Tarefa** disponibiliza
“GJLM Books: Celular (Expo Go)”, “GJLM Books: Expo Web” e
“GJLM Books: Verificar projeto”.

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

## Acessibilidade

Todos os textos e campos próprios usam [Typography](./src/components/Typography.tsx),
com escala do sistema habilitada e sem limite de multiplicação. A grade passa
para uma coluna com fonte grande; ações, filtros e metadados quebram linha.
O cabeçalho permite várias linhas e rolagem para títulos extensos. Mensagens de
erro fazem parte da área rolável para não ocupar permanentemente a tela inteira.

Botões têm função e rótulo acessíveis. O filtro de português lê seu texto visível e
informa o estado atual com um único estado `checked`.
No iOS, usa a semântica nativa de interruptor (`switch`): o UIKit verbaliza o
estado, evitando as strings “checkbox checked/unchecked” acrescentadas pelo
React Native. Android e web mantêm a semântica de checkbox. O leitor
decide como verbalizar a função e o estado conforme idioma e configuração do
sistema. No iOS, o idioma dos controles é indicado como português brasileiro.
Na web, os estados equivalentes são expostos por ARIA.

O nome de cada botão pertence ao controle externo. Texto, ícones e indicadores
internos são decorativos e não criam anúncios adicionais. Durante uma operação,
o botão informa que está ocupado (por exemplo, “Atualizando catálogo”) e bloqueia
novas ativações no handler. O carregamento, por si só, não aplica o estado
desativado, que pode provocar anúncios como “escuro”/“esmaecido” no VoiceOver.
Controles realmente indisponíveis continuam expondo o estado desativado.
No iOS, o estado `busy` é omitido porque o React Native pode acrescentar a palavra
inglesa “busy” mesmo com `accessibilityLanguage="pt-BR"`. A operação é informada
pelo rótulo em português. Android e web preservam o estado ocupado.

No campo de senha, a regra de oito caracteres aparece uma vez no rótulo acessível;
o placeholder apenas orienta a digitação. O controle de visibilidade lê “Mostrar
senha” ou “Ocultar senha” e confirma “Senha visível”/“Senha oculta” ao ativá-lo.

O campo de busca tem nome próprio. As capas dos cards são decorativas. O foco de
“Ver detalhes” segue a ordem **título → autoria → ano → leitura/nota → favorito**.
A autoria tem um rótulo explícito, e leitura e nota ficam juntas:
“Ver detalhes de Livro. Autoria: Autora. Ano: 1900. Lido. Sua nota: 4 de 5 estrelas.
Nos favoritos”. Sem leitura marcada, usa “Para descobrir”; lido sem avaliação,
“Lido, ainda sem nota”. O ano é omitido quando indisponível. O rodapé visual não
cria uma parada repetida. O coração permanece separado, identificado pelo livro.

Na tela de detalhes, título, autoria, publicação e edições são lidos separadamente,
conforme a pessoa avança o foco. O título lê apenas o nome do livro. Os botões, a
sinopse e os temas também mantêm seus próprios focos. A capa tem um
único foco de imagem, inclusive quando indisponível, sem exigir toque para abrir.

Favoritos e leitura leem a ação escrita no botão: “Adicionar aos favoritos”,
“Remover dos favoritos”, “Marcar como lido” ou “Marcar como não lido”. Após a
persistência local, uma confirmação informa o livro e o resultado. Não há anúncio
de sucesso ao apenas focar, durante o salvamento, na hidratação ou na sincronização.
Uma falha preserva o estado anterior e mostra o erro. A confirmação é centralizada
na biblioteca, inclusive quando uma remoção tira o card da coleção.

Na avaliação, a estrela escolhida lê “Sua nota atual: N de 5 estrelas”. As outras
leem “Mudar para nota N de 5 estrelas”; sem avaliação, “Dar nota N de 5 estrelas”.
Ativar a nota atual confirma que ela já está salva, sem gravá-la novamente. Uma
mudança só é confirmada com “nota salva” após persistir. Durante o salvamento, os
rótulos preservam a nota atual e pedem para aguardar; novas ativações são bloqueadas.

No iOS, o trait `selected` é omitido nesses botões para evitar o prefixo genérico
“selecionado”. Android/web preservam os estados de seleção/ARIA. Categorias indicam
qual é a atual e confirmam mudanças; o filtro de português usa seu texto visível e
o estado nativo de interruptor/caixa de seleção.
As confirmações de gravação são emitidas depois da renderização do estado salvo.
No iOS, usam
[`announceForAccessibilityWithOptions` com `queue: false`](https://reactnative.dev/docs/accessibilityinfo#announceforaccessibilitywithoptions)
para interromper a fala da ação anterior, sem enfileirar o resultado atrás dela.
Outras mensagens continuam usando a fila. Android usa `announceForAccessibility`;
web usa uma região viva (`assertive` para a confirmação, `polite` para as demais),
pois RN Web não implementa esse método de anúncio.

Ao entrar ou voltar a uma página, o foco vai para seu título após a transição.
O cabeçalho apresenta o título antes de “Voltar para [página anterior]”. Catálogo,
favoritos, lidos e detalhes têm nomes explícitos; nos detalhes, o nome do livro é
acrescentado ao título. Login e cadastro usam “Entrar na conta” e “Criar conta” nos
títulos do formulário, pois não exibem o cabeçalho de navegação. A gestão de foco
usa o [evento de fim da transição](https://reactnavigation.org/docs/native-stack-navigator/#transitionend)
e [`sendAccessibilityEvent`](https://reactnative.dev/docs/accessibilityinfo#sendaccessibilityevent)
nas plataformas nativas; na web, o título recebe foco programático sem entrar na
sequência de Tab. Atualizar dados na mesma página não refoca o título.

No iPhone, **Reconhecimento de Texto** do VoiceOver faz OCR das imagens e pode
acrescentar as palavras da capa ao rótulo fornecido pelo app. Essa leitura dos
pixels é diferente da árvore de acessibilidade oculta pelos componentes. Para
ouvir apenas os rótulos do app, desative **Ajustes → Acessibilidade → VoiceOver →
Reconhecimento do VoiceOver → Reconhecimento de Texto**. Se também houver
descrições automáticas dos detalhes visuais, desative **Descrições de Imagens**
nessa mesma tela. O app não altera essas preferências do sistema. Veja a
[explicação da Apple](https://support.apple.com/pt-br/111799).

## Persistência e autenticação

O modo local usa AsyncStorage para biblioteca e verificadores de senha
PBKDF2-SHA256 com salt aleatório. Senhas em texto puro não são persistidas.
No iOS/Android, a identificação da sessão fica no SecureStore. Na web, onde
SecureStore não existe, o identificador de sessão fica no AsyncStorage.
Os dados são separados por usuário e por provedor de autenticação.

O app aguarda a restauração da sessão e da biblioteca antes de mostrar o catálogo.
Falhas de leitura não substituem dados salvos por uma coleção vazia. A interface
confirma a alteração de favoritos, lidos e notas após salvar localmente.

## Bônus opcionais: Firebase Auth e Firestore

A integração está implementada, mas os bônus dependem da configuração e validação
no serviço real. Não são necessários para demonstrar os requisitos locais.

1. Crie/configure seu projeto Firebase e habilite Authentication → E-mail/senha.
2. Crie o Firestore e aplique as regras de [firestore.rules](./firestore.rules)
   ao projeto correto. Elas restringem a coleção `users/{uid}/books` ao dono.
3. Copie [.env.example](./.env.example) para `.env`, preencha os valores do seu
   aplicativo Firebase e defina `EXPO_PUBLIC_USE_FIREBASE=true`.
4. Reinicie o Expo. Cadastre uma conta Firebase no aplicativo; contas locais
   não são migradas automaticamente.
5. Faça a conferência em dois dispositivos descrita no checklist.

Arquivos `.env` são ignorados pelo Git. Variáveis `EXPO_PUBLIC_` entram no bundle
do cliente: nunca coloque credenciais administrativas ou chaves privadas nelas.
A autorização dos dados depende das regras do Firestore e do Firebase Auth.

## Verificação e apresentação

```bash
npm run check
npm run export:web
```

O primeiro comando executa TypeScript, ESLint e Vitest. Os testes de interface
usam React Native Web/JSDOM e não simulam a voz, o layout nativo nem as configurações
reais de fonte do sistema. A validação final de RF10 precisa de VoiceOver/TalkBack
e fontes ampliadas no aparelho.

Veja o [mapeamento RF01–RF10 e roteiro de avaliação](./CHECKLIST_REQUISITOS.md).

## Referências

- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Acessibilidade no React Native](https://reactnative.dev/docs/accessibility)
- [Escala de texto no React Native](https://reactnative.dev/docs/text#allowfontscaling)
- [Executar o projeto no Expo Go](https://docs.expo.dev/get-started/start-developing/)

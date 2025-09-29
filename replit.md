# WhatsApp Bot - NEEXT LTDA

## Visão Geral
Bot WhatsApp automatizado construído com Baileys, com sistema de antilink avançado e funcionalidades de administração de grupos.

## Funcionalidades Principais

### 🤖 Comandos do Bot
- **`.ping`** - Verifica status do bot e informações do sistema
- **`.hora`** - Mostra horário atual
- **`.dono`** - Identifica o dono do bot
- **`.marca`** - Menciona todos os membros do grupo (apenas em grupos)
- **`.recado`** - Confirma que bot está ativo
- **`.s`** - Converte imagem/vídeo para sticker
- **`.hermitwhite`** - Cria ID no sistema NEEXT (requer dados pessoais)
- **`prefixo`** - Mostra o prefixo do bot (sem prefixo)

### ⚡ Comandos Administrativos
**Comandos exclusivos para administradores que exigem que o bot também seja admin:**

#### 🔒 Controle do Grupo
- **`.fechargrupo`** ou **`.fechar`** - Fecha o grupo (apenas admins podem enviar mensagens)
- **`.abrirgrupo`** ou **`.abrir`** - Abre o grupo (todos podem enviar mensagens)
- **`.soloadmin`** ou **`.adminonly`** - Permite apenas admins editarem informações do grupo

#### 🗑️ Moderação de Mensagens
- **`.delmsg`**, **`.del`** ou **`.delete`** - Deleta mensagem marcada (use respondendo a uma mensagem)

#### 🔗 Gerenciamento de Link
- **`.resetlink`**, **`.resetarlink`** ou **`.novolink`** - Gera novo link de convite e invalida o anterior

#### 👥 Controle de Entrada
- **`.ativarsolicitacao`**, **`.ativarjoin`** ou **`.reqon`** - Ativa aprovação obrigatória para novos membros
- **`.desativarsolicitacao`**, **`.desativarjoin`** ou **`.reqoff`** - Desativa aprovação obrigatória

#### ✏️ Edição do Grupo
- **`.mudargrupo`**, **`.mudarnome`** ou **`.renamegroup [nome]`** - Altera o nome do grupo

**Requisitos:**
- ✅ Usuário deve ser admin do grupo
- ✅ Bot deve ser admin do grupo
- ✅ Funciona apenas em grupos
- ⚠️ Se o bot não for admin, será exibido aviso específico

### 🆔 Sistema de Criação de ID - NEEXT
Comando para criar IDs únicos no sistema da NEEXT LTDA:

#### Como Usar:
- **`.hermitwhite [nome] [idade] [telefone] [instagram] [email]`** - Cria um novo ID

#### Exemplo:
```
.hermitwhite João Silva 25 5527999999999 @joao_silva joao@gmail.com
```

#### Validações:
- ✅ Todos os campos são obrigatórios
- ✅ Instagram deve incluir o @ (ex: @usuario)
- ✅ Telefone deve ter 10-15 dígitos (ex: 5527999999999)
- ✅ Email deve ser válido (ex: usuario@provedor.com)

#### Recursos:
- ✅ Integração com API Google Sheets
- ✅ Geração automática de ID sequencial
- ✅ Validação completa de dados
- ✅ Mensagem de confirmação com ID gerado
- ✅ Tratamento de erros robusto

### 🎮 Jogo Akinator
Sistema de jogo interativo do Akinator (gênio da lâmpada):

#### Como Usar:
- **`.akinator`** - Inicia uma nova partida do jogo
- **`.resetaki`** - Reseta/cancela a partida atual

#### Como Jogar:
1. Digite `.akinator` em um grupo para iniciar
2. Responda as perguntas com: **Sim**, **Não**, **Não sei**, **Provavelmente sim** ou **Provavelmente não**
3. O Akinator tentará adivinhar o personagem que você está pensando
4. Use `.resetaki` para cancelar o jogo a qualquer momento

#### Recursos:
- ✅ Funciona apenas em grupos
- ✅ Uma partida por grupo por vez
- ✅ Controle de acesso por jogador
- ✅ Limite de uma partida por dia
- ✅ Sistema de reset para admins e quem iniciou o jogo
- ✅ Respostas inteligentes em português
- ⚠️ API pode estar sujeita a limitações de Cloudflare

### 💰 Sistema RPG - NeextCity
Sistema completo de economia virtual com loja, trabalhos, jogos e inventário:

#### 👤 Cadastro no RPG:
- **`.rpg on/off`** - Ativa/desativa RPG no grupo (apenas admins)
- **`.registrar [nome] [banco]`** - Cadastro inicial no sistema

#### 💼 Comandos para Ganhar Gold:
- **`.pescar`** - Pescar para ganhar gold (cooldown: 15 min)
- **`.minerar`** - Minerar recursos preciosos (cooldown: 20 min)
- **`.trabalhar`** - Trabalhar por gold (cooldown: 25 min)
- **`.cacar`** - Caçar animais selvagens (cooldown: 20 min)
- **`.coletar`** - Coletar itens da natureza (cooldown: 10 min)
- **`.agricultura`** - Plantar e colher (cooldown: 25 min)
- **`.entrega`** - Fazer entregas na cidade (cooldown: 30 min)

#### 🛒 Sistema de Loja e Inventário:
- **`.loja`** - Ver todas as categorias disponíveis
- **`.loja [categoria]`** - Ver itens de categoria específica
- **`.comprar [item] [quantidade]`** - Comprar itens (qtd: 1-10)
- **`.inventario`** - Ver seus itens comprados

#### 🏪 Categorias da Loja:
- **Propriedades** - Casas, fazendas, empresas
- **Animais** - Galinhas, cavalos, gatos
- **Veículos** - Motos, carros, aviões
- **Ferramentas** - Varas, picaretas, tratores
- **Negócios** - Lanchonetes, academias

#### 🎰 Jogos e Diversão:
- **`.tigrinho [valor]`** - Caça-níquel
- **`.assalto @user`** - Assaltar jogador
- **`.apostar [valor]`** - Apostar na sorte
- **`.investir [tipo] [valor]`** - Investimentos

#### 🎓 Educação e Crescimento:
- **`.estudar`** - Ver cursos disponíveis
- **`.estudar [num]`** - Fazer curso específico

#### 💸 Sistema Bancário:
- **`.pix @user [valor]`** - Transferir gold
- **`.saldo`** - Ver saldo e estatísticas
- **`.rank`** - Ranking dos mais ricos

#### Recursos do Sistema:
- ✅ Economia balanceada com cooldowns
- ✅ Sistema de inventário persistente
- ✅ Loja com 5 categorias e 25+ itens
- ✅ 7 formas diferentes de ganhar gold
- ✅ Sistema bancário completo
- ✅ Proteção contra spam com cooldowns
- ✅ Dados salvos em JSON (database/grupos/rpg_data.json)

### 🛡️ Sistema Anti-Spam Avançado
Sistema completo de proteção contra diversos tipos de conteúdo:

#### 🔗 Proteção Contra Links:
- **`.antilink on/off`** - Anti-links básico
- **`.antilinkhard on/off`** - Anti-links avançado (detecta w.w.w, bit(.)ly, etc)

#### 🔞 Proteção de Conteúdo:
- **`.antiporno on/off`** - Detecta e bloqueia conteúdo pornográfico
- **`.antipalavrao on/off`** - Detecta e bloqueia palavrões

#### 📱 Outras Proteções:
- **`.anticontato on/off`** - Anti-contatos
- **`.antidocumento on/off`** - Anti-documentos
- **`.antivideo on/off`** - Anti-vídeos
- **`.antiaudio on/off`** - Anti-áudios
- **`.antisticker on/off`** - Anti-stickers
- **`.antiflod on/off`** - Anti-flood
- **`.antifake on/off`** - Anti-números fake
- **`.x9 on/off`** - Anti-X9 Monitor

#### 🛡️ Proteções do Dono:
- **`.antipv on/off`** - Bloqueia PVs de não-donos (apenas dono)
- **`.anticall on/off`** - Rejeita chamadas automaticamente (apenas dono)

#### ✨ Comando Especial:
- **`.hidetag [texto]`** - Marcação oculta (admins) - menciona todos sem mostrar as menções

#### Recursos:
- ✅ Detecta automaticamente conteúdo proibido
- ✅ Remove mensagens e bane usuários instantaneamente
- ✅ Protege admins e dono (não remove suas mensagens)
- ✅ Configuração por grupo (salva em JSON)
- ✅ Apenas admins podem ativar/desativar (exceto antipv/anticall)
- ✅ Feedback visual com reações e mensagens
- ✅ Normalização de acentos para detecção precisa
- ✅ Suporte a texto e legendas de mídia

### 🔧 Configurações
As configurações do bot estão em `settings/settings.json`:
- **prefix**: Prefixo dos comandos (padrão: ".")
- **nomeDoBot**: Nome do bot
- **numeroDoDono**: Número do dono do bot
- **nickDoDono**: Apelido do dono

### 📁 Estrutura do Projeto
- `main.js` - Script principal com tratamento de erros
- `connect.js` - Gerenciamento de conexão WhatsApp
- `index.js` - Lógica do bot e comandos
- `settings/settings.json` - Configurações do bot
- `arquivos/` - Funções utilitárias e assets
- `conexao/` - Arquivos de sessão WhatsApp (auto-gerados)

### 🚀 Como Executar
O bot é executado automaticamente via Workflow do Replit:
1. Conecta automaticamente ao WhatsApp
2. Se primeira vez, solicita método de conexão (QR Code ou Pareamento)
3. Processa mensagens e comandos em tempo real

### 📊 Logs e Monitoramento
- Logs detalhados de todas as mensagens processadas
- Identificação de comandos vs mensagens normais
- Rastreamento de ações do antilink
- Tratamento de erros robusto

### 🔐 Segurança
- Arquivos de sessão excluídos do Git
- Verificação de permissões para comandos administrativos
- Proteção contra spam com cache de mensagens processadas

## Alterações Recentes
- ✅ Implementado sistema completo de antilink
- ✅ Adicionadas verificações de admin e dono
- ✅ Criado sistema de configuração por grupo
- ✅ Melhorado tratamento de erros
- ✅ Adicionadas reações visuais aos comandos
- ✅ Configurado para funcionar no ambiente Replit
- ✅ Melhorada implementação do comando Pinterest
- ✅ Instaladas todas as dependências necessárias
- ✅ **NOVO**: Implementado jogo do Akinator com aki-api
- ✅ **NOVO**: Adicionados comandos .akinator e .resetaki
- ✅ **NOVO**: Sistema de gestão de partidas por grupo
- ✅ **NOVO**: Processamento inteligente de respostas do usuário
- ✅ **NOVO**: Estrutura de banco de dados para jogos
- ✅ **RECENTE**: Implementados 8 comandos administrativos completos
- ✅ **RECENTE**: Sistema automático de contagem de comandos
- ✅ **RECENTE**: Controle total de grupos (abrir/fechar/resetar link)
- ✅ **RECENTE**: Moderação avançada (deletar mensagens, controlar entrada)
- ✅ **RECENTE**: Verificações robustas de permissões admin
- ✅ **MAIS RECENTE**: Implementado sistema de loja RPG completo
- ✅ **MAIS RECENTE**: Adicionados 4 novos comandos para ganhar gold (cacar, coletar, agricultura, entrega)
- ✅ **MAIS RECENTE**: Sistema de inventário com 5 categorias e 25+ itens
- ✅ **MAIS RECENTE**: Backend robusto com cooldowns e persistência de dados
- ✅ **MAIS RECENTE**: Menu RPG atualizado com todas as funcionalidades
- ✅ **ÚLTIMO**: Implementados 6 comandos de moderação avançada (antiporno, antilinkhard, antipalavrao, antipv, anticall, hidetag)
- ✅ **ÚLTIMO**: Sistema anti-spam expandido com detecção de pornografia e palavrões
- ✅ **ÚLTIMO**: Normalização de acentos para detecção precisa em português
- ✅ **ÚLTIMO**: Proteções do dono (bloqueio de PV e chamadas)
- ✅ **ÚLTIMO**: Comando hidetag para marcação oculta
- ✅ **ÚLTIMO**: Menus atualizados com todas as novas funcionalidades

## Estado Atual
✅ **Bot Online e Funcionando no Replit**
✅ **Antilink Implementado e Testado**
✅ **Todos os Comandos Operacionais**
✅ **Comando Pinterest Melhorado**
✅ **Workflow Configurado e Rodando**
✅ **Dependências Instaladas e Funcionando**
✅ **Stickers com Selinho Quotado Implementado**
✅ **Deployment Configurado para Produção (VM)**
✅ **Bot Conectado e Processando Comandos Ativamente**
✅ **Menu Principal Reformulado com Estatísticas Dinâmicas**
✅ **Sistema de Configuração Seguro Implementado**
✅ **Importação GitHub Configurada Completamente**
✅ **Detecção Automática de Ambiente Replit**
✅ **QR Code Automático em Ambiente Não-Interativo**

### 🆕 Funcionalidades Recentes
- **Menu Principal Avançado**: Novo design com contadores de comandos, grupos e registros
- **Configuração de Segurança**: Template `.env.example` para configuração segura
- **Estatísticas Dinâmicas**: Contagem automática de comandos, grupos e usuários registrados
- **Sistema de Cargo**: Detecção automática de cargo (Dono, Admin, Membro)
- **Saudação Inteligente**: Saudações baseadas no horário atual

### 🚀 Ambiente de Produção
- **Deployment Target**: VM (para conexão persistente)
- **Comando de Produção**: `node main.js`
- **Status**: Pronto para deploy

### 🔧 Configuração GitHub Import (Setembro 2025)
- **Importação Automática**: ✅ Bot configurado para funcionar após importação do GitHub
- **Detecção Replit**: ✅ Sistema detecta automaticamente ambiente Replit/não-interativo
- **Dependências**: ✅ Todas as dependências do npm instaladas automaticamente
- **Workflow**: ✅ Configurado para executar `node main.js` no console
- **Deploy**: ✅ Configurado para VM (conexão persistente necessária para WhatsApp)
- **Ambiente**: ✅ Pronto para uso imediato após importação
- **Status**: ✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO

## Configuração para Replit
Este projeto foi configurado para funcionar no ambiente Replit com as seguintes otimizações:

### ✅ Configuração Realizada
- **Workflow Configurado**: Bot executa via `node main.js` no console
- **Dependências Instaladas**: Todas as dependências do package.json instaladas com sucesso
- **Arquivos Corrompidos Corrigidos**: Removidos duplicatas e erros de sintaxe do index.js
- **Configuração de Segurança**: Settings.json configurado com valores seguros (placeholders)
- **Estrutura de Pastas**: Todas as pastas necessárias criadas automaticamente

### 🔐 Configuração de Ambiente
Para usar o bot, configure as seguintes variáveis de ambiente baseadas no arquivo `.env.example`:

- `BOT_OWNER_NUMBER`: Seu número de WhatsApp (formato: 5527999999999)
- `BOT_OWNER_NICKNAME`: Seu apelido
- `BOT_NAME`: Nome do bot
- `BOT_PREFIX`: Prefixo dos comandos (padrão: .)
- `BOT_PHOTO_URL`: URL da foto do bot

### 🚀 Como Iniciar no Replit
1. O bot inicia automaticamente quando o projeto é executado
2. Na primeira execução, escolha o método de conexão:
   - **QR Code**: Para conectar via computador
   - **Pareamento**: Para conectar via celular (digite seu número)
3. Após conectar, o bot ficará online e processará comandos automaticamente

### 📁 Arquivos de Sessão
- Pasta `conexao/`: Contém arquivos de sessão do WhatsApp (gerados automaticamente)
- Estes arquivos mantêm a sessão ativa entre reinicializações
- **Importante**: Não compartilhar estes arquivos pois contêm credenciais de acesso
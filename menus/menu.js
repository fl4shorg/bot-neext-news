// menu.js - Sistema de menus organizados do bot NEEXT LTDA

// Função para obter configurações atualizadas em tempo real
function obterConfiguracoes() {
    delete require.cache[require.resolve('../settings/settings.json')];
    return require('../settings/settings.json');
}

// Importa funções utilitárias
const { obterSaudacao, contarGrupos, contarComandos } = require('../arquivos/funcoes/function.js');
const { obterEstatisticas } = require('../arquivos/registros.js');

// Função para determinar cargo do usuário
async function obterCargoUsuario(sock, from, sender) {
    try {
        // Verifica se é o dono
        const config = obterConfiguracoes();
        const numeroDono = config.numeroDoDono + "@s.whatsapp.net";
        if (sender === numeroDono) {
            return "👑 Dono";
        }

        // Se estiver em grupo, verifica se é admin
        if (from.endsWith('@g.us') || from.endsWith('@lid')) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participant = groupMetadata.participants.find(p => p.id === sender);
                if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                    return "🛡️ Admin";
                }
            } catch (err) {
                // Se der erro, assume membro
            }
        }

        return "👤 Membro";
    } catch (err) {
        return "👤 Membro";
    }
}

// ========================
// MENU PRINCIPAL - NOVO FORMATO
// ========================
async function obterMenuPrincipal(sock, from, sender, pushName) {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    
    try {
        // Obter informações dinâmicas
        const saudacao = obterSaudacao();
        const totalComandos = contarComandos();
        const totalGrupos = await contarGrupos(sock);
        const estatisticasRegistros = obterEstatisticas();
        const cargoUsuario = await obterCargoUsuario(sock, from, sender);
        const nomeUsuario = pushName || "Usuário";
        
        return `${saudacao}! 👋

╭──〔 𖦹∘̥⸽⃟ INFORMAÇÕES 〕──⪩
│ 𖦹∘̥⸽🎯⃟ Prefixo: 「 ${prefix} 」
│ 𖦹∘̥⸽📊⃟ Total de Comandos: ${totalComandos}
│ 𖦹∘̥⸽🤖⃟ Nome do Bot: ${nomeDoBot}
│ 𖦹∘̥⸽👤⃟ Usuário: ${nomeUsuario}
│ 𖦹∘̥⸽🛠️⃟ Versão: ^7.0.0-rc.3
│ 𖦹∘̥⸽👑⃟ Dono: ${nickDoDono}
│ 𖦹∘̥⸽📈⃟ Total de Grupos: ${totalGrupos}
│ 𖦹∘̥⸽📝⃟ Total Registrado: ${estatisticasRegistros.totalRegistros}
│ 𖦹∘̥⸽🎗️⃟ Cargo: ${cargoUsuario.split(' ')[1]}
╰───────────────────⪨

╭──〔 MENUS DISPONÍVEIS 〕──⪩
│ 𖧈∘̥⸽🏠⃟ menuPrincipal
│ 𖧈∘̥⸽🎬⃟ menudownload
│ 𖧈∘̥⸽🖼️⃟ menufigurinhas
│ 𖧈∘̥⸽🔞⃟ menuhentai
│ 𖧈∘̥⸽🛠️⃟ menuadm
│ 𖧈∘̥⸽👑⃟ menudono
│ 𖧈∘̥⸽🎉⃟ menubrincadeira
│ 𖧈∘̥⸽🧑‍🤝‍🧑⃟ menuMembro
│ 𖧈∘̥⸽🎮⃟ menuGamer
│ 𖧈∘̥⸽🌐⃟ menuNeext
╰──────────────────────⪨

© NEEXT LTDA`;
    } catch (error) {
        console.error('Erro ao gerar menu principal:', error);
        // Fallback para menu simples
        return `🤖 *${nomeDoBot} - MENU PRINCIPAL*\n\n📋 *CATEGORIAS DISPONÍVEIS:*\n\n👥 \`${prefix}menumembro\` - Comandos para membros\n🛡️ \`${prefix}menuadmin\` - Comandos administrativos\n👑 \`${prefix}menudono\` - Comandos do dono\n\n━━━━━━━━━━━━━━━\n© NEEXT LTDA - ${nickDoDono}`;
    }
}

// ========================
// MENU MEMBRO (comandos básicos)
// ========================
function obterMenuMembro() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
👥 *COMANDOS PARA MEMBROS*

🤖 *INFORMAÇÕES DO BOT:*
• \`${prefix}ping\` - Status e informações do sistema
• \`${prefix}hora\` - Horário atual
• \`${prefix}dono\` - Informações do dono
• \`${prefix}recado\` - Confirma que o bot está ativo
• \`prefixo\` - Mostra o prefixo atual

📝 *UTILITÁRIOS:*
• \`${prefix}status [texto]\` - Atualiza status do bot
• \`${prefix}rg\` - Registra-se no sistema do bot
• \`${prefix}hermitwhite [dados]\` - Cria ID no sistema NEEXT

🏷️ *STICKERS:*
• \`${prefix}s\` - Converte mídia em sticker
• \`${prefix}rename [pack|author]\` - Renomeia sticker

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU ADMIN (comandos administrativos)
// ========================
function obterMenuAdmin() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🛡️ *COMANDOS ADMINISTRATIVOS*

👥 *GERENCIAMENTO DE GRUPO:*
• \`${prefix}marca\` - Menciona todos os membros
• \`${prefix}fechargrupo\` / \`${prefix}fechar\` - Fecha o grupo
• \`${prefix}abrirgrupo\` / \`${prefix}abrir\` - Abre o grupo
• \`${prefix}mudargrupo [nome]\` - Altera nome do grupo
• \`${prefix}resetlink\` - Gera novo link do grupo

🗑️ *MODERAÇÃO:*
• \`${prefix}del\` - Deleta mensagem marcada
• \`${prefix}ativarsolicitacao\` - Ativa aprovação de membros
• \`${prefix}desativarsolicitacao\` - Desativa aprovação
• \`${prefix}soloadmin\` - Apenas admins editam grupo

⚙️ *CONFIGURAÇÕES:*
• \`${prefix}antilink on/off\` - Liga/desliga antilink
• \`${prefix}modogamer on/off\` - Liga/desliga modo gamer
• \`${prefix}rpg on/off\` - Liga/desliga sistema RPG

📊 *STATUS:*
• \`${prefix}grupo-status\` - Status do grupo
• \`${prefix}status-anti\` - Status sistemas anti-spam

⚠️ *Requer: Admin do grupo + Bot admin*

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU DONO (comandos exclusivos)
// ========================
function obterMenuDono() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
👑 *COMANDOS DO DONO*

⚙️ *CONFIGURAÇÕES DO BOT:*
• \`${prefix}trocar-prefixo [novo]\` - Altera prefixo
• \`${prefix}trocar-nome [novo]\` - Altera nome do bot
• \`${prefix}trocar-nick [novo]\` - Altera nick do dono
• \`${prefix}configurar-bot\` - Guia de configurações

🔧 *CONTROLE TOTAL:*
• Todos os comandos de admin funcionam
• Bypass de todas as restrições
• Controle completo sobre configurações

⚠️ *Acesso exclusivo para: ${nickDoDono}*

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU DOWNLOAD (mídia e downloads)
// ========================
function obterMenuDownload() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
📥 *DOWNLOADS E MÍDIA*

🎵 *MÚSICA:*
• \`${prefix}play [nome]\` - Busca música no YouTube

📷 *IMAGENS:*
• \`${prefix}pinterest [busca]\` - Imagens do Pinterest
• \`${prefix}brat [texto]\` - Gera imagem BRAT

📱 *REDES SOCIAIS:*
• \`${prefix}ig [link]\` - Download Instagram
• \`${prefix}instagram [link]\` - Download Instagram

🏷️ *STICKERS:*
• \`${prefix}s\` - Criar sticker de mídia
• \`${prefix}rename [pack|author]\` - Editar sticker

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU GAMER (jogos e entretenimento)
// ========================
function obterMenuGamer() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🎮 *JOGOS E ENTRETENIMENTO*

⚠️ *Requer \`${prefix}modogamer on\` ativo no grupo*

🎯 *JOGOS INTERATIVOS:*
• \`${prefix}jogodavelha @user\` - Jogo da velha
• \`${prefix}roletarussa @user\` - Roleta russa
• \`${prefix}disparar\` - Atirar na roleta russa
• \`${prefix}resetjogodavelha\` - Reset jogo da velha
• \`${prefix}resetroleta\` - Reset roleta russa

🎲 *DIVERSÃO:*
• \`${prefix}eununca\` - Eu nunca poll
• \`${prefix}impostor\` - Escolhe impostor aleatório

💥 *AÇÕES DIVERTIDAS:*
• \`${prefix}tapa @user\` - Dar tapa
• \`${prefix}matar @user\` - Matar alguém
• \`${prefix}atirar @user\` - Atirar em alguém
• \`${prefix}atropelar @user\` - Atropelar
• \`${prefix}beijar @user\` - Beijar alguém
• \`${prefix}prender @user\` - Prender alguém
• \`${prefix}sarra @user\` - Sarrar em alguém
• \`${prefix}dedo @user\` - Mostrar dedo

📊 *RANKINGS DIVERTIDOS:*
• \`${prefix}rankcorno\` - Rank dos cornos
• \`${prefix}rankgay\` - Rank dos gays
• \`${prefix}ranklesbica\` - Rank das lésbicas
• \`${prefix}rankburro\` - Rank dos burros
• \`${prefix}rankfeio\` - Rank dos feios
• \`${prefix}rankbonito\` - Rank dos bonitos
• \`${prefix}rankfumante\` - Rank dos fumantes
• \`${prefix}rankmaconheiro\` - Rank dos maconheiros
• \`${prefix}rankpobre\` - Rank dos pobres
• \`${prefix}ranksad\` - Rank dos tristes
• \`${prefix}rankemo\` - Rank dos emos
• \`${prefix}rankcasal\` - Rank de casais

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU ADM (todos os comandos de administradores)
// ========================
function obterMenuAdm() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🛡️ *COMANDOS DE ADMINISTRADORES*

⚠️ *Requer: Admin do grupo + Bot admin*

🔗 *SISTEMA ANTI-SPAM:*
• \`${prefix}x9 on/off\` - Anti-X9 Monitor
• \`${prefix}antilink on/off\` - Anti-links
• \`${prefix}anticontato on/off\` - Anti-contatos
• \`${prefix}antidocumento on/off\` - Anti-documentos
• \`${prefix}antivideo on/off\` - Anti-vídeos
• \`${prefix}antiaudio on/off\` - Anti-áudios
• \`${prefix}antisticker on/off\` - Anti-stickers
• \`${prefix}antiflod on/off\` - Anti-flood
• \`${prefix}antifake on/off\` - Anti-números fake

📋 *LISTA NEGRA:*
• \`${prefix}listanegra add @user\` - Adicionar usuário
• \`${prefix}listanegra remove @user\` - Remover usuário
• \`${prefix}listanegra list\` - Ver lista negra

🗑️ *MODERAÇÃO:*
• \`${prefix}del\` - Deleta mensagem marcada
• \`${prefix}marca\` - Menciona todos os membros

🔒 *CONTROLE DO GRUPO:*
• \`${prefix}fechargrupo\` - Fecha o grupo
• \`${prefix}abrirgrupo\` - Abre o grupo
• \`${prefix}mudargrupo [nome]\` - Altera nome do grupo
• \`${prefix}soloadmin\` - Só admin edita grupo
• \`${prefix}resetlink\` - Gera novo link do grupo

👥 *CONTROLE DE ENTRADA:*
• \`${prefix}ativarsolicitacao\` - Ativa aprovação
• \`${prefix}desativarsolicitacao\` - Desativa aprovação

🎮 *CONFIGURAÇÕES:*
• \`${prefix}modogamer on/off\` - Modo gamer
• \`${prefix}grupo-status\` - Status do grupo

📸 *PERSONALIZAÇÃO:*
• \`${prefix}fotodogrupo\` - Troca foto do grupo
• \`${prefix}fotodobot\` - Troca foto do bot

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU ANTI-SPAM
// ========================
function obterMenuAnti() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🛡️ *SISTEMA ANTI-SPAM*

⚠️ *Requer: Admin + Bot admin*

🔗 *PROTEÇÕES DISPONÍVEIS:*
• \`${prefix}antilink on/off\` - Anti-links
• \`${prefix}anticontato on/off\` - Anti-contatos
• \`${prefix}antidocumento on/off\` - Anti-documentos
• \`${prefix}antivideo on/off\` - Anti-vídeos
• \`${prefix}antiaudio on/off\` - Anti-áudios
• \`${prefix}antisticker on/off\` - Anti-stickers
• \`${prefix}antiflod on/off\` - Anti-flood
• \`${prefix}antifake on/off\` - Anti-números fake
• \`${prefix}x9 on/off\` - Anti-X9

📋 *LISTA NEGRA:*
• \`${prefix}listanegra add @user\` - Adicionar à lista
• \`${prefix}listanegra remove @user\` - Remover da lista
• \`${prefix}listanegra list\` - Ver lista negra

📊 *STATUS:*
• \`${prefix}status-anti\` - Ver todas as proteções ativas

🔴 *AÇÃO: Delete automático + Ban (se bot for admin)*

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU RPG (sistema NeextCity)
// ========================
function obterMenuRPG() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
💰 *SISTEMA RPG - NEEXTCITY*

⚠️ *Requer \`${prefix}rpg on\` ativo no grupo*

👤 *CADASTRO:*
• \`${prefix}registrar [nome] [banco]\` - Registrar no RPG

💼 *TRABALHOS:*
• \`${prefix}pescar\` - Pescar para ganhar gold
• \`${prefix}minerar\` - Minerar recursos
• \`${prefix}trabalhar\` - Trabalhar por gold

🎰 *JOGOS:*
• \`${prefix}tigrinho [valor]\` - Caça-níquel
• \`${prefix}assalto @user\` - Assaltar jogador

📊 *INFORMAÇÕES:*
• \`${prefix}saldo\` - Ver seu saldo e stats
• \`${prefix}rank\` - Ranking dos mais ricos

💡 *Ganhe gold, compre itens e domine NeextCity!*

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU STICKERS (figurinhas)
// ========================
function obterMenuSticker() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🏷️ *MENU DE STICKERS*

✨ *CRIAR STICKERS:*
• \`${prefix}s\` - Converte mídia em sticker
• \`${prefix}sticker\` - Criar sticker de imagem/vídeo
• \`${prefix}attp [texto]\` - Sticker de texto animado
• \`${prefix}ttp [texto]\` - Sticker de texto simples

🎨 *EDITAR STICKERS:*
• \`${prefix}rename [pack|author]\` - Renomear sticker
• \`${prefix}take [pack] [author]\` - Roubar sticker
• \`${prefix}toimg\` - Converter sticker em imagem

🎭 *STICKERS ESPECIAIS:*
• \`${prefix}emoji [emoji]\` - Sticker de emoji
• \`${prefix}semoji [emoji]\` - Sticker emoji simples

📝 *COMO USAR:*
• Envie uma imagem/vídeo com \`${prefix}s\`
• Marque um sticker e use \`${prefix}take\`
• Use \`${prefix}rename\` para personalizar

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU BRINCADEIRAS (coming soon)
// ========================
function obterMenuBrincadeira() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🎉 *MENU BRINCADEIRAS*

⚠️ *EM DESENVOLVIMENTO*

🚧 Este menu está sendo finalizado e em breve terá:

🎭 **Comandos de Diversão:**
• Roleta de perguntas
• Verdade ou desafio
• Simulador de namorados
• Gerador de casais aleatórios

🎲 **Interações Divertidas:**
• Perguntas para o grupo
• Desafios aleatórios
• Brincadeiras de grupo

📅 **Status:** Em desenvolvimento
⏰ **Previsão:** Próxima atualização

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU HENTAI (coming soon)
// ========================
function obterMenuHentai() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🔞 *MENU HENTAI*

⚠️ *EM DESENVOLVIMENTO*

🚧 Este menu está sendo finalizado e em breve terá:

🎨 **Conteúdo Artístico:**
• Imagens de anime
• Wallpapers temáticos
• Arte digital

⚠️ **Importante:**
• Conteúdo será adequado às diretrizes
• Uso responsável obrigatório
• Apenas em grupos privados

📅 **Status:** Em desenvolvimento
⏰ **Previsão:** Próxima atualização

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// MENU DONO AVANÇADO (coming soon)
// ========================
function obterMenuDonoAvancado() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
👑 *MENU DONO AVANÇADO*

⚠️ *EM DESENVOLVIMENTO*

🚧 Este menu está sendo finalizado e em breve terá:

🔧 **Controle Total:**
• Backup de configurações
• Gerenciamento de grupos em massa
• Logs detalhados do sistema
• Controle de usuários globais

⚙️ **Configurações Avançadas:**
• Auto-moderação inteligente
• Respostas automáticas personalizadas
• Sistema de recompensas

📅 **Status:** Em desenvolvimento
⏰ **Previsão:** Próxima atualização

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

// ========================
// GUIA DE CONFIGURAÇÃO
// ========================
function obterConfigurarBot() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
⚙️ *CONFIGURAR BOT - GUIA COMPLETO*

🔧 *COMANDOS DE CONFIGURAÇÃO (Apenas Dono):*

📝 *ALTERAR PREFIXO:*
\`${prefix}trocar-prefixo [novo]\`
*Exemplo:* \`${prefix}trocar-prefixo !\`
*Resultado:* Prefixo mudará de "${prefix}" para "!"

🤖 *ALTERAR NOME DO BOT:*
\`${prefix}trocar-nome [novo nome]\`
*Exemplo:* \`${prefix}trocar-nome MeuBot Incrível\`
*Resultado:* Nome mudará de "${nomeDoBot}"

👤 *ALTERAR NICK DO DONO:*
\`${prefix}trocar-nick [novo nick]\`
*Exemplo:* \`${prefix}trocar-nick Administrador\`
*Resultado:* Nick mudará de "${nickDoDono}"

📋 *CONFIGURAÇÕES ATUAIS:*
• **Prefixo:** ${prefix}
• **Nome do Bot:** ${nomeDoBot}
• **Nick do Dono:** ${nickDoDono}

⚠️ *IMPORTANTE:*
• Apenas o dono pode usar esses comandos
• As mudanças são aplicadas instantaneamente
• Configurações são salvas automaticamente

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
}

module.exports = {
    obterMenuPrincipal,
    obterMenuMembro,
    obterMenuAdmin,
    obterMenuAdm,
    obterMenuDono,
    obterMenuDownload,
    obterMenuGamer,
    obterMenuAnti,
    obterMenuRPG,
    obterMenuSticker,
    obterMenuBrincadeira,
    obterMenuHentai,
    obterMenuDonoAvancado,
    obterConfigurarBot
};
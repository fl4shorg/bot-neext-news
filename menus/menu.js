// menu.js - Sistema de menus organizados do bot NEEXT LTDA

// Função para obter configurações atualizadas em tempo real
function obterConfiguracoes() {
    delete require.cache[require.resolve('../settings/settings.json')];
    return require('../settings/settings.json');
}

// ========================
// MENU PRINCIPAL
// ========================
function obterMenuPrincipal() {
    const { prefix, nomeDoBot, nickDoDono } = obterConfiguracoes();
    return `
🤖 *${nomeDoBot} - MENU PRINCIPAL*

📋 *CATEGORIAS DISPONÍVEIS:*

👥 \`${prefix}menumembro\` - Comandos para membros
🛡️ \`${prefix}menuadmin\` - Comandos administrativos
👑 \`${prefix}menudono\` - Comandos do dono
📥 \`${prefix}menudownload\` - Downloads e mídia
🎮 \`${prefix}menugamer\` - Jogos e entretenimento
🛡️ \`${prefix}menuanti\` - Sistema anti-spam
💰 \`${prefix}menurpg\` - Sistema RPG (NeextCity)
⚙️ \`${prefix}configurar-bot\` - Configurações do bot

💡 *Digite o comando da categoria para ver todos os comandos disponíveis!*

━━━━━━━━━━━━━━━
© NEEXT LTDA - ${nickDoDono}
`;
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
    obterMenuDono,
    obterMenuDownload,
    obterMenuGamer,
    obterMenuAnti,
    obterMenuRPG,
    obterConfigurarBot
};
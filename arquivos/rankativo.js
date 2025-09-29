// Sistema de Rank de Ativos para WhatsApp Bot
const fs = require('fs');
const path = require('path');

// Diretórios do sistema
const ATIVIDADES_DIR = path.join(__dirname, '../database/grupos/atividades');

// Utilitários
function formatGroupId(groupId) {
    return groupId.replace('@g.us', '').replace('@lid', '').replace(/[^a-zA-Z0-9]/g, '_');
}

function getAtividadesPath(groupId) {
    const formattedId = formatGroupId(groupId);
    return path.join(ATIVIDADES_DIR, `${formattedId}.json`);
}

// Carrega atividades de um grupo
function carregarAtividades(groupId) {
    try {
        const ativPath = getAtividadesPath(groupId);
        if (!fs.existsSync(ativPath)) {
            return {};
        }
        const data = fs.readFileSync(ativPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`❌ Erro ao carregar atividades do grupo ${groupId}:`, err);
        return {};
    }
}

// Salva atividades de um grupo
function salvarAtividades(groupId, atividades) {
    try {
        // Garante que o diretório existe
        if (!fs.existsSync(ATIVIDADES_DIR)) {
            fs.mkdirSync(ATIVIDADES_DIR, { recursive: true });
        }
        
        const ativPath = getAtividadesPath(groupId);
        fs.writeFileSync(ativPath, JSON.stringify(atividades, null, 2));
        return true;
    } catch (err) {
        console.error(`❌ Erro ao salvar atividades do grupo ${groupId}:`, err);
        return false;
    }
}

// Inicializa dados de um usuário
function inicializarUsuario(userId) {
    return {
        mensagens: 0,
        comandos: 0,
        stickers: 0,
        midias: 0,
        ultimaAtividade: Date.now(),
        primeiraAtividade: Date.now()
    };
}

// Registra atividade de um usuário
function registrarAtividade(groupId, userId, tipo) {
    const atividades = carregarAtividades(groupId);
    
    if (!atividades[userId]) {
        atividades[userId] = inicializarUsuario(userId);
    }
    
    const usuario = atividades[userId];
    usuario.ultimaAtividade = Date.now();
    
    switch (tipo) {
        case 'mensagem':
            usuario.mensagens++;
            break;
        case 'comando':
            usuario.comandos++;
            break;
        case 'sticker':
            usuario.stickers++;
            break;
        case 'midia':
            usuario.midias++;
            break;
    }
    
    return salvarAtividades(groupId, atividades);
}

// Obter ranking dos usuários mais ativos
function obterRanking(groupId, limite = 6) {
    const atividades = carregarAtividades(groupId);
    
    // Converte objeto em array e calcula total de atividades
    const usuarios = Object.entries(atividades).map(([userId, dados]) => {
        const total = dados.mensagens + dados.comandos + dados.stickers + dados.midias;
        return {
            userId,
            ...dados,
            total
        };
    });
    
    // Ordena por total de atividades (decrescente)
    usuarios.sort((a, b) => b.total - a.total);
    
    // Retorna apenas o limite especificado
    return usuarios.slice(0, limite);
}

// Formatar nome de usuário
function formatarNomeUsuario(userId) {
    // Remove @s.whatsapp.net e formata número
    const numero = userId.replace('@s.whatsapp.net', '');
    
    // Se for número brasileiro, formata como +55 XX XXXXX-XXXX
    if (numero.startsWith('55') && numero.length >= 12) {
        const dd = numero.substring(2, 4);
        const prefixo = numero.substring(4, 9);
        const sufixo = numero.substring(9);
        return `+55 ${dd} ${prefixo}-${sufixo}`;
    }
    
    // Para outros países ou formatos, retorna apenas o número
    return numero;
}

// Gerar ranking formatado
async function gerarRankingFormatado(sock, groupId) {
    try {
        const ranking = obterRanking(groupId, 6);
        
        if (ranking.length === 0) {
            return {
                mensagem: `⚠️ *RANK DE ATIVOS*\n\nNenhuma atividade registrada ainda.\nComece a interagir no grupo para aparecer no ranking! 🚀`,
                mentions: []
            };
        }
        
        const posicoes = ['🏆', '🥈', '🥉', '', '', ''];
        const numeros = ['1°', '2°', '3°', '4°', '5°', '6°'];
        const mentions = [];
        
        let mensagem = `╭════ •⊰✿⊱• ════╮
  🔥 𝐑𝐀𝐍𝐊 𝐃𝐄 𝐀𝐓𝐈𝐕𝐎𝐒 𝐃𝐎 𝐆𝐑𝐔𝐏𝐎 🔥
╰════ •⊰✿⊱• ════╯\n\n`;

        for (let i = 0; i < ranking.length; i++) {
            const usuario = ranking[i];
            const emoji = posicoes[i];
            const numero = numeros[i];
            
            // Adiciona o userId ao array de mentions
            mentions.push(usuario.userId);
            
            // Extrai o número limpo para menção
            const numeroLimpo = usuario.userId.replace(/@s\.whatsapp\.net|@lid/g, '');
            
            // Tenta obter o nome do usuário através do grupo
            let nomeUsuario = '';
            try {
                const groupMetadata = await sock.groupMetadata(groupId);
                const participant = groupMetadata.participants.find(p => p.id === usuario.userId);
                
                if (participant && participant.notify) {
                    nomeUsuario = participant.notify;
                } else {
                    // Usa o número formatado como fallback
                    nomeUsuario = formatarNomeUsuario(usuario.userId);
                }
            } catch (err) {
                nomeUsuario = formatarNomeUsuario(usuario.userId);
            }
            
            mensagem += `『 ${numero} ${emoji} 』
╔═══════════════╗
┃ 👤 Usuário: @${numeroLimpo}
┃ 💬 Mensagens: ${usuario.mensagens}
┃ ⌨️ Comandos: ${usuario.comandos}
┃ 📱 Conectado: Android 🗿
┃ 🖼️ Stickers: ${usuario.stickers}
┃ 📊 Total: ${usuario.total}
╚═══════════════╝\n\n`;
        }
        
        return {
            mensagem: mensagem.trim(),
            mentions: mentions
        };
        
    } catch (err) {
        console.error('❌ Erro ao gerar ranking:', err);
        return {
            mensagem: `❌ Erro ao gerar ranking de ativos.`,
            mentions: []
        };
    }
}

// Limpar dados antigos (mais de 30 dias)
function limparDadosAntigos(groupId) {
    try {
        const atividades = carregarAtividades(groupId);
        const agora = Date.now();
        const trintaDias = 30 * 24 * 60 * 60 * 1000;
        
        let removidos = 0;
        for (const userId in atividades) {
            const ultimaAtividade = atividades[userId].ultimaAtividade;
            if (agora - ultimaAtividade > trintaDias) {
                delete atividades[userId];
                removidos++;
            }
        }
        
        if (removidos > 0) {
            salvarAtividades(groupId, atividades);
            console.log(`🧹 Removidos ${removidos} usuários inativos do grupo ${groupId}`);
        }
        
        return removidos;
    } catch (err) {
        console.error(`❌ Erro ao limpar dados antigos do grupo ${groupId}:`, err);
        return 0;
    }
}

// Limpeza automática executada uma vez por dia
setInterval(() => {
    try {
        if (fs.existsSync(ATIVIDADES_DIR)) {
            const arquivos = fs.readdirSync(ATIVIDADES_DIR);
            for (const arquivo of arquivos) {
                if (arquivo.endsWith('.json')) {
                    const groupId = arquivo.replace('.json', '').replace(/_/g, '');
                    limparDadosAntigos(groupId);
                }
            }
        }
    } catch (err) {
        console.error('❌ Erro na limpeza automática:', err);
    }
}, 24 * 60 * 60 * 1000); // 24 horas

// Exporta todas as funções
module.exports = {
    registrarAtividade,
    obterRanking,
    gerarRankingFormatado,
    carregarAtividades,
    salvarAtividades,
    limparDadosAntigos,
    formatGroupId,
    getAtividadesPath
};
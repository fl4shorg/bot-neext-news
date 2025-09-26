// Sistema Anti-Spam Completo para WhatsApp Bot
const fs = require('fs');
const path = require('path');

// Diretórios do sistema
const GRUPOS_DIR = path.join(__dirname, '../database/grupos/ativadogrupo');
const CACHE_FLOOD = new Map(); // Cache para controle de flood

// Utilitários
function formatGroupId(groupId) {
    return groupId.replace('@g.us', '').replace('@lid', '').replace(/[^a-zA-Z0-9]/g, '_');
}

// Verifica se número é brasileiro
function isNumeroBrasileiro(jid) {
    if (!jid || typeof jid !== 'string') return false;
    
    // Remove o @s.whatsapp.net para pegar apenas o número
    const numero = jid.replace('@s.whatsapp.net', '');
    
    // Verifica se começa com 55 (código do Brasil)
    // Formatos aceitos: 55XXXXXXXXXXX (13 dígitos) ou 5511XXXXXXXXX (12 dígitos para alguns casos)
    const brasileiroRegex = /^55[1-9][0-9]{8,9}$/;
    
    return brasileiroRegex.test(numero);
}

function getGroupConfigPath(groupId) {
    const formattedId = formatGroupId(groupId);
    return path.join(GRUPOS_DIR, `${formattedId}.json`);
}

// Carrega configuração de um grupo
function carregarConfigGrupo(groupId) {
    try {
        const configPath = getGroupConfigPath(groupId);
        if (!fs.existsSync(configPath)) {
            return {
                antilink: false,
                anticontato: false,
                antidocumento: false,
                antivideo: false,
                antiaudio: false,
                antisticker: false,
                antiflod: false,
                antifake: false,
                listanegra: [],
                floodConfig: {
                    maxMensagens: 5,
                    tempoSegundos: 10
                }
            };
        }
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`❌ Erro ao carregar config do grupo ${groupId}:`, err);
        return null;
    }
}

// Salva configuração de um grupo
function salvarConfigGrupo(groupId, config) {
    try {
        // Garante que o diretório existe
        if (!fs.existsSync(GRUPOS_DIR)) {
            fs.mkdirSync(GRUPOS_DIR, { recursive: true });
        }
        
        const configPath = getGroupConfigPath(groupId);
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error(`❌ Erro ao salvar config do grupo ${groupId}:`, err);
        return false;
    }
}

// Detecta links na mensagem
function detectarLinks(texto) {
    if (!texto) return false;
    const linkRegex = /((https?:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)|wa.me\/|whatsapp.com\/|t.me\/|chat.whatsapp.com\/|instagram.com\/|facebook.com\/|twitter.com\/|tiktok.com\/|youtube.com\/|discord.gg\//i;
    return linkRegex.test(texto);
}

// Verifica se é contact/contato
function isContactMessage(message) {
    return !!(message.contactMessage || message.contactsArrayMessage);
}

// Verifica se é documento
function isDocumentMessage(message) {
    return !!(message.documentMessage);
}

// Verifica se é vídeo
function isVideoMessage(message) {
    return !!(message.videoMessage);
}

// Verifica se é áudio
function isAudioMessage(message) {
    return !!(message.audioMessage || message.pttMessage);
}

// Verifica se é sticker
function isStickerMessage(message) {
    return !!(message.stickerMessage);
}

// Controle de flood
function verificarFlood(userId, groupId, config) {
    if (!config.antiflod) return false;
    
    const key = `${groupId}_${userId}`;
    const agora = Date.now();
    const limite = config.floodConfig.tempoSegundos * 1000;
    
    if (!CACHE_FLOOD.has(key)) {
        CACHE_FLOOD.set(key, []);
    }
    
    const mensagens = CACHE_FLOOD.get(key);
    
    // Remove mensagens antigas
    const mensagensRecentes = mensagens.filter(timestamp => agora - timestamp < limite);
    
    // Adiciona nova mensagem
    mensagensRecentes.push(agora);
    CACHE_FLOOD.set(key, mensagensRecentes);
    
    // Verifica se excedeu o limite
    return mensagensRecentes.length > config.floodConfig.maxMensagens;
}

// Limpa cache de flood periodicamente
setInterval(() => {
    const agora = Date.now();
    for (const [key, mensagens] of CACHE_FLOOD.entries()) {
        const mensagensRecentes = mensagens.filter(timestamp => agora - timestamp < 60000); // 1 minuto
        if (mensagensRecentes.length === 0) {
            CACHE_FLOOD.delete(key);
        } else {
            CACHE_FLOOD.set(key, mensagensRecentes);
        }
    }
}, 60000);

// Verifica se usuário está na lista negra
function isUsuarioListaNegra(userId, groupId) {
    const config = carregarConfigGrupo(groupId);
    if (!config || !config.listanegra) return false;
    return config.listanegra.includes(userId);
}

// Adiciona usuário à lista negra
function adicionarListaNegra(userId, groupId) {
    const config = carregarConfigGrupo(groupId);
    if (!config) return false;
    
    if (!config.listanegra) config.listanegra = [];
    
    if (!config.listanegra.includes(userId)) {
        config.listanegra.push(userId);
        return salvarConfigGrupo(groupId, config);
    }
    return true; // Já estava na lista
}

// Remove usuário da lista negra
function removerListaNegra(userId, groupId) {
    const config = carregarConfigGrupo(groupId);
    if (!config || !config.listanegra) return false;
    
    const index = config.listanegra.indexOf(userId);
    if (index > -1) {
        config.listanegra.splice(index, 1);
        return salvarConfigGrupo(groupId, config);
    }
    return true; // Não estava na lista
}

// Ativa/desativa funcionalidade anti
function toggleAntiFeature(groupId, feature, estado) {
    const config = carregarConfigGrupo(groupId);
    if (!config) return false;
    
    const validFeatures = ['antilink', 'anticontato', 'antidocumento', 'antivideo', 'antiaudio', 'antisticker', 'antiflod', 'antifake'];
    
    if (!validFeatures.includes(feature)) return false;
    
    if (estado === 'on' || estado === 'ativar' || estado === '1') {
        config[feature] = true;
    } else if (estado === 'off' || estado === 'desativar' || estado === '0') {
        config[feature] = false;
    } else {
        return config[feature]; // Retorna estado atual
    }
    
    return salvarConfigGrupo(groupId, config) ? config[feature] : false;
}

// Processa mensagem para verificar violações
function processarMensagem(message, groupId, userId) {
    const config = carregarConfigGrupo(groupId);
    if (!config) return { violacao: false };
    
    const violations = [];
    
    // Extrai texto da mensagem
    let texto = '';
    if (message.conversation) texto = message.conversation;
    if (message.extendedTextMessage?.text) texto = message.extendedTextMessage.text;
    if (message.imageMessage?.caption) texto = message.imageMessage.caption;
    if (message.videoMessage?.caption) texto = message.videoMessage.caption;
    
    // Verifica antilink
    if (config.antilink && detectarLinks(texto)) {
        violations.push('antilink');
    }
    
    // Verifica anticontato
    if (config.anticontato && isContactMessage(message)) {
        violations.push('anticontato');
    }
    
    // Verifica antidocumento
    if (config.antidocumento && isDocumentMessage(message)) {
        violations.push('antidocumento');
    }
    
    // Verifica antivideo
    if (config.antivideo && isVideoMessage(message)) {
        violations.push('antivideo');
    }
    
    // Verifica antiaudio
    if (config.antiaudio && isAudioMessage(message)) {
        violations.push('antiaudio');
    }
    
    // Verifica antisticker
    if (config.antisticker && isStickerMessage(message)) {
        violations.push('antisticker');
    }
    
    // Verifica antiflod
    if (verificarFlood(userId, groupId, config)) {
        violations.push('antiflod');
    }
    
    return {
        violacao: violations.length > 0,
        tipos: violations,
        config
    };
}

// Exporta todas as funções
module.exports = {
    // Gerenciamento de configuração
    carregarConfigGrupo,
    salvarConfigGrupo,
    
    // Toggle de funcionalidades
    toggleAntiFeature,
    
    // Lista negra
    isUsuarioListaNegra,
    adicionarListaNegra,
    removerListaNegra,
    
    // Processamento
    processarMensagem,
    
    // Detecções específicas
    detectarLinks,
    isContactMessage,
    isDocumentMessage,
    isVideoMessage,
    isAudioMessage,
    isStickerMessage,
    verificarFlood,
    isNumeroBrasileiro,
    
    // Utilitários
    formatGroupId,
    getGroupConfigPath
};
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
                x9: false,
                modogamer: false,
                antiporno: false,
                antilinkhard: false,
                antipalavrao: false,
                antipv: false,
                anticall: false,
                rankativo: false,
                welcome1: false,
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

// Detecta links difíceis de encontrar (antilinkhard)
function detectarLinksHard(texto) {
    if (!texto) return false;
    // Remove espaços e caracteres especiais
    const textoLimpo = texto.replace(/[\s\-_\.]/g, '');
    
    const linksHardRegex = [
        // Links com separadores: w.w.w, h.t.t.p.s
        /w\.w\.w|h\.t\.t\.p\.s|h\.t\.t\.p/i,
        // Links com espaços: w w w . , h t t p s : / /
        /w\s*w\s*w\s*\.|h\s*t\s*t\s*p\s*s?\s*:/i,
        // Links com underscore: w_w_w_, http_s
        /w_w_w_|h_t_t_p_s?/i,
        // Links camuflados: ｗｗｗ (unicode), ＨＴＴＰs
        /ｗｗｗ|ＨＴＴＰ/i,
        // Números como letras: w4atsapp, 1nstagram
        /w4atsapp|1nstagram|f4cebook|t1ktok/i,
        // Links com hífen excessivo: w-w-w, h-t-t-p
        /w-w-w|h-t-t-p/i,
        // Links espelhados ou invertidos
        /ptt\.|moc\.|gro\./i,
        // Domínios disfarçados: bit.ly > b1t.ly, tinyurl > t1nyurl
        /b1t\.ly|t1nyurl|sh0rt|l1nk|ur\.l/i,
        // WhatsApp camuflado: 
        /chat.*whats.*app|wa.*me|whats.*app.*chat/i
    ];
    
    return linksHardRegex.some(regex => regex.test(textoLimpo));
}

// Detecta conteúdo pornográfico
function detectarPorno(texto, message) {
    if (!texto && !message) return false;
    
    // Lista de palavras relacionadas a pornografia
    const palavrasPorno = [
        // Palavras explícitas
        'porno', 'pornografia', 'pornô', 'xxx', 'sexo', 'nude', 'nua', 'pelada',
        'buceta', 'pau', 'pênis', 'vagina', 'peitos', 'seios', 'rola', 'piru',
        'xota', 'xereca', 'ppk', 'penis', 'tesao', 'tesão', 'gozar', 'gozo',
        'masturbação', 'masturbar', 'punheta', 'siririca', 'puta', 'putaria',
        'safada', 'safado', 'gostosa', 'gostoso', 'bundão', 'bunduda',
        // Sites pornôs conhecidos
        'pornhub', 'xvideos', 'redtube', 'xhamster', 'youporn', 'tube8',
        'spankbang', 'xnxx', 'brazzers', 'realitykings', 'bangbros',
        // Termos relacionados
        'hentai', 'ecchi', 'ahegao', 'futanari', 'yaoi', 'yuri',
        'onlyfans', 'privacy', 'webcam', 'camgirl', 'stripper',
        // Variações com números/símbolos
        'p0rno', 'p0rn', 's3xo', 'x x x', 'p.o.r.n', 's.e.x.o'
    ];
    
    // Função para normalizar texto removendo acentos mas preservando caracteres
    function normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD') // Decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais exceto espaços
            .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
            .trim();
    }

    // Verifica no texto
    if (texto) {
        const textoLimpo = normalizarTexto(texto);
        for (const palavra of palavrasPorno) {
            const palavraNormalizada = normalizarTexto(palavra);
            if (textoLimpo.includes(palavraNormalizada)) {
                return true;
            }
        }
    }
    
    // Verifica em legendas de mídia
    if (message) {
        const caption = message.imageMessage?.caption || message.videoMessage?.caption || '';
        if (caption) {
            const captionLimpa = normalizarTexto(caption);
            for (const palavra of palavrasPorno) {
                const palavraNormalizada = normalizarTexto(palavra);
                if (captionLimpa.includes(palavraNormalizada)) {
                    return true;
                }
            }
        }
        
        // Verifica se é mídia suspeita (imagem/vídeo sem caption em contexto suspeito)
        if (message.imageMessage || message.videoMessage) {
            // Por segurança, se não houver caption mas for mídia, pode ser verificado por moderador
            return false; // Por enquanto não bloqueia automaticamente mídia sem caption
        }
    }
    
    return false;
}

// Detecta palavrões
function detectarPalavrao(texto) {
    if (!texto) return false;
    
    const palavroes = [
        // Palavrões comuns
        'filho da puta', 'fdp', 'porra', 'caralho', 'merda', 'cu', 'bosta',
        'desgraça', 'desgraçado', 'puto', 'puta', 'cacete', 'cuzão', 'cuzao',
        'otário', 'otario', 'babaca', 'imbecil', 'idiota', 'burro', 'estúpido',
        'estupido', 'retardado', 'mongolóide', 'mongoloide', 'débil', 'debil',
        'trouxa', 'lesado', 'lesão', 'lesao', 'vagabundo', 'vagabunda',
        'safado', 'safada', 'corno', 'cornudo', 'chifrudo', 'cuckold',
        // Palavrões com variações
        'p0rra', 'c4ralho', 'm3rda', 'c@ralho', 'p0uta', 'put@',
        'fdp', 'f.d.p', 'f d p', 'filhodaputa', 'filho-da-puta',
        // Xingamentos racistas/preconceituosos
        'macaco', 'negro', 'preto', 'mulata', 'crioulo', 'neguinho',
        'favelado', 'favelada', 'nordestino', 'paraíba', 'baiano',
        // Ofensas religiosas
        'demônio', 'diabo', 'capeta', 'inferno', 'satanás', 'satanas',
        // Palavrões regionais
        'baitola', 'viado', 'bicha', 'boiola', 'fresco', 'maricas',
        'piranha', 'galinha', 'vadia', 'rameira', 'prostituta'
    ];
    
    // Função para normalizar texto removendo acentos mas preservando caracteres
    function normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD') // Decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
            .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove caracteres especiais exceto espaços
            .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
            .trim();
    }

    const textoLimpo = normalizarTexto(texto);
    
    for (const palavrao of palavroes) {
        // Verifica palavra exata
        const palavraoNormalizado = normalizarTexto(palavrao);
        if (textoLimpo.includes(palavraoNormalizado)) {
            return true;
        }
        
        // Verifica palavra com espaços
        const palavraoComEspacos = palavraoNormalizado.split('').join('\\s*');
        const regex = new RegExp(palavraoComEspacos, 'i');
        if (regex.test(textoLimpo)) {
            return true;
        }
    }
    
    return false;
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
    
    const validFeatures = ['antilink', 'anticontato', 'antidocumento', 'antivideo', 'antiaudio', 'antisticker', 'antiflod', 'antifake', 'x9', 'antiporno', 'antilinkhard', 'antipalavrao', 'antipv', 'anticall', 'rankativo'];
    
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
    
    // Verifica antilinkhard
    if (config.antilinkhard && detectarLinksHard(texto)) {
        violations.push('antilinkhard');
    }
    
    // Verifica antiporno
    if (config.antiporno && detectarPorno(texto, message)) {
        violations.push('antiporno');
    }
    
    // Verifica antipalavrao
    if (config.antipalavrao && detectarPalavrao(texto)) {
        violations.push('antipalavrao');
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
    detectarLinksHard,
    detectarPorno,
    detectarPalavrao,
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
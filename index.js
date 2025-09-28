// index.js — Bot completo com eventos e comandos unificados

const { 
    makeWASocket, 
    fetchLatestBaileysVersion, 
    generateWAMessageFromContent,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");


const path = require("path"); // <<< ESSENCIAL PARA path.joinv
const fs = require("fs");
const axios = require("axios");
const os = require("os");
const { writeExif } = require("./arquivos/sticker.js");
const { sendImageAsSticker, sendVideoAsSticker } = require("./arquivos/rename.js");
const Jimp = require("jimp");
const pinterest = require('./Pinterest.js');
const { igdl } = require('./Instagram.js');
const settings = require('./settings/settings.json');
const { Aki } = require('aki-api');
const cloudscraper = require('cloudscraper');
const UserAgent = require('user-agents');
const moment = require('moment-timezone');

// Sistema RPG - NeextCity
const rpg = require('./arquivos/rpg.js');

const antilinkFile = path.join(__dirname, "antilink.json");
const akinatorFile = path.join(__dirname, "database/grupos/games/akinator.json");

// Sistema Anti-Spam Completo
const antiSpam = require("./arquivos/antispam.js");

// Sistema de Registros
const registros = require("./arquivos/registros.js");

// importa banner + logger centralizados
const { mostrarBanner, logMensagem } = require("./export");

// importa funções auxiliares do menu
const { obterSaudacao, contarGrupos, contarComandos } = require("./arquivos/funcoes/function.js");

// Config do Bot - agora usando referências dinâmicas para permitir alterações em tempo real
function obterConfiguracoes() {
    delete require.cache[require.resolve('./settings/settings.json')];
    return require('./settings/settings.json');
}

// Selinhos e quoted fake (mantive seu conteúdo)
const selinho = {
    key: { fromMe: false, participant: `13135550002@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: { contactMessage: { displayName: 'NEEXT LTDA', vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Kuun;Flash;;;\nFN:Flash Kuun\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Mobile\nEND:VCARD`, sendEphemeral: true } }
};
const selinho2 = {
    key: { fromMe: false, participant: `553176011100@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: { contactMessage: { displayName: 'NEEXT LTDA', vcard: `BEGIN:VCARD\nVERSION:3.0\nN:un;Flh;;;\nFN:Kuun\nitem1.TEL;waid=553176011100:553176011100\nitem1.X-ABLabel:Mobile\nEND:VCARD`, sendEphemeral: true } }
};
const selomercadopago = {
    key: { fromMe: false, participant: `5511988032872@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: { contactMessage: { displayName: 'NEEXT LTDA', vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Mercado;Pago;;;\nFN:Mercado Pago\nitem1.TEL;waid=5511988032872:5511988032872\nitem1.X-ABLabel:Mobile\nEND:VCARD`, sendEphemeral: true } }
};
const selonubank = {
    key: { fromMe: false, participant: `551151807064@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: { contactMessage: { displayName: 'NEEXT LTDA', vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Nubank;Flash;;;\nFN:Nubank Kuun\nitem1.TEL;waid=551151807064:551151807064\nitem1.X-ABLabel:Mobile\nEND:VCARD`, sendEphemeral: true } }
};
const seloserasa = {
    key: { fromMe: false, participant: `551128475131@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: { contactMessage: { displayName: 'NEEXT LTDA', vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Serasa;Flash;;;\nFN:Serasa Kuun\nitem1.TEL;waid=551128475131:551128475131\nitem1.X-ABLabel:Mobile\nEND:VCARD`, sendEphemeral: true } }
};
const quotedCarrinho = {
    key: { participant: "0@s.whatsapp.net", remoteJid: "0@s.whatsapp.net" },
    message: { documentMessage: { title: "🛒 Neext Ltda", fileName: "Neext.pdf", mimetype: "application/pdf", fileLength: 999999, pageCount: 1 } }
};

// System NEEXT (status do sistema) para usar no grupo-status
const quotedSerasaAPK = {
    key: { participant: "0@s.whatsapp.net", remoteJid: "0@s.whatsapp.net" },
    message: { 
        documentMessage: { 
            title: "🛡️ NEEXT System", 
            fileName: "serasa.apk", 
            mimetype: "application/vnd.android.package-archive", 
            fileLength: 549755813888000, // 500TB em bytes
            pageCount: 0,
            contactVcard: true
        } 
    }
};

// APK Fake da NEEXT LTDA (1000GB) para usar no grupo-status
const quotedNeextAPK = {
    key: { participant: "0@s.whatsapp.net", remoteJid: "0@s.whatsapp.net" },
    message: { 
        documentMessage: { 
            title: "📱 NEEXT LTDA", 
            fileName: "neext_ltda.apk", 
            mimetype: "application/vnd.android.package-archive", 
            fileLength: 1073741824000, // 1000GB em bytes
            pageCount: 0,
            contactVcard: true
        } 
    }
};

// ContextInfo para fazer mensagens aparecerem como "enviada via anúncio"
const contextAnuncio = {
    externalAdReply: {
        title: "© NEEXT LTDA",
        body: "📱 Instagram: @neet.tk",
        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
        mediaType: 1,
        sourceUrl: "https://www.neext.online",
        showAdAttribution: true
    }
};

// Mensagens já processadas (evita duplicadas)
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 5 * 60 * 1000);

// Variáveis do jogo Akinator
let akinator = [];
let jogo = { now: true, jogador: "" };

// Classe para bypass do Cloudflare no Akinator
class AkinatorCloudflareBypass {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async createAkinator(region = 'en', retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🧞‍♂️ Tentando conectar ao Akinator (tentativa ${attempt}/${retries})...`);

                // Configura cloudscraper para contornar Cloudflare
                const userAgent = this.getRandomUserAgent();

                // Cria instância do Akinator
                const aki = new Aki({ 
                    region: region, 
                    childMode: false,
                    // Configurações para bypass
                    requestOptions: {
                        headers: {
                            'User-Agent': userAgent,
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'none',
                            'Cache-Control': 'max-age=0'
                        },
                        timeout: 30000
                    }
                });

                // Aguarda um pouco antes de tentar
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

                await aki.start();
                console.log(`✅ Conectado ao Akinator com sucesso! Região: ${region}`);
                return aki;

            } catch (error) {
                console.error(`❌ Tentativa ${attempt} falhou:`, error.message);

                if (attempt === retries) {
                    throw new Error(`Falha após ${retries} tentativas. Akinator temporariamente indisponível.`);
                }

                // Aguarda mais tempo a cada tentativa
                await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            }
        }
    }
}

// Carrega dados do Akinator
function carregarAkinator() {
    try {
        if (!fs.existsSync(akinatorFile)) {
            const dir = path.dirname(akinatorFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(akinatorFile, "[]");
        }
        const data = fs.readFileSync(akinatorFile, "utf-8");
        akinator = JSON.parse(data);
        return akinator;
    } catch (err) {
        console.error("❌ Erro ao carregar akinator.json:", err);
        akinator = [];
        return [];
    }
}

// Salva dados do Akinator
function salvarAkinator() {
    try {
        fs.writeFileSync(akinatorFile, JSON.stringify(akinator, null, 2));
    } catch (err) {
        console.error("❌ Erro ao salvar akinator.json:", err);
    }
}

// Inicializa dados do Akinator
carregarAkinator();




// Funções antigas removidas - agora usamos o sistema antiSpam completo

// Função utilitária: extrai texto da mensagem
function getMessageText(message) {
    if (!message) return "";
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    if (message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId;
    if (message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId;
    if (message.ephemeralMessage?.message) return getMessageText(message.ephemeralMessage.message);
    return "";
}

// Normaliza mensagem e retorna quoted
function normalizeMessage(m) {
    if (!m?.message) return { normalized: m, quoted: null };
    let message = m.message;
    if (message.ephemeralMessage) message = message.ephemeralMessage.message;
    if (message.viewOnceMessage) message = message.viewOnceMessage.message;
    const contextInfo = message.extendedTextMessage?.contextInfo || {};
    const quoted = contextInfo.quotedMessage || null;
    return { normalized: { ...m, message }, quoted };
}

// Função reply genérica
async function reply(sock, from, text, mentions = []) {
    try { await sock.sendMessage(from, { 
        text,
        contextInfo: {
            forwardingScore: 100000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363289739581116@newsletter",
                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
            }
        },
        mentions
    }); }
    catch (err) { console.error("❌ Erro ao enviar reply:", err); }
}

// Reage a qualquer mensagem com emoji
async function reagirMensagem(sock, normalized, emoji = "🤖") {
    if (!normalized?.key) return false;
    try {
        await sock.sendMessage(normalized.key.remoteJid, {
            react: {
                text: emoji,
                key: normalized.key
            }
        });
        return true;
    } catch (err) {
        console.error("❌ Erro ao reagir:", err);
        return false;
    }
}

// Detecta links na mensagem
function detectarLinks(texto) {
    if (!texto) return false;
    const linkRegex = /((https?:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)|wa.me\/|whatsapp.com\/|t.me\/|chat.whatsapp.com\/|instagram.com\/|facebook.com\/|twitter.com\/|tiktok.com\/|youtube.com\/|discord.gg\//i;
    return linkRegex.test(texto);
}

// Verifica se usuário é admin do grupo
async function isAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        console.error("❌ Erro ao verificar admin:", err);
        return false;
    }
}

// Verifica se usuário é o dono do bot
function isDono(userId) {
    const config = obterConfiguracoes();
    const numeroDono = config.numeroDoDono + "@s.whatsapp.net";
    return userId === numeroDono;
}

// Remove mensagem do grupo
async function removerMensagem(sock, messageKey) {
    try {
        await sock.sendMessage(messageKey.remoteJid, { delete: messageKey });
        return true;
    } catch (err) {
        console.error("❌ Erro ao remover mensagem:", err);
        return false;
    }
}

// Verifica se bot é admin do grupo
async function botEhAdmin(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const botId = sock.user?.id?.replace(/:.*@s.whatsapp.net/, '@s.whatsapp.net') || sock.user?.id;
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        return botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
    } catch (err) {
        console.error("❌ Erro ao verificar se bot é admin:", err);
        return false;
    }
}

// Bane usuário do grupo
async function banirUsuario(sock, groupId, userId) {
    try {
        // Verifica se bot tem permissão de admin
        const botAdmin = await botEhAdmin(sock, groupId);
        if (!botAdmin) {
            console.log(`⚠️ Bot não é admin no grupo ${groupId} - não pode banir`);
            return { success: false, reason: "bot_nao_admin" };
        }

        console.log(`⚔️ Tentando banir usuário ${userId} do grupo ${groupId}`);
        await sock.groupParticipantsUpdate(groupId, [userId], "remove");
        console.log(`✅ Usuário ${userId} banido com sucesso!`);
        return { success: true, reason: "banido" };
    } catch (err) {
        console.error(`❌ Erro ao banir usuário ${userId}:`, err);
        if (err.message?.includes('forbidden')) {
            return { success: false, reason: "sem_permissao" };
        }
        return { success: false, reason: "erro_tecnico" };
    }
}

// Processa sistema anti-spam completo
async function processarAntiSpam(sock, normalized) {
    try {
        const from = normalized.key.remoteJid;
        const sender = normalized.key.participant || from;

        // Só funciona em grupos
        if (!from.endsWith('@g.us') && !from.endsWith('@lid')) return false;

        // Não processa se for o dono
        if (isDono(sender)) {
            return false;
        }

        // Não processa se for admin
        const ehAdmin = await isAdmin(sock, from, sender);
        if (ehAdmin) {
            return false;
        }

        // Processa mensagem para verificar violações
        const resultado = antiSpam.processarMensagem(normalized.message, from, sender);
        
        if (!resultado.violacao) return false;

        const senderNumber = sender.split('@')[0];
        const tiposViolacao = resultado.tipos;
        
        console.log(`🚫 Violação detectada de ${senderNumber}: ${tiposViolacao.join(', ')}`);

        // Remove a mensagem
        const removido = await removerMensagem(sock, normalized.key);

        if (removido) {
            // Aguarda um pouco antes de tentar banir
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Tenta banir o usuário
            const resultadoBan = await banirUsuario(sock, from, sender);
            
            const emojiMap = {
                'antilink': '🔗',
                'anticontato': '📞',
                'antidocumento': '📄',
                'antivideo': '🎥',
                'antiaudio': '🎵',
                'antisticker': '🏷️',
                'antiflod': '🌊'
            };
            
            const violacaoEmoji = emojiMap[tiposViolacao[0]] || '🚫';
            const violacaoNome = tiposViolacao[0].toUpperCase();

            if (resultadoBan.success) {
                await reagirMensagem(sock, normalized, "⚔️");
                await reply(sock, from, `⚔️ *${violacaoEmoji} ${violacaoNome} - USUÁRIO BANIDO!*\n\n@${senderNumber} foi removido do grupo por violação!\n\n🚫 Conteúdo não permitido: ${tiposViolacao.join(', ')}\n⚡ Ação: Delete + Ban automático`, [sender]);
                console.log(`⚔️ SUCESSO: ${senderNumber} banido do grupo ${from} por ${tiposViolacao.join(', ')}`);
            } else {
                await reagirMensagem(sock, normalized, "🚫");
                let motivo = "";
                switch(resultadoBan.reason) {
                    case "bot_nao_admin":
                        motivo = "Bot não é admin do grupo";
                        break;
                    case "sem_permissao":
                        motivo = "Bot sem permissão para banir";
                        break;
                    default:
                        motivo = "Erro técnico no banimento";
                }

                await reply(sock, from, `🚫 *${violacaoEmoji} ${violacaoNome} ATIVO*\n\n@${senderNumber} sua mensagem foi deletada por violação!\n\n⚠️ **Não foi possível banir:** ${motivo}\n💡 **Solução:** Torne o bot admin do grupo`, [sender]);
                console.log(`⚠️ FALHA: Não foi possível banir ${senderNumber} - ${motivo}`);
            }
        }

        return true;
    } catch (err) {
        console.error("❌ Erro no processamento anti-spam:", err);
        return false;
    }
}

// Auto-ban para lista negra e antifake quando usuário entra no grupo
async function processarListaNegra(sock, participants, groupId, action) {
    try {
        if (action !== 'add') return;
        
        const config = antiSpam.carregarConfigGrupo(groupId);
        if (!config) return;
        
        for (const participant of participants) {
            const participantNumber = participant.split('@')[0];
            let motivo = '';
            let shouldBan = false;
            
            // Verifica lista negra
            if (antiSpam.isUsuarioListaNegra(participant, groupId)) {
                motivo = 'Lista Negra';
                shouldBan = true;
                console.log(`📋 Usuário da lista negra detectado: ${participantNumber}`);
            }
            
            // Verifica antifake (números não brasileiros)
            if (config.antifake && !antiSpam.isNumeroBrasileiro(participant)) {
                motivo = motivo ? `${motivo} + Antifake` : 'Antifake (não brasileiro)';
                shouldBan = true;
                console.log(`🇧🇷 Usuário não brasileiro detectado: ${participantNumber}`);
            }
            
            if (shouldBan) {
                // Aguarda um pouco antes de banir
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const resultadoBan = await banirUsuario(sock, groupId, participant);
                
                if (resultadoBan.success) {
                    const emoji = motivo.includes('Lista Negra') ? '📋' : '🇧🇷';
                    await sock.sendMessage(groupId, {
                        text: `⚔️ *${emoji} ${motivo.toUpperCase()} - USUÁRIO BANIDO!*\n\n@${participantNumber} foi removido automaticamente!\n\n🚫 Motivo: ${motivo}\n⚡ Ação: Ban automático`,
                        mentions: [participant]
                    });
                    console.log(`⚔️ ${motivo.toUpperCase()}: ${participantNumber} banido automaticamente do grupo ${groupId}`);
                } else {
                    console.log(`⚠️ ${motivo.toUpperCase()}: Não foi possível banir ${participantNumber} - ${resultadoBan.reason}`);
                }
            }
        }
    } catch (err) {
        console.error("❌ Erro no processamento de lista negra/antifake:", err);
    }
}



// Função principal de comandos
async function handleCommand(sock, message, command, args, from, quoted) {
    const msg = message.message;
    if (!msg) return;

    switch (command) {
        case "ping": {
            const now = new Date();
            const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
            const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
            let uptimeSec = process.uptime();
            const days = Math.floor(uptimeSec / 86400);
            uptimeSec %= 86400;
            const hours = Math.floor(uptimeSec / 3600);
            uptimeSec %= 3600;
            const minutes = Math.floor(uptimeSec / 60);
            const seconds = Math.floor(uptimeSec % 60);
            const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const pingMessage = `
┏━━━━━━━━━━━━━━━┓
┃ 📅 Data: ${now.toLocaleDateString()}  
┃ ⏰ Hora: ${now.toLocaleTimeString()}  
┃ 🟢 Uptime: ${uptime}  
┃ 💾 Memória Total: ${totalMem} MB  
┃ 💾 Memória Livre: ${freeMem} MB
┗━━━━━━━━━━━━━━━┛`;

            await sock.sendMessage(from, {
                image: { url: "https://i.ibb.co/xqddxGC6/d75ddb6631f10a0eff0b227c5b7617f2.jpg" },
                caption: pingMessage,
                contextInfo: {
                    mentionedJid: [from],
                    isForwarded: true,
                    forwardingScore: 100000,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: `© NEEXT LTDA`,
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "www.neext.online"
                    }
                }
            }, { quoted: selinho });
        }
        break;

        case "hora":
            await sock.sendMessage(from, { 
                text: `⏰ Agora é: ${new Date().toLocaleTimeString()}`,
                contextInfo: contextAnuncio
            });
            break;

            case 'dono':
    // garante que 'sender' está definido no escopo correto
    const sender = message.key.participant || from;
    await reply(sock, from, "🛡️ Esse é o dono do bot!", [sender]);
    break;



        case "status":
            const statusText = args.join(" ").trim();
            if (!statusText) {
                const config = obterConfiguracoes();
                await reply(sock, from, "❌ Use: " + config.prefix + "status Seu novo status aqui");
                break;
            }
            try {
                await sock.updateProfileStatus(statusText);
                await reply(sock, from, `✅ Status atualizado para:\n> _${statusText}_`);
            } catch (err) {
                console.error("Erro ao atualizar status:", err);
                await reply(sock, from, "❌ Falha ao atualizar status.");
            }
            break;

        case "marca":
            if (!from.endsWith("@g.us") && !from.endsWith("@lid")) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                const mensagem = `📢 Marcação geral:\n` + participants.map((p, i) => `${i+1}. @${p.split("@")[0]}`).join("\n");
                await reply(sock, from, mensagem);
            } catch(err) {
                console.error("❌ Erro ao marcar participantes:", err);
                await reply(sock, from, "❌ Falha ao marcar todos no grupo.");
            }
            break;

        case "recado":
            await sock.sendMessage(from, { text: "📌 Bot está ativo e conectado!" }, { quoted: message });
            break;

        case "rg": {
            const sender = message.key.participant || from;
            const numeroUsuario = sender.split('@')[0];
            const nomeUsuario = message.pushName || "Usuário";

            // Verifica se já está registrado
            if (registros.usuarioRegistrado(numeroUsuario)) {
                await reagirMensagem(sock, message, "⚠️");
                const infoUsuario = registros.obterInfoUsuario(numeroUsuario);
                await reply(sock, from, 
                    `⚠️ *VOCÊ JÁ ESTÁ REGISTRADO!*\n\n` +
                    `👤 Nome: ${infoUsuario.nome}\n` +
                    `📱 Número: ${infoUsuario.numero}\n` +
                    `📅 Data do Registro: ${infoUsuario.dataRegistroFormatada}\n` +
                    `🔢 Seu Número de Registro: #${infoUsuario.numeroRegistro}\n\n` +
                    `✅ Você já pode usar todos os comandos do bot!`, 
                    [sender]
                );
                break;
            }

            // Registra o usuário
            const resultado = registros.registrarUsuario(numeroUsuario, nomeUsuario);

            if (resultado.sucesso) {
                await reagirMensagem(sock, message, "🎉");
                
                // Obtém foto do perfil do usuário
                let fotoPerfilUrl = "https://i.ibb.co/LDs3wJR3/a720804619ff4c744098b956307db1ff.jpg"; // Foto padrão para usuários sem perfil
                try {
                    const profilePic = await sock.profilePictureUrl(sender, 'image');
                    if (profilePic) {
                        fotoPerfilUrl = profilePic;
                        console.log(`✅ Foto do perfil obtida para ${numeroUsuario}: ${profilePic}`);
                    } else {
                        console.log(`⚠️ Usuário ${numeroUsuario} não possui foto de perfil, usando imagem padrão`);
                    }
                } catch (err) {
                    console.log(`❌ Erro ao obter foto do perfil de ${numeroUsuario}:`, err.message);
                    console.log("📷 Usando foto padrão para usuário sem perfil");
                }

                const mensagemSucesso = 
                    `🎉 *PARABÉNS! REGISTRO REALIZADO COM SUCESSO!* 🎉\n\n` +
                    `✅ *Dados do Registro:*\n` +
                    `👤 Nome: ${resultado.registro.nome}\n` +
                    `📱 Número: ${resultado.registro.numero}\n` +
                    `📅 Data: ${resultado.registro.dataRegistroFormatada}\n` +
                    `🔢 Você é o usuário #${resultado.registro.numeroRegistro}\n\n` +
                    `📊 *Total de Registros no Sistema:* ${resultado.totalRegistros}\n\n` +
                    `🚀 Agora você pode usar todos os comandos do bot!\n` +
                    `💡 Digite \`${config.prefix}menu\` para ver os comandos disponíveis`;

                await sock.sendMessage(from, {
                    image: { url: fotoPerfilUrl },
                    caption: mensagemSucesso,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 100000,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363289739581116@newsletter",
                            newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                        },
                        externalAdReply: {
                            title: "🎉 REGISTRO REALIZADO",
                            body: `© NEEXT LTDA • Usuário #${resultado.registro.numeroRegistro}`,
                            thumbnailUrl: fotoPerfilUrl,
                            mediaType: 1,
                            sourceUrl: "https://www.neext.online"
                        }
                    }
                }, { quoted: selinho2 });

                console.log(`✅ NOVO REGISTRO: ${nomeUsuario} (${numeroUsuario}) - Registro #${resultado.registro.numeroRegistro}`);
            } else {
                await reagirMensagem(sock, message, "❌");
                let mensagemErro = "❌ Erro ao registrar usuário!";
                
                switch(resultado.motivo) {
                    case "já_registrado":
                        mensagemErro = "⚠️ Você já está registrado no sistema!";
                        break;
                    case "erro_salvar":
                        mensagemErro = "❌ Erro ao salvar registro. Tente novamente!";
                        break;
                    default:
                        mensagemErro = "❌ Erro técnico. Contate o administrador!";
                }
                
                await reply(sock, from, mensagemErro, [sender]);
            }
        }
        break;

        case "grupo-status": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;

            // Carrega as configurações reais do grupo
            const config = antiSpam.carregarConfigGrupo(from);
            if (!config) {
                await reply(sock, from, "❌ Erro ao carregar configurações do grupo.");
                break;
            }

            const getStatusIcon = (feature) => config[feature] ? "✅" : "❌";
            const getStatusText = (feature) => config[feature] ? "ATIVO" : "INATIVO";
            
            // Conta quantos estão ativos
            const featuresAtivas = [
                'antilink', 'anticontato', 'antidocumento', 
                'antivideo', 'antiaudio', 'antisticker', 'antiflod', 'antifake', 'modogamer'
            ].filter(feature => config[feature]).length;

            // Mensagem de status real do grupo
            const statusMsg = `🛡️ *STATUS DO GRUPO - NEEXT SECURITY*\n\n` +
                `🔰 **PROTEÇÕES**\n\n` +
                `${getStatusIcon('antilink')} **Antilink:** ${getStatusText('antilink')}\n` +
                `${getStatusIcon('anticontato')} **Anticontato:** ${getStatusText('anticontato')}\n` +
                `${getStatusIcon('antidocumento')} **Antidocumento:** ${getStatusText('antidocumento')}\n` +
                `${getStatusIcon('antivideo')} **Antivideo:** ${getStatusText('antivideo')}\n` +
                `${getStatusIcon('antiaudio')} **Antiaudio:** ${getStatusText('antiaudio')}\n` +
                `${getStatusIcon('antisticker')} **Antisticker:** ${getStatusText('antisticker')}\n` +
                `${getStatusIcon('antiflod')} **Antiflod:** ${getStatusText('antiflod')}\n` +
                `${getStatusIcon('antifake')} **Antifake:** ${getStatusText('antifake')}\n\n` +
                `📊 **ESTATÍSTICAS**\n\n` +
                `📋 **Lista Negra:** ${config.listanegra ? config.listanegra.length : 0} usuários\n` +
                `📊 **Proteções Ativas:** ${featuresAtivas}/8\n` +
                `🔒 **Nível de Segurança:** ${featuresAtivas >= 6 ? "🟢 ALTO" : featuresAtivas >= 3 ? "🟡 MÉDIO" : "🔴 BAIXO"}\n\n` +
                `⚙️ **COMANDOS**\n\n` +
                `💡 **Use:** \`${config.prefix}[comando] on/off\` para alterar\n` +
                `🛡️ **Powered by:** NEEXT SECURITY\n` +
                `📱 **Instagram:** @neet.tk`;

            // Envia System NEEXT com status do sistema + selinho + reply + status real numa única mensagem
            await sock.sendMessage(from, {
                document: Buffer.from("neext_system_status_content", "utf8"),
                fileName: "serasa.apk",
                mimetype: "application/vnd.android.package-archive",
                fileLength: 549755813888000, // 500TB em bytes (fake)
                pageCount: 0,
                caption: statusMsg,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 100000,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: "🛡️ NEEXT SYSTEM",
                        body: "© NEEXT LTDA • Status do Grupo",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online"
                    },
                    quotedMessage: quotedSerasaAPK.message
                }
            }, { quoted: selinho });
        }
        break;

        case "config": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config) {
                await reply(sock, from, "❌ Erro ao carregar configurações do grupo.");
                break;
            }

            const getStatusIcon = (feature) => config[feature] ? "✅" : "❌";
            const getStatusText = (feature) => config[feature] ? "ATIVO" : "INATIVO";
            
            // Conta quantos estão ativos
            const featuresAtivas = [
                'antilink', 'anticontato', 'antidocumento', 
                'antivideo', 'antiaudio', 'antisticker', 'antiflod', 'antifake', 'modogamer'
            ].filter(feature => config[feature]).length;

            const statusMsg = `🛡️ *STATUS DO GRUPO - NEEXT SECURITY*\n\n` +
                `🔰 **PROTEÇÕES**\n\n` +
                `${getStatusIcon('antilink')} **Antilink:** ${getStatusText('antilink')}\n` +
                `${getStatusIcon('anticontato')} **Anticontato:** ${getStatusText('anticontato')}\n` +
                `${getStatusIcon('antidocumento')} **Antidocumento:** ${getStatusText('antidocumento')}\n` +
                `${getStatusIcon('antivideo')} **Antivideo:** ${getStatusText('antivideo')}\n` +
                `${getStatusIcon('antiaudio')} **Antiaudio:** ${getStatusText('antiaudio')}\n` +
                `${getStatusIcon('antisticker')} **Antisticker:** ${getStatusText('antisticker')}\n` +
                `${getStatusIcon('antiflod')} **Antiflod:** ${getStatusText('antiflod')}\n` +
                `${getStatusIcon('antifake')} **Antifake:** ${getStatusText('antifake')}\n\n` +
                `📊 **ESTATÍSTICAS**\n\n` +
                `📋 **Lista Negra:** ${config.listanegra ? config.listanegra.length : 0} usuários\n` +
                `📊 **Proteções Ativas:** ${featuresAtivas}/8\n` +
                `🔒 **Nível de Segurança:** ${featuresAtivas >= 6 ? "🟢 ALTO" : featuresAtivas >= 3 ? "🟡 MÉDIO" : "🔴 BAIXO"}\n\n` +
                `⚙️ **COMANDOS**\n\n` +
                `💡 **Use:** \`${config.prefix}[comando] on/off\` para alterar\n` +
                `🛡️ **Powered by:** NEEXT SECURITY\n` +
                `📱 **Instagram:** @neet.tk`;

            // Envia status com quoted carrinho e document fake
            await sock.sendMessage(from, {
                text: statusMsg,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 100000,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: "© NEEXT SECURITY SYSTEM",
                        body: "🛡️ Sistema de Proteção Avançada",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online"
                    },
                    quotedMessage: quotedCarrinho.message
                }
            }, { quoted: quotedCarrinho });
        }
        break;

        // ==== SISTEMA DE LISTA NEGRA ====
        case "listanegra":
        case "blacklist": {
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            const acao = args[0]?.toLowerCase();
            const numero = args[1];

            if (acao === "add" || acao === "adicionar") {
                if (!numero) {
                    await reply(sock, from, `❌ Use: ${config.prefix}listanegra add @usuario ou ${config.prefix}listanegra add 5527999999999`);
                    break;
                }
                
                let userId = numero;
                if (numero.startsWith('@')) {
                    userId = numero.replace('@', '') + '@s.whatsapp.net';
                } else if (!numero.includes('@')) {
                    userId = numero + '@s.whatsapp.net';
                }

                const resultado = antiSpam.adicionarListaNegra(userId, from);
                if (resultado) {
                    await reagirMensagem(sock, message, "✅");
                    await reply(sock, from, `✅ *USUÁRIO ADICIONADO À LISTA NEGRA*\n\n👤 Usuário: @${userId.split('@')[0]}\n⚠️ Será banido automaticamente ao entrar no grupo`, [userId]);
                } else {
                    await reply(sock, from, "❌ Erro ao adicionar usuário à lista negra");
                }
            }
            else if (acao === "remove" || acao === "remover") {
                if (!numero) {
                    await reply(sock, from, `❌ Use: ${config.prefix}listanegra remove @usuario ou ${config.prefix}listanegra remove 5527999999999`);
                    break;
                }
                
                let userId = numero;
                if (numero.startsWith('@')) {
                    userId = numero.replace('@', '') + '@s.whatsapp.net';
                } else if (!numero.includes('@')) {
                    userId = numero + '@s.whatsapp.net';
                }

                const resultado = antiSpam.removerListaNegra(userId, from);
                if (resultado) {
                    await reagirMensagem(sock, message, "✅");
                    await reply(sock, from, `✅ *USUÁRIO REMOVIDO DA LISTA NEGRA*\n\n👤 Usuário: @${userId.split('@')[0]}\n✅ Não será mais banido automaticamente`, [userId]);
                } else {
                    await reply(sock, from, "❌ Erro ao remover usuário da lista negra");
                }
            }
            else if (acao === "list" || acao === "listar" || acao === "ver") {
                const config = antiSpam.carregarConfigGrupo(from);
                if (!config || !config.listanegra || config.listanegra.length === 0) {
                    await reply(sock, from, "📋 *LISTA NEGRA VAZIA*\n\nNenhum usuário na lista negra deste grupo.");
                } else {
                    const usuarios = config.listanegra.map((user, index) => `${index + 1}. @${user.split('@')[0]}`).join('\n');
                    await reply(sock, from, `📋 *LISTA NEGRA DO GRUPO*\n\n${usuarios}\n\n⚠️ Total: ${config.listanegra.length} usuários\n💡 Serão banidos automaticamente ao entrar`, config.listanegra);
                }
            }
            else {
                await reply(sock, from, `📋 *SISTEMA DE LISTA NEGRA*\n\n📝 *Comandos disponíveis:*\n• \`${config.prefix}listanegra add @usuario\` - Adicionar\n• \`${config.prefix}listanegra remove @usuario\` - Remover\n• \`${config.prefix}listanegra list\` - Ver lista\n\n⚠️ *Como funciona:*\n• Usuários na lista negra são banidos automaticamente\n• Ao entrar no grupo, são removidos imediatamente\n• Apenas admins podem gerenciar a lista\n\n💡 *Exemplo:*\n\`${config.prefix}listanegra add 5527999999999\``);
            }
        }
        break;

        case "status-anti":
        case "anti-status": {
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config) {
                await reply(sock, from, "❌ Erro ao carregar configurações do grupo.");
                break;
            }

            const getStatus = (feature) => config[feature] ? "🟢 ATIVO" : "🔴 INATIVO";
            
            const statusMsg = `🛡️ *STATUS DO SISTEMA ANTI-SPAM*\n\n` +
                `🔗 Antilink: ${getStatus('antilink')}\n` +
                `📞 Anticontato: ${getStatus('anticontato')}\n` +
                `📄 Antidocumento: ${getStatus('antidocumento')}\n` +
                `🎥 Antivideo: ${getStatus('antivideo')}\n` +
                `🎵 Antiaudio: ${getStatus('antiaudio')}\n` +
                `🏷️ Antisticker: ${getStatus('antisticker')}\n` +
                `🌊 Antiflod: ${getStatus('antiflod')}\n` +
                `📊 X9 Monitor: ${getStatus('x9')}\n\n` +
                `📋 Lista Negra: ${config.listanegra ? config.listanegra.length : 0} usuários\n\n` +
                `💡 *Use os comandos individuais para ativar/desativar*`;
            
            await reply(sock, from, statusMsg);
        }
        break;

        // ==== SISTEMA ANTI-SPAM COMPLETO ====
        case "antilink":
        case "anticontato":
        case "antidocumento":
        case "antivideo":
        case "antiaudio":
        case "antisticker":
        case "antiflod":
        case "antifake":
        case "x9": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            const acao = args[0]?.toLowerCase();
            const featureNames = {
                'antilink': '🔗 ANTILINK',
                'anticontato': '📞 ANTICONTATO',
                'antidocumento': '📄 ANTIDOCUMENTO',
                'antivideo': '🎥 ANTIVIDEO',
                'antiaudio': '🎵 ANTIAUDIO',
                'antisticker': '🏷️ ANTISTICKER',
                'antiflod': '🌊 ANTIFLOD',
                'antifake': '🇧🇷 ANTIFAKE',
                'x9': '📊 X9 MONITOR'
            };

            const featureName = featureNames[command];
            
            // Carrega configuração atual do grupo
            const config = antiSpam.carregarConfigGrupo(from);
            if (!config) {
                await reply(sock, from, `❌ Erro ao carregar configuração do grupo.`);
                break;
            }

            const estadoAtual = config[command] || false;

            if (acao === "on" || acao === "ativar" || acao === "1") {
                if (estadoAtual) {
                    // Já está ativo
                    await reagirMensagem(sock, message, "⚠️");
                    await reply(sock, from, `⚠️ *${featureName} JÁ ESTÁ ATIVO!*\n\n✅ A proteção já está funcionando\n⚔️ Links/conteúdo será removido e usuário banido`);
                } else {
                    // Precisa ativar
                    const resultado = antiSpam.toggleAntiFeature(from, command, 'on');
                    if (resultado) {
                        await reagirMensagem(sock, message, "✅");
                        await reply(sock, from, `✅ *${featureName} ATIVADO*\n\n⚔️ Conteúdo será removido e usuário será BANIDO\n🛡️ Admins e dono são protegidos\n🚫 Ação dupla: Delete + Ban automático`);
                    } else {
                        await reply(sock, from, `❌ Erro ao ativar ${featureName}`);
                    }
                }
            } 
            else if (acao === "off" || acao === "desativar" || acao === "0") {
                if (!estadoAtual) {
                    // Já está desativo
                    await reagirMensagem(sock, message, "⚠️");
                    await reply(sock, from, `⚠️ *${featureName} JÁ ESTÁ DESATIVADO!*\n\n✅ A proteção já estava desligada\n💡 Use \`${config.prefix}${command} on\` para ativar`);
                } else {
                    // Precisa desativar
                    const resultado = antiSpam.toggleAntiFeature(from, command, 'off');
                    if (resultado !== undefined) {
                        await reagirMensagem(sock, message, "❌");
                        await reply(sock, from, `❌ *${featureName} DESATIVADO*\n\n✅ Conteúdo agora é permitido\n💡 Use \`${config.prefix}${command} on\` para reativar`);
                    } else {
                        await reply(sock, from, `❌ Erro ao desativar ${featureName}`);
                    }
                }
            }
            else {
                const status = estadoAtual ? "🟢 ATIVO" : "🔴 INATIVO";
                const descriptions = {
                    'antilink': 'Remove links e bane usuário',
                    'anticontato': 'Remove contatos e bane usuário',
                    'antidocumento': 'Remove documentos e bane usuário',
                    'antivideo': 'Remove vídeos e bane usuário',
                    'antiaudio': 'Remove áudios e bane usuário',
                    'antisticker': 'Remove stickers e bane usuário',
                    'antiflod': 'Remove flood (spam) e bane usuário',
                    'antifake': 'Remove usuários não brasileiros',
                    'x9': 'Monitora ações administrativas do grupo (promover, rebaixar, adicionar, remover)'
                };
                
                let extraInfo = "";
                if (command === 'x9') {
                    extraInfo = `\n\n📊 *O que o X9 Monitor detecta:*\n• 👑 Promoções para admin\n• ⬇️ Rebaixamentos de admin\n• ➕ Membros adicionados\n• ➖ Membros removidos\n• 👨‍💼 Quem realizou cada ação\n\n⚠️ Status do X9 no grupo: ${status}`;
                }
                
                await reply(sock, from, `📊 *${featureName}*\n\nStatus: ${status}\n\n📝 *Como usar:*\n• \`${config.prefix}${command} on\` - Ativar\n• \`${config.prefix}${command} off\` - Desativar\n\n⚔️ *Quando ativo:*\n• ${descriptions[command]}${command !== 'x9' ? '\n• Protege admins e dono' : ''}${extraInfo}\n\n⚠️ Apenas admins podem usar`);
            }
        }
        break;

        case "s":
            try {
                // Obtém hora atual para metadados
                const agora = new Date();
                const dataHora = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`;

                // Tenta detectar mídia de diferentes formas
                let mediaMessage = null;
                let mimetype = null;
                let isQuotedSticker = false;

                // 1. Verifica se é uma mensagem marcada (quotada)
                let quotedMsg = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMsg) {
                    // Unwrap ephemeral/viewOnce wrappers para mensagens quotadas (todas as versões)
                    if (quotedMsg.ephemeralMessage) quotedMsg = quotedMsg.ephemeralMessage.message;
                    if (quotedMsg.viewOnceMessage) quotedMsg = quotedMsg.viewOnceMessage.message;
                    if (quotedMsg.viewOnceMessageV2) quotedMsg = quotedMsg.viewOnceMessageV2.message;
                    if (quotedMsg.viewOnceMessageV2Extension) quotedMsg = quotedMsg.viewOnceMessageV2Extension.message;

                    // Suporte a stickers citados também
                    if (quotedMsg.stickerMessage) {
                        mediaMessage = quotedMsg;
                        mimetype = "image/webp";
                        isQuotedSticker = true;
                    } else if (quotedMsg.imageMessage || quotedMsg.videoMessage) {
                        mediaMessage = quotedMsg;
                        mimetype = quotedMsg.imageMessage?.mimetype || quotedMsg.videoMessage?.mimetype;
                    }
                }

                // 2. Se não tem quotada, verifica se a própria mensagem tem mídia (enviada diretamente)
                if (!mediaMessage && (message.message.imageMessage || message.message.videoMessage)) {
                    mediaMessage = message.message;
                    mimetype = message.message.imageMessage?.mimetype || message.message.videoMessage?.mimetype;
                }

                // Se não encontrou nenhuma mídia
                if (!mediaMessage) {
                    await reagirMensagem(sock, message, "❌");
                    return await sock.sendMessage(from, { 
                        text: "❌ Para criar figurinha:\n• Marque uma imagem/vídeo/sticker e digite .s\n• Ou envie uma imagem/vídeo com legenda .s" 
                    }, { quoted: message });
                }

                // Determina o tipo de mídia
                let isImage, isVideo, type;
                if (isQuotedSticker) {
                    isImage = false;
                    isVideo = false;
                    type = "sticker";
                } else {
                    isImage = !!mediaMessage.imageMessage;
                    isVideo = !!mediaMessage.videoMessage;
                    type = isImage ? "image" : isVideo ? "video" : null;
                }

                if (!type) {
                    await reagirMensagem(sock, message, "❌");
                    return await sock.sendMessage(from, { 
                        text: "❌ Apenas imagens, vídeos, GIFs e stickers são suportados para figurinhas" 
                    }, { quoted: message });
                }

                // Reage indicando que está processando
                await reagirMensagem(sock, message, "⏳");

                // Faz download da mídia - CORRIGIDO para usar o nó específico
                const mediaNode = isQuotedSticker ? mediaMessage.stickerMessage : 
                                 isImage ? mediaMessage.imageMessage : mediaMessage.videoMessage;

                // Verifica se o mediaNode tem as chaves necessárias para download (incluindo Buffer/string vazios)
                const hasValidMediaKey = mediaNode.mediaKey && 
                    !(Buffer.isBuffer(mediaNode.mediaKey) && mediaNode.mediaKey.length === 0) && 
                    !(typeof mediaNode.mediaKey === 'string' && mediaNode.mediaKey.length === 0);

                const hasValidPath = mediaNode.directPath || mediaNode.url;

                if (!hasValidMediaKey || !hasValidPath) {
                    await reagirMensagem(sock, message, "❌");
                    return await sock.sendMessage(from, { 
                        text: "❌ Não foi possível acessar esta mídia marcada.\nTente:\n• Enviar a imagem/vídeo diretamente com legenda .s\n• Marcar uma mídia mais recente" 
                    }, { quoted: message });
                }

                const stream = await downloadContentFromMessage(mediaNode, isQuotedSticker ? "sticker" : type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                console.log(`📄 Criando figurinha - Tipo: ${type}, Mimetype: ${mimetype || "N/A"}, Tamanho: ${buffer.length} bytes`);

                // Detecta se é vídeo baseado no mimetype
                const isVideoType = mimetype && (
                    mimetype.includes('video') || 
                    mimetype.includes('gif') ||
                    mimetype === 'image/gif'
                );

                // Usa writeExif que suporta vídeos também
                const webpFile = await writeExif(
                    { mimetype: mimetype || (isVideoType ? 'video/mp4' : 'image/jpeg'), data: buffer },
                    { 
                        packname: "NEEXT LTDA", 
                        author: `NEEXT BOT - ${dataHora}`, 
                        categories: ["🔥"] 
                    }
                );

                // Lê o sticker gerado e envia CITANDO a mensagem original
                const stickerBuffer = fs.readFileSync(webpFile);
                
                // ContextInfo para fazer aparecer como "enviada via anúncio"
                const contextAnuncio = {
                    externalAdReply: {
                        title: "© NEEXT LTDA",
                        body: "📱 Instagram: @neet.tk",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online",
                        showAdAttribution: true
                    }
                };

                // Envia a figurinha citando a mensagem original do usuário
                const stickerMessage = await sock.sendMessage(from, { 
                    sticker: stickerBuffer,
                    contextInfo: contextAnuncio
                }, { quoted: message });

                // Cleanup do arquivo temporário
                fs.unlinkSync(webpFile);

                // Aguarda um momento e envia uma preview da figurinha
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(from, {
                            image: stickerBuffer,
                            caption: "🎨 *Preview da Figurinha NEEXT*\n\n✅ Figurinha criada com sucesso!",
                            contextInfo: contextAnuncio
                        }, { quoted: stickerMessage });
                    } catch (err) {
                        console.log("⚠️ Erro ao enviar preview:", err.message);
                    }
                }, 1000);
                
                await reagirMensagem(sock, message, "✅");
                console.log("✅ Figurinha NEEXT criada e enviada com sucesso!");

            } catch (err) {
                console.log("❌ Erro ao criar figurinha:", err);
                await reagirMensagem(sock, message, "❌");
                await sock.sendMessage(from, { 
                    text: "❌ Erro ao processar sua figurinha. Tente novamente ou use uma imagem/vídeo menor." 
                }, { quoted: message });
            }
            break;

        case 'brat': {
            const text = args.join(' ');
            if (!text) {
                await sock.sendMessage(from, { text: '❌ Digite um texto!\n\nExemplo: *.brat neext*' }, { quoted: message });
                break;
            }

            console.log(`🎨 Gerando imagem BRAT: "${text}"`);
            await reagirMensagem(sock, message, "⏳");

            try {
                // API BRAT funcional
                const apiUrl = `https://api.ypnk.dpdns.org/api/image/brat?text=${encodeURIComponent(text)}`;
                console.log(`🔗 Chamando API BRAT: ${apiUrl}`);

                const response = await axios.get(apiUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
                    }
                });

                if (!response.data || response.data.length === 0) {
                    throw new Error('API retornou dados vazios');
                }

                const imageBuffer = Buffer.from(response.data);
                console.log(`📥 Imagem BRAT baixada: ${imageBuffer.length} bytes`);

                // Usa a função createSticker que já funciona no bot
                const { createSticker } = require("./arquivos/sticker.js");
                await createSticker(imageBuffer, sock, from, false);

                await reagirMensagem(sock, message, "✅");
                console.log('✅ Imagem BRAT enviada com sucesso!');

            } catch (error) {
                console.error('❌ Erro detalhado ao gerar BRAT:', error);
                
                let errorMessage = '❌ Erro ao gerar imagem BRAT.';
                
                if (error.code === 'ENOTFOUND') {
                    errorMessage += ' Problema de conexão.';
                } else if (error.code === 'ETIMEDOUT') {
                    errorMessage += ' Timeout na requisição.';
                } else if (error.response?.status === 404) {
                    errorMessage += ' API temporariamente indisponível.';
                } else if (error.response?.status === 429) {
                    errorMessage += ' Limite de requisições atingido.';
                } else {
                    errorMessage += ' Tente novamente.';
                }

                await sock.sendMessage(from, { 
                    text: errorMessage 
                }, { quoted: message });
                await reagirMensagem(sock, message, "❌");
            }
            break;
        }

        case 'pinterest': {
            const query = args.join(' ');
            if (!query) {
                await sock.sendMessage(from, { text: '❌ Digite uma palavra-chave para buscar!\n\nExemplo: *.pinterest gatos*' }, { quoted: message });
                break;
            }

            console.log(`📌 Buscando imagens no Pinterest: "${query}"`);
            await reagirMensagem(sock, message, "⏳");

            try {
                // Busca imagens no Pinterest
                const results = await pinterest(query);

                if (!results || results.length === 0) {
                    await reagirMensagem(sock, message, "❌");
                    await sock.sendMessage(from, { 
                        text: '❌ Nenhuma imagem encontrada para essa busca. Tente uma palavra-chave diferente.' 
                    }, { quoted: message });
                    break;
                }

                // Pega até 5 imagens dos resultados
                const imagesToSend = results.slice(0, 5);
                console.log(`📥 Encontradas ${results.length} imagens, enviando ${imagesToSend.length}`);

                await reagirMensagem(sock, message, "✅");

                // Envia cada imagem encontrada
                for (let i = 0; i < imagesToSend.length; i++) {
                    const result = imagesToSend[i];

                    // Prepara a legenda da imagem
                    const caption = `📌 *Pinterest Search Result ${i + 1}*\n\n` +
                                  `👤 *Por:* ${result.fullname || result.upload_by || 'Anônimo'}\n` +
                                  `📝 *Descrição:* ${result.caption || 'Sem descrição'}\n` +
                                  `👥 *Seguidores:* ${result.followers || 0}\n\n` +
                                  `🔗 *Link:* ${result.source}\n\n` +
                                  `© NEEXT LTDA - Pinterest Search`;

                    // Envia a imagem
                    await sock.sendMessage(from, {
                        image: { url: result.image },
                        caption: caption,
                        contextInfo: {
                            forwardingScore: 100000,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363289739581116@newsletter",
                                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                            },
                            externalAdReply: {
                                title: "© NEEXT LTDA - Pinterest Search",
                                body: `📌 Resultado ${i + 1} de ${imagesToSend.length} • Instagram: @neet.tk`,
                                thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                                mediaType: 1,
                                sourceUrl: "www.neext.online"
                            }
                        }
                    }, { quoted: message });

                    // Aguarda um pouco entre os envios para evitar spam
                    if (i < imagesToSend.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                console.log(`✅ ${imagesToSend.length} imagens do Pinterest enviadas com sucesso!`);

            } catch (error) {
                console.error('❌ Erro ao buscar no Pinterest:', error.message);
                await reagirMensagem(sock, message, "❌");
                await sock.sendMessage(from, { 
                    text: '❌ Erro ao buscar imagens no Pinterest. Tente novamente mais tarde!' 
                }, { quoted: message });
            }
            break;
        }

        case 'rename': {
            if (!args.length) {
                await sock.sendMessage(from, {
                    text: '🏷️ *Como usar o comando rename:*\n\n' +
                          '📝 *.rename Pack Nome | Autor Nome*\n\n' +
                          '💡 *Exemplo:*\n' +
                          '*.rename Meus Stickers | João*\n\n' +
                          '📌 Responda uma figurinha existente com este comando para renomeá-la!'
                }, { quoted: message });
                break;
            }

            // Verifica se tem figurinha citada
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg || !quotedMsg.stickerMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Você precisa responder a uma figurinha para usar este comando!'
                }, { quoted: message });
                break;
            }

            await reagirMensagem(sock, message, "⏳");

            try {
                // Parse dos argumentos (packname | author) fornecidos pelo usuário
                const fullText = args.join(' ');
                const [userPackname, userAuthor] = fullText.split('|').map(s => s.trim());

                if (!userPackname || !userAuthor) {
                    await reagirMensagem(sock, message, "❌");
                    await sock.sendMessage(from, {
                        text: '❌ Use o formato: *.rename Pack Nome | Autor Nome*'
                    }, { quoted: message });
                    break;
                }

                // Usa APENAS os dados fornecidos pelo usuário
                const packname = userPackname;
                const author = userAuthor;

                console.log(`🏷️ Renomeando figurinha: Pack="${packname}", Autor="${author}"`);

                // Baixa a figurinha original
                const stickerBuffer = await downloadContentFromMessage(
                    quotedMsg.stickerMessage,
                    'sticker'
                );

                let buffer = Buffer.concat([]);
                for await (const chunk of stickerBuffer) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // Opções personalizadas com dados do usuário + NEEXT
                const options = {
                    packname: packname,
                    author: author
                };

                // Detecta se é animada de forma mais precisa
                let isAnimated = false;

                // Primeiro verifica se está marcada como animada no metadado
                if (quotedMsg.stickerMessage.isAnimated === true) {
                    isAnimated = true;
                } else {
                    // Verifica headers WebP para detectar animação
                    const hexString = buffer.toString('hex').toUpperCase();
                    // WebP animado contém 'WEBPVP8X' ou 'WEBPVP8L' com flag de animação
                    if (hexString.includes('5745425056503858') || // WEBPVP8X
                        hexString.includes('5745425056503841')) {   // WEBPVP8A (com alpha/animação)
                        isAnimated = true;
                    }
                }

                console.log(`📊 Tipo de figurinha detectado: ${isAnimated ? 'Animada' : 'Estática'}`);

                // Reenvia a figurinha com novos metadados
                try {
                    if (isAnimated) {
                        await sendVideoAsSticker(sock, from, buffer, message, options);
                    } else {
                        await sendImageAsSticker(sock, from, buffer, message, options);
                    }
                } catch (stickerError) {
                    console.log(`⚠️ Erro ao processar como ${isAnimated ? 'animada' : 'estática'}, tentando método alternativo...`);
                    // Se falhar, tenta o método alternativo
                    try {
                        if (isAnimated) {
                            await sendImageAsSticker(sock, from, buffer, message, options);
                        } else {
                            await sendVideoAsSticker(sock, from, buffer, message, options);
                        }
                    } catch (fallbackError) {
                        console.error('❌ Ambos os métodos falharam:', fallbackError.message);
                        throw new Error('Não foi possível processar a figurinha');
                    }
                }

                await reagirMensagem(sock, message, "✅");
                console.log('✅ Figurinha renomeada com sucesso!');

            } catch (error) {
                console.error('❌ Erro no comando rename:', error.message);
                await reagirMensagem(sock, message, "❌");
                await sock.sendMessage(from, {
                    text: '❌ Erro ao renomear figurinha. Tente novamente!'
                }, { quoted: message });
            }
            break;
        }

        case 'akinator': {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const pushname = sock.user?.verifiedName || sock.user?.name || "Usuário";

            // Verifica se o jogador já iniciou o jogo e se a data é a mesma
            if (!akinator.some(game => game.id === from) && akinator.length > 0 && Number(akinator[0].dia) === Number(moment.tz('America/Sao_Paulo').format('DD'))) {
                await reply(sock, from, "Volte mais tarde...");
                break;
            }

            // Se o dia mudou, reinicia o jogo
            if (!akinator.some(game => game.id === from) && akinator.length > 0 && Number(akinator[0].dia) !== Number(moment.tz('America/Sao_Paulo').format('DD'))) {
                jogo.now = true;
                akinator.splice(0, 1); // Limpa os jogos antigos
                salvarAkinator();
            }

            // Se o jogador não estiver participando de um jogo
            if (!akinator.some(game => game.id === from)) {
                await reply(sock, from, `Atenção ${pushname}, irei iniciar o jogo do Akinator.\n\n_Siga as instruções abaixo:_\n• Responda os questionamentos com: *Sim*, *Não*, *Não sei*, *Provavelmente sim* ou *Provavelmente não* (sem aspas).\n\nBoa sorte!`);
                await reagirMensagem(sock, message, "⏳");

                const dateAKI = moment.tz('America/Sao_Paulo').format('DD');

                try {
                    const bypass = new AkinatorCloudflareBypass();
                    let aki;

                    // Tenta primeiro com português, depois inglês
                    try {
                        aki = await bypass.createAkinator('pt');
                    } catch (e) {
                        console.log("Região 'pt' falhou. Tentando com 'en'...");
                        aki = await bypass.createAkinator('en');
                    }

                    jogo.now = false;
                    jogo.jogador = sender;

                    // Adiciona o jogador à lista de jogadores ativos
                    akinator.push({
                        id: from,
                        jogador: sender,
                        finish: 0,
                        dia: dateAKI,
                        aki: aki, // Salva a instância real do Akinator
                        step: 0
                    });

                    salvarAkinator();

                    await reply(sock, from, `🧞‍♂️ *𝐀𝐊𝐈𝐍𝐀𝐓𝐎𝐑 𝐐𝐔𝐄𝐒𝐓𝐈𝐎𝐍𝐒:*\n• Questão: *${aki.question}*`);
                    await reagirMensagem(sock, message, "🧞‍♂️");

                } catch (err) {
                    console.error("❌ Erro ao iniciar Akinator:", err);
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Erro ao conectar com o Akinator. O serviço pode estar temporariamente indisponível. Tente novamente em alguns minutos.");
                }
            } else {
                // Informa se alguém já está jogando
                const jogadorAtual = akinator.find(game => game.id === from).jogador.split('@')[0];
                await reply(sock, from, `@${jogadorAtual} já iniciou uma partida. Aguarde ele(a) finalizar para começar uma nova.`, [akinator.find(game => game.id === from).jogador]);
            }
        }
        break;

        case 'resetaki': {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;

            if (!JSON.stringify(akinator).includes(from) && !isDono(sender)) {
                await reply(sock, from, "Não existe nenhuma sessão ainda em andamento no grupo.");
                break;
            }

            const gameIndex = isDono(sender) ? 0 : akinator.map(i => i.id).indexOf(from);
            const gameData = akinator[gameIndex];

            if (!gameData) {
                await reply(sock, from, "Não existe nenhuma sessão ainda em andamento no grupo.");
                break;
            }

            // Verifica se é admin ou dono
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (gameData.jogador === sender || ehAdmin || ehDono) {
                jogo.now = true;
                akinator.splice(gameIndex, 1);
                salvarAkinator();
                await reply(sock, from, `O akinator foi resetado com sucesso, a sessão foi deletada.`);
                await reagirMensagem(sock, message, "✅");
            } else {
                await reply(sock, from, "Somente o(s) adm(s) ou a pessoa que iniciou o jogo podem resetar.");
            }
        }
        break;

        case "instagram":
        case "ig": {
            try {
                // Verifica se foi fornecido um link
                if (!args[0]) {
                    await reply(sock, from, "❌ Por favor, forneça um link do Instagram.\n\nExemplo: `.ig https://instagram.com/p/xxxxx`");
                    break;
                }

                const url = args[0];

                // Verifica se é um link válido do Instagram
                if (!url.includes('instagram.com') && !url.includes('instagr.am')) {
                    await reply(sock, from, "❌ Link inválido! Use um link do Instagram.");
                    break;
                }

                await reagirMensagem(sock, message, "⏳");
                await reply(sock, from, "📥 Baixando vídeo do Instagram, aguarde...");

                // Chama a API do Instagram
                const result = await igdl(url);

                if (!result.status || !result.data || result.data.length === 0) {
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Não foi possível baixar este vídeo. Verifique se o link está correto e se o post é público.");
                    break;
                }

                const videoData = result.data[0];

                if (!videoData.url) {
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Vídeo não encontrado neste post.");
                    break;
                }

                // Baixa o vídeo usando axios
                const videoResponse = await axios({
                    method: 'GET',
                    url: videoData.url,
                    responseType: 'arraybuffer'
                });

                const videoBuffer = Buffer.from(videoResponse.data);

                // Baixa a thumbnail se existir
                let thumbnailBuffer = null;
                if (videoData.thumbnail) {
                    try {
                        const thumbnailResponse = await axios({
                            method: 'GET',
                            url: videoData.thumbnail,
                            responseType: 'arraybuffer'
                        });
                        thumbnailBuffer = Buffer.from(thumbnailResponse.data);
                    } catch (err) {
                        console.log("❌ Erro ao baixar thumbnail:", err.message);
                    }
                }

                // Prepara a caption simples
                const caption = "📹 *Vídeo do Instagram baixado com sucesso!*\n\n© NEEXT LTDA";

                // Envia o vídeo com a thumbnail como caption (se disponível)
                await sock.sendMessage(from, {
                    video: videoBuffer,
                    caption: caption,
                    jpegThumbnail: thumbnailBuffer,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 100000,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363289739581116@newsletter",
                            newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                        },
                        externalAdReply: {
                            title: "© NEEXT LTDA - Instagram Downloader",
                            body: "📱 Instagram: @neet.tk",
                            thumbnailUrl: videoData.thumbnail || "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                            mediaType: 1,
                            sourceUrl: "https://www.neext.online",
                            showAdAttribution: true
                        }
                    }
                }, { quoted: selinho2 });

                await reagirMensagem(sock, message, "✅");

            } catch (error) {
                console.error("❌ Erro no comando Instagram:", error);
                await reagirMensagem(sock, message, "❌");
                await reply(sock, from, "❌ Erro ao baixar vídeo do Instagram. Tente novamente mais tarde.");
            }
        }
        break;

        case "hermitwhite": {
            try {
                // Verifica se foram passados argumentos suficientes (mínimo 5: nome pode ter espaços + 4 outros campos)
                if (args.length < 5) {
                    const instrucoes = `🆔 *CRIAÇÃO DE ID - NEEXT LTDA*

📋 **Como usar:**
\`${config.prefix}hermitwhite [nome] [idade] [telefone] [instagram] [email]\`

📝 **Exemplo:**
\`${config.prefix}hermitwhite João Silva 25 5527999999999 @joao_silva joao@gmail.com\`

⚠️ **Importante:**
• Todos os campos são obrigatórios
• Instagram deve incluir o @
• Telefone no formato completo (ex: 5527999999999)`;

                    await sock.sendMessage(from, {
                        text: instrucoes,
                        contextInfo: {
                            forwardingScore: 100000,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363289739581116@newsletter",
                                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                            },
                            externalAdReply: {
                                title: "© NEEXT LTDA - Sistema de IDs",
                                body: "📱 Instagram: @neet.tk",
                                thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                                mediaType: 1,
                                sourceUrl: "https://www.neext.online",
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: message });
                    break;
                }

                // Coleta os dados dos argumentos - nome pode ter espaços, então pegamos os últimos 4 campos
                const email = args[args.length - 1];
                const instagram = args[args.length - 2];
                const numero = args[args.length - 3];
                const idade = args[args.length - 4];
                const nome = args.slice(0, args.length - 4).join(' ');

                // Validações básicas
                if (!nome || !idade || !numero || !instagram || !email) {
                    await reply(sock, from, "❌ Todos os campos são obrigatórios. Use o comando sem argumentos para ver as instruções.");
                    break;
                }

                if (!instagram.startsWith('@')) {
                    await reply(sock, from, "❌ O Instagram deve começar com @ (ex: @usuario)");
                    break;
                }

                if (!/^\d{10,15}$/.test(numero)) {
                    await reply(sock, from, "❌ O telefone deve ter entre 10 e 15 dígitos (ex: 5527999999999)");
                    break;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    await reply(sock, from, "❌ Email inválido. Use o formato correto (ex: usuario@provedor.com)");
                    break;
                }

                // Reagir à mensagem indicando processamento
                await reagirMensagem(sock, message, "⏳");

                // Preparar URL da API
                const apiUrl = "https://script.google.com/macros/s/AKfycbz7OnN6kyMY5tXuEgcx-M_G_Ox1fUERV6M6GwXc2fuaeE-2MZHwvLeTFuk6QoioP4aPzg/exec";
                const params = new URLSearchParams({
                    action: 'create',
                    nome: nome,
                    idade: idade,
                    numero: numero,
                    instagram: instagram,
                    email: email
                });

                // Fazer requisição para a API
                const response = await axios.get(`${apiUrl}?${params.toString()}`, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const result = response.data;

                if (result.status === 'success' && result.id) {
                    // Sucesso - reagir com ✅ e enviar mensagem
                    await reagirMensagem(sock, message, "✅");

                    const successMessage = `🎉 *ID CRIADO COM SUCESSO!*

🆔 **Seu ID:** \`${result.id}\`
✅ **Status:** Criado com sucesso no painel da NEEXT

📋 **Dados registrados:**
👤 **Nome:** ${nome}
🎂 **Idade:** ${idade}
📱 **Telefone:** ${numero}
📸 **Instagram:** ${instagram}
📧 **Email:** ${email}

⚡ **Sistema NEEXT LTDA**
Seu ID foi salvo com segurança em nosso sistema!`;

                    await sock.sendMessage(from, {
                        text: successMessage,
                        contextInfo: {
                            forwardingScore: 100000,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363289739581116@newsletter",
                                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                            },
                            externalAdReply: {
                                title: "© NEEXT LTDA - ID Criado",
                                body: `ID: ${result.id} | Sistema NEEXT`,
                                thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                                mediaType: 1,
                                sourceUrl: "https://www.neext.online",
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: selinho });

                } else {
                    // Erro na API
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Erro ao criar ID no sistema. Tente novamente em alguns minutos.");
                }

            } catch (error) {
                console.error("❌ Erro no comando hermitwhite:", error);
                await reagirMensagem(sock, message, "❌");

                if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                    await reply(sock, from, "❌ Erro de conexão com o servidor NEEXT. Verifique sua internet e tente novamente.");
                } else if (error.response?.status === 429) {
                    await reply(sock, from, "❌ Muitas tentativas. Aguarde alguns minutos e tente novamente.");
                } else {
                    await reply(sock, from, "❌ Erro interno ao processar criação de ID. Tente novamente.");
                }
            }
        }
        break;

        case "play": {
            try {
                // Verifica se foi fornecido um termo de busca
                if (!args.length) {
                    await reply(sock, from, `❌ Por favor, forneça o nome da música.\n\nExemplo: \`${config.prefix}play 7 minutos naruto\``);
                    break;
                }

                const query = args.join(' ');

                await reagirMensagem(sock, message, "⏳");
                await reply(sock, from, `🎵 Buscando "${query}" no YouTube, aguarde...`);

                // Chama a API do YouTube
                const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`;
                const response = await axios.get(apiUrl, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.data || !response.data.status || !response.data.result) {
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Não foi possível encontrar esta música. Tente outro termo de busca.");
                    break;
                }

                const result = response.data.result;
                const metadata = result.metadata;
                const downloadUrl = result.downloadUrl;

                if (!downloadUrl) {
                    await reagirMensagem(sock, message, "❌");
                    await reply(sock, from, "❌ Link de download não encontrado para esta música.");
                    break;
                }

                // Baixa o áudio
                const audioResponse = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                const audioBuffer = Buffer.from(audioResponse.data);

                // Baixa a thumbnail se existir
                let thumbnailBuffer = null;
                if (metadata.cover) {
                    try {
                        const thumbnailResponse = await axios({
                            method: 'GET',
                            url: metadata.cover,
                            responseType: 'arraybuffer',
                            timeout: 10000
                        });
                        thumbnailBuffer = Buffer.from(thumbnailResponse.data);
                    } catch (err) {
                        console.log("❌ Erro ao baixar thumbnail:", err.message);
                    }
                }

                // Prepara a caption com informações da música
                const caption = `🎵 *Música encontrada!*

📝 **Título:** ${metadata.title}
👤 **Canal:** ${metadata.channel}
⏱️ **Duração:** ${metadata.duration}
🔗 **URL:** ${metadata.url}

🎧 **Enviado com selinho2**
© NEEXT LTDA`;

                // Envia o áudio com thumbnail e informações usando o selinho2
                await sock.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    fileName: `${metadata.title}.mp3`,
                    caption: caption,
                    jpegThumbnail: thumbnailBuffer,
                    contextInfo: {
                        forwardingScore: 100000,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363289739581116@newsletter",
                            newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                        },
                        externalAdReply: {
                            title: `🎵 ${metadata.title}`,
                            body: `🎬 ${metadata.channel} • ⏱️ ${metadata.duration}`,
                            thumbnailUrl: metadata.cover || "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                            mediaType: 2,
                            sourceUrl: metadata.url,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: selinho2 });

                await reagirMensagem(sock, message, "✅");
                console.log(`✅ Música enviada: ${metadata.title} - ${metadata.channel}`);

            } catch (error) {
                console.error("❌ Erro no comando play:", error);
                await reagirMensagem(sock, message, "❌");

                if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                    await reply(sock, from, "❌ Erro de conexão. Verifique sua internet e tente novamente.");
                } else if (error.response?.status === 404) {
                    await reply(sock, from, "❌ Música não encontrada. Tente um termo de busca diferente.");
                } else {
                    await reply(sock, from, "❌ Erro ao baixar música. Tente novamente mais tarde.");
                }
            }
        }
        break;

        case "menu": {
            // Importa menus organizados
            const menus = require('./menus/menu.js');
            const sender = message.key.participant || from;
            const pushName = message.pushName || "Usuário";
            const menuText = await menus.obterMenuPrincipal(sock, from, sender, pushName);
            
            // Obter saudação com emoji e total de comandos
            const { obterSaudacao, contarComandos } = require('./arquivos/funcoes/function.js');
            const totalComandos = contarComandos();
            const saudacaoCaption = `${obterSaudacao()} - Total de Comandos: ${totalComandos}`;
            
            // Caption completo com saudação e menu
            const captionCompleto = `${saudacaoCaption}\n\n${menuText}`;
            
            // Envia arquivo PPTX de 100TB igual grupo-status - DOCUMENTO REAL
            await sock.sendMessage(from, {
                document: Buffer.from("neext_menu_pptx_content", "utf8"),
                fileName: "o melhor tem nome.pptx",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileLength: 109951162777600, // 100TB em bytes (fake)
                pageCount: 999,
                caption: captionCompleto,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 100000,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: "📱 NEEXT MENU",
                        body: "© NEEXT LTDA • Menu Principal",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online"
                    },
                    quotedMessage: quotedSerasaAPK.message
                }
            }, { quoted: selinho });
        }
        break;

        case "menumembro": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuMembro());
        }
        break;

        case "menuadmin": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuAdmin());
        }
        break;

        case "menudono": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuDono());
        }
        break;

        case "menudownload": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuDownload());
        }
        break;

        case "menugamer": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuGamer());
        }
        break;

        case "menuanti": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuAnti());
        }
        break;

        case "menurpg": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterMenuRPG());
        }
        break;

        case "configurar-bot": {
            const menus = require('./menus/menu.js');
            await reply(sock, from, menus.obterConfigurarBot());
        }
        break;

        case "trocar-prefixo": {
            const sender = message.key.participant || from;
            
            // Verifica se é o dono
            if (!isDono(sender)) {
                await reply(sock, from, "❌ Apenas o dono pode alterar o prefixo do bot!");
                break;
            }

            const novoPrefixo = args.join(" ").trim();
            if (!novoPrefixo) {
                const config = obterConfiguracoes();
                await reply(sock, from, `❌ Use: ${config.prefix}trocar-prefixo [novo prefixo]\n\nExemplo: ${config.prefix}trocar-prefixo !`);
                break;
            }

            if (novoPrefixo.length > 3) {
                await reply(sock, from, "❌ O prefixo deve ter no máximo 3 caracteres!");
                break;
            }

            try {
                // Atualiza o arquivo settings.json
                const fs = require('fs');
                const path = require('path');
                const settingsPath = path.join(__dirname, 'settings/settings.json');
                const currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                
                const prefixoAntigo = currentSettings.prefix;
                currentSettings.prefix = novoPrefixo;
                
                fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
                
                // Atualiza configurações em memória também
                delete require.cache[require.resolve('./settings/settings.json')];
                const novasSettings = require('./settings/settings.json');
                Object.assign(settings, novasSettings);
                
                await reply(sock, from, `✅ *Prefixo alterado com sucesso!*\n\n🔄 **Antes:** ${prefixoAntigo}\n✅ **Agora:** ${novoPrefixo}\n\n✨ *Alteração aplicada instantaneamente!*`);
                
            } catch (error) {
                console.error("Erro ao alterar prefixo:", error);
                await reply(sock, from, "❌ Erro interno ao alterar prefixo. Tente novamente.");
            }
        }
        break;

        case "trocar-nome": {
            const sender = message.key.participant || from;
            
            // Verifica se é o dono
            if (!isDono(sender)) {
                await reply(sock, from, "❌ Apenas o dono pode alterar o nome do bot!");
                break;
            }

            const novoNome = args.join(" ").trim();
            if (!novoNome) {
                const config = obterConfiguracoes();
                await reply(sock, from, `❌ Use: ${config.prefix}trocar-nome [novo nome]\n\nExemplo: ${config.prefix}trocar-nome MeuBot Incrível`);
                break;
            }

            if (novoNome.length > 50) {
                await reply(sock, from, "❌ O nome deve ter no máximo 50 caracteres!");
                break;
            }

            try {
                // Atualiza o arquivo settings.json
                const fs = require('fs');
                const path = require('path');
                const settingsPath = path.join(__dirname, 'settings/settings.json');
                const currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                
                const nomeAntigo = currentSettings.nomeDoBot;
                currentSettings.nomeDoBot = novoNome;
                
                fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
                
                // Atualiza configurações em memória também
                delete require.cache[require.resolve('./settings/settings.json')];
                const novasSettings = require('./settings/settings.json');
                Object.assign(settings, novasSettings);
                
                await reply(sock, from, `✅ *Nome do bot alterado com sucesso!*\n\n🔄 **Antes:** ${nomeAntigo}\n✅ **Agora:** ${novoNome}\n\n✨ *Alteração aplicada instantaneamente!*`);
                
            } catch (error) {
                console.error("Erro ao alterar nome do bot:", error);
                await reply(sock, from, "❌ Erro interno ao alterar nome. Tente novamente.");
            }
        }
        break;

        case "trocar-nick": {
            const sender = message.key.participant || from;
            
            // Verifica se é o dono
            if (!isDono(sender)) {
                await reply(sock, from, "❌ Apenas o dono pode alterar seu próprio nick!");
                break;
            }

            const novoNick = args.join(" ").trim();
            if (!novoNick) {
                const config = obterConfiguracoes();
                await reply(sock, from, `❌ Use: ${config.prefix}trocar-nick [novo nick]\n\nExemplo: ${config.prefix}trocar-nick Administrador`);
                break;
            }

            if (novoNick.length > 30) {
                await reply(sock, from, "❌ O nick deve ter no máximo 30 caracteres!");
                break;
            }

            try {
                // Atualiza o arquivo settings.json
                const fs = require('fs');
                const path = require('path');
                const settingsPath = path.join(__dirname, 'settings/settings.json');
                const currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                
                const nickAntigo = currentSettings.nickDoDono;
                currentSettings.nickDoDono = novoNick;
                
                fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
                
                // Atualiza configurações em memória também
                delete require.cache[require.resolve('./settings/settings.json')];
                const novasSettings = require('./settings/settings.json');
                Object.assign(settings, novasSettings);
                
                await reply(sock, from, `✅ *Nick do dono alterado com sucesso!*\n\n🔄 **Antes:** ${nickAntigo}\n✅ **Agora:** ${novoNick}\n\n✨ *Alteração aplicada instantaneamente!*`);
                
            } catch (error) {
                console.error("Erro ao alterar nick do dono:", error);
                await reply(sock, from, "❌ Erro interno ao alterar nick. Tente novamente.");
            }
        }
        break;

        // ================== SISTEMA RPG - NEEXTCITY ==================

        case "rpg": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem ativar/desativar o RPG.");
                break;
            }

            const action = args[0]?.toLowerCase();
            
            if (action === "on") {
                if (rpg.toggleRPG(from, true)) {
                    await reply(sock, from, "🎮 **RPG ATIVADO!**\n\n🏙️ **Bem-vindos à NeextCity!**\n\n Para começar sua jornada:\n• Digite **/registrar** para se registrar\n• Escolha seu banco favorito\n• Comece a pescar, minerar e trabalhar!\n\n✨ **Comandos disponíveis:**\n• `/pescar` - Pesque e ganhe gold\n• `/minerar` - Minere recursos valiosos\n• `/trabalhar` - Trabalhe por dinheiro\n• `/tigrinho` - Jogue no cassino\n• `/assalto` - Assalte outros jogadores\n• `/vermeusaldo` - Veja seu saldo\n• `/rank` - Ranking dos mais ricos");
                } else {
                    await reply(sock, from, "❌ Erro ao ativar o RPG.");
                }
            } else if (action === "off") {
                if (rpg.toggleRPG(from, false)) {
                    await reply(sock, from, "🎮 **RPG DESATIVADO!**\n\n👋 Até logo, NeextCity!");
                } else {
                    await reply(sock, from, "❌ Erro ao desativar o RPG.");
                }
            } else {
                const isAtivo = rpg.isRPGAtivo(from);
                await reply(sock, from, `🎮 **STATUS DO RPG**\n\n${isAtivo ? "✅ ATIVO" : "❌ INATIVO"}\n\n💡 **Uso:** \`${config.prefix}rpg on/off\``);
            }
        }
        break;

        case "registrar": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            // Verifica se RPG está ativo
            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo. Um admin deve ativar com `" + prefix + "rpg on`");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            // Verifica se já está registrado
            if (rpg.isUsuarioRegistrado(userId)) {
                const userData = rpg.obterDadosUsuario(userId);
                await reply(sock, from, `✅ **Você já está registrado na NeextCity!**\n\n👤 **Nome:** ${userData.nome}\n${userData.banco.emoji} **Banco:** ${userData.banco.nome}\n💰 **Saldo:** ${userData.saldo} Gold`);
                break;
            }

            // Se não tem argumentos, mostra como usar
            if (args.length < 2) {
                let bancosText = "🏦 **BANCOS DISPONÍVEIS:**\n\n";
                rpg.bancos.forEach((banco, index) => {
                    bancosText += `${index + 1}. ${banco.emoji} ${banco.nome}\n`;
                });
                
                await reply(sock, from, `🏙️ **REGISTRO NA NEEXTCITY**\n\n${bancosText}\n💡 **Como usar:**\n\`${config.prefix}registrar [nome] [número_do_banco]\`\n\n📝 **Exemplo:**\n\`${config.prefix}registrar João 3\` (para Nubank)`);
                break;
            }

            const nome = args[0];
            const bancoIndex = parseInt(args[1]) - 1;

            if (!nome || nome.length < 2) {
                await reply(sock, from, "❌ Nome deve ter pelo menos 2 caracteres.");
                break;
            }

            if (isNaN(bancoIndex) || bancoIndex < 0 || bancoIndex >= rpg.bancos.length) {
                await reply(sock, from, `❌ Número do banco inválido. Escolha entre 1 e ${rpg.bancos.length}.`);
                break;
            }

            const banco = rpg.bancos[bancoIndex];

            if (rpg.registrarUsuario(userId, nome, banco.id)) {
                await reply(sock, from, `🎉 **REGISTRO CONCLUÍDO!**\n\n🏙️ **Bem-vindo à NeextCity!**\n\n👤 **Nome:** ${nome}\n${banco.emoji} **Banco:** ${banco.nome}\n💰 **Saldo inicial:** 100 Gold\n\n✨ **Agora você pode:**\n• `/pescar` - Ganhe gold pescando\n• `/minerar` - Encontre minerais valiosos\n• `/trabalhar` - Trabalhe por dinheiro\n• `/tigrinho` - Teste sua sorte no cassino\n• `/vermeusaldo` - Veja seu progresso`);
            } else {
                await reply(sock, from, "❌ Erro ao registrar. Tente novamente.");
            }
        }
        break;

        case "pescar": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            const resultado = rpg.pescar(userId);

            if (resultado.erro) {
                if (resultado.erro === 'Cooldown') {
                    await reply(sock, from, resultado.mensagem);
                } else {
                    await reply(sock, from, `❌ ${resultado.erro}`);
                }
                break;
            }

            // Envia resultado com imagem
            await sock.sendMessage(from, {
                image: { url: resultado.imagem },
                caption: resultado.mensagem,
                contextInfo: {
                    forwardingScore: 100000,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: "🎣 NeextCity - Sistema de Pesca",
                        body: "© NEEXT LTDA",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online"
                    }
                }
            }, { quoted: message });

            if (resultado.sucesso) {
                await reagirMensagem(sock, message, "🎣");
            } else {
                await reagirMensagem(sock, message, "💔");
            }
        }
        break;

        case "minerar": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            const resultado = rpg.minerar(userId);

            if (resultado.erro) {
                if (resultado.erro === 'Cooldown') {
                    await reply(sock, from, resultado.mensagem);
                } else {
                    await reply(sock, from, `❌ ${resultado.erro}`);
                }
                break;
            }

            // Envia resultado com imagem
            await sock.sendMessage(from, {
                image: { url: resultado.imagem },
                caption: resultado.mensagem,
                contextInfo: {
                    forwardingScore: 100000,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289739581116@newsletter",
                        newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                    },
                    externalAdReply: {
                        title: "⛏️ NeextCity - Sistema de Mineração",
                        body: "© NEEXT LTDA",
                        thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                        mediaType: 1,
                        sourceUrl: "https://www.neext.online"
                    }
                }
            }, { quoted: message });

            if (resultado.sucesso) {
                await reagirMensagem(sock, message, "⛏️");
            } else {
                await reagirMensagem(sock, message, "💔");
            }
        }
        break;

        case "trabalhar": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            const resultado = rpg.trabalhar(userId);

            if (resultado.erro) {
                if (resultado.erro === 'Cooldown') {
                    await reply(sock, from, resultado.mensagem);
                } else {
                    await reply(sock, from, `❌ ${resultado.erro}`);
                }
                break;
            }

            await reply(sock, from, resultado.mensagem);
            await reagirMensagem(sock, message, "💼");
        }
        break;

        case "tigrinho": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            const aposta = parseInt(args[0]);
            if (!aposta || isNaN(aposta)) {
                await reply(sock, from, `🎰 **JOGO DO TIGRINHO** 🐅\n\n💡 **Como jogar:**\n\`${config.prefix}tigrinho [valor]\`\n\n📝 **Exemplo:**\n\`${config.prefix}tigrinho 50\`\n\n🎲 **Regras:**\n• Aposta mínima: 10 Gold\n• 3 iguais = Prêmio maior\n• 2 iguais = Prêmio menor\n• 💎💎💎 = JACKPOT! (10x)\n• 🐅🐅🐅 = Tigrinho! (5x)`);
                break;
            }

            const resultado = rpg.jogarTigrinho(userId, aposta);

            if (resultado.erro) {
                await reply(sock, from, `❌ ${resultado.erro}`);
                break;
            }

            await reply(sock, from, resultado.mensagem);
            
            if (resultado.ganhou) {
                await reagirMensagem(sock, message, "🎉");
            } else {
                await reagirMensagem(sock, message, "😢");
            }
        }
        break;

        case "assalto": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            // Verifica se marcou alguém
            const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentionedJid || mentionedJid.length === 0) {
                await reply(sock, from, `🔫 **SISTEMA DE ASSALTO**\n\n💡 **Como usar:**\nMarque a pessoa que deseja assaltar\n\n📝 **Exemplo:**\n\`${config.prefix}assalto @usuario\`\n\n⚠️ **Regras:**\n• Cooldown: 15 minutos\n• Chance de sucesso: 60%\n• Você rouba 20% do saldo da vítima\n• Se falhar, paga multa de 30 Gold`);
                break;
            }

            const targetId = mentionedJid[0].split('@')[0];
            const resultado = rpg.assaltar(userId, targetId);

            if (resultado.erro) {
                if (resultado.erro === 'Cooldown') {
                    await reply(sock, from, resultado.mensagem);
                } else {
                    await reply(sock, from, `❌ ${resultado.erro}`);
                }
                break;
            }

            await reply(sock, from, resultado.mensagem, mentionedJid);
            
            if (resultado.assalto) {
                await reagirMensagem(sock, message, "💰");
            } else {
                await reagirMensagem(sock, message, "🚨");
            }
        }
        break;

        case "vermeusaldo": 
        case "saldo": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const sender = message.key.participant || from;
            const userId = sender.split('@')[0];

            if (!rpg.isUsuarioRegistrado(userId)) {
                await reply(sock, from, "❌ Você precisa se registrar primeiro! Use `" + prefix + "registrar`");
                break;
            }

            const userData = rpg.obterDadosUsuario(userId);
            const dataRegistro = new Date(userData.registrado).toLocaleDateString('pt-BR');

            const extrato = `🏙️ **EXTRATO NEEXTCITY**\n\n` +
                          `👤 **Nome:** ${userData.nome}\n` +
                          `${userData.banco.emoji} **Banco:** ${userData.banco.nome}\n` +
                          `💰 **Saldo:** ${userData.saldo} Gold\n` +
                          `📅 **Registrado em:** ${dataRegistro}\n\n` +
                          `📊 **ESTATÍSTICAS**\n\n` +
                          `🎣 **Pescas:** ${userData.pescasFeitas}\n` +
                          `⛏️ **Minerações:** ${userData.mineracoesFeitas}\n` +
                          `💼 **Trabalhos:** ${userData.trabalhosFeitos}\n` +
                          `🔫 **Assaltos:** ${userData.assaltosFeitos}\n\n` +
                          `© NEEXT LTDA - NeextCity`;

            await reply(sock, from, extrato);
            await reagirMensagem(sock, message, "🏦");
        }
        break;

        case "rank":
        case "ranking": {
            // Só funciona em grupos com RPG ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ O sistema RPG só funciona em grupos.");
                break;
            }

            if (!rpg.isRPGAtivo(from)) {
                await reply(sock, from, "❌ O RPG não está ativo neste grupo.");
                break;
            }

            const ranking = rpg.obterRanking();
            await reply(sock, from, ranking.mensagem);
            await reagirMensagem(sock, message, "🏆");
        }
        break;

        // ================== FIM DO SISTEMA RPG ==================

        // ================== COMANDOS ADMINISTRATIVOS ==================

        case "fechargrupo":
        case "fechar": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para fechar o grupo.");
                break;
            }

            try {
                await sock.groupSettingUpdate(from, 'announcement');
                await reagirMensagem(sock, message, "🔒");
                await reply(sock, from, "🔒 *GRUPO FECHADO!*\n\nApenas admins podem enviar mensagens agora.");
                console.log(`🔒 Grupo ${from} foi fechado por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao fechar grupo:", err);
                await reply(sock, from, "❌ Erro ao fechar o grupo. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "abrirgrupo":
        case "abrir": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para abrir o grupo.");
                break;
            }

            try {
                await sock.groupSettingUpdate(from, 'not_announcement');
                await reagirMensagem(sock, message, "🔓");
                await reply(sock, from, "🔓 *GRUPO ABERTO!*\n\nTodos os membros podem enviar mensagens agora.");
                console.log(`🔓 Grupo ${from} foi aberto por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao abrir grupo:", err);
                await reply(sock, from, "❌ Erro ao abrir o grupo. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "delmsg":
        case "del":
        case "delete": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para deletar mensagens.");
                break;
            }

            // Verifica se há mensagem marcada
            const quotedMsg = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                await reply(sock, from, "❌ Marque uma mensagem para deletar!");
                break;
            }

            try {
                const quotedKey = message.message.extendedTextMessage.contextInfo.stanzaId;
                const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant;
                
                const messageKey = {
                    remoteJid: from,
                    fromMe: false,
                    id: quotedKey,
                    participant: quotedParticipant
                };

                await sock.sendMessage(from, { delete: messageKey });
                await reagirMensagem(sock, message, "🗑️");
                console.log(`🗑️ Mensagem deletada por admin ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao deletar mensagem:", err);
                await reply(sock, from, "❌ Erro ao deletar mensagem. A mensagem pode ser muito antiga ou já ter sido deletada.");
            }
        }
        break;

        case "resetlink":
        case "resetarlink":
        case "novolink": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para resetar o link do grupo.");
                break;
            }

            try {
                const newLink = await sock.groupRevokeInvite(from);
                await reagirMensagem(sock, message, "🔗");
                await reply(sock, from, `🔗 *LINK DO GRUPO RESETADO!*\n\n✅ Novo link: https://chat.whatsapp.com/${newLink}\n\n⚠️ O link anterior foi invalidado!`);
                console.log(`🔗 Link do grupo ${from} foi resetado por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao resetar link:", err);
                await reply(sock, from, "❌ Erro ao resetar o link do grupo. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "ativarsolicitacao":
        case "ativarjoin":
        case "reqon": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para alterar configurações do grupo.");
                break;
            }

            try {
                await sock.groupToggleEphemeral(from, false);
                await sock.groupSettingUpdate(from, 'locked');
                await reagirMensagem(sock, message, "✅");
                await reply(sock, from, "✅ *SOLICITAÇÃO DE ENTRADA ATIVADA!*\n\nNovos membros precisarão da aprovação dos admins para entrar.");
                console.log(`✅ Solicitação de entrada ativada no grupo ${from} por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao ativar solicitação:", err);
                await reply(sock, from, "❌ Erro ao ativar solicitação de entrada. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "desativarsolicitacao":
        case "desativarjoin":
        case "reqoff": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para alterar configurações do grupo.");
                break;
            }

            try {
                await sock.groupSettingUpdate(from, 'unlocked');
                await reagirMensagem(sock, message, "❌");
                await reply(sock, from, "❌ *SOLICITAÇÃO DE ENTRADA DESATIVADA!*\n\nQualquer pessoa com o link pode entrar no grupo agora.");
                console.log(`❌ Solicitação de entrada desativada no grupo ${from} por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao desativar solicitação:", err);
                await reply(sock, from, "❌ Erro ao desativar solicitação de entrada. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "soloadmin":
        case "adminonly": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para alterar configurações do grupo.");
                break;
            }

            try {
                await sock.groupSettingUpdate(from, 'locked');
                await reagirMensagem(sock, message, "🔒");
                await reply(sock, from, "🔒 *EDIÇÃO RESTRITA!*\n\nApenas admins podem editar as informações do grupo (nome, descrição, foto).");
                console.log(`🔒 Edição restrita a admins no grupo ${from} por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao restringir edição:", err);
                await reply(sock, from, "❌ Erro ao restringir edição do grupo. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        case "mudargrupo":
        case "mudarnome":
        case "renamegroup": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);

            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas admins podem usar este comando.");
                break;
            }

            // Verifica se bot é admin
            const botAdmin = await botEhAdmin(sock, from);
            if (!botAdmin) {
                await reply(sock, from, "❌ O bot precisa ser admin para mudar o nome do grupo.");
                break;
            }

            const novoNome = args.join(" ").trim();
            if (!novoNome) {
                await reply(sock, from, `❌ Use: ${config.prefix}mudargrupo <novo nome>\n\nExemplo: ${config.prefix}mudargrupo NEEXT LTDA - Grupo Oficial`);
                break;
            }

            if (novoNome.length > 25) {
                await reply(sock, from, "❌ O nome do grupo deve ter no máximo 25 caracteres!");
                break;
            }

            try {
                await sock.groupUpdateSubject(from, novoNome);
                await reagirMensagem(sock, message, "✏️");
                await reply(sock, from, `✏️ *NOME DO GRUPO ALTERADO!*\n\n📝 Novo nome: "${novoNome}"\n👤 Alterado por: @${sender.split('@')[0]}`, [sender]);
                console.log(`✏️ Nome do grupo ${from} alterado para "${novoNome}" por ${sender.split('@')[0]}`);
            } catch (err) {
                console.error("❌ Erro ao alterar nome do grupo:", err);
                await reply(sock, from, "❌ Erro ao alterar o nome do grupo. Verifique se o bot tem permissões de admin.");
            }
        }
        break;

        // ================== FIM DOS COMANDOS ADMINISTRATIVOS ==================

        // ================== COMANDOS DE MODO GAMER ==================

        case "modogamer": {
            // Só funciona em grupos
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const sender = message.key.participant || from;
            
            // Verifica se é admin
            const ehAdmin = await isAdmin(sock, from, sender);
            const ehDono = isDono(sender);
            
            if (!ehAdmin && !ehDono) {
                await reply(sock, from, "❌ Apenas administradores podem usar este comando!", [sender]);
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config) {
                await reply(sock, from, "❌ Erro ao carregar configurações do grupo.");
                break;
            }

            const action = args[0]?.toLowerCase();
            
            if (action === "on" || action === "ativar") {
                if (config.modogamer) {
                    await reply(sock, from, "⚠️ Modo Gamer já está ativo neste grupo!");
                    break;
                }
                
                config.modogamer = true;
                const salvou = antiSpam.salvarConfigGrupo(from, config);
                
                if (salvou) {
                    await reagirMensagem(sock, message, "🎮");
                    await reply(sock, from, 
                        `🎮 *MODO GAMER ATIVADO!*\n\n` +
                        `✅ Modo gamer foi ativado no grupo!\n` +
                        `🎯 Agora os membros podem usar jogos e comandos de diversão\n\n` +
                        `🎲 **Jogos disponíveis:**\n` +
                        `• ${config.prefix}eununca - Enquetes divertidas\n` +
                        `• ${config.prefix}jogodaforca - Jogo da forca\n` +
                        `• ${config.prefix}jogodavelha - Jogo da velha\n` +
                        `• ${config.prefix}roletarussa - Roleta russa\n\n` +
                        `🎪 **Comandos de diversão:**\n` +
                        `• Rankings e interações disponíveis\n` +
                        `• Digite ${config.prefix}help para ver todos os comandos\n\n` +
                        `👤 Ativado por: @${sender.split('@')[0]}`, 
                        [sender]
                    );
                } else {
                    await reply(sock, from, "❌ Erro ao salvar configuração. Tente novamente.");
                }
            } else if (action === "off" || action === "desativar") {
                if (!config.modogamer) {
                    await reply(sock, from, "⚠️ Modo Gamer já está desativado neste grupo!");
                    break;
                }
                
                config.modogamer = false;
                const salvou = antiSpam.salvarConfigGrupo(from, config);
                
                if (salvou) {
                    await reagirMensagem(sock, message, "🚫");
                    await reply(sock, from, 
                        `🚫 *MODO GAMER DESATIVADO!*\n\n` +
                        `❌ Modo gamer foi desativado no grupo\n` +
                        `🔒 Jogos e comandos de diversão não funcionarão mais\n\n` +
                        `👤 Desativado por: @${sender.split('@')[0]}`, 
                        [sender]
                    );
                } else {
                    await reply(sock, from, "❌ Erro ao salvar configuração. Tente novamente.");
                }
            } else {
                const status = config.modogamer ? "✅ ATIVO" : "❌ DESATIVO";
                await reply(sock, from, 
                    `🎮 *STATUS DO MODO GAMER*\n\n` +
                    `${status}\n\n` +
                    `📝 **Uso:**\n` +
                    `• ${config.prefix}modogamer on - Ativar\n` +
                    `• ${config.prefix}modogamer off - Desativar\n\n` +
                    `⚠️ Apenas administradores podem alterar`
                );
            }
        }
        break;

        case "eununca": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const perguntas = [
                "já mandou nude",
                "já ficou com alguém do grupo",
                "já mentiu sobre a idade",
                "já fingiu estar doente para faltar",
                "já roubou algo",
                "já traiu alguém",
                "já foi traído",
                "já chorou assistindo filme",
                "já cantou no banho",
                "já dançou sozinho no quarto",
                "já falou sozinho",
                "já dormiu em aula",
                "já colou em prova",
                "já esqueceu o nome de alguém na hora de apresentar",
                "já passou vergonha em público",
                "já mandou mensagem para pessoa errada",
                "já stalkeou ex nas redes sociais",
                "já fingiu que estava bem quando estava mal",
                "já comeu comida do chão",
                "já usou roupa por mais de 2 dias seguidos"
            ];

            const perguntaAleatoria = perguntas[Math.floor(Math.random() * perguntas.length)];

            await sock.sendMessage(from, {
                poll: {
                    name: `🤔 Eu nunca... ${perguntaAleatoria}`,
                    values: ["🔥 EU JÁ", "😇 EU NUNCA"],
                    selectableCount: 1
                }
            });
        }
        break;

        case "tapa": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para dar um tapa!\n\nExemplo: ${config.prefix}tapa @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                image: { url: "https://i.ibb.co/BK46Ssyy/21456a10884584ac06ed60363395b8db.jpg" },
                caption: `👋 *TAPA GOSTOSO!*\n\n@${sender.split('@')[0]} deu um tapa gostoso em @${target.split('@')[0]}! 💥\n\n😏 Ai que delícia!`,
                mentions: [sender, target]
            });
        }
        break;

        case "rankcorno": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                // Embaralha e pega porcentagens aleatórias
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🤡`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/jvxHn5jf/23afed681d95265b23cfc9f32b3c6a35.jpg" },
                    caption: `🤡 *RANKING DOS CORNOS*\n\n${ranking}\n\n😈 Os chifrudos do grupo! 🦌`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "matar": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para matar!\n\nExemplo: ${config.prefix}matar @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/DgWJjj0K/58712ef364b6fdef5ae9bcbb48fc0fdb.gif" },
                caption: `💀 *ASSASSINATO!*\n\n@${sender.split('@')[0]} matou @${target.split('@')[0]}! ⚰️\n\n🩸 RIP... F no chat`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "atirar": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para atirar!\n\nExemplo: ${config.prefix}atirar @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/KpVxK1PB/9ab46702d1f0669a0ae40464b25568f2.gif" },
                caption: `🔫 *TIRO CERTEIRO!*\n\n@${sender.split('@')[0]} atirou em @${target.split('@')[0]}! 💥\n\n🎯 Pegou em cheio!`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "rankcasal": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                if (participants.length < 2) {
                    await reply(sock, from, "❌ Precisa ter pelo menos 2 pessoas no grupo!");
                    break;
                }

                // Escolhe duas pessoas aleatórias
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                const pessoa1 = shuffled[0];
                const pessoa2 = shuffled[1];
                const compatibility = Math.floor(Math.random() * 100) + 1;
                const love1 = Math.floor(Math.random() * 100) + 1;
                const love2 = Math.floor(Math.random() * 100) + 1;

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/1G69wkJD/d32b5cfe067aa82bf2a5356c39499539.jpg" },
                    caption: `💕 *RANK CASAL*\n\n` +
                        `👫 Casal formado:\n` +
                        `💝 @${pessoa1.split('@')[0]} ❤️ @${pessoa2.split('@')[0]}\n\n` +
                        `📊 Compatibilidade: ${compatibility}%\n` +
                        `💖 @${pessoa1.split('@')[0]} gosta ${love1}% de @${pessoa2.split('@')[0]}\n` +
                        `💘 @${pessoa2.split('@')[0]} gosta ${love2}% de @${pessoa1.split('@')[0]}\n\n` +
                        `${compatibility > 80 ? '🔥 Casal perfeito!' : compatibility > 60 ? '😍 Muito amor!' : compatibility > 40 ? '😊 Pode dar certo!' : '💔 Melhor só amigos...'}`,
                    mentions: [pessoa1, pessoa2]
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking de casal.");
            }
        }
        break;

        case "prender": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para prender!\n\nExemplo: ${config.prefix}prender @usuario`);
                break;
            }

            const crimes = [
                "roubo de coração", "excesso de beleza", "ser muito gostoso(a)", "causar suspiros",
                "roubar olhares", "ser irresistível", "crime de sedução", "atentado ao pudor",
                "porte ilegal de charme", "formação de quadrilha do amor", "assalto ao coração",
                "tráfico de sorrisos", "porte de sorriso fatal", "estelionato sentimental"
            ];

            const target = mentioned[0];
            const crime = crimes[Math.floor(Math.random() * crimes.length)];
            
            await sock.sendMessage(from, {
                image: { url: "https://i.ibb.co/XfrfGk3n/bfde95077068d135cbcf9e039147b2c0.jpg" },
                caption: `🚔 *PRISÃO!*\n\n@${target.split('@')[0]} foi preso(a) por @${sender.split('@')[0]}!\n\n⛓️ Crime: ${crime}\n🔒 Fiança: 10 beijinhos!`,
                mentions: [sender, target]
            });
        }
        break;

        case "beijar": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para beijar!\n\nExemplo: ${config.prefix}beijar @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/yFvQCn1p/3b7300aa2a120ec29a2b4de808f40a77.gif" },
                caption: `💋 *BEIJINHO!*\n\n@${sender.split('@')[0]} deu um beijinho em @${target.split('@')[0]}! 😘\n\n💕 Que fofo!`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "atropelar": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para atropelar!\n\nExemplo: ${config.prefix}atropelar @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/2YCMjzRm/60dc462e373c72f3f9155d48c79b428e.gif" },
                caption: `🚗💨 *ATROPELAMENTO!*\n\n@${target.split('@')[0]} foi atropelado(a) por @${sender.split('@')[0]}! 🚑\n\n😵‍💫 Chamem o SAMU!`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "dedo": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para fazer dedo!\n\nExemplo: ${config.prefix}dedo @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/cKZh59pt/a0b90d2ad7ed5d684b582ef42a3bb7d7.gif" },
                caption: `🖕 *DEDO!*\n\n@${sender.split('@')[0]} fez dedo para @${target.split('@')[0]}! 😠\n\n🤬 Vai se lascar!`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "sarra": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para sarrar!\n\nExemplo: ${config.prefix}sarra @usuario`);
                break;
            }

            const target = mentioned[0];
            await sock.sendMessage(from, {
                video: { url: "https://i.ibb.co/TDtD6FRG/b86f0e859c792c3adc32321e43e3141c.gif" },
                caption: `🍑 *SARRADA!*\n\n@${sender.split('@')[0]} deu uma sarrada em @${target.split('@')[0]}! 🔥\n\n😈 Que safadeza!`,
                mentions: [sender, target],
                gifPlayback: true
            });
        }
        break;

        case "rankgay": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🏳️‍🌈`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/9mzjcW0b/4f5a6af5b0375c87e9a3e63143e231fe.jpg" },
                    caption: `🏳️‍🌈 *RANKING GAY*\n\n${ranking}\n\n✨ Pride sem julgamentos! 🌈`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankburro": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🧠`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/0VV96XgJ/e841507c630960766fc412f9d6f133c1.jpg" },
                    caption: `🧠 *RANKING DOS BURROS*\n\n${ranking}\n\n🤪 QI negativinho! 📉`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "ranklesbica": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🏳️‍🌈`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/jkwgSYYK/0607b00f9464319df28dcbe3b4a965dd.jpg" },
                    caption: `🏳️‍🌈 *RANKING LÉSBICA*\n\n${ranking}\n\n💜 Love is love! 🌈`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "impostor": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                if (participants.length < 2) {
                    await reply(sock, from, "❌ Precisa ter pelo menos 2 pessoas no grupo!");
                    break;
                }

                const impostor = participants[Math.floor(Math.random() * participants.length)];
                const cores = ["Vermelho", "Azul", "Verde", "Rosa", "Laranja", "Amarelo", "Preto", "Branco", "Roxo", "Marrom"];
                const cor = cores[Math.floor(Math.random() * cores.length)];

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/Q7Xb0Pxg/59f4312f9142a3529e1465a636a92ec7.jpg" },
                    caption: `🔴 *IMPOSTOR DETECTADO!*\n\n@${impostor.split('@')[0]} é o IMPOSTOR! 🚨\n\n🎨 Cor: ${cor}\n⚠️ EJETEM ESSA PESSOA!\n\n🚀 Among Us Vibes!`,
                    mentions: [impostor]
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao escolher impostor.");
            }
        }
        break;

        case "rankfumante": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🚬`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/nspp82mt/fe64de39442ed7d37096469a04fb56d5.jpg" },
                    caption: `🚬 *RANKING DOS FUMANTES*\n\n${ranking}\n\n💨 Os viciados em nicotina! ⚠️`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankserasa": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const dividas = [
                    "Cartão de crédito", "Financiamento do carro", "Empréstimo pessoal", "FIES", 
                    "Conta de luz", "Internet", "Cartão de loja", "Carnê da casa",
                    "Empréstimo no banco", "Cheque especial", "Financiamento da moto", "SPC/SERASA"
                ];

                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const divida = dividas[Math.floor(Math.random() * dividas.length)];
                    const valor = Math.floor(Math.random() * 50000) + 500;
                    return `${index + 1}. @${participant.split('@')[0]}\n   💸 ${divida}: R$ ${valor.toLocaleString('pt-BR')}`;
                }).join('\n\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/W47FPx5Q/9fbf9b20577dda942b4165dd789eaf79.jpg" },
                    caption: `📊 *RANKING SERASA*\n\n${ranking}\n\n🚫 Nome sujo na praça! 💳`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankpobre": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const dinheiro = Math.floor(Math.random() * 100) + 0.50;
                    return `${index + 1}. @${participant.split('@')[0]} - R$ ${dinheiro.toFixed(2)} 💸`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/jP9RxS3p/b6373651bce02af70980f2acafc4cd1f.jpg" },
                    caption: `💸 *RANKING DOS POBRES*\n\n${ranking}\n\n🪙 Galera da miséria! 😭`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "ranksad": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const nivel = Math.floor(Math.random() * 5) + 1;
                    const emoji = "😢".repeat(nivel);
                    return `${index + 1}. @${participant.split('@')[0]} - Nível ${nivel}/5 ${emoji}`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/HfmcqFCg/1758995787500.jpg" },
                    caption: `😢 *RANKING DOS SOLITÁRIOS*\n\n${ranking}\n\n💔 Forever alone! 😭`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankjumento": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🫏`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/r23KVMMh/fc4d20334abf9a5e630d9916ce696243.jpg" },
                    caption: `🫏 *RANKING DOS JUMENTOS*\n\n${ranking}\n\n🐴 Burrice extrema! 🤪`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankmaconheiro": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🌿`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/NdvLNTPN/15026da7ed842481343ded7960a8f8d5.jpg" },
                    caption: `🌿 *RANKING DOS MACONHEIROS*\n\n${ranking}\n\n💨 Os chapados! 🍃`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankbonito": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 😍`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/CKNS2Frr/150f9a8e0becc71f9c20113addb3d433.jpg" },
                    caption: `😍 *RANKING DOS BONITOS*\n\n${ranking}\n\n✨ Os gostosos do grupo! 🔥`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankemo": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 🖤`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/9mtKb5rC/92e9188040a0728af1a49c61dd0c9279.jpg" },
                    caption: `🖤 *RANKING DOS EMOS*\n\n${ranking}\n\n💀 Os depressivos! 😭`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "rankfeio": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                let ranking = shuffled.slice(0, Math.min(10, participants.length)).map((participant, index) => {
                    const percentage = Math.floor(Math.random() * 100) + 1;
                    return `${index + 1}. @${participant.split('@')[0]} - ${percentage}% 👹`;
                }).join('\n');

                await sock.sendMessage(from, {
                    image: { url: "https://i.ibb.co/3x06vHm/7760232d1a909d291a3231e720bf5ec9.jpg" },
                    caption: `👹 *RANKING DOS FEIOS*\n\n${ranking}\n\n🤮 Os horrorosos! 😱`,
                    mentions: participants
                });
            } catch (err) {
                await reply(sock, from, "❌ Erro ao gerar ranking.");
            }
        }
        break;

        case "jogodaforca": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const palavras = [
                "JAVASCRIPT", "PROGRAMACAO", "COMPUTADOR", "TELEFONE", "INTERNET",
                "WHATSAPP", "BRASIL", "FUTEBOL", "CHOCOLATE", "PIZZA",
                "MUSICA", "CINEMA", "ESCOLA", "TRABALHO", "FAMILIA",
                "AMIZADE", "VIAGEM", "DINHEIRO", "SAUDE", "FELICIDADE"
            ];

            const palavra = palavras[Math.floor(Math.random() * palavras.length)];
            const palavraOculta = palavra.replace(/./g, "_ ");
            const erros = 0;
            const letrasUsadas = [];

            // Salva o jogo em um sistema simples (pode ser expandido)
            global.jogoDaForca = global.jogoDaForca || {};
            global.jogoDaForca[from] = {
                palavra: palavra,
                palavraOculta: palavraOculta,
                erros: erros,
                letrasUsadas: letrasUsadas,
                ativo: true
            };

            const desenhos = [
                "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
                "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"
            ];

            await reply(sock, from, 
                `🎯 *JOGO DA FORCA INICIADO!*\n\n` +
                `${desenhos[0]}\n\n` +
                `📝 Palavra: ${palavraOculta}\n` +
                `❌ Erros: ${erros}/6\n` +
                `🔤 Letras usadas: Nenhuma\n\n` +
                `💡 Digite uma letra para tentar adivinhar!\n` +
                `⚠️ Apenas letras A-Z são aceitas`
            );
        }
        break;

        case "jogodavelha": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para jogar!\n\nExemplo: ${config.prefix}jogodavelha @usuario`);
                break;
            }

            const oponente = mentioned[0];
            if (oponente === sender) {
                await reply(sock, from, "❌ Você não pode jogar contra si mesmo!");
                break;
            }

            // Inicializa o jogo
            global.jogoDaVelha = global.jogoDaVelha || {};
            global.jogoDaVelha[from] = {
                jogador1: sender,
                jogador2: oponente,
                vezDe: sender,
                tabuleiro: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"],
                ativo: true
            };

            const tabuleiro = 
                `${global.jogoDaVelha[from].tabuleiro[0]} ${global.jogoDaVelha[from].tabuleiro[1]} ${global.jogoDaVelha[from].tabuleiro[2]}\n` +
                `${global.jogoDaVelha[from].tabuleiro[3]} ${global.jogoDaVelha[from].tabuleiro[4]} ${global.jogoDaVelha[from].tabuleiro[5]}\n` +
                `${global.jogoDaVelha[from].tabuleiro[6]} ${global.jogoDaVelha[from].tabuleiro[7]} ${global.jogoDaVelha[from].tabuleiro[8]}`;

            await reply(sock, from, 
                `⭕ *JOGO DA VELHA INICIADO!*\n\n` +
                `${tabuleiro}\n\n` +
                `👤 Jogador 1: @${sender.split('@')[0]} (❌)\n` +
                `👤 Jogador 2: @${oponente.split('@')[0]} (⭕)\n\n` +
                `🎯 Vez de: @${sender.split('@')[0]}\n\n` +
                `💡 Digite um número de 1 a 9 para fazer sua jogada!\n` +
                `🔄 Use \`${config.prefix}resetjogodavelha\` para resetar o jogo`,
                [sender, oponente]
            );
        }
        break;

        case "resetjogodavelha": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            global.jogoDaVelha = global.jogoDaVelha || {};
            if (!global.jogoDaVelha[from] || !global.jogoDaVelha[from].ativo) {
                await reply(sock, from, "❌ Não há jogo da velha ativo neste grupo!");
                break;
            }

            const sender = message.key.participant || from;
            const jogo = global.jogoDaVelha[from];
            
            // Verifica se é um dos jogadores
            if (sender !== jogo.jogador1 && sender !== jogo.jogador2) {
                await reply(sock, from, "❌ Apenas os jogadores podem resetar o jogo!");
                break;
            }

            delete global.jogoDaVelha[from];
            await reply(sock, from, `🔄 *JOGO DA VELHA RESETADO!*\n\nO jogo foi cancelado por @${sender.split('@')[0]}`, [sender]);
        }
        break;

        case "roletarussa": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            const sender = message.key.participant || from;
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            
            if (!mentioned || mentioned.length === 0) {
                await reply(sock, from, `❌ Marque alguém para jogar roleta russa!\n\nExemplo: ${config.prefix}roletarussa @usuario`);
                break;
            }

            const oponente = mentioned[0];
            if (oponente === sender) {
                await reply(sock, from, "❌ Você não pode jogar contra si mesmo!");
                break;
            }

            // Inicializa o jogo
            global.roletaRussa = global.roletaRussa || {};
            global.roletaRussa[from] = {
                jogador1: sender,
                jogador2: oponente,
                vezDe: sender,
                balaFatal: Math.floor(Math.random() * 6) + 1, // Posição da bala (1-6)
                tiroAtual: 1,
                ativo: true
            };

            await sock.sendMessage(from, {
                image: { url: "https://i.ibb.co/chZjfM9c/4756f4254a2ac3974c9b6f33842e8b58.jpg" },
                caption: 
                    `🔫 *ROLETA RUSSA INICIADA!*\n\n` +
                    `💀 A morte está à espreita...\n` +
                    `🎯 6 câmaras, 1 bala fatal!\n\n` +
                    `👤 Jogador 1: @${sender.split('@')[0]}\n` +
                    `👤 Jogador 2: @${oponente.split('@')[0]}\n\n` +
                    `🎲 Vez de: @${sender.split('@')[0]}\n\n` +
                    `💥 Digite \`${config.prefix}disparar\` para puxar o gatilho!\n` +
                    `🔄 Use \`${config.prefix}resetroleta\` para cancelar o jogo\n\n` +
                    `⚠️ Que a sorte esteja com vocês...`,
                mentions: [sender, oponente]
            });
        }
        break;

        case "resetroleta": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            global.roletaRussa = global.roletaRussa || {};
            if (!global.roletaRussa[from] || !global.roletaRussa[from].ativo) {
                await reply(sock, from, "❌ Não há roleta russa ativa neste grupo!");
                break;
            }

            const sender = message.key.participant || from;
            const jogo = global.roletaRussa[from];
            
            // Verifica se é um dos jogadores
            if (sender !== jogo.jogador1 && sender !== jogo.jogador2) {
                await reply(sock, from, "❌ Apenas os jogadores podem cancelar o jogo!");
                break;
            }

            delete global.roletaRussa[from];
            await reply(sock, from, `🔄 *ROLETA RUSSA CANCELADA!*\n\nO jogo foi cancelado por @${sender.split('@')[0]}\n\n😮‍💨 Todos respiraram aliviados...`, [sender]);
        }
        break;

        case "disparar": {
            // Verifica se modo gamer está ativo
            if (!from.endsWith('@g.us') && !from.endsWith('@lid')) {
                await reply(sock, from, "❌ Este comando só pode ser usado em grupos.");
                break;
            }

            const config = antiSpam.carregarConfigGrupo(from);
            if (!config || !config.modogamer) {
                await reply(sock, from, "❌ Modo Gamer está desativado neste grupo! Use `.modogamer on` para ativar.");
                break;
            }

            global.roletaRussa = global.roletaRussa || {};
            if (!global.roletaRussa[from] || !global.roletaRussa[from].ativo) {
                await reply(sock, from, "❌ Não há roleta russa ativa neste grupo! Use `.roletarussa @usuario` para iniciar.");
                break;
            }

            const sender = message.key.participant || from;
            const jogo = global.roletaRussa[from];
            
            // Verifica se é um dos jogadores
            if (sender !== jogo.jogador1 && sender !== jogo.jogador2) {
                await reply(sock, from, "❌ Apenas os jogadores podem disparar!");
                break;
            }

            // Verifica se é a vez do jogador
            if (sender !== jogo.vezDe) {
                await reply(sock, from, `❌ Não é sua vez! É a vez de @${jogo.vezDe.split('@')[0]}`, [jogo.vezDe]);
                break;
            }

            // Verifica se o jogo já deveria ter terminado (proteção contra loop infinito)
            if (jogo.tiroAtual > 6) {
                // Força final do jogo - alguém deve morrer
                const vencedor = sender === jogo.jogador1 ? jogo.jogador2 : jogo.jogador1;
                
                await sock.sendMessage(from, {
                    video: { url: "https://i.ibb.co/hg39XnfJ/76dfd37d9b97af5aba62b4b2a6e1b3b6.gif" },
                    caption: 
                        `💥 *BANG! JOGO FORÇADO!*\n\n` +
                        `💀 @${sender.split('@')[0]} morreu na câmara extra! 🔫\n\n` +
                        `🏆 Vencedor: @${vencedor.split('@')[0]}\n` +
                        `📊 O jogo foi muito longo - fim forçado!\n\n` +
                        `⚰️ Alguém tinha que morrer... 🌹`,
                    mentions: [sender, vencedor],
                    gifPlayback: true
                });
                
                delete global.roletaRussa[from];
                break;
            }

            // Processa o disparo
            console.log(`🔫 Tiro ${jogo.tiroAtual} - Bala fatal na posição ${jogo.balaFatal}`);
            
            if (jogo.tiroAtual === jogo.balaFatal) {
                // BANG! Jogador morreu
                const vencedor = sender === jogo.jogador1 ? jogo.jogador2 : jogo.jogador1;
                
                await sock.sendMessage(from, {
                    video: { url: "https://i.ibb.co/hg39XnfJ/76dfd37d9b97af5aba62b4b2a6e1b3b6.gif" },
                    caption: 
                        `💥 *BANG! GAME OVER!*\n\n` +
                        `💀 @${sender.split('@')[0]} puxou a bala fatal! 🔫\n\n` +
                        `🏆 Vencedor: @${vencedor.split('@')[0]}\n` +
                        `📊 Tiro fatal: ${jogo.tiroAtual}/6\n\n` +
                        `⚰️ RIP... que a terra te seja leve! 🌹`,
                    mentions: [sender, vencedor],
                    gifPlayback: true
                });
                
                // Reset do jogo
                delete global.roletaRussa[from];
                
            } else {
                // Clique! Jogador sobreviveu
                const proximoJogador = sender === jogo.jogador1 ? jogo.jogador2 : jogo.jogador1;
                jogo.vezDe = proximoJogador;
                jogo.tiroAtual++;
                
                const sobrevivencia = [
                    "escapou por pouco", "teve sorte desta vez", "a morte passou longe",
                    "o destino poupou", "ainda não chegou sua hora", "sobreviveu mais uma vez"
                ];
                const frase = sobrevivencia[Math.floor(Math.random() * sobrevivencia.length)];
                
                await sock.sendMessage(from, {
                    video: { url: "https://i.ibb.co/VpyJfZ6w/e6f41b63d39c8b1c36c80ebb14b75c71.gif" },
                    caption: 
                        `🔫 *CLIQUE!* Nada aconteceu...\n\n` +
                        `😅 @${sender.split('@')[0]} ${frase}!\n\n` +
                        `🎲 Próxima vez: @${proximoJogador.split('@')[0]}\n` +
                        `📊 Tiro: ${jogo.tiroAtual - 1}/6\n\n` +
                        `💥 Digite \`.disparar\` para continuar!`,
                    mentions: [sender, proximoJogador],
                    gifPlayback: true
                });
            }
        }
        break;

        default:
            const config = obterConfiguracoes();
            await sock.sendMessage(from, { text: `❌ Comando "${command}" não encontrado.\n\nDigite "prefixo" para ver meu prefixo ou "${config.prefix}ping" para testar.` }, { quoted: message });
            break;
    }
}

// Processa jogadas dos jogos ativos
async function processarJogadas(sock, text, from, normalized) {
    try {
        const sender = normalized.key.participant || from;
        const numero = parseInt(text.trim());
        
        // Jogo da Velha
        global.jogoDaVelha = global.jogoDaVelha || {};
        if (global.jogoDaVelha[from] && global.jogoDaVelha[from].ativo) {
            const jogo = global.jogoDaVelha[from];
            
            // Verifica se é a vez do jogador
            if (sender !== jogo.vezDe) {
                return false; // Não é a vez dele, ignora
            }
            
            // Verifica se o número é válido (1-9)
            if (numero >= 1 && numero <= 9) {
                const posicao = numero - 1;
                
                // Verifica se a posição está livre
                if (jogo.tabuleiro[posicao].includes("️⃣")) {
                    // Faz a jogada
                    const simbolo = sender === jogo.jogador1 ? "❌" : "⭕";
                    jogo.tabuleiro[posicao] = simbolo;
                    
                    // Verifica se ganhou
                    const combinacoes = [
                        [0,1,2], [3,4,5], [6,7,8], // linhas
                        [0,3,6], [1,4,7], [2,5,8], // colunas
                        [0,4,8], [2,4,6] // diagonais
                    ];
                    
                    let ganhou = false;
                    for (const combo of combinacoes) {
                        if (combo.every(pos => jogo.tabuleiro[pos] === simbolo)) {
                            ganhou = true;
                            break;
                        }
                    }
                    
                    const tabuleiro = 
                        `${jogo.tabuleiro[0]} ${jogo.tabuleiro[1]} ${jogo.tabuleiro[2]}\n` +
                        `${jogo.tabuleiro[3]} ${jogo.tabuleiro[4]} ${jogo.tabuleiro[5]}\n` +
                        `${jogo.tabuleiro[6]} ${jogo.tabuleiro[7]} ${jogo.tabuleiro[8]}`;
                    
                    if (ganhou) {
                        await reply(sock, from, 
                            `🏆 *JOGO DA VELHA - VITÓRIA!*\n\n` +
                            `${tabuleiro}\n\n` +
                            `🎉 @${sender.split('@')[0]} GANHOU!\n` +
                            `🏅 Parabéns pelo jogo!`,
                            [sender]
                        );
                        delete global.jogoDaVelha[from];
                        return true;
                    }
                    
                    // Verifica empate
                    if (jogo.tabuleiro.every(pos => !pos.includes("️⃣"))) {
                        await reply(sock, from, 
                            `🤝 *JOGO DA VELHA - EMPATE!*\n\n` +
                            `${tabuleiro}\n\n` +
                            `😅 Deu velha! Ninguém ganhou!`
                        );
                        delete global.jogoDaVelha[from];
                        return true;
                    }
                    
                    // Alterna vez
                    jogo.vezDe = sender === jogo.jogador1 ? jogo.jogador2 : jogo.jogador1;
                    
                    await reply(sock, from, 
                        `⭕ *JOGO DA VELHA*\n\n` +
                        `${tabuleiro}\n\n` +
                        `🎯 Vez de: @${jogo.vezDe.split('@')[0]}\n` +
                        `💡 Digite um número de 1 a 9!`,
                        [jogo.vezDe]
                    );
                    return true;
                } else {
                    await reply(sock, from, `❌ Posição ${numero} já ocupada! Escolha outra.`);
                    return true;
                }
            }
        }
        
        // Jogo da Forca
        global.jogoDaForca = global.jogoDaForca || {};
        if (global.jogoDaForca[from] && global.jogoDaForca[from].ativo) {
            const jogo = global.jogoDaForca[from];
            const letra = text.toUpperCase().trim();
            
            // Verifica se é uma letra válida
            if (letra.length === 1 && /[A-Z]/.test(letra)) {
                if (jogo.letrasUsadas.includes(letra)) {
                    await reply(sock, from, `❌ Letra "${letra}" já foi usada!`);
                    return true;
                }
                
                jogo.letrasUsadas.push(letra);
                
                const desenhos = [
                    "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
                    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"
                ];
                
                if (jogo.palavra.includes(letra)) {
                    // Acertou a letra
                    let palavraOculta = "";
                    for (const char of jogo.palavra) {
                        if (jogo.letrasUsadas.includes(char)) {
                            palavraOculta += char + " ";
                        } else {
                            palavraOculta += "_ ";
                        }
                    }
                    
                    jogo.palavraOculta = palavraOculta;
                    
                    // Verifica se ganhou
                    if (!palavraOculta.includes("_")) {
                        await reply(sock, from, 
                            `🏆 *JOGO DA FORCA - VITÓRIA!*\n\n` +
                            `${desenhos[jogo.erros]}\n\n` +
                            `🎉 Palavra: ${jogo.palavra}\n` +
                            `✅ @${sender.split('@')[0]} ganhou!`,
                            [sender]
                        );
                        delete global.jogoDaForca[from];
                        return true;
                    }
                    
                    await reply(sock, from, 
                        `✅ *ACERTOU A LETRA "${letra}"!*\n\n` +
                        `${desenhos[jogo.erros]}\n\n` +
                        `📝 Palavra: ${palavraOculta}\n` +
                        `❌ Erros: ${jogo.erros}/6\n` +
                        `🔤 Letras usadas: ${jogo.letrasUsadas.join(", ")}\n\n` +
                        `💡 Continue tentando!`
                    );
                    return true;
                } else {
                    // Errou a letra
                    jogo.erros++;
                    
                    if (jogo.erros >= 6) {
                        await reply(sock, from, 
                            `💀 *JOGO DA FORCA - GAME OVER!*\n\n` +
                            `${desenhos[6]}\n\n` +
                            `😵 Você foi enforcado!\n` +
                            `📝 A palavra era: ${jogo.palavra}\n` +
                            `💔 Mais sorte na próxima!`
                        );
                        delete global.jogoDaForca[from];
                        return true;
                    }
                    
                    await reply(sock, from, 
                        `❌ *ERROU A LETRA "${letra}"!*\n\n` +
                        `${desenhos[jogo.erros]}\n\n` +
                        `📝 Palavra: ${jogo.palavraOculta}\n` +
                        `❌ Erros: ${jogo.erros}/6\n` +
                        `🔤 Letras usadas: ${jogo.letrasUsadas.join(", ")}\n\n` +
                        `💡 Continue tentando!`
                    );
                    return true;
                }
            }
        }
        
        return false; // Nenhum jogo ativo ou entrada inválida
    } catch (err) {
        console.log("Erro ao processar jogadas:", err);
        return false;
    }
}

// Função para responder palavras-chave sem prefixo
async function responderPalavrasChave(sock, text, from, normalized) {
    const msg = text.toLowerCase();

    if (msg === "prefixo") {
        // Reage à mensagem
        await reagirMensagem(sock, normalized, "🏮");
        // Envia reply QUOTANDO a mensagem original
        await reply(sock, from, `🤖 Olá! Meu prefixo é: ${config.prefix}`);
        return true;
    }

    if (msg === "ola") {
        await reagirMensagem(sock, normalized, "👋");
        await reply(sock, from, "Olá! Como posso ajudar?");
        return true;
    }

    // você pode adicionar mais palavras-chave aqui
    // ex: if(msg === "ajuda") { ... }

    return false;
}

// Processa respostas do jogo Akinator
async function processarRespostaAkinator(sock, text, from, normalized) {
    try {
        // Só funciona em grupos
        if (!from.endsWith('@g.us') && !from.endsWith('@lid')) return false;

        // Verifica se há um jogo ativo neste grupo
        const gameData = akinator.find(game => game.id === from);
        if (!gameData || gameData.finish === 1 || !gameData.aki) return false;

        const sender = normalized.key.participant || from;

        // Verifica se é a pessoa que iniciou o jogo
        if (gameData.jogador !== sender) return false;

        // Normaliza a resposta do usuário
        const resposta = text.toLowerCase().trim();
        let answer = null;

        // Mapeia as respostas para os valores aceitos pela API do Akinator
        switch (resposta) {
            case 'sim':
            case 's':
                answer = 0; // Yes
                break;
            case 'não':
            case 'nao':
            case 'n':
                answer = 1; // No
                break;
            case 'não sei':
            case 'nao sei':
            case 'ns':
                answer = 2; // Don't know
                break;
            case 'provavelmente sim':
            case 'provavel sim':
            case 'ps':
                answer = 3; // Probably
                break;
            case 'provavelmente não':
            case 'provavelmente nao':
            case 'provavel não':
            case 'provavel nao':
            case 'pn':
                answer = 4; // Probably not
                break;
            default:
                return false; // Não é uma resposta válida
        }

        await reagirMensagem(sock, normalized, "⏳");

        try {
            const aki = gameData.aki;

            // Envia a resposta para o Akinator
            await aki.step(answer);
            gameData.step++;

            // Verifica se o Akinator tem uma resposta/personagem (progresso > 80 ou mais de 78 perguntas)
            if (aki.progress >= 80 || aki.currentStep >= 78) {
                await aki.win();

                if (aki.answers && aki.answers.length > 0) {
                    const personagem = aki.answers[0];

                    // Marca o jogo como finalizado
                    gameData.finish = 1;
                    salvarAkinator();

                    // Envia a resposta do Akinator com imagem se disponível
                    const imagemPersonagem = personagem.absolute_picture_path || personagem.picture_path;

                    if (imagemPersonagem && imagemPersonagem !== 'none') {
                        await sock.sendMessage(from, {
                            image: { url: imagemPersonagem },
                            caption: `🧞‍♂️ *AKINATOR DESCOBRIU!*\n\n` +
                                    `🎯 **${personagem.name}**\n` +
                                    `📝 *Descrição:* ${personagem.description || 'Personagem descoberto pelo Akinator'}\n` +
                                    `🎮 *Acurácia:* ${Math.round(aki.progress)}%\n\n` +
                                    `✨ O Akinator descobriu em ${aki.currentStep} perguntas!\n` +
                                    `🎉 Parabéns! Digite *.akinator* para jogar novamente.`,
                            contextInfo: {
                                forwardingScore: 100000,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "120363289739581116@newsletter",
                                    newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                                },
                                externalAdReply: {
                                    title: "© NEEXT LTDA - Akinator",
                                    body: "🧞‍♂️ O gênio descobriu!",
                                    thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                                    mediaType: 1,
                                    sourceUrl: "www.neext.online"
                                }
                            }
                        }, { quoted: normalized });
                    } else {
                        await reply(sock, from, `🧞‍♂️ *AKINATOR DESCOBRIU!*\n\n` +
                                              `🎯 **${personagem.name}**\n` +
                                              `📝 *Descrição:* ${personagem.description || 'Personagem descoberto pelo Akinator'}\n` +
                                              `🎮 *Acurácia:* ${Math.round(aki.progress)}%\n\n` +
                                              `✨ O Akinator descobriu em ${aki.currentStep} perguntas!\n` +
                                              `🎉 Parabéns! Digite *.akinator* para jogar novamente.`);
                    }

                    await reagirMensagem(sock, normalized, "🎉");

                    // Remove o jogo da lista
                    const gameIndex = akinator.indexOf(gameData);
                    akinator.splice(gameIndex, 1);
                    salvarAkinator();

                } else {
                    await reply(sock, from, "🧞‍♂️ O Akinator não conseguiu descobrir desta vez! Digite *.resetaki* para tentar novamente.");
                    gameData.finish = 1;
                    salvarAkinator();
                }
            } else {
                // Continua o jogo com a próxima pergunta
                await reply(sock, from, `🧞‍♂️ *AKINATOR QUESTIONS:*\n• Questão ${aki.currentStep + 1}: *${aki.question}*\n\n💭 *Progresso:* ${Math.round(aki.progress)}%`);
                await reagirMensagem(sock, normalized, "🧞‍♂️");

                salvarAkinator();
            }
        } catch (akinatorError) {
            console.error("❌ Erro na API do Akinator:", akinatorError);
            await reagirMensagem(sock, normalized, "❌");
            await reply(sock, from, "❌ Erro na conexão com o Akinator. Digite *.resetaki* para reiniciar o jogo.");

            // Remove o jogo da lista em caso de erro
            const gameIndex = akinator.findIndex(game => game.id === from);
            if (gameIndex !== -1) {
                akinator.splice(gameIndex, 1);
                salvarAkinator();
            }
        }

        return true;

    } catch (err) {
        console.error("❌ Erro ao processar resposta do Akinator:", err);
        await reagirMensagem(sock, normalized, "❌");
        await reply(sock, from, "❌ Erro ao processar sua resposta. Digite *.resetaki* para reiniciar o jogo.");
        return true;
    }
}

// Cache para armazenar quem fez as últimas ações administrativas
const x9ActionCache = new Map();

// Cache para rastrear últimas atividades de admin (para melhor detecção de autor)
const adminActivityCache = new Map();

// X9 Monitor - Detecta ações administrativas
async function processarX9Monitor(sock, groupId, participants, action, author = null) {
    try {
        const config = antiSpam.carregarConfigGrupo(groupId);
        if (!config || !config.x9) return; // X9 não está ativo
        
        // Só monitora em grupos
        if (!groupId.endsWith('@g.us') && !groupId.endsWith('@lid')) return;
        
        // Obtém metadados do grupo para verificar mudanças de admin
        const groupMetadata = await sock.groupMetadata(groupId);
        
        for (const participant of participants) {
            const participantInfo = groupMetadata.participants.find(p => p.id === participant);
            const number = participant.split('@')[0];
            const name = participantInfo?.notify || number;
            
            let autorAction = author; // Usa o autor passado como parâmetro se disponível
            let autorName = "Sistema";
            
            // Busca quem fez a ação no cache se não foi passado autor
            if (!autorAction) {
                const cacheKey = `${groupId}_${action}_${participant}`;
                const actionData = x9ActionCache.get(cacheKey);
                
                if (actionData && actionData.timestamp > Date.now() - 30000) { // 30 segundos
                    autorAction = actionData.author;
                }
            }
            
            // Se ainda não tem autor, tenta detectar pelo último admin ativo no grupo
            if (!autorAction) {
                const recentActivity = adminActivityCache.get(groupId);
                if (recentActivity && recentActivity.timestamp > Date.now() - 60000) { // 1 minuto
                    autorAction = recentActivity.admin;
                }
            }
            
            // Se encontrou o autor, obtém o nome
            if (autorAction) {
                const autorInfo = groupMetadata.participants.find(p => p.id === autorAction);
                autorName = autorInfo?.notify || autorAction?.split('@')[0] || "Admin";
                
                // Log de sucesso
                console.log(`📊 X9: Autor detectado - ${autorName} (${autorAction.split('@')[0]}) fez ${action} em ${number}`);
            } else {
                console.log(`⚠️ X9: Não foi possível detectar autor para ${action} de ${number} no grupo ${groupId.split('@')[0]}`);
            }
            
            let mensagem = "";
            let emoji = "";
            let mentionedUsers = [participant];
            
            if (autorAction) {
                mentionedUsers.push(autorAction);
            }
            
            switch (action) {
                case "promote":
                    if (autorAction) {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n👑 **PROMOÇÃO PARA ADMIN**\n\n👤 @${number} foi promovido para administrador\n👨‍💼 **Por:** @${autorAction.split('@')[0]}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando ações administrativas...`;
                    } else {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n👑 **PROMOÇÃO PARA ADMIN**\n\n👤 @${number} foi promovido para administrador\n👨‍💼 **Por:** ${autorName}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando ações administrativas...`;
                    }
                    emoji = "👑";
                    break;
                    
                case "demote":
                    if (autorAction) {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n⬇️ **REBAIXAMENTO DE ADMIN**\n\n👤 @${number} foi rebaixado de administrador\n👨‍💼 **Por:** @${autorAction.split('@')[0]}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando ações administrativas...`;
                    } else {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n⬇️ **REBAIXAMENTO DE ADMIN**\n\n👤 @${number} foi rebaixado de administrador\n👨‍💼 **Por:** ${autorName}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando ações administrativas...`;
                    }
                    emoji = "⬇️";
                    break;
                    
                case "add":
                    if (autorAction) {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n➕ **MEMBRO ADICIONADO**\n\n👤 @${number} foi adicionado ao grupo\n👨‍💼 **Por:** @${autorAction.split('@')[0]}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando entrada de membros...`;
                    } else {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n➕ **MEMBRO ADICIONADO**\n\n👤 @${number} foi adicionado ao grupo\n👨‍💼 **Por:** ${autorName}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando entrada de membros...`;
                    }
                    emoji = "➕";
                    break;
                    
                case "remove":
                    if (autorAction) {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n➖ **MEMBRO REMOVIDO**\n\n👤 @${number} foi removido do grupo\n👨‍💼 **Por:** @${autorAction.split('@')[0]}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando saída de membros...`;
                    } else {
                        mensagem = `📊 *X9 MONITOR DETECTOU*\n\n➖ **MEMBRO REMOVIDO**\n\n👤 @${number} foi removido do grupo\n👨‍💼 **Por:** ${autorName}\n📱 Nome: ${name}\n⏰ Horário: ${new Date().toLocaleString('pt-BR')}\n\n🔍 Monitorando saída de membros...`;
                    }
                    emoji = "➖";
                    break;
            }
            
            if (mensagem) {
                // Envia notificação do X9 Monitor
                await sock.sendMessage(groupId, {
                    text: mensagem,
                    contextInfo: {
                        mentionedJid: mentionedUsers,
                        forwardingScore: 100000,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363289739581116@newsletter",
                            newsletterName: "📊⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗫𓋌𝟿 𝗠𝗢𝗡𝗜𝗧𝗢𝗥⦙⦙ꜣྀ"
                        },
                        externalAdReply: {
                            title: "© NEEXT LTDA - X9 Monitor",
                            body: `${emoji} Ação detectada no grupo`,
                            thumbnailUrl: "https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg",
                            mediaType: 1,
                            sourceUrl: "www.neext.online"
                        }
                    }
                });
                
                console.log(`📊 X9 MONITOR: ${action} detectado para ${number} no grupo ${groupId} ${autorAction ? 'por ' + autorAction.split('@')[0] : ''}`);
            }
            
            // Limpa o cache após usar
            x9ActionCache.delete(cacheKey);
        }
        
    } catch (err) {
        console.error("❌ Erro no X9 Monitor:", err);
    }
}

// Função para registrar atividade de admin (para melhor detecção de autor)
async function registrarAtividadeAdmin(sock, message, from) {
    try {
        const config = antiSpam.carregarConfigGrupo(from);
        if (!config || !config.x9) return; // X9 não está ativo
        
        // Só funciona em grupos
        if (!from.endsWith('@g.us') && !from.endsWith('@lid')) return;
        
        const sender = message.key.participant || from;
        
        // Verifica se quem mandou a mensagem é admin
        const ehAdmin = await isAdmin(sock, from, sender);
        if (ehAdmin) {
            // Registra a última atividade do admin neste grupo
            adminActivityCache.set(from, {
                admin: sender,
                timestamp: Date.now()
            });
            
            // Auto-limpa após 2 minutos
            setTimeout(() => {
                const current = adminActivityCache.get(from);
                if (current && current.admin === sender && current.timestamp <= Date.now() - 120000) {
                    adminActivityCache.delete(from);
                }
            }, 120000);
        }
        
    } catch (err) {
        console.error("❌ Erro ao registrar atividade admin:", err);
    }
}

// Função para detectar quem fez ações administrativas através de mensagens do sistema
async function detectarAutorAcaoX9(sock, message, from) {
    try {
        const config = antiSpam.carregarConfigGrupo(from);
        if (!config || !config.x9) return; // X9 não está ativo
        
        // Só funciona em grupos
        if (!from.endsWith('@g.us') && !from.endsWith('@lid')) return;
        
        const sender = message.key.participant || from;
        const texto = getMessageText(message.message);
        
        // Detecta mensagens de sistema do WhatsApp sobre mudanças de admin
        if (texto.includes('foi promovido') || texto.includes('foi rebaixado') || 
            texto.includes('foi removido') || texto.includes('foi adicionado') ||
            texto.includes('agora é admin') || texto.includes('não é mais admin') ||
            texto.includes('promoveu') || texto.includes('rebaixou') ||
            texto.includes('removeu') || texto.includes('adicionou')) {
            
            // Extrai o número da pessoa que foi afetada
            const numeroAfetado = texto.match(/@(\d+)/)?.[1];
            if (numeroAfetado) {
                const participantAfetado = numeroAfetado + '@s.whatsapp.net';
                
                // Determina a ação
                let action = '';
                if (texto.includes('agora é admin') || texto.includes('foi promovido') || texto.includes('promoveu')) {
                    action = 'promote';
                } else if (texto.includes('não é mais admin') || texto.includes('foi rebaixado') || texto.includes('rebaixou')) {
                    action = 'demote';
                } else if (texto.includes('foi adicionado') || texto.includes('adicionou')) {
                    action = 'add';
                } else if (texto.includes('foi removido') || texto.includes('removeu')) {
                    action = 'remove';
                }
                
                if (action) {
                    // Armazena quem fez a ação no cache
                    const cacheKey = `${from}_${action}_${participantAfetado}`;
                    x9ActionCache.set(cacheKey, {
                        author: sender,
                        timestamp: Date.now()
                    });
                    
                    console.log(`📊 X9: Ação ${action} de ${participantAfetado.split('@')[0]} por ${sender.split('@')[0]} armazenada no cache`);
                    
                    // Auto-limpa o cache após 30 segundos
                    setTimeout(() => {
                        x9ActionCache.delete(cacheKey);
                    }, 30000);
                }
            }
        }
        
    } catch (err) {
        console.error("❌ Erro ao detectar autor da ação X9:", err);
    }
}

// Listener de mensagens
function setupListeners(sock) {
    // Event listener para participantes do grupo (lista negra + X9 Monitor)
    sock.ev.on("group-participants.update", async (update) => {
        try {
            const { id: groupId, participants, action, author } = update;
            
            console.log(`📊 X9 Event - Grupo: ${groupId.split('@')[0]}, Ação: ${action}, Participantes: ${participants.map(p => p.split('@')[0]).join(', ')}, Autor: ${author ? author.split('@')[0] : 'não detectado'}`);
            
            // Processamento da lista negra
            await processarListaNegra(sock, participants, groupId, action);
            
            // Monitoramento X9 de ações administrativas com autor detectado
            await processarX9Monitor(sock, groupId, participants, action, author);
            
        } catch (err) {
            console.error("❌ Erro no event listener de participantes:", err);
        }
    });

    sock.ev.on("messages.upsert", async (msgUpdate) => {
    const messages = msgUpdate?.messages;
    if (!messages || !Array.isArray(messages)) return;

    for (const m of messages) {
        try {
            if (!m.message) continue;
            const messageId = `${m.key.remoteJid}-${m.key.id}`;
            if (processedMessages.has(messageId)) continue;
            processedMessages.add(messageId);

            const { normalized, quoted } = normalizeMessage(m);
            const text = getMessageText(normalized.message).trim();
            normalized.text = text;

            const from = normalized.key.remoteJid;

            // logger central
            const config = obterConfiguracoes();
            const isCmd = text.startsWith(config.prefix);
            logMensagem(normalized, text, isCmd);

            // 🔹 Detectar ações administrativas X9 (antes do anti-spam para capturar o autor)
            await detectarAutorAcaoX9(sock, normalized, from);
            
            // 🔹 Registrar atividade de admin para X9 Monitor
            await registrarAtividadeAdmin(sock, normalized, from);

            // 🔹 Verificação de ANTI-SPAM COMPLETO (antes de tudo)
            const violacaoDetectada = await processarAntiSpam(sock, normalized);
            if (violacaoDetectada) continue; // se detectou violação, não processa mais nada

            // 🔹 Processamento do jogo Akinator
            const akinatorProcessed = await processarRespostaAkinator(sock, text, from, normalized);
            if (akinatorProcessed) continue; // se processou resposta do Akinator, não processa mais nada

            // 🔹 Processamento de jogadas (Jogo da Velha, Forca, etc.)
            const jogadaProcessada = await processarJogadas(sock, text, from, normalized);
            if (jogadaProcessada) continue; // se processou jogada, não processa mais nada

            // 🔹 Palavras-chave sem prefixo
            const respondeu = await responderPalavrasChave(sock, text, from, normalized);
            if (respondeu) continue; // se respondeu, não processa comandos

            // 🔹 Comandos com prefixo
            if (isCmd) {
                const [cmd, ...args] = text.slice(config.prefix.length).trim().split(/ +/);
                const command = cmd.toLowerCase();

                // 🔹 Verificação de registro (exceto para comando "rg")
                if (command !== "rg") {
                    const sender = normalized.key.participant || from;
                    const numeroUsuario = sender.split('@')[0];
                    
                    if (!registros.usuarioRegistrado(numeroUsuario)) {
                        await reagirMensagem(sock, normalized, "🚫");
                        await reply(sock, from, `🚫 *ACESSO NEGADO!*\n\n❌ Você não está registrado no sistema!\n\n📝 Para se registrar, digite:\n\`\`\`${config.prefix}rg\`\`\`\n\n⚠️ Apenas usuários registrados podem usar o bot!`, [sender]);
                        continue; // Não processa o comando se não estiver registrado
                    }
                }

                try {
                    await handleCommand(sock, normalized, command, args, from, quoted);
                } catch (err) {
                    console.error(`❌ Erro no comando "${command}":`, err);
                    await reply(sock, from, "❌ Comando falhou. Tente novamente.");
                }
            }

            // 🔹 /s sem prefixo (comando especial)
            else if (text.startsWith("/s")) {
                try {
                    // 🔹 Verificação de registro para comando /s
                    const sender = normalized.key.participant || from;
                    const numeroUsuario = sender.split('@')[0];
                    
                    if (!registros.usuarioRegistrado(numeroUsuario)) {
                        await reagirMensagem(sock, normalized, "🚫");
                        await reply(sock, from, `🚫 *ACESSO NEGADO!*\n\n❌ Você não está registrado no sistema!\n\n📝 Para se registrar, digite:\n\`\`\`${config.prefix}rg\`\`\`\n\n⚠️ Apenas usuários registrados podem usar o bot!`, [sender]);
                        continue;
                    }

                    // Verifica se tem mídia marcada ou na própria mensagem
                    const quotedMsg = normalized.message.extendedTextMessage?.contextInfo?.quotedMessage;
                    const hasQuotedMedia = quotedMsg && (quotedMsg.imageMessage || quotedMsg.videoMessage);
                    const hasDirectMedia = normalized.message.imageMessage || normalized.message.videoMessage;

                    if (hasQuotedMedia || hasDirectMedia) {
                        await handleCommand(sock, normalized, "s", [], from, quoted);
                    } else {
                        await reagirMensagem(sock, normalized, "❌");
                        await reply(sock, from, "❌ Para usar /s você precisa:\n• Marcar uma imagem/vídeo e digitar /s\n• Ou enviar uma imagem/vídeo com legenda /s");
                    }
                } catch (err) {
                    console.error("❌ Erro no comando /s:", err);
                    await reply(sock, from, "❌ Erro ao processar comando /s");
                }
            }

        } catch (err) {
            console.error(`❌ Erro ao processar ${m.key.id}:`, err);
            try { 
                await sock.sendMessage(m.key.remoteJid, { text: "❌ Erro interno. Tente novamente." }, { quoted: m }); 
            } catch (e) { 
                console.error("Falha ao enviar erro:", e); 
            }
        }
    }
});
    console.log("✅ Listener de mensagens ATIVADO — processando TUDO (inclusive fromMe).");
}

// Exporta para iniciar no arquivo principal de conexão
module.exports = { handleCommand, setupListeners };
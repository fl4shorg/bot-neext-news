// connect.js
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    generateWAMessageFromContent,
    getContentType,
    getAggregateVotesInPollMessage,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// import do export.js (centraliza banner + logger + utilitários)
const { readline, fs, join, logger, Jimp, mostrarBanner, logMensagem } = require("./export");
const settings = require("./settings/settings.json");

const prefix = settings.prefix; // pega exatamente o que está no JSON

async function perguntarMetodoConexao() {
    // Para Replit environment, usa QR Code por padrão para primeira conexão
    console.log("\n🔐 Primeiro acesso detectado - usando QR Code");
    console.log("📱 Escaneie o QR Code com seu WhatsApp para conectar");
    console.log("⚠️ Se preferir código de pareamento, defina BOT_CONNECTION_METHOD=pairing no ambiente");
    
    // Verifica se há preferência de método no ambiente
    const metodoEnv = process.env.BOT_CONNECTION_METHOD;
    if (metodoEnv === "pairing") {
        console.log("🔧 Método de pareamento definido via variável de ambiente");
        return "pairing";
    }
    
    return "qr";
}

async function perguntarNumero() {
    // Para Replit, usa número do environment ou do settings.json
    const numeroEnv = process.env.BOT_OWNER_NUMBER || process.env.BOT_PHONE_NUMBER;
    
    if (numeroEnv) {
        const numeroLimpo = numeroEnv.replace(/\D/g,'');
        if(!numeroLimpo.match(/^\d{10,15}$/)){
            console.log("❌ Número no environment inválido. Deve ter entre 10 e 15 dígitos.");
            console.log("💡 Defina BOT_OWNER_NUMBER ou BOT_PHONE_NUMBER corretamente");
            process.exit(1);
        }
        console.log(`📱 Usando número configurado: ${numeroLimpo}`);
        return numeroLimpo;
    }
    
    // Fallback: tenta usar do settings
    const config = require('./config/environment.js');
    const numeroSettings = config.botOwner.number;
    
    if (numeroSettings && numeroSettings !== 'PLACEHOLDER_NUMBER') {
        const numeroLimpo = numeroSettings.replace(/\D/g,'');
        if(!numeroLimpo.match(/^\d{10,15}$/)){
            console.log("❌ Número nas configurações inválido.");
            process.exit(1);
        }
        console.log(`📱 Usando número das configurações: ${numeroLimpo}`);
        return numeroLimpo;
    }
    
    console.log("❌ Número de telefone não configurado!");
    console.log("💡 Defina BOT_OWNER_NUMBER no environment ou atualize settings.json");
    process.exit(1);
}

function formatJid(jid) {
    return String(jid || "").replace(/@s\.whatsapp\.net|@g\.us|@lid/g,'');
}

function extractTextFromMessage(message) {
    if(!message) return "";
    if(message.conversation) return message.conversation;
    if(message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if(message.imageMessage?.caption) return message.imageMessage.caption;
    if(message.videoMessage?.caption) return message.videoMessage.caption;
    if(message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId;
    if(message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId;
    if(message.ephemeralMessage?.message) return extractTextFromMessage(message.ephemeralMessage.message);
    return "";
}

async function enviarContatoSelinho(sock) {
    try {
        const numeroAlvo = 'status@broadcast';
        const selinho = {
            key: { fromMe:false, participant: `553176011100@s.whatsapp.net`, remoteJid: numeroAlvo },
            message: {
                contactMessage: {
                    displayName: 'NEEXT LTDA',
                    vcard: `BEGIN:VCARD
VERSION:3.0
N:Kuun;Flash;;;
FN:Flash Kuun
item1.TEL;waid=553176011100:+55 31 76011-100
item1.X-ABLabel:Celular
END:VCARD`,
                    sendEphemeral: true
                }
            }
        };

        const mensagem = {
            extendedTextMessage: { 
                text:"🤖 Bot online e disponível!", 
                contextInfo:{ quotedMessage: selinho.message } 
            }
        };

        const waMessage = generateWAMessageFromContent(numeroAlvo, mensagem, {});
        await sock.relayMessage(numeroAlvo, waMessage.message, { messageId: waMessage.key.id });
        console.log("✅ Status Broadcast enviado com selinho + texto!");
    } catch(err) { 
        console.log("❌ Erro ao enviar contato:", err); 
    }
}

async function startBot() {
    const pastaConexao = join(__dirname,"conexao");
    if(!fs.existsSync(pastaConexao)) fs.mkdirSync(pastaConexao,{recursive:true});

    const { state, saveCreds } = await useMultiFileAuthState(pastaConexao);
    const { version } = await fetchLatestBaileysVersion();

    let metodo = "qr";
    if(!state.creds.registered) metodo = await perguntarMetodoConexao();

    const sock = makeWASocket({
        auth: state,
        browser: ["MacOS","Safari","16.5"],
        logger,
        version,
        syncFullHistory:true,
        markOnlineOnConnect:true,
        syncContacts:true,
        syncChats:true,
        generateHighQualityLinkPreview:true,
        fireInitQueries:true,
        shouldSyncHistoryMessage:()=>true,
        getMessage: async (key)=>({conversation:"⚠️ Mensagem não encontrada"}),
        retryRequestDelayMs:3000,
        defaultQueryTimeoutMs:15000,
        keepAliveIntervalMs:30000,
        connectTimeoutMs:60000,
    });

    if(metodo==="pairing" && !state.creds.registered){
        const numero = await perguntarNumero();
        try { 
            const codigo = await sock.requestPairingCode(numero); 
            console.log(`\n📲 Seu código de pareamento é: ${codigo}`); 
        } catch(err){ 
            console.log("❌ Erro ao gerar código de pareamento:",err.message); 
            process.exit(1);
        }
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update)=>{
        const { connection, lastDisconnect, qr } = update;
        
        // Handle QR code
        if (qr && metodo === "qr") {
            const qrcode = require('qrcode-terminal');
            console.log("\n📱 QR CODE GERADO:");
            console.log("════════════════════════════════════════");
            qrcode.generate(qr, { small: true });
            console.log("════════════════════════════════════════");
            console.log("📱 Escaneie este QR Code com seu WhatsApp");
            console.log("⚡ O QR Code expira em 60 segundos");
        }
        
        if(connection==="open"){
            mostrarBanner();
            console.log(`✅ Conectado ao sistema da Neext em ${new Date().toLocaleString()}`);
            await enviarContatoSelinho(sock);
            
            // Configura listeners de mensagens após conectar
            const { setupListeners } = require("./index.js");
            setupListeners(sock);
            console.log("🔧 Listeners de mensagens configurados!");
        } else if(connection==="close"){
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== 401 && statusCode !== 403;
            console.log(`❌ Conexão fechada (${statusCode || 'desconhecido'}). Reconectando... (${shouldReconnect?"sim":"não"})`);
            if(shouldReconnect) setTimeout(()=>startBot(),5000);
        }
    });
}

startBot();
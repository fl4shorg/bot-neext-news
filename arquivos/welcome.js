const fs = require('fs');
const path = require('path');

class WelcomeSystem {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'database', 'grupos');
        this.configFile = 'welcome_config.json';
        this.ensureDirectoryExists();
        this.welcomeConfigs = this.carregarConfiguracoes();
        this.migrarConfiguracoesAntigas(); // Remove textos fixos antigos
    }

    ensureDirectoryExists() {
        if (!fs.existsSync(this.configPath)) {
            fs.mkdirSync(this.configPath, { recursive: true });
        }
    }

    carregarConfiguracoes() {
        try {
            const configFilePath = path.join(this.configPath, this.configFile);
            if (fs.existsSync(configFilePath)) {
                const data = fs.readFileSync(configFilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar configurações de welcome:', error);
        }
        return {};
    }

    // REMOVIDO: Função que estava sobrescrevendo mensagens personalizadas
    migrarConfiguracoesAntigas() {
        // Migração desativada - usuários devem ter controle total de suas mensagens
        console.log('✅ Migração automática desativada - mensagens personalizadas serão mantidas');
    }

    salvarConfiguracoes() {
        try {
            const configFilePath = path.join(this.configPath, this.configFile);
            fs.writeFileSync(configFilePath, JSON.stringify(this.welcomeConfigs, null, 2));
        } catch (error) {
            console.log('❌ Erro ao salvar configurações de welcome:', error);
        }
    }

    // Ativa/desativa welcome para um grupo
    toggleWelcome(groupId, action) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: false,
                mensagem: "#numerodele bem-vindo ao #nomedogrupo! #descricao", // Mensagem padrão simples
                descricao: "Aproveite o grupo!"
            };
        }

        if (action === 'on') {
            this.welcomeConfigs[groupId].ativo = true;
            this.salvarConfiguracoes();
            return true;
        } else if (action === 'off') {
            this.welcomeConfigs[groupId].ativo = false;
            this.salvarConfiguracoes();
            return false;
        }

        return this.welcomeConfigs[groupId].ativo;
    }

    // Verifica se welcome está ativo para um grupo
    isWelcomeAtivo(groupId) {
        return this.welcomeConfigs[groupId] && this.welcomeConfigs[groupId].ativo;
    }

    // NOVA: Configura a mensagem COMPLETA (não apenas descrição)
    configurarMensagemCompleta(groupId, novaMensagem) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: false,
                mensagem: novaMensagem,
                descricao: ""
            };
        } else {
            this.welcomeConfigs[groupId].mensagem = novaMensagem;
            // Remove descricao duplicada para evitar conflitos
            this.welcomeConfigs[groupId].descricao = "";
        }

        this.salvarConfiguracoes();
        console.log(`✅ Mensagem welcome configurada para grupo ${groupId}: ${novaMensagem}`);
        return true;
    }

    // LEGACY: Mantém por compatibilidade (apenas altera #descricao)
    configurarMensagem(groupId, novaDescricao) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: false,
                mensagem: "#numerodele bem-vindo ao #nomedogrupo! #descricao",
                descricao: novaDescricao
            };
        } else {
            this.welcomeConfigs[groupId].descricao = novaDescricao;
        }

        this.salvarConfiguracoes();
        return true;
    }

    // Obtém configuração do grupo
    obterConfig(groupId) {
        return this.welcomeConfigs[groupId] || null;
    }

    // Obtém foto de perfil do usuário OU usa imagem específica
    async obterFotoPerfil(sock, userId) {
        try {
            const profilePic = await sock.profilePictureUrl(userId, 'image');
            console.log('✅ [WELCOME] Foto de perfil obtida');
            return profilePic;
        } catch (error) {
            console.log('⚠️ [WELCOME] Usando foto padrão (usuário sem foto)');
            return 'https://i.ibb.co/pvQpcbB2/37575a213755cad83bd408908623ba22.jpg';
        }
    }

    // SISTEMA FINAL: Processa welcome com fallback robusto
    async processarWelcome(sock, groupId, newMember) {
        try {
            console.log(`🎉 [WELCOME] Processando para ${newMember} no grupo ${groupId}`);

            if (!this.isWelcomeAtivo(groupId)) {
                console.log('❌ [WELCOME] Sistema não está ativo para este grupo');
                return false;
            }

            const config = this.welcomeConfigs[groupId];
            if (!config || !config.mensagem) {
                console.log('❌ [WELCOME] Configuração não encontrada');
                return false;
            }

            // Obtém informações do grupo
            const groupMetadata = await sock.groupMetadata(groupId);
            const nomeGrupo = groupMetadata.subject;
            const totalMembros = groupMetadata.participants.length;

            // Limpa o número (remove @s.whatsapp.net, @lid, e sufixos :xx)
            const numeroLimpo = newMember.replace(/@s\.whatsapp\.net|@lid|:[^@]+/g, '');
            
            // Debug para verificar os valores
            console.log(`🔍 [WELCOME DEBUG] newMember original: ${newMember}`);
            console.log(`🔍 [WELCOME DEBUG] numeroLimpo: ${numeroLimpo}`);

            // Usa APENAS a mensagem personalizada do usuário (sem texto padrão)
            let mensagemFinal = config.mensagem || `@${numeroLimpo} bem-vindo ao ${nomeGrupo}!`;

            console.log(`🔍 [WELCOME DEBUG] Mensagem original configurada: ${mensagemFinal}`);
            console.log(`🔍 [WELCOME DEBUG] numeroLimpo para substituir: ${numeroLimpo}`);

            // Substitui TODOS os placeholders (incluindo variações com e sem #)
            // Para #numerodele#, usa @ + número para menção visual
            mensagemFinal = mensagemFinal.replace(/#numerodele#?/g, `@${numeroLimpo}`);
            mensagemFinal = mensagemFinal.replace(/#nomedogrupo#?/g, nomeGrupo);
            // Suporta tanto #totalmembros quanto #totaldemembros (com "de")
            mensagemFinal = mensagemFinal.replace(/#totalmembros#?/g, totalMembros.toString());
            mensagemFinal = mensagemFinal.replace(/#totaldemembros#?/g, totalMembros.toString());
            
            console.log(`🔍 [WELCOME DEBUG] Mensagem após substituição: ${mensagemFinal}`);

            console.log(`📝 [WELCOME] Mensagem final: "${mensagemFinal}"`);

            // Obtém foto do usuário
            let avatarUrl;
            let temFotoPropria = true;
            
            try {
                avatarUrl = await sock.profilePictureUrl(newMember, 'image');
                console.log('✅ [WELCOME] Foto de perfil própria obtida');
            } catch (error) {
                avatarUrl = 'https://i.ibb.co/LDs3wJR3/a720804619ff4c744098b956307db1ff.jpg';
                temFotoPropria = false;
                console.log('⚠️ [WELCOME] Usando foto padrão (usuário sem foto)');
            }

            // SEMPRE menciona o usuário que entrou (não depende de @ na mensagem)
            const mentions = [newMember];
            
            console.log(`🔍 [WELCOME DEBUG] Mentions array: ${JSON.stringify(mentions)}`);
            console.log(`🔍 [WELCOME DEBUG] newMember completo: ${newMember}`);

            // TENTA primeiro com welcome card da API
            let welcomeEnviado = false;
            
            try {
                // Gera welcome card - só usa background quando não tem foto própria
                let welcomeCardUrl = `https://api.erdwpe.com/api/maker/welcome1?profile=${encodeURIComponent(avatarUrl)}&name=${encodeURIComponent(numeroLimpo)}&groupname=${encodeURIComponent(nomeGrupo)}&member=${totalMembros}`;
                
                // SÓ adiciona background se não tem foto própria
                if (!temFotoPropria) {
                    welcomeCardUrl += `&background=https://i.ibb.co/LDs3wJR3/a720804619ff4c744098b956307db1ff.jpg`;
                }

                console.log(`🔗 [WELCOME] Tentando API: ${welcomeCardUrl}`);

                // Timeout de 10 segundos para a API
                const axios = require('axios');
                const response = await axios.get(welcomeCardUrl, { 
                    timeout: 10000,
                    responseType: 'arraybuffer'
                });

                if (response.status === 200 && response.data) {
                    // API funcionou - envia welcome card
                    await sock.sendMessage(groupId, {
                        image: { url: welcomeCardUrl },
                        caption: mensagemFinal,
                        mentions: mentions,
                        contextInfo: {
                            forwardingScore: 100000,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363289739581116@newsletter",
                                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                            },
                            externalAdReply: {
                                title: "🎉 BEM-VINDO",
                                body: "© NEEXT LTDA",
                                thumbnailUrl: avatarUrl,
                                mediaType: 1,
                                sourceUrl: "https://www.neext.online"
                            }
                        }
                    });

                    console.log(`✅ [WELCOME] Welcome card enviado via API para ${numeroLimpo}`);
                    welcomeEnviado = true;
                }
            } catch (apiError) {
                console.log(`⚠️ [WELCOME] API falhou: ${apiError.message} - Usando fallback`);
            }

            // FALLBACK: Se API falhou, envia mensagem simples com foto do usuário
            if (!welcomeEnviado) {
                console.log(`🔄 [WELCOME] Usando fallback - enviando mensagem simples`);
                
                try {
                    await sock.sendMessage(groupId, {
                        image: { url: avatarUrl },
                        caption: mensagemFinal, // APENAS a mensagem personalizada
                        mentions: mentions,
                        contextInfo: {
                            forwardingScore: 100000,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363289739581116@newsletter",
                                newsletterName: "🐦‍🔥⃝ 𝆅࿙⵿ׂ𝆆𝝢𝝣𝝣𝝬𝗧𓋌𝗟𝗧𝗗𝗔⦙⦙ꜣྀ"
                            },
                            externalAdReply: {
                                title: "🎉 BEM-VINDO",
                                body: "© NEEXT LTDA",
                                thumbnailUrl: avatarUrl,
                                mediaType: 1,
                                sourceUrl: "https://www.neext.online"
                            }
                        }
                    });

                    console.log(`✅ [WELCOME] Fallback enviado para ${numeroLimpo}: "${mensagemFinal}"`);
                    welcomeEnviado = true;
                } catch (fallbackError) {
                    console.log(`❌ [WELCOME] Fallback também falhou: ${fallbackError.message}`);
                    
                    // ÚLTIMO RECURSO: Mensagem apenas de texto
                    try {
                        await sock.sendMessage(groupId, {
                            text: mensagemFinal, // APENAS a mensagem personalizada
                            mentions: mentions
                        });

                        console.log(`✅ [WELCOME] Mensagem de texto enviada para ${numeroLimpo}`);
                        welcomeEnviado = true;
                    } catch (textError) {
                        console.log(`❌ [WELCOME] Até mensagem de texto falhou: ${textError.message}`);
                    }
                }
            }

            return welcomeEnviado;

        } catch (error) {
            console.log('❌ [WELCOME] Erro geral ao processar:', error.message);
            return false;
        }
    }

    // Lista todos os grupos com welcome ativo
    listarGruposAtivos() {
        const gruposAtivos = [];
        for (const [groupId, config] of Object.entries(this.welcomeConfigs)) {
            if (config.ativo) {
                gruposAtivos.push(groupId);
            }
        }
        return gruposAtivos;
    }

    // Estatísticas do sistema
    obterEstatisticas() {
        const total = Object.keys(this.welcomeConfigs).length;
        const ativos = this.listarGruposAtivos().length;
        const inativos = total - ativos;

        return {
            total,
            ativos,
            inativos
        };
    }
}

module.exports = new WelcomeSystem();
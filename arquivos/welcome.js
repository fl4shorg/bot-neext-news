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

    // NOVA: Remove textos fixos antigos das configurações
    migrarConfiguracoesAntigas() {
        let alterado = false;
        
        for (const [groupId, config] of Object.entries(this.welcomeConfigs)) {
            // Remove mensagens com textos fixos antigos
            if (config.mensagem && (
                config.mensagem.includes('BEM-VINDO(A)') ||
                config.mensagem.includes('📱 *Grupo:*') ||
                config.mensagem.includes('👥 *Total de Membros:*') ||
                config.mensagem.includes('🎉 *BEM-VINDO')
            )) {
                console.log(`🔧 Removendo texto fixo antigo do grupo ${groupId}`);
                // Define mensagem padrão simples com placeholders
                config.mensagem = "#numerodele bem-vindo ao #nomedogrupo! #descricao";
                config.descricao = config.descricao || "Aproveite o grupo!";
                alterado = true;
            }
        }
        
        if (alterado) {
            this.salvarConfiguracoes();
            console.log('✅ Configurações migradas - textos fixos removidos!');
        }
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
                ativo: true, // Ativa automaticamente quando configura mensagem
                mensagem: novaMensagem,
                descricao: "Aproveite o grupo!"
            };
        } else {
            this.welcomeConfigs[groupId].mensagem = novaMensagem;
            // Garante que está ativo quando configura mensagem
            this.welcomeConfigs[groupId].ativo = true;
        }

        this.salvarConfiguracoes();
        console.log(`✅ Mensagem welcome configurada e ativada para grupo ${groupId}: ${novaMensagem}`);
        return true;
    }

    // LEGACY: Mantém por compatibilidade (apenas altera #descricao)
    configurarMensagem(groupId, novaDescricao) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: true, // Ativa automaticamente quando configura
                mensagem: "#numerodele bem-vindo ao #nomedogrupo! #descricao",
                descricao: novaDescricao
            };
        } else {
            this.welcomeConfigs[groupId].descricao = novaDescricao;
            // Garante que a mensagem padrão existe
            if (!this.welcomeConfigs[groupId].mensagem) {
                this.welcomeConfigs[groupId].mensagem = "#numerodele bem-vindo ao #nomedogrupo! #descricao";
            }
            // Garante que está ativo
            this.welcomeConfigs[groupId].ativo = true;
        }

        this.salvarConfiguracoes();
        console.log(`✅ Descrição welcome configurada e ativada para grupo ${groupId}: ${novaDescricao}`);
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
            if (!config) {
                console.log('❌ [WELCOME] Configuração não encontrada');
                return false;
            }

            // Obtém informações do grupo
            const groupMetadata = await sock.groupMetadata(groupId);
            const nomeGrupo = groupMetadata.subject;
            const totalMembros = groupMetadata.participants.length;

            // Limpa o número (remove @s.whatsapp.net, @lid, e sufixos :xx)
            const numeroLimpo = newMember.replace(/@s\.whatsapp\.net|@lid|:[^@]+/g, '');

            // Processa a mensagem configurada ou usa padrão
            let mensagemFinal = config.mensagem || "#numerodele bem-vindo ao #nomedogrupo! #descricao";

            // Substitui TODOS os placeholders
            mensagemFinal = mensagemFinal.replace(/#numerodele#?/g, `@${numeroLimpo}`);
            mensagemFinal = mensagemFinal.replace(/#nomedogrupo#?/g, nomeGrupo);
            mensagemFinal = mensagemFinal.replace(/#totalmembros#?/g, totalMembros.toString());
            mensagemFinal = mensagemFinal.replace(/#descricao#?/g, config.descricao || 'Aproveite o grupo!');

            console.log(`📝 [WELCOME] Mensagem final: "${mensagemFinal}"`);

            // Obtém foto do usuário
            let avatarUrl = 'https://i.ibb.co/LDs3wJR3/a720804619ff4c744098b956307db1ff.jpg'; // Foto padrão
            
            try {
                const profilePic = await sock.profilePictureUrl(newMember, 'image');
                if (profilePic) {
                    avatarUrl = profilePic;
                    console.log('✅ [WELCOME] Foto de perfil própria obtida');
                }
            } catch (error) {
                console.log('⚠️ [WELCOME] Usando foto padrão (usuário sem foto)');
            }

            // Verifica se deve mencionar
            const mentions = mensagemFinal.includes(`@${numeroLimpo}`) ? [newMember] : [];

            // PRIMEIRA TENTATIVA: Tenta enviar com welcome card
            try {
                const welcomeCardUrl = `https://api.popcat.xyz/welcomecard?background=https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg&text1=Bem-vindo&text2=${encodeURIComponent(numeroLimpo)}&text3=${encodeURIComponent(nomeGrupo)}&avatar=${encodeURIComponent(avatarUrl)}`;
                
                await sock.sendMessage(groupId, {
                    image: { url: welcomeCardUrl },
                    caption: mensagemFinal,
                    mentions: mentions
                });

                console.log(`✅ [WELCOME] Welcome card enviado para ${numeroLimpo}`);
                return true;

            } catch (cardError) {
                console.log('⚠️ [WELCOME] Erro no welcome card, enviando texto simples:', cardError.message);
                
                // FALLBACK: Envia apenas texto com foto de perfil
                try {
                    await sock.sendMessage(groupId, {
                        image: { url: avatarUrl },
                        caption: `🎉 *BEM-VINDO!*\n\n${mensagemFinal}\n\n© NEEXT LTDA`,
                        mentions: mentions
                    });

                    console.log(`✅ [WELCOME] Mensagem simples enviada para ${numeroLimpo}`);
                    return true;

                } catch (fallbackError) {
                    console.log('❌ [WELCOME] Erro no fallback, enviando só texto:', fallbackError.message);
                    
                    // ÚLTIMO RECURSO: Apenas texto
                    await sock.sendMessage(groupId, {
                        text: `🎉 *BEM-VINDO!*\n\n${mensagemFinal}\n\n© NEEXT LTDA`,
                        mentions: mentions
                    });

                    console.log(`✅ [WELCOME] Texto simples enviado para ${numeroLimpo}`);
                    return true;
                }
            }

        } catch (error) {
            console.error('❌ [WELCOME] Erro crítico ao processar:', error);
            
            // ÚLTIMO RECURSO ABSOLUTO: Mensagem básica
            try {
                const numeroLimpo = newMember.replace(/@s\.whatsapp\.net|@lid|:[^@]+/g, '');
                await sock.sendMessage(groupId, {
                    text: `🎉 Bem-vindo @${numeroLimpo}! Aproveite o grupo!`,
                    mentions: [newMember]
                });
                console.log(`✅ [WELCOME] Mensagem de emergência enviada para ${numeroLimpo}`);
                return true;
            } catch (emergencyError) {
                console.error('❌ [WELCOME] Falha total:', emergencyError);
                return false;
            }
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
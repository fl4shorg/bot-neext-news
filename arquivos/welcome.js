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
                ativo: false,
                mensagem: novaMensagem,
                descricao: ""
            };
        } else {
            this.welcomeConfigs[groupId].mensagem = novaMensagem;
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

    // SISTEMA FINAL: Processa welcome com API de welcome card
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

            // Processa APENAS a mensagem que o usuário configurou
            let mensagemFinal = config.mensagem;

            // Substitui TODOS os placeholders (sem deixar # literal)
            mensagemFinal = mensagemFinal.replace(/#numerodele#?/g, `@${numeroLimpo}`);
            mensagemFinal = mensagemFinal.replace(/#nomedogrupo#?/g, nomeGrupo);
            mensagemFinal = mensagemFinal.replace(/#totalmembros#?/g, totalMembros.toString());
            mensagemFinal = mensagemFinal.replace(/#descricao#?/g, config.descricao || '');

            console.log(`📝 [WELCOME] Mensagem final: "${mensagemFinal}"`);

            // Obtém foto do usuário
            let avatarUrl;
            let temFotoPropria = true;
            
            try {
                avatarUrl = await sock.profilePictureUrl(newMember, 'image');
                console.log('✅ [WELCOME] Foto de perfil própria obtida');
            } catch (error) {
                avatarUrl = 'https://i.ibb.co/pvQpcbB2/37575a213755cad83bd408908623ba22.jpg';
                temFotoPropria = false;
                console.log('⚠️ [WELCOME] Usando foto padrão (usuário sem foto)');
            }

            // Gera welcome card - só usa background quando não tem foto própria
            let welcomeCardUrl = `https://api.erdwpe.com/api/maker/welcome1?profile=${encodeURIComponent(avatarUrl)}&name=${encodeURIComponent(numeroLimpo)}&groupname=${encodeURIComponent(nomeGrupo)}&member=${totalMembros}`;
            
            // SÓ adiciona background se não tem foto própria
            if (!temFotoPropria) {
                welcomeCardUrl += `&background=https://i.ibb.co/pvQpcbB2/37575a213755cad83bd408908623ba22.jpg`;
            }

            // Verifica se deve mencionar (só se tiver @ na mensagem)
            const mentions = mensagemFinal.includes(`@${numeroLimpo}`) ? [newMember] : [];

            // ENVIA welcome card + texto do usuário
            await sock.sendMessage(groupId, {
                image: { url: welcomeCardUrl },
                caption: mensagemFinal,
                mentions: mentions
            });

            console.log(`✅ [WELCOME] Welcome card enviado para ${numeroLimpo}: "${mensagemFinal}"`);
            return true;

        } catch (error) {
            console.log('❌ [WELCOME] Erro ao processar:', error);
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
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class WelcomeSystem {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'database', 'grupos');
        this.configFile = 'welcome_config.json';
        this.ensureDirectoryExists();
        this.welcomeConfigs = this.carregarConfiguracoes();
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

    salvarConfiguracoes() {
        try {
            const configFilePath = path.join(this.configPath, this.configFile);
            fs.writeFileSync(configFilePath, JSON.stringify(this.welcomeConfigs, null, 2));
            console.log('✅ Configurações de welcome salvas!');
        } catch (error) {
            console.log('❌ Erro ao salvar configurações de welcome:', error);
        }
    }

    // Ativa/desativa welcome para um grupo
    toggleWelcome(groupId, action) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: false,
                mensagem: "🎉 *BEM-VINDO(A) #numerodele#!*\n\n📱 *Grupo:* #nomedogrupo\n👥 *Total de Membros:* #totalmembros\n\n#descricao",
                descricao: "Seja bem-vindo(a) ao nosso grupo! Esperamos que você se divirta e participe das conversas! 😊"
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

    // Configura mensagem personalizada de welcome
    configurarMensagem(groupId, novaDescricao) {
        if (!this.welcomeConfigs[groupId]) {
            this.welcomeConfigs[groupId] = {
                ativo: false,
                mensagem: "🎉 *BEM-VINDO(A) #numerodele#!*\n\n📱 *Grupo:* #nomedogrupo\n👥 *Total de Membros:* #totalmembros\n\n#descricao",
                descricao: "Seja bem-vindo(a) ao nosso grupo! Esperamos que você se divirta e participe das conversas! 😊"
            };
        }

        this.welcomeConfigs[groupId].descricao = novaDescricao;
        this.salvarConfiguracoes();
        return true;
    }

    // Obtém configuração do grupo
    obterConfig(groupId) {
        return this.welcomeConfigs[groupId] || null;
    }

    // Processa placeholders na mensagem
    processarMensagem(groupId, numeroMembro, nomeGrupo, totalMembros) {
        const config = this.welcomeConfigs[groupId];
        if (!config) return null;

        let mensagem = config.mensagem;
        
        // Substitui placeholders
        mensagem = mensagem.replace(/#numerodele#/g, `@${numeroMembro}`);
        mensagem = mensagem.replace(/#nomedogrupo/g, nomeGrupo);
        mensagem = mensagem.replace(/#totalmembros/g, totalMembros.toString());
        mensagem = mensagem.replace(/#descricao/g, config.descricao);

        return mensagem;
    }

    // Gera URL da API PopCat para welcome card
    async gerarWelcomeCard(avatarUrl, nomeUsuario, nomeGrupo, numeroMembro) {
        try {
            // URL base da API PopCat
            const baseUrl = 'https://api.popcat.xyz/v2/welcomecard';
            
            // Background padrão fornecido
            const background = 'https://i.ibb.co/N6qX5TzX/bcfd129f316060c3149893a4663a160f.jpg';
            
            // Monta os parâmetros
            const params = new URLSearchParams({
                background: background,
                text1: nomeUsuario || 'Novo Membro',
                text2: `Bem-vindo(a) ao ${nomeGrupo}`,
                text3: `Membro #${numeroMembro}`,
                avatar: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
            });

            const welcomeCardUrl = `${baseUrl}?${params.toString()}`;
            console.log('🖼️ URL da welcome card gerada:', welcomeCardUrl);
            
            return welcomeCardUrl;
        } catch (error) {
            console.log('❌ Erro ao gerar welcome card:', error);
            return null;
        }
    }

    // Obtém foto de perfil do usuário
    async obterAvatarUsuario(sock, userId) {
        try {
            const profilePic = await sock.profilePictureUrl(userId, 'image');
            return profilePic;
        } catch (error) {
            console.log('⚠️ Não foi possível obter foto de perfil, usando padrão');
            return 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }

    // Processa welcome completo para novo membro
    async processarWelcome(sock, groupId, newMember) {
        try {
            if (!this.isWelcomeAtivo(groupId)) {
                return false;
            }

            // Obtém metadados do grupo
            const groupMetadata = await sock.groupMetadata(groupId);
            const nomeGrupo = groupMetadata.subject;
            const totalMembros = groupMetadata.participants.length;
            
            // Extrai número do membro
            const numeroMembro = newMember.replace('@s.whatsapp.net', '');
            
            // Gera mensagem personalizada
            const mensagemWelcome = this.processarMensagem(groupId, numeroMember, nomeGrupo, totalMembros);
            
            if (!mensagemWelcome) {
                console.log('❌ Erro ao processar mensagem de welcome');
                return false;
            }

            // Envia mensagem de texto primeiro
            await sock.sendMessage(groupId, {
                text: mensagemWelcome,
                mentions: [newMember]
            });

            // Gera e envia welcome card
            const avatarUrl = await this.obterAvatarUsuario(sock, newMember);
            const nomeUsuario = numeroMembro; // Pode ser melhorado obtendo nome real
            
            const welcomeCardUrl = await this.gerarWelcomeCard(
                avatarUrl, 
                nomeUsuario, 
                nomeGrupo, 
                totalMembros
            );

            if (welcomeCardUrl) {
                await sock.sendMessage(groupId, {
                    image: { url: welcomeCardUrl },
                    caption: `🎉 *Welcome Card para @${numeroMembro}*`,
                    mentions: [newMember]
                });
            }

            console.log(`✅ Welcome processado para ${numeroMembro} no grupo ${nomeGrupo}`);
            return true;

        } catch (error) {
            console.log('❌ Erro ao processar welcome:', error);
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
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
                mensagem: "🎉 *BEM-VINDO(A) #numerodele!*\n\n📱 *Grupo:* #nomedogrupo\n👥 *Total de Membros:* #totalmembros\n\n#descricao",
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
                mensagem: "🎉 *BEM-VINDO(A) #numerodele!*\n\n📱 *Grupo:* #nomedogrupo\n👥 *Total de Membros:* #totalmembros\n\n#descricao",
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
        
        // Remove o @s.whatsapp.net ou @lid do número
        const numeroLimpo = numeroMembro.replace(/@s\.whatsapp\.net|@lid/g, '');
        
        // Substitui placeholders (compatível com ambas as versões: #numerodele e #numerodele#)
        mensagem = mensagem.replace(/#numerodele#?/g, `@${numeroLimpo}`);
        mensagem = mensagem.replace(/#nomedogrupo#?/g, nomeGrupo);
        mensagem = mensagem.replace(/#totalmembros#?/g, totalMembros.toString());
        mensagem = mensagem.replace(/#descricao#?/g, config.descricao);

        return {
            texto: mensagem,
            numeroParaMencionar: numeroMembro // Retorna o JID completo para mencionar
        };
    }

    // Gera URL da API PopCat para welcome card
    async gerarWelcomeCard(avatarUrl, numeroLimpo, nomeGrupo, totalMembros) {
        try {
            // URL base da API PopCat
            const baseUrl = 'https://api.popcat.xyz/v2/welcomecard';
            
            // Background padrão fornecido
            const background = 'https://i.ibb.co/N6qX5TzX/bcfd129f316060c3149893a4663a160f.jpg';
            
            // Avatar padrão melhorado (imagem vazia do WhatsApp)
            const avatarPadrao = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            
            // Monta os parâmetros (numeroLimpo já vem limpo)
            const params = new URLSearchParams({
                background: background,
                text1: numeroLimpo,
                text2: `Bem-vindo(a) ao ${nomeGrupo}`,
                text3: `Membro #${totalMembros}`,
                avatar: avatarUrl || avatarPadrao
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
            console.log('✅ Foto de perfil obtida:', profilePic);
            return profilePic;
        } catch (error) {
            console.log('⚠️ Não foi possível obter foto de perfil, usando padrão');
            // Avatar padrão que simula a foto vazia do WhatsApp
            return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
        }
    }

    // Processa welcome completo para novo membro - CORRIGIDO
    async processarWelcome(sock, groupId, newMember) {
        try {
            if (!this.isWelcomeAtivo(groupId)) {
                console.log('❌ Welcome não está ativo para este grupo');
                return false;
            }

            console.log(`🎉 Processando welcome para ${newMember} no grupo ${groupId}`);

            // Obtém metadados do grupo
            const groupMetadata = await sock.groupMetadata(groupId);
            const nomeGrupo = groupMetadata.subject;
            const totalMembros = groupMetadata.participants.length;
            
            // Extrai número do membro (mantém o JID completo para mencionar)
            const numeroLimpo = newMember.replace(/@s\.whatsapp\.net|@lid/g, '');
            
            // Gera mensagem personalizada
            const resultadoMensagem = this.processarMensagem(groupId, newMember, nomeGrupo, totalMembros);
            
            if (!resultadoMensagem) {
                console.log('❌ Erro ao processar mensagem de welcome');
                return false;
            }

            // Obtém avatar do usuário
            const avatarUrl = await this.obterAvatarUsuario(sock, newMember);
            
            // Gera welcome card
            const welcomeCardUrl = await this.gerarWelcomeCard(
                avatarUrl, 
                numeroLimpo, 
                nomeGrupo, 
                totalMembros
            );

            if (welcomeCardUrl) {
                // ENVIA APENAS UMA MENSAGEM com imagem E texto
                await sock.sendMessage(groupId, {
                    image: { url: welcomeCardUrl },
                    caption: resultadoMensagem.texto,
                    mentions: [newMember] // Usa o JID completo
                });
                
                console.log(`✅ Welcome card enviado para ${numeroLimpo} no grupo ${nomeGrupo}`);
            } else {
                // Fallback: envia apenas texto se não conseguir gerar a imagem
                await sock.sendMessage(groupId, {
                    text: resultadoMensagem.texto,
                    mentions: [newMember]
                });
                
                console.log(`✅ Welcome texto enviado para ${numeroLimpo} no grupo ${nomeGrupo}`);
            }

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
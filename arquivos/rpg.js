
// Sistema RPG NeextCity - NOVA GERAÇÃO COMPLETA
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Caminho para o arquivo de dados do RPG
const rpgDataFile = path.join(__dirname, '../database/grupos/rpg_data.json');

// Sistema de Mutex para evitar race conditions
let rpgLock = false;

async function withLock(fn) {
    while (rpgLock) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    rpgLock = true;
    try {
        return await fn();
    } finally {
        rpgLock = false;
    }
}

// ==================== CONSTANTES DO JOGO ====================

// Bancos disponíveis (18 opções)
const bancos = [
    { id: 'nubank', nome: '💜 Nubank', emoji: '💜' },
    { id: 'inter', nome: '🧡 Inter', emoji: '🧡' },
    { id: 'santander', nome: '🔴 Santander', emoji: '🔴' },
    { id: 'bradesco', nome: '🔵 Bradesco', emoji: '🔵' },
    { id: 'itau', nome: '🟠 Itaú', emoji: '🟠' },
    { id: 'bb', nome: '🟡 Banco do Brasil', emoji: '🟡' },
    { id: 'caixa', nome: '🏦 Caixa', emoji: '🏦' },
    { id: 'picpay', nome: '💚 PicPay', emoji: '💚' },
    { id: 'c6bank', nome: '⚫ C6 Bank', emoji: '⚫' },
    { id: 'next', nome: '⚪ Next', emoji: '⚪' },
    { id: 'neon', nome: '🔺 Neon', emoji: '🔺' },
    { id: 'original', nome: '🟤 Original', emoji: '🟤' },
    { id: 'safra', nome: '🟣 Safra', emoji: '🟣' },
    { id: 'will', nome: '🔸 Will Bank', emoji: '🔸' },
    { id: 'c6', nome: '⚪ C6 Bank', emoji: '⚪' },
    { id: 'bs2', nome: '🟨 BS2', emoji: '🟨' },
    { id: 'bmg', nome: '🟫 BMG', emoji: '🟫' },
    { id: 'sicoob', nome: '🟢 Sicoob', emoji: '🟢' }
];

// Níveis de educação com progressão realista
const educacao = {
    1: { nome: 'Ensino Fundamental', custo: 0, tempo: 1, salarioMin: 50 },
    2: { nome: 'Ensino Médio', custo: 1000, tempo: 2, salarioMin: 100 },
    3: { nome: 'Curso Técnico', custo: 3000, tempo: 3, salarioMin: 200 },
    4: { nome: 'Graduação', custo: 8000, tempo: 4, salarioMin: 400 },
    5: { nome: 'Pós-graduação', custo: 15000, tempo: 5, salarioMin: 600 },
    6: { nome: 'Mestrado', custo: 25000, tempo: 6, salarioMin: 800 },
    7: { nome: 'Doutorado', custo: 40000, tempo: 8, salarioMin: 1200 }
};

// Cursos universitários específicos
const faculdades = {
    medicina: { nome: 'Medicina', custo: 100000, tempo: 12, salario: 2000 },
    engenharia: { nome: 'Engenharia', custo: 60000, tempo: 10, salario: 1500 },
    direito: { nome: 'Direito', custo: 50000, tempo: 10, salario: 1300 },
    administracao: { nome: 'Administração', custo: 35000, tempo: 8, salario: 1000 },
    ti: { nome: 'Tecnologia da Informação', custo: 45000, tempo: 8, salario: 1800 },
    psicologia: { nome: 'Psicologia', custo: 40000, tempo: 10, salario: 900 },
    odontologia: { nome: 'Odontologia', custo: 80000, tempo: 10, salario: 1600 },
    veterinaria: { nome: 'Veterinária', custo: 70000, tempo: 10, salario: 1400 }
};

// Loja completa com 8 categorias e +100 itens
const loja = {
    // CATEGORIA 1: PROPRIEDADES (15 itens)
    propriedades: {
        barraca: { 
            id: 'barraca', nome: '⛺ Barraca', preco: 500, categoria: 'propriedades', emoji: '⛺',
            durabilidade: 50, durabilidade_max: 50, beneficio: '+10 gold/dia (renda passiva)', renda_passiva: 10,
            descricao: 'Abrigo básico para começar'
        },
        casa_madeira: { 
            id: 'casa_madeira', nome: '🏠 Casa de Madeira', preco: 15000, categoria: 'propriedades', emoji: '🏠',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+50 gold/dia (renda passiva)', renda_passiva: 50,
            descricao: 'Casa simples mas confortável'
        },
        casa_alvenaria: { 
            id: 'casa_alvenaria', nome: '🏘️ Casa de Alvenaria', preco: 50000, categoria: 'propriedades', emoji: '🏘️',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+150 gold/dia (renda passiva)', renda_passiva: 150,
            descricao: 'Casa resistente e espaçosa'
        },
        apartamento: { 
            id: 'apartamento', nome: '🏢 Apartamento', preco: 80000, categoria: 'propriedades', emoji: '🏢',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+200 gold/dia (renda passiva)', renda_passiva: 200,
            descricao: 'Apartamento moderno na cidade'
        },
        mansao: { 
            id: 'mansao', nome: '🏰 Mansão', preco: 300000, categoria: 'propriedades', emoji: '🏰',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+500 gold/dia (renda passiva)', renda_passiva: 500,
            descricao: 'Casa de luxo para os ricos'
        },
        fazenda: { 
            id: 'fazenda', nome: '🚜 Fazenda', preco: 150000, categoria: 'propriedades', emoji: '🚜',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+300 gold/dia (agricultura)', renda_passiva: 300,
            descricao: 'Propriedade rural produtiva'
        },
        hotel: { 
            id: 'hotel', nome: '🏨 Hotel', preco: 500000, categoria: 'propriedades', emoji: '🏨',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+800 gold/dia (turismo)', renda_passiva: 800,
            descricao: 'Negócio de hospedagem lucrativo'
        },
        shopping: { 
            id: 'shopping', nome: '🏬 Shopping Center', preco: 1000000, categoria: 'propriedades', emoji: '🏬',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: '+1500 gold/dia (comércio)', renda_passiva: 1500,
            descricao: 'Centro comercial gigantesco'
        },
        ilha_privada: { 
            id: 'ilha_privada', nome: '🏝️ Ilha Privada', preco: 5000000, categoria: 'propriedades', emoji: '🏝️',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+3000 gold/dia (paraíso)', renda_passiva: 3000,
            descricao: 'Seu próprio paraíso particular'
        },
        cidade: { 
            id: 'cidade', nome: '🌆 Cidade Inteira', preco: 20000000, categoria: 'propriedades', emoji: '🌆',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+10000 gold/dia (prefeito)', renda_passiva: 10000,
            descricao: 'Você é o dono de uma cidade!'
        },
        castelo: { 
            id: 'castelo', nome: '🏯 Castelo Medieval', preco: 2000000, categoria: 'propriedades', emoji: '🏯',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+1200 gold/dia (realeza)', renda_passiva: 1200,
            descricao: 'Castelo histórico majestoso'
        },
        bunker: { 
            id: 'bunker', nome: '🏢 Bunker Nuclear', preco: 3000000, categoria: 'propriedades', emoji: '🏢',
            durabilidade: 8000, durabilidade_max: 8000, beneficio: 'Proteção total contra ataques', protecao: 100,
            descricao: 'Abrigo à prova de tudo'
        },
        predio: { 
            id: 'predio', nome: '🏗️ Prédio Comercial', preco: 800000, categoria: 'propriedades', emoji: '🏗️',
            durabilidade: 2500, durabilidade_max: 2500, beneficio: '+1000 gold/dia (aluguel)', renda_passiva: 1000,
            descricao: 'Prédio para alugar escritórios'
        },
        universidade: { 
            id: 'universidade', nome: '🎓 Universidade Própria', preco: 10000000, categoria: 'propriedades', emoji: '🎓',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+5000 gold/dia (educação)', renda_passiva: 5000,
            descricao: 'Sua própria instituição de ensino'
        },
        porto: { 
            id: 'porto', nome: '⚓ Porto Marítimo', preco: 8000000, categoria: 'propriedades', emoji: '⚓',
            durabilidade: 6000, durabilidade_max: 6000, beneficio: '+4000 gold/dia (comércio)', renda_passiva: 4000,
            descricao: 'Porto para navios cargueiros'
        }
    },

    // CATEGORIA 2: ANIMAIS (15 itens)
    animais: {
        galinha: { 
            id: 'galinha', nome: '🐔 Galinha', preco: 200, categoria: 'animais', emoji: '🐔',
            durabilidade: 60, durabilidade_max: 60, beneficio: '+30 gold/dia (ovos)', renda_passiva: 30,
            descricao: 'Produz ovos diariamente'
        },
        vaca: { 
            id: 'vaca', nome: '🐄 Vaca', preco: 3000, categoria: 'animais', emoji: '🐄',
            durabilidade: 120, durabilidade_max: 120, beneficio: '+100 gold/dia (leite)', renda_passiva: 100,
            descricao: 'Produz leite fresco'
        },
        porco: { 
            id: 'porco', nome: '🐷 Porco', preco: 1500, categoria: 'animais', emoji: '🐷',
            durabilidade: 80, durabilidade_max: 80, beneficio: '+80 gold/dia (carne)', renda_passiva: 80,
            descricao: 'Criação para consumo'
        },
        cavalo: { 
            id: 'cavalo', nome: '🐴 Cavalo', preco: 8000, categoria: 'animais', emoji: '🐴',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+25% velocidade trabalhos', bonus_velocidade: 25,
            descricao: 'Animal de transporte nobre'
        },
        cachorro: { 
            id: 'cachorro', nome: '🐕 Cachorro', preco: 1000, categoria: 'animais', emoji: '🐕',
            durabilidade: 150, durabilidade_max: 150, beneficio: '+30% proteção assaltos', bonus_defesa: 30,
            descricao: 'Fiel guardião da família'
        },
        gato: { 
            id: 'gato', nome: '🐱 Gato', preco: 500, categoria: 'animais', emoji: '🐱',
            durabilidade: 120, durabilidade_max: 120, beneficio: '+10 gold/dia (companionship)', renda_passiva: 10,
            descricao: 'Pet carinhoso e independente'
        },
        ovelha: { 
            id: 'ovelha', nome: '🐑 Ovelha', preco: 2000, categoria: 'animais', emoji: '🐑',
            durabilidade: 100, durabilidade_max: 100, beneficio: '+70 gold/dia (lã)', renda_passiva: 70,
            descricao: 'Produz lã de qualidade'
        },
        tigre: { 
            id: 'tigre', nome: '🐅 Tigre', preco: 50000, categoria: 'animais', emoji: '🐅',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+50% proteção + intimidação', bonus_defesa: 50,
            descricao: 'Predador exótico impressionante'
        },
        leao: { 
            id: 'leao', nome: '🦁 Leão', preco: 80000, categoria: 'animais', emoji: '🦁',
            durabilidade: 350, durabilidade_max: 350, beneficio: '+60% proteção + status', bonus_defesa: 60,
            descricao: 'Rei da selva como pet'
        },
        elefante: { 
            id: 'elefante', nome: '🐘 Elefante', preco: 150000, categoria: 'animais', emoji: '🐘',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+40% ganhos trabalho pesado', bonus_trabalho: 40,
            descricao: 'Gigante gentil e trabalhador'
        },
        dragao: { 
            id: 'dragao', nome: '🐲 Dragão', preco: 1000000, categoria: 'animais', emoji: '🐲',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+100% proteção + voo', bonus_defesa: 100,
            descricao: 'Criatura mítica lendária'
        },
        unicornio: { 
            id: 'unicornio', nome: '🦄 Unicórnio', preco: 800000, categoria: 'animais', emoji: '🦄',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+500 gold/dia (magia)', renda_passiva: 500,
            descricao: 'Ser mágico que traz sorte'
        },
        aguia: { 
            id: 'aguia', nome: '🦅 Águia', preco: 10000, categoria: 'animais', emoji: '🦅',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+20% chance crítica trabalhos', bonus_critico: 20,
            descricao: 'Ave de rapina majestosa'
        },
        lobo: { 
            id: 'lobo', nome: '🐺 Lobo', preco: 25000, categoria: 'animais', emoji: '🐺',
            durabilidade: 250, durabilidade_max: 250, beneficio: '+40% proteção noturna', bonus_defesa: 40,
            descricao: 'Predador feroz e leal'
        },
        tubarao: { 
            id: 'tubarao', nome: '🦈 Tubarão', preco: 100000, categoria: 'animais', emoji: '🦈',
            durabilidade: 400, durabilidade_max: 400, beneficio: '+200% ganhos pesca', bonus_pesca: 200,
            descricao: 'Predador aquático temível'
        }
    },

    // CATEGORIA 3: FERRAMENTAS (20 itens)
    ferramentas: {
        // Pesca
        vara_bambu: { 
            id: 'vara_bambu', nome: '🎋 Vara de Bambu', preco: 100, categoria: 'ferramentas', emoji: '🎋',
            durabilidade: 30, durabilidade_max: 30, beneficio: 'Pesca básica (+20% sucesso)', bonus_pesca: 20,
            descricao: 'Vara simples para iniciantes'
        },
        vara_carbono: { 
            id: 'vara_carbono', nome: '🎣 Vara de Carbono', preco: 2000, categoria: 'ferramentas', emoji: '🎣',
            durabilidade: 150, durabilidade_max: 150, beneficio: 'Pesca avançada (+60% sucesso)', bonus_pesca: 60,
            descricao: 'Vara profissional de alta qualidade'
        },
        rede_pesca: { 
            id: 'rede_pesca', nome: '🕸️ Rede de Pesca', preco: 5000, categoria: 'ferramentas', emoji: '🕸️',
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Pesca em massa (+100% ganhos)', bonus_pesca: 100,
            descricao: 'Captura múltiplos peixes'
        },
        
        // Mineração
        picareta_ferro: { 
            id: 'picareta_ferro', nome: '⛏️ Picareta de Ferro', preco: 500, categoria: 'ferramentas', emoji: '⛏️',
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Mineração básica (+30% sucesso)', bonus_mineracao: 30,
            descricao: 'Ferramenta padrão de mineração'
        },
        picareta_diamante: { 
            id: 'picareta_diamante', nome: '💎 Picareta de Diamante', preco: 10000, categoria: 'ferramentas', emoji: '💎',
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Mineração avançada (+80% sucesso)', bonus_mineracao: 80,
            descricao: 'A melhor picareta disponível'
        },
        britadeira: { 
            id: 'britadeira', nome: '🔨 Britadeira Industrial', preco: 50000, categoria: 'ferramentas', emoji: '🔨',
            durabilidade: 300, durabilidade_max: 300, beneficio: 'Mineração industrial (+150% ganhos)', bonus_mineracao: 150,
            descricao: 'Máquina pesada para grandes extrações'
        },
        
        // Caça
        rifle_caca: { 
            id: 'rifle_caca', nome: '🔫 Rifle de Caça', preco: 3000, categoria: 'ferramentas', emoji: '🔫',
            durabilidade: 80, durabilidade_max: 80, beneficio: 'Caça básica (+40% sucesso)', bonus_caca: 40,
            descricao: 'Arma padrão para caça'
        },
        espingarda: { 
            id: 'espingarda', nome: '💥 Espingarda 12', preco: 8000, categoria: 'ferramentas', emoji: '💥',
            durabilidade: 120, durabilidade_max: 120, beneficio: 'Caça avançada (+70% sucesso)', bonus_caca: 70,
            descricao: 'Arma poderosa para grandes presas'
        },
        rifle_sniper: { 
            id: 'rifle_sniper', nome: '🎯 Rifle Sniper', preco: 25000, categoria: 'ferramentas', emoji: '🎯',
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Caça de precisão (+120% sucesso)', bonus_caca: 120,
            descricao: 'Precisão milimétrica para alvos distantes'
        },
        
        // Agricultura
        enxada: { 
            id: 'enxada', nome: '🪓 Enxada Básica', preco: 200, categoria: 'ferramentas', emoji: '🪓',
            durabilidade: 40, durabilidade_max: 40, beneficio: 'Plantio básico (+25% produção)', bonus_agricultura: 25,
            descricao: 'Ferramenta essencial para agricultura'
        },
        trator: { 
            id: 'trator', nome: '🚜 Trator Agrícola', preco: 80000, categoria: 'ferramentas', emoji: '🚜',
            durabilidade: 500, durabilidade_max: 500, beneficio: 'Agricultura industrial (+200% produção)', bonus_agricultura: 200,
            descricao: 'Máquina para grandes plantações'
        },
        drone_agricola: { 
            id: 'drone_agricola', nome: '🛸 Drone Agrícola', preco: 150000, categoria: 'ferramentas', emoji: '🛸',
            durabilidade: 300, durabilidade_max: 300, beneficio: 'Agricultura de precisão (+300% produção)', bonus_agricultura: 300,
            descricao: 'Tecnologia avançada para fazendas'
        },
        
        // Proteção
        colete_kevlar: { 
            id: 'colete_kevlar', nome: '🦺 Colete à Prova de Balas', preco: 15000, categoria: 'ferramentas', emoji: '🦺',
            durabilidade: 100, durabilidade_max: 100, beneficio: '+60% proteção contra ataques', bonus_defesa: 60,
            descricao: 'Proteção corporal avançada'
        },
        capacete_seguranca: { 
            id: 'capacete_seguranca', nome: '⛑️ Capacete de Segurança', preco: 800, categoria: 'ferramentas', emoji: '⛑️',
            durabilidade: 60, durabilidade_max: 60, beneficio: '+30% proteção acidentes trabalho', bonus_defesa: 30,
            descricao: 'Proteção para trabalhos perigosos'
        },
        
        // Medicina
        kit_medico: { 
            id: 'kit_medico', nome: '🏥 Kit Médico Avançado', preco: 5000, categoria: 'ferramentas', emoji: '🏥',
            durabilidade: 20, durabilidade_max: 20, beneficio: 'Cura 100% da vida', cura: 100,
            descricao: 'Kit completo para emergências médicas'
        },
        desfibrilador: { 
            id: 'desfibrilador', nome: '⚡ Desfibrilador', preco: 30000, categoria: 'ferramentas', emoji: '⚡',
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Revive automaticamente após morte', revive: true,
            descricao: 'Equipamento que pode salvar vidas'
        },
        
        // Diversos
        lupa_detetive: { 
            id: 'lupa_detetive', nome: '🔍 Lupa de Detetive', preco: 2000, categoria: 'ferramentas', emoji: '🔍',
            durabilidade: 100, durabilidade_max: 100, beneficio: '+50% chance encontrar itens raros', bonus_sorte: 50,
            descricao: 'Aumenta chances de descobertas'
        },
        ima_poderoso: { 
            id: 'ima_poderoso', nome: '🧲 Ímã Poderoso', preco: 8000, categoria: 'ferramentas', emoji: '🧲',
            durabilidade: 80, durabilidade_max: 80, beneficio: 'Atrai metais preciosos (+100% mineração)', bonus_mineracao: 100,
            descricao: 'Atrai metais valiosos automaticamente'
        },
        detector_metais: { 
            id: 'detector_metais', nome: '📡 Detector de Metais', preco: 12000, categoria: 'ferramentas', emoji: '📡',
            durabilidade: 150, durabilidade_max: 150, beneficio: '+80% chance tesouros enterrados', bonus_sorte: 80,
            descricao: 'Encontra tesouros escondidos'
        }
    },

    // CATEGORIA 4: VEÍCULOS (20 itens)
    veiculos: {
        bicicleta: { 
            id: 'bicicleta', nome: '🚲 Bicicleta', preco: 800, categoria: 'veiculos', emoji: '🚲',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+15% velocidade trabalhos', bonus_velocidade: 15,
            descricao: 'Transporte ecológico e saudável'
        },
        motocicleta: { 
            id: 'motocicleta', nome: '🏍️ Motocicleta', preco: 15000, categoria: 'veiculos', emoji: '🏍️',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+30% velocidade trabalhos', bonus_velocidade: 30,
            descricao: 'Moto ágil para a cidade'
        },
        carro_popular: { 
            id: 'carro_popular', nome: '🚗 Carro Popular', preco: 40000, categoria: 'veiculos', emoji: '🚗',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+25% ganhos trabalho', bonus_trabalho: 25,
            descricao: 'Carro básico confiável'
        },
        carro_luxo: { 
            id: 'carro_luxo', nome: '🏎️ Carro de Luxo', preco: 200000, categoria: 'veiculos', emoji: '🏎️',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+60% ganhos trabalho + status', bonus_trabalho: 60,
            descricao: 'Veículo de alto padrão'
        },
        ferrari: { 
            id: 'ferrari', nome: '🏁 Ferrari', preco: 1000000, categoria: 'veiculos', emoji: '🏁',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+100% ganhos + máximo status', bonus_trabalho: 100,
            descricao: 'Supercarro dos sonhos'
        },
        lamborghini: { 
            id: 'lamborghini', nome: '🚗 Lamborghini', preco: 1500000, categoria: 'veiculos', emoji: '🚗',
            durabilidade: 1200, durabilidade_max: 1200, beneficio: '+120% ganhos + exclusividade', bonus_trabalho: 120,
            descricao: 'Supercarro exclusivo italiano'
        },
        caminhao: { 
            id: 'caminhao', nome: '🚛 Caminhão', preco: 120000, categoria: 'veiculos', emoji: '🚛',
            durabilidade: 600, durabilidade_max: 600, beneficio: '+80% ganhos trabalho pesado', bonus_trabalho: 80,
            descricao: 'Veículo para cargas pesadas'
        },
        onibus: { 
            id: 'onibus', nome: '🚌 Ônibus', preco: 200000, categoria: 'veiculos', emoji: '🚌',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+300 gold/dia (transporte público)', renda_passiva: 300,
            descricao: 'Negócio de transporte urbano'
        },
        barco: { 
            id: 'barco', nome: '🚤 Lancha', preco: 80000, categoria: 'veiculos', emoji: '🚤',
            durabilidade: 400, durabilidade_max: 400, beneficio: '+150% ganhos pesca aquática', bonus_pesca: 150,
            descricao: 'Embarcação para pesca em alto mar'
        },
        iate: { 
            id: 'iate', nome: '🛥️ Iate de Luxo', preco: 2000000, categoria: 'veiculos', emoji: '🛥️',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+800 gold/dia (turismo de luxo)', renda_passiva: 800,
            descricao: 'Embarcação de luxo para os ricos'
        },
        jato_particular: { 
            id: 'jato_particular', nome: '✈️ Jato Particular', preco: 10000000, categoria: 'veiculos', emoji: '✈️',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+200% ganhos trabalho internacional', bonus_trabalho: 200,
            descricao: 'Avião privado para negócios globais'
        },
        helicoptero: { 
            id: 'helicoptero', nome: '🚁 Helicóptero', preco: 5000000, categoria: 'veiculos', emoji: '🚁',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+1500 gold/dia (táxi aéreo)', renda_passiva: 1500,
            descricao: 'Transporte aéreo executivo'
        },
        navio_carga: { 
            id: 'navio_carga', nome: '🚢 Navio Cargueiro', preco: 15000000, categoria: 'veiculos', emoji: '🚢',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: '+5000 gold/dia (comércio marítimo)', renda_passiva: 5000,
            descricao: 'Embarcação para comércio internacional'
        },
        submarino: { 
            id: 'submarino', nome: '🛸 Submarino', preco: 8000000, categoria: 'veiculos', emoji: '🛸',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+500% ganhos pesca submarina', bonus_pesca: 500,
            descricao: 'Exploração dos oceanos profundos'
        },
        trem: { 
            id: 'trem', nome: '🚂 Locomotiva', preco: 3000000, categoria: 'veiculos', emoji: '🚂',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+1000 gold/dia (transporte ferroviário)', renda_passiva: 1000,
            descricao: 'Transporte ferroviário de massa'
        },
        foguete: { 
            id: 'foguete', nome: '🚀 Foguete Espacial', preco: 50000000, categoria: 'veiculos', emoji: '🚀',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+10000 gold/dia (turismo espacial)', renda_passiva: 10000,
            descricao: 'Viagens ao espaço sideral'
        },
        ovni: { 
            id: 'ovni', nome: '🛸 OVNI', preco: 100000000, categoria: 'veiculos', emoji: '🛸',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+20000 gold/dia (tecnologia alienígena)', renda_passiva: 20000,
            descricao: 'Tecnologia extraterrestre avançada'
        },
        jetpack: { 
            id: 'jetpack', nome: '🎒 Jetpack', preco: 500000, categoria: 'veiculos', emoji: '🎒',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+100% velocidade + voo pessoal', bonus_velocidade: 100,
            descricao: 'Mochila voadora futurística'
        },
        hover_board: { 
            id: 'hover_board', nome: '🛹 Hoverboard', preco: 50000, categoria: 'veiculos', emoji: '🛹',
            durabilidade: 150, durabilidade_max: 150, beneficio: '+40% velocidade + estilo', bonus_velocidade: 40,
            descricao: 'Skate voador tecnológico'
        },
        robo_transformers: { 
            id: 'robo_transformers', nome: '🤖 Robô Transformers', preco: 20000000, categoria: 'veiculos', emoji: '🤖',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: 'Todos os bônus de veículos', bonus_universal: 50,
            descricao: 'Robô que se transforma em qualquer veículo'
        }
    },

    // CATEGORIA 5: NEGÓCIOS (15 itens)
    negocios: {
        barraquinha: { 
            id: 'barraquinha', nome: '🏪 Barraquinha', preco: 5000, categoria: 'negocios', emoji: '🏪',
            durabilidade: 100, durabilidade_max: 100, beneficio: '+150 gold/dia', renda_passiva: 150,
            descricao: 'Pequeno comércio de rua'
        },
        lanchonete: { 
            id: 'lanchonete', nome: '🍔 Lanchonete', preco: 25000, categoria: 'negocios', emoji: '🍔',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+400 gold/dia', renda_passiva: 400,
            descricao: 'Negócio de fast food'
        },
        restaurante: { 
            id: 'restaurante', nome: '🍽️ Restaurante', preco: 100000, categoria: 'negocios', emoji: '🍽️',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+800 gold/dia', renda_passiva: 800,
            descricao: 'Estabelecimento gastronômico refinado'
        },
        academia: { 
            id: 'academia', nome: '💪 Academia', preco: 80000, categoria: 'negocios', emoji: '💪',
            durabilidade: 600, durabilidade_max: 600, beneficio: '+600 gold/dia', renda_passiva: 600,
            descricao: 'Centro de fitness e musculação'
        },
        loja_roupas: { 
            id: 'loja_roupas', nome: '👕 Loja de Roupas', preco: 60000, categoria: 'negocios', emoji: '👕',
            durabilidade: 400, durabilidade_max: 400, beneficio: '+500 gold/dia', renda_passiva: 500,
            descricao: 'Boutique de moda'
        },
        posto_gasolina: { 
            id: 'posto_gasolina', nome: '⛽ Posto de Gasolina', preco: 300000, categoria: 'negocios', emoji: '⛽',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+1200 gold/dia', renda_passiva: 1200,
            descricao: 'Abastecimento automotivo'
        },
        supermercado: { 
            id: 'supermercado', nome: '🏬 Supermercado', preco: 500000, categoria: 'negocios', emoji: '🏬',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+2000 gold/dia', renda_passiva: 2000,
            descricao: 'Rede de varejo alimentício'
        },
        farmacia: { 
            id: 'farmacia', nome: '💊 Farmácia', preco: 200000, categoria: 'negocios', emoji: '💊',
            durabilidade: 600, durabilidade_max: 600, beneficio: '+900 gold/dia', renda_passiva: 900,
            descricao: 'Drogaria e produtos de saúde'
        },
        banco_proprio: { 
            id: 'banco_proprio', nome: '🏦 Banco Próprio', preco: 10000000, categoria: 'negocios', emoji: '🏦',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+8000 gold/dia', renda_passiva: 8000,
            descricao: 'Instituição financeira própria'
        },
        cassino: { 
            id: 'cassino', nome: '🎰 Cassino', preco: 5000000, categoria: 'negocios', emoji: '🎰',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+4000 gold/dia', renda_passiva: 4000,
            descricao: 'Casa de jogos e apostas'
        },
        empresa_ti: { 
            id: 'empresa_ti', nome: '💻 Empresa de TI', preco: 2000000, categoria: 'negocios', emoji: '💻',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+3000 gold/dia', renda_passiva: 3000,
            descricao: 'Desenvolvimento de software'
        },
        construtora: { 
            id: 'construtora', nome: '🏗️ Construtora', preco: 8000000, categoria: 'negocios', emoji: '🏗️',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: '+6000 gold/dia', renda_passiva: 6000,
            descricao: 'Empresa de construção civil'
        },
        mineradora: { 
            id: 'mineradora', nome: '⛏️ Mineradora', preco: 15000000, categoria: 'negocios', emoji: '⛏️',
            durabilidade: 4000, durabilidade_max: 4000, beneficio: '+10000 gold/dia', renda_passiva: 10000,
            descricao: 'Extração industrial de minérios'
        },
        petroleira: { 
            id: 'petroleira', nome: '🛢️ Petrolífera', preco: 50000000, categoria: 'negocios', emoji: '🛢️',
            durabilidade: 8000, durabilidade_max: 8000, beneficio: '+25000 gold/dia', renda_passiva: 25000,
            descricao: 'Extração e refino de petróleo'
        },
        multinacional: { 
            id: 'multinacional', nome: '🌍 Multinacional', preco: 100000000, categoria: 'negocios', emoji: '🌍',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+50000 gold/dia', renda_passiva: 50000,
            descricao: 'Corporação global dominante'
        }
    },

    // CATEGORIA 6: TECNOLOGIA (15 itens)
    tecnologia: {
        celular: { 
            id: 'celular', nome: '📱 Smartphone', preco: 1500, categoria: 'tecnologia', emoji: '📱',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+20% ganhos trabalho', bonus_trabalho: 20,
            descricao: 'Telefone inteligente moderno'
        },
        laptop: { 
            id: 'laptop', nome: '💻 Laptop Gamer', preco: 8000, categoria: 'tecnologia', emoji: '💻',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+50% ganhos programação', bonus_programacao: 50,
            descricao: 'Computador portátil de alta performance'
        },
        pc_gamer: { 
            id: 'pc_gamer', nome: '🖥️ PC Gamer', preco: 25000, categoria: 'tecnologia', emoji: '🖥️',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+100% ganhos streaming/programação', bonus_programacao: 100,
            descricao: 'Computador desktop poderoso'
        },
        servidor: { 
            id: 'servidor', nome: '🖥️ Servidor Dedicado', preco: 100000, categoria: 'tecnologia', emoji: '🖥️',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+500 gold/dia (hosting)', renda_passiva: 500,
            descricao: 'Servidor para negócios online'
        },
        tablet: { 
            id: 'tablet', nome: '📱 Tablet Pro', preco: 3000, categoria: 'tecnologia', emoji: '📱',
            durabilidade: 250, durabilidade_max: 250, beneficio: '+30% ganhos design', bonus_trabalho: 30,
            descricao: 'Tablet profissional para criação'
        },
        camera_profissional: { 
            id: 'camera_profissional', nome: '📷 Câmera Profissional', preco: 15000, categoria: 'tecnologia', emoji: '📷',
            durabilidade: 400, durabilidade_max: 400, beneficio: '+200% ganhos fotografia/video', bonus_arte: 200,
            descricao: 'Equipamento para fotografia profissional'
        },
        drone_camera: { 
            id: 'drone_camera', nome: '🛸 Drone com Câmera', preco: 12000, categoria: 'tecnologia', emoji: '🛸',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+150% ganhos vídeos aéreos', bonus_arte: 150,
            descricao: 'Drone para filmagens aéreas'
        },
        setup_streaming: { 
            id: 'setup_streaming', nome: '🎬 Setup de Stream', preco: 35000, categoria: 'tecnologia', emoji: '🎬',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+300% ganhos streaming', bonus_streaming: 300,
            descricao: 'Equipamentos completos para streaming'
        },
        estudio_gravacao: { 
            id: 'estudio_gravacao', nome: '🎵 Estúdio de Gravação', preco: 200000, categoria: 'tecnologia', emoji: '🎵',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+1000 gold/dia (música)', renda_passiva: 1000,
            descricao: 'Estúdio profissional de música'
        },
        impressora_3d: { 
            id: 'impressora_3d', nome: '🖨️ Impressora 3D', preco: 25000, categoria: 'tecnologia', emoji: '🖨️',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+400 gold/dia (prototipagem)', renda_passiva: 400,
            descricao: 'Impressão tridimensional avançada'
        },
        vr_headset: { 
            id: 'vr_headset', nome: '🥽 VR Headset', preco: 8000, categoria: 'tecnologia', emoji: '🥽',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+100% ganhos desenvolvimento VR', bonus_programacao: 100,
            descricao: 'Óculos de realidade virtual'
        },
        robo_assistente: { 
            id: 'robo_assistente', nome: '🤖 Robô Assistente', preco: 500000, categoria: 'tecnologia', emoji: '🤖',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+50% eficiência todos trabalhos', bonus_universal: 50,
            descricao: 'Inteligência artificial pessoal'
        },
        hologram_projetor: { 
            id: 'hologram_projetor', nome: '🌟 Projetor de Hologramas', preco: 800000, categoria: 'tecnologia', emoji: '🌟',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+2000 gold/dia (entretenimento)', renda_passiva: 2000,
            descricao: 'Tecnologia holográfica futurística'
        },
        quantum_computer: { 
            id: 'quantum_computer', nome: '⚛️ Computador Quântico', preco: 10000000, categoria: 'tecnologia', emoji: '⚛️',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+10000 gold/dia (pesquisa)', renda_passiva: 10000,
            descricao: 'Computação quântica revolucionária'
        },
        satelite_pessoal: { 
            id: 'satelite_pessoal', nome: '🛰️ Satélite Pessoal', preco: 50000000, categoria: 'tecnologia', emoji: '🛰️',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+20000 gold/dia (telecomunicações)', renda_passiva: 20000,
            descricao: 'Seu próprio satélite em órbita'
        }
    },

    // CATEGORIA 7: DECORAÇÃO (15 itens)
    decoracao: {
        quadro_simples: { 
            id: 'quadro_simples', nome: '🖼️ Quadro Simples', preco: 500, categoria: 'decoracao', emoji: '🖼️',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+5% felicidade em casa', bonus_felicidade: 5,
            descricao: 'Arte básica para decorar paredes'
        },
        vaso_plantas: { 
            id: 'vaso_plantas', nome: '🪴 Vaso de Plantas', preco: 200, categoria: 'decoracao', emoji: '🪴',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+3% purificação do ar', bonus_saude: 3,
            descricao: 'Plantas decorativas que melhoram o ambiente'
        },
        tapete_persa: { 
            id: 'tapete_persa', nome: '🪆 Tapete Persa', preco: 5000, categoria: 'decoracao', emoji: '🪆',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+10% conforto residencial', bonus_conforto: 10,
            descricao: 'Tapete artesanal luxuoso'
        },
        lustre_cristal: { 
            id: 'lustre_cristal', nome: '💎 Lustre de Cristal', preco: 25000, categoria: 'decoracao', emoji: '💎',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+20% elegância + iluminação perfeita', bonus_elegancia: 20,
            descricao: 'Iluminação de alto padrão'
        },
        estante_livros: { 
            id: 'estante_livros', nome: '📚 Estante de Livros', preco: 3000, categoria: 'decoracao', emoji: '📚',
            durabilidade: 600, durabilidade_max: 600, beneficio: '+15% bônus estudo', bonus_estudo: 15,
            descricao: 'Biblioteca pessoal impressionante'
        },
        lareira: { 
            id: 'lareira', nome: '🔥 Lareira', preco: 15000, categoria: 'decoracao', emoji: '🔥',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+25% aconchego + aquecimento', bonus_conforto: 25,
            descricao: 'Aquecimento aconchegante para casa'
        },
        piano_cauda: { 
            id: 'piano_cauda', nome: '🎹 Piano de Cauda', preco: 80000, categoria: 'decoracao', emoji: '🎹',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+100 gold/dia (aulas música)', renda_passiva: 100,
            descricao: 'Instrumento musical refinado'
        },
        aquario_gigante: { 
            id: 'aquario_gigante', nome: '🐠 Aquário Gigante', preco: 12000, categoria: 'decoracao', emoji: '🐠',
            durabilidade: 400, durabilidade_max: 400, beneficio: '+30% relaxamento + peixes exóticos', bonus_relaxamento: 30,
            descricao: 'Aquário com peixes tropicais'
        },
        escultura_marmore: { 
            id: 'escultura_marmore', nome: '🗿 Escultura de Mármore', preco: 50000, categoria: 'decoracao', emoji: '🗿',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+50% status cultural', bonus_cultura: 50,
            descricao: 'Arte clássica em mármore'
        },
        fonte_agua: { 
            id: 'fonte_agua', nome: '⛲ Fonte de Água', preco: 20000, categoria: 'decoracao', emoji: '⛲',
            durabilidade: 1200, durabilidade_max: 1200, beneficio: '+40% tranquilidade', bonus_tranquilidade: 40,
            descricao: 'Fonte ornamental relaxante'
        },
        jardim_zen: { 
            id: 'jardim_zen', nome: '🧘 Jardim Zen', preco: 8000, categoria: 'decoracao', emoji: '🧘',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+60% meditação e paz', bonus_meditacao: 60,
            descricao: 'Espaço para meditação e reflexão'
        },
        home_theater: { 
            id: 'home_theater', nome: '📽️ Home Theater', preco: 100000, categoria: 'decoracao', emoji: '📽️',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+200 gold/dia (entretenimento)', renda_passiva: 200,
            descricao: 'Cinema particular em casa'
        },
        mesa_sinuca: { 
            id: 'mesa_sinuca', nome: '🎱 Mesa de Sinuca', preco: 18000, categoria: 'decoracao', emoji: '🎱',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+80 gold/dia (torneios)', renda_passiva: 80,
            descricao: 'Mesa profissional para jogos'
        },
        adega_vinhos: { 
            id: 'adega_vinhos', nome: '🍷 Adega de Vinhos', preco: 60000, categoria: 'decoracao', emoji: '🍷',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+300 gold/dia (degustações)', renda_passiva: 300,
            descricao: 'Coleção de vinhos premium'
        },
        galeria_arte: { 
            id: 'galeria_arte', nome: '🎨 Galeria de Arte', preco: 200000, categoria: 'decoracao', emoji: '🎨',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: '+1000 gold/dia (exposições)', renda_passiva: 1000,
            descricao: 'Galeria pessoal com obras de arte'
        }
    },

    // CATEGORIA 8: SEGURANÇA (15 itens)
    seguranca: {
        cameras_simples: { 
            id: 'cameras_simples', nome: '📹 Câmeras Básicas', preco: 2000, categoria: 'seguranca', emoji: '📹',
            durabilidade: 300, durabilidade_max: 300, beneficio: '+30% proteção contra roubos', bonus_protecao: 30,
            descricao: 'Sistema básico de vigilância'
        },
        alarme_residencial: { 
            id: 'alarme_residencial', nome: '🚨 Alarme Residencial', preco: 5000, categoria: 'seguranca', emoji: '🚨',
            durabilidade: 500, durabilidade_max: 500, beneficio: '+40% alerta contra invasões', bonus_alerta: 40,
            descricao: 'Sistema de alarme automático'
        },
        fechadura_digital: { 
            id: 'fechadura_digital', nome: '🔐 Fechadura Digital', preco: 3000, categoria: 'seguranca', emoji: '🔐',
            durabilidade: 800, durabilidade_max: 800, beneficio: '+25% segurança acesso', bonus_acesso: 25,
            descricao: 'Controle de acesso biométrico'
        },
        cerca_eletrica: { 
            id: 'cerca_eletrica', nome: '⚡ Cerca Elétrica', preco: 8000, categoria: 'seguranca', emoji: '⚡',
            durabilidade: 1000, durabilidade_max: 1000, beneficio: '+60% proteção perímetro', bonus_perimetro: 60,
            descricao: 'Barreira elétrica de proteção'
        },
        seguranca_armada: { 
            id: 'seguranca_armada', nome: '👮 Segurança Armada', preco: 15000, categoria: 'seguranca', emoji: '👮',
            durabilidade: 200, durabilidade_max: 200, beneficio: '+150 gold/dia + proteção máxima', renda_passiva: -150,
            descricao: 'Equipe de segurança profissional (custo mensal)'
        },
        bunker_seguro: { 
            id: 'bunker_seguro', nome: '🏰 Bunker Seguro', preco: 500000, categoria: 'seguranca', emoji: '🏰',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+95% proteção total', bonus_protecao: 95,
            descricao: 'Abrigo blindado máxima segurança'
        },
        drones_vigilancia: { 
            id: 'drones_vigilancia', nome: '🛸 Drones de Vigilância', preco: 50000, categoria: 'seguranca', emoji: '🛸',
            durabilidade: 600, durabilidade_max: 600, beneficio: '+80% monitoramento aéreo', bonus_monitoramento: 80,
            descricao: 'Vigilância aérea automatizada'
        },
        radar_movimento: { 
            id: 'radar_movimento', nome: '📡 Radar de Movimento', preco: 25000, categoria: 'seguranca', emoji: '📡',
            durabilidade: 1200, durabilidade_max: 1200, beneficio: '+70% detecção intrusos', bonus_deteccao: 70,
            descricao: 'Sistema de detecção avançado'
        },
        sistema_biometrico: { 
            id: 'sistema_biometrico', nome: '👁️ Sistema Biométrico', preco: 40000, categoria: 'seguranca', emoji: '👁️',
            durabilidade: 1500, durabilidade_max: 1500, beneficio: '+85% controle acesso', bonus_biometria: 85,
            descricao: 'Reconhecimento facial e digital'
        },
        blindagem_residencial: { 
            id: 'blindagem_residencial', nome: '🛡️ Blindagem Residencial', preco: 200000, categoria: 'seguranca', emoji: '🛡️',
            durabilidade: 3000, durabilidade_max: 3000, beneficio: '+90% resistência ataques', bonus_blindagem: 90,
            descricao: 'Reforço estrutural anti-balas'
        },
        sistema_contramedidas: { 
            id: 'sistema_contramedidas', nome: '⚔️ Sistema de Contramedidas', preco: 800000, categoria: 'seguranca', emoji: '⚔️',
            durabilidade: 2000, durabilidade_max: 2000, beneficio: '+100% defesa ativa', bonus_contramedidas: 100,
            descricao: 'Defesas automáticas ativas'
        },
        seguranca_ai: { 
            id: 'seguranca_ai', nome: '🤖 IA de Segurança', preco: 1000000, categoria: 'seguranca', emoji: '🤖',
            durabilidade: 5000, durabilidade_max: 5000, beneficio: '+98% predição ameaças', bonus_predicao: 98,
            descricao: 'Inteligência artificial de proteção'
        },
        escudo_eletromagnetico: { 
            id: 'escudo_eletromagnetico', nome: '🌐 Escudo Eletromagnético', preco: 5000000, categoria: 'seguranca', emoji: '🌐',
            durabilidade: 8000, durabilidade_max: 8000, beneficio: '+99% proteção total', bonus_escudo: 99,
            descricao: 'Campo de força eletromagnético'
        },
        satelite_vigilancia: { 
            id: 'satelite_vigilancia', nome: '🛰️ Satélite de Vigilância', preco: 25000000, categoria: 'seguranca', emoji: '🛰️',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: '+100% vigilância global', bonus_satelite: 100,
            descricao: 'Monitoramento via satélite'
        },
        exercito_particular: { 
            id: 'exercito_particular', nome: '🪖 Exército Particular', preco: 100000000, categoria: 'seguranca', emoji: '🪖',
            durabilidade: 9999, durabilidade_max: 9999, beneficio: 'Proteção militar total', bonus_militar: 100,
            descricao: 'Força militar privada completa'
        }
    }
};

// Locais para roubar
const locaisRoubo = {
    casa: { nome: 'Casa Simples', min: 100, max: 500, risco: 20, tempo: 5 },
    loja: { nome: 'Loja de Conveniência', min: 200, max: 800, risco: 30, tempo: 8 },
    mercado: { nome: 'Supermercado', min: 500, max: 1500, risco: 40, tempo: 12 },
    joalheria: { nome: 'Joalheria', min: 1000, max: 3000, risco: 60, tempo: 15 },
    banco: { nome: 'Agência Bancária', min: 2000, max: 8000, risco: 80, tempo: 20 },
    mansao: { nome: 'Mansão de Luxo', min: 3000, max: 12000, risco: 70, tempo: 25 },
    cassino: { nome: 'Cassino', min: 5000, max: 15000, risco: 90, tempo: 30 },
    shopping: { nome: 'Shopping Center', min: 8000, max: 25000, risco: 85, tempo: 40 },
    aeroporto: { nome: 'Aeroporto', min: 10000, max: 30000, risco: 95, tempo: 50 },
    banco_central: { nome: 'Banco Central', min: 20000, max: 100000, risco: 99, tempo: 60 },
    casa_moeda: { nome: 'Casa da Moeda', min: 50000, max: 200000, risco: 99, tempo: 80 },
    pentágono: { nome: 'Pentágono', min: 100000, max: 500000, risco: 100, tempo: 120 }
};

// Tipos de investimentos
const investimentos = {
    poupanca: { nome: 'Poupança', rendimento: 0.5, risco: 0, tempo: 24 },
    cdb: { nome: 'CDB', rendimento: 8, risco: 5, tempo: 48 },
    acoes: { nome: 'Ações', rendimento: 15, risco: 30, tempo: 72 },
    bitcoin: { nome: 'Bitcoin', rendimento: 25, risco: 50, tempo: 96 },
    forex: { nome: 'Forex', rendimento: 40, risco: 70, tempo: 24 },
    imoveis: { nome: 'Imóveis', rendimento: 12, risco: 10, tempo: 168 },
    ouro: { nome: 'Ouro', rendimento: 6, risco: 8, tempo: 120 }
};

// ==================== FUNÇÕES AUXILIARES ====================

// Carrega dados do RPG
function carregarDadosRPG() {
    try {
        if (!fs.existsSync(rpgDataFile)) {
            const dir = path.dirname(rpgDataFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(rpgDataFile, JSON.stringify({ grupos: {}, jogadores: {} }, null, 2));
        }
        const data = fs.readFileSync(rpgDataFile, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('❌ Erro ao carregar dados RPG:', err);
        return { grupos: {}, jogadores: {} };
    }
}

// Salva dados do RPG
function salvarDadosRPG(data) {
    try {
        fs.writeFileSync(rpgDataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('❌ Erro ao salvar dados RPG:', err);
        return false;
    }
}

// Função para garantir estrutura completa do usuário
function garantirEstruturaUsuario(usuario) {
    return {
        nome: usuario.nome || 'Jogador',
        banco: usuario.banco || bancos[0],
        saldo: usuario.saldo || 0,
        vida: usuario.vida || 100,
        vida_max: usuario.vida_max || 100,
        registrado: usuario.registrado || new Date().toISOString(),
        inventario: usuario.inventario || {},
        educacao_nivel: usuario.educacao_nivel || 1,
        faculdades_completas: usuario.faculdades_completas || [],
        trabalho_atual: usuario.trabalho_atual || null,
        // Estatísticas
        pescasFeitas: usuario.pescasFeitas || 0,
        mineracoesFeitas: usuario.mineracoesFeitas || 0,
        trabalhosFeitos: usuario.trabalhosFeitos || 0,
        cacadasFeitas: usuario.cacadasFeitas || 0,
        roubosFeitos: usuario.roubosFeitos || 0,
        investimentosFeitos: usuario.investimentosFeitos || 0,
        // Cooldowns
        ultimaPesca: usuario.ultimaPesca || 0,
        ultimaMineracao: usuario.ultimaMineracao || 0,
        ultimoTrabalho: usuario.ultimoTrabalho || 0,
        ultimaCaca: usuario.ultimaCaca || 0,
        ultimoRoubo: usuario.ultimoRoubo || 0,
        ultimoEstudo: usuario.ultimoEstudo || 0,
        ultimoInvestimento: usuario.ultimoInvestimento || 0,
        ultimoYoutube: usuario.ultimoYoutube || 0,
        ultimoTiktok: usuario.ultimoTiktok || 0,
        ultimoTwitch: usuario.ultimoTwitch || 0,
        // Estados especiais
        morreu: usuario.morreu || false,
        preso: usuario.preso || false,
        tempo_prisao: usuario.tempo_prisao || 0,
        causa_morte: usuario.causa_morte || null,
        investimentos_ativos: usuario.investimentos_ativos || {},
        // Totais
        totalGanho: usuario.totalGanho || 0,
        totalGasto: usuario.totalGasto || 0,
        nivelInfluenciador: usuario.nivelInfluenciador || 1,
        seguidores: usuario.seguidores || 0
    };
}

// Encontra item em qualquer categoria
function encontrarItem(itemId) {
    for (const categoria of Object.values(loja)) {
        if (categoria[itemId]) {
            return categoria[itemId];
        }
    }
    return null;
}

// Verifica se usuário tem item
function temItem(usuario, itemId) {
    return usuario.inventario[itemId] && usuario.inventario[itemId].quantidade > 0;
}

// Usa item (reduz durabilidade)
function usarItem(usuario, itemId) {
    if (!usuario.inventario[itemId] || usuario.inventario[itemId].quantidade <= 0) {
        return { erro: 'Item não encontrado no inventário' };
    }

    const item = encontrarItem(itemId);
    if (!item) return { erro: 'Item não existe' };

    // Reduz durabilidade
    usuario.inventario[itemId].durabilidade -= 1;
    
    // Remove item se durabilidade chegou a 0
    if (usuario.inventario[itemId].durabilidade <= 0) {
        delete usuario.inventario[itemId];
        return { quebrou: true, item: item };
    }
    
    return { quebrou: false, item: item };
}

// Adiciona item ao inventário
function adicionarItem(usuario, itemId, quantidade = 1) {
    const item = encontrarItem(itemId);
    if (!item) return false;

    if (!usuario.inventario[itemId]) {
        usuario.inventario[itemId] = {
            quantidade: 0,
            durabilidade: item.durabilidade_max
        };
    }
    
    usuario.inventario[itemId].quantidade += quantidade;
    return true;
}

// Verifica cooldown
function verificarCooldown(ultimaVez, cooldownMs) {
    const agora = Date.now();
    const tempoRestante = cooldownMs - (agora - ultimaVez);
    return tempoRestante > 0 ? tempoRestante : 0;
}

// Formatar tempo
function formatarTempo(ms) {
    const minutos = Math.ceil(ms / 60000);
    if (minutos >= 60) {
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutos} minutos`;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Verifica se RPG está ativo no grupo
function isRPGAtivo(groupId) {
    const dados = carregarDadosRPG();
    return dados.grupos[groupId]?.ativo || false;
}

// Ativa/desativa RPG no grupo
function toggleRPG(groupId, ativo) {
    const dados = carregarDadosRPG();
    if (!dados.grupos[groupId]) {
        dados.grupos[groupId] = { ativo: false, jogadores: [] };
    }
    dados.grupos[groupId].ativo = ativo;
    return salvarDadosRPG(dados);
}

// Verifica se usuário está registrado
function isUsuarioRegistrado(userId) {
    const dados = carregarDadosRPG();
    return !!dados.jogadores[userId];
}

// Registra novo usuário
function registrarUsuario(userId, nome, bancoId) {
    const dados = carregarDadosRPG();
    const banco = bancos.find(b => b.id === bancoId);
    if (!banco) return false;

    dados.jogadores[userId] = garantirEstruturaUsuario({
        nome: nome,
        banco: banco,
        saldo: 1000, // Saldo inicial
        inventario: {
            // Itens iniciais
            vara_bambu: { quantidade: 1, durabilidade: 30 },
            picareta_ferro: { quantidade: 1, durabilidade: 50 },
            rifle_caca: { quantidade: 1, durabilidade: 80 },
            enxada: { quantidade: 1, durabilidade: 40 }
        }
    });

    return salvarDadosRPG(dados);
}

// Obtém dados do usuário
function obterDadosUsuario(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;
    return garantirEstruturaUsuario(usuario);
}

// ==================== SISTEMA DE PESCA ====================
async function pescar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };
        if (usuario.preso) return { erro: `Você está preso por mais ${Math.ceil(usuario.tempo_prisao / 60)} minutos!` };

        const cooldown = verificarCooldown(usuario.ultimaPesca, 15 * 60 * 1000); // 15 min
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `🎣 Aguarde **${formatarTempo(cooldown)}** para pescar novamente!` };
        }

        // Verifica se tem vara
        const varas = ['vara_bambu', 'vara_carbono', 'rede_pesca'];
        let varaUsada = null;
        let bonusPesca = 0;

        for (const vara of varas) {
            if (temItem(usuario, vara)) {
                varaUsada = vara;
                const item = encontrarItem(vara);
                bonusPesca = item.bonus_pesca || 0;
                break;
            }
        }

        if (!varaUsada) {
            return { erro: 'Você precisa comprar uma vara de pescar na loja!' };
        }

        // Usa a vara
        const resultadoUso = usarItem(usuario, varaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Calcula chance de sucesso (50% base + bônus)
        const chanceBase = 50;
        const chanceTotal = Math.min(90, chanceBase + bonusPesca);
        const sucesso = Math.random() * 100 < chanceTotal;

        usuario.ultimaPesca = Date.now();
        usuario.pescasFeitas++;

        if (!sucesso) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            return { 
                sucesso: false, 
                mensagem: `🎣 **PESCA SEM SUCESSO**\n\nOs peixes não morderam a isca!${mensagemQuebra}\n\n⏰ Cooldown: 15 minutos` 
            };
        }

        // Peixes disponíveis
        const peixes = [
            { nome: 'Peixe Dourado Lendário', valor: 1000, chance: 5, emoji: '🐠' },
            { nome: 'Salmão Grande', valor: 500, chance: 15, emoji: '🐟' },
            { nome: 'Truta Prateada', valor: 300, chance: 25, emoji: '🐟' },
            { nome: 'Sardinha', valor: 150, chance: 30, emoji: '🐟' },
            { nome: 'Peixe Comum', valor: 80, chance: 25, emoji: '🐟' }
        ];

        // Seleciona peixe baseado na chance
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        let peixePescado = null;

        for (const peixe of peixes) {
            chanceAcumulada += peixe.chance;
            if (sorte <= chanceAcumulada) {
                peixePescado = peixe;
                break;
            }
        }

        if (!peixePescado) peixePescado = peixes[peixes.length - 1];

        usuario.saldo += peixePescado.valor;
        usuario.totalGanho += peixePescado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            peixe: peixePescado,
            mensagem: `🎣 **PESCA BEM-SUCEDIDA!** ${peixePescado.emoji}\n\n${peixePescado.nome} pescado!\n💰 **Ganhou:** ${peixePescado.valor.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold${mensagemQuebra}\n\n⏰ Cooldown: 15 minutos`
        };
    });
}

// ==================== SISTEMA DE MINERAÇÃO ====================
async function minerar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };
        if (usuario.preso) return { erro: `Você está preso por mais ${Math.ceil(usuario.tempo_prisao / 60)} minutos!` };

        const cooldown = verificarCooldown(usuario.ultimaMineracao, 20 * 60 * 1000); // 20 min
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `⛏️ Aguarde **${formatarTempo(cooldown)}** para minerar novamente!` };
        }

        // Verifica se tem picareta
        const picaretas = ['picareta_ferro', 'picareta_diamante', 'britadeira'];
        let picaretaUsada = null;
        let bonusMineracao = 0;

        for (const picareta of picaretas) {
            if (temItem(usuario, picareta)) {
                picaretaUsada = picareta;
                const item = encontrarItem(picareta);
                bonusMineracao = item.bonus_mineracao || 0;
                break;
            }
        }

        if (!picaretaUsada) {
            return { erro: 'Você precisa comprar uma picareta na loja!' };
        }

        // Risco de acidente (morte) - 15% base
        let riscoAcidente = 15;
        if (temItem(usuario, 'capacete_seguranca')) riscoAcidente -= 10;
        if (temItem(usuario, 'colete_kevlar')) riscoAcidente -= 5;

        if (Math.random() * 100 < riscoAcidente) {
            usuario.vida = 0;
            usuario.morreu = true;
            usuario.causa_morte = 'Acidente de mineração';
            usuario.saldo = Math.floor(usuario.saldo * 0.6); // Perde 40%

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: false,
                mensagem: `💀 **ACIDENTE FATAL NA MINERAÇÃO!**\n\nDesabamento na mina!\n💰 Perdeu 40% do dinheiro (${Math.floor(usuario.saldo * 0.4).toLocaleString()} Gold)\n⚰️ Use **.reviver** para voltar ao jogo`
            };
        }

        // Usa a picareta
        const resultadoUso = usarItem(usuario, picaretaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Calcula sucesso (40% base + bônus)
        const chanceBase = 40;
        const chanceTotal = Math.min(85, chanceBase + bonusMineracao);
        const sucesso = Math.random() * 100 < chanceTotal;

        usuario.ultimaMineracao = Date.now();
        usuario.mineracoesFeitas++;

        if (!sucesso) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            return { 
                sucesso: false, 
                mensagem: `⛏️ **MINERAÇÃO SEM SUCESSO**\n\nApenas pedras sem valor!${mensagemQuebra}\n\n⏰ Cooldown: 20 minutos` 
            };
        }

        // Minérios disponíveis
        const minerais = [
            { nome: 'Diamante Puro', valor: 2000, chance: 3, emoji: '💎' },
            { nome: 'Ouro Bruto', valor: 1200, chance: 8, emoji: '🥇' },
            { nome: 'Prata', valor: 600, chance: 15, emoji: '🥈' },
            { nome: 'Ferro', valor: 300, chance: 30, emoji: '⚡' },
            { nome: 'Carvão', valor: 150, chance: 44, emoji: '⚫' }
        ];

        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        let mineralEncontrado = null;

        for (const mineral of minerais) {
            chanceAcumulada += mineral.chance;
            if (sorte <= chanceAcumulada) {
                mineralEncontrado = mineral;
                break;
            }
        }

        if (!mineralEncontrado) mineralEncontrado = minerais[minerais.length - 1];

        usuario.saldo += mineralEncontrado.valor;
        usuario.totalGanho += mineralEncontrado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            mineral: mineralEncontrado,
            mensagem: `⛏️ **MINERAÇÃO BEM-SUCEDIDA!** ${mineralEncontrado.emoji}\n\n${mineralEncontrado.nome} extraído!\n💰 **Ganhou:** ${mineralEncontrado.valor.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold${mensagemQuebra}\n\n⏰ Cooldown: 20 minutos`
        };
    });
}

// ==================== SISTEMA DE CAÇA ====================
async function cacar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };
        if (usuario.preso) return { erro: `Você está preso por mais ${Math.ceil(usuario.tempo_prisao / 60)} minutos!` };

        const cooldown = verificarCooldown(usuario.ultimaCaca, 25 * 60 * 1000); // 25 min
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `🔫 Aguarde **${formatarTempo(cooldown)}** para caçar novamente!` };
        }

        // Verifica se tem arma
        const armas = ['rifle_caca', 'espingarda', 'rifle_sniper'];
        let armaUsada = null;
        let bonusCaca = 0;

        for (const arma of armas) {
            if (temItem(usuario, arma)) {
                armaUsada = arma;
                const item = encontrarItem(arma);
                bonusCaca = item.bonus_caca || 0;
                break;
            }
        }

        if (!armaUsada) {
            return { erro: 'Você precisa comprar uma arma de caça na loja!' };
        }

        // Usa a arma
        const resultadoUso = usarItem(usuario, armaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Animais disponíveis com diferentes riscos
        const animais = [
            { nome: 'Coelho', valor: 120, chance: 35, perigo: 0, emoji: '🐰' },
            { nome: 'Veado', valor: 350, chance: 30, perigo: 5, emoji: '🦌' },
            { nome: 'Javali', valor: 600, chance: 20, perigo: 25, emoji: '🐗' },
            { nome: 'Urso', valor: 1200, chance: 10, perigo: 60, emoji: '🐻' },
            { nome: 'Leão da Montanha', valor: 2000, chance: 5, perigo: 80, emoji: '🦁' }
        ];

        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        let animalEncontrado = null;

        for (const animal of animais) {
            chanceAcumulada += animal.chance;
            if (sorte <= chanceAcumulada) {
                animalEncontrado = animal;
                break;
            }
        }

        if (!animalEncontrado) animalEncontrado = animais[0];

        // Verifica se consegue abater
        const chanceAbate = Math.max(30, 70 + bonusCaca - animalEncontrado.perigo);
        const abateu = Math.random() * 100 < chanceAbate;

        // Se não abateu e o animal é perigoso, pode atacar
        if (!abateu && animalEncontrado.perigo > 0) {
            const chanceAtaque = animalEncontrado.perigo;
            if (Math.random() * 100 < chanceAtaque) {
                let protecao = 0;
                if (temItem(usuario, 'colete_kevlar')) protecao += 60;
                if (temItem(usuario, 'capacete_seguranca')) protecao += 30;

                const danoRecebido = Math.floor(animalEncontrado.perigo * (1 - protecao / 100));
                usuario.vida -= danoRecebido;

                if (usuario.vida <= 0) {
                    usuario.vida = 0;
                    usuario.morreu = true;
                    usuario.causa_morte = `Atacado por ${animalEncontrado.nome}`;
                    usuario.saldo = Math.floor(usuario.saldo * 0.7);

                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);

                    return {
                        sucesso: false,
                        mensagem: `💀 **MORTO POR ${animalEncontrado.nome.toUpperCase()}!** ${animalEncontrado.emoji}\n\nO animal te atacou fatalmente!\n💰 Perdeu 30% do dinheiro\n⚰️ Use **.reviver** para voltar`
                    };
                }

                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);

                return {
                    sucesso: false,
                    mensagem: `🩸 **ATACADO!** ${animalEncontrado.emoji}\n\n${animalEncontrado.nome} te feriu!\n❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}\n💡 Use kit médico para se curar!${mensagemQuebra}`
                };
            }
        }

        usuario.ultimaCaca = Date.now();
        usuario.cacadasFeitas++;

        if (!abateu) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            return { 
                sucesso: false, 
                mensagem: `🔫 **CAÇA FRACASSOU**\n\nVocê errou o tiro!${mensagemQuebra}\n\n⏰ Cooldown: 25 minutos` 
            };
        }

        usuario.saldo += animalEncontrado.valor;
        usuario.totalGanho += animalEncontrado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            animal: animalEncontrado,
            mensagem: `🔫 **CAÇA BEM-SUCEDIDA!** ${animalEncontrado.emoji}\n\n${animalEncontrado.nome} abatido!\n💰 **Ganhou:** ${animalEncontrado.valor.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold${mensagemQuebra}\n\n⏰ Cooldown: 25 minutos`
        };
    });
}

// ==================== SISTEMA DE TRABALHO ====================
async function trabalhar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };
        if (usuario.preso) return { erro: `Você está preso por mais ${Math.ceil(usuario.tempo_prisao / 60)} minutos!` };

        const cooldown = verificarCooldown(usuario.ultimoTrabalho, 30 * 60 * 1000); // 30 min
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `💼 Aguarde **${formatarTempo(cooldown)}** para trabalhar novamente!` };
        }

        // Calcula salário base pela educação
        const nivelEducacao = usuario.educacao_nivel || 1;
        const salarioBase = educacao[nivelEducacao]?.salarioMin || 50;
        let salarioFinal = salarioBase + Math.floor(Math.random() * salarioBase);

        // Bônus por itens
        let bonusTotal = 0;
        let itensUsados = [];

        // Veículos
        if (temItem(usuario, 'ferrari')) { bonusTotal += 100; itensUsados.push('Ferrari'); }
        else if (temItem(usuario, 'lamborghini')) { bonusTotal += 120; itensUsados.push('Lamborghini'); }
        else if (temItem(usuario, 'carro_luxo')) { bonusTotal += 60; itensUsados.push('Carro de Luxo'); }
        else if (temItem(usuario, 'carro_popular')) { bonusTotal += 25; itensUsados.push('Carro Popular'); }
        else if (temItem(usuario, 'motocicleta')) { bonusTotal += 30; itensUsados.push('Motocicleta'); }
        else if (temItem(usuario, 'bicicleta')) { bonusTotal += 15; itensUsados.push('Bicicleta'); }

        // Tecnologia
        if (temItem(usuario, 'laptop')) { bonusTotal += 50; itensUsados.push('Laptop'); }
        if (temItem(usuario, 'celular')) { bonusTotal += 20; itensUsados.push('Smartphone'); }

        // Faculdades completas
        let bonusFaculdade = 0;
        if (usuario.faculdades_completas && usuario.faculdades_completas.length > 0) {
            const melhorFaculdade = usuario.faculdades_completas.reduce((melhor, faculdadeId) => {
                const faculdade = faculdades[faculdadeId];
                return (faculdade && faculdade.salario > melhor) ? faculdade.salario : melhor;
            }, 0);
            bonusFaculdade = melhorFaculdade;
        }

        salarioFinal = Math.floor(salarioFinal * (1 + bonusTotal / 100)) + bonusFaculdade;

        usuario.saldo += salarioFinal;
        usuario.totalGanho += salarioFinal;
        usuario.ultimoTrabalho = Date.now();
        usuario.trabalhosFeitos++;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        let trabalhoDescricao = '';
        if (bonusFaculdade > 0) {
            trabalhoDescricao = `Trabalho especializado (formação superior)`;
        } else if (nivelEducacao >= 4) {
            trabalhoDescricao = `Trabalho de nível superior`;
        } else if (nivelEducacao >= 3) {
            trabalhoDescricao = `Trabalho técnico`;
        } else {
            trabalhoDescricao = `Trabalho básico`;
        }

        return { 
            sucesso: true,
            mensagem: `💼 **TRABALHO CONCLUÍDO!**\n\n📋 **Tipo:** ${trabalhoDescricao}\n💰 **Salário:** ${salarioFinal.toLocaleString()} Gold\n📊 **Bônus:** +${bonusTotal}%\n🎓 **Nível Educação:** ${nivelEducacao}\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n⏰ Cooldown: 30 minutos`
        };
    });
}

// ==================== SISTEMA DE ROUBO ====================
async function roubar(userId, local) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };
        if (usuario.preso) return { erro: `Você está preso por mais ${Math.ceil(usuario.tempo_prisao / 60)} minutos!` };

        const cooldown = verificarCooldown(usuario.ultimoRoubo, 60 * 60 * 1000); // 1 hora
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `🏴‍☠️ Aguarde **${formatarTempo(cooldown)}** para roubar novamente!` };
        }

        if (!local) {
            let lista = '🏴‍☠️ **LOCAIS PARA ROUBAR**\n\n';
            Object.entries(locaisRoubo).forEach(([id, dados]) => {
                lista += `🎯 **${dados.nome}**\n`;
                lista += `   💰 ${dados.min.toLocaleString()} - ${dados.max.toLocaleString()} Gold\n`;
                lista += `   ⚠️ Risco: ${dados.risco}%\n`;
                lista += `   ⏱️ Tempo: ${dados.tempo} min\n\n`;
            });
            lista += '💡 **Use:** `.roubar [local]`';
            return { mensagem: lista };
        }

        const localRoubo = locaisRoubo[local.toLowerCase()];
        if (!localRoubo) {
            return { erro: 'Local inválido! Use .roubar para ver os locais disponíveis.' };
        }

        // Redução de risco por itens
        let riscoFinal = localRoubo.risco;
        if (temItem(usuario, 'colete_kevlar')) riscoFinal -= 20;
        if (temItem(usuario, 'carro_luxo') || temItem(usuario, 'ferrari')) riscoFinal -= 10;

        riscoFinal = Math.max(5, riscoFinal); // Mínimo 5% de risco

        // Verifica se foi pego
        if (Math.random() * 100 < riscoFinal) {
            // Foi preso
            usuario.preso = true;
            usuario.tempo_prisao = localRoubo.tempo * 60 * 1000; // Converte para ms
            usuario.ultimoRoubo = Date.now();

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: false,
                mensagem: `🚨 **PRESO EM FLAGRANTE!**\n\n👮‍♂️ Você foi pego tentando roubar **${localRoubo.nome}**!\n⛓️ **Tempo de prisão:** ${localRoubo.tempo} minutos\n📱 Pode usar outros comandos após sair da prisão`
            };
        }

        // Roubo bem-sucedido
        const valorRoubado = Math.floor(Math.random() * (localRoubo.max - localRoubo.min + 1)) + localRoubo.min;
        
        usuario.saldo += valorRoubado;
        usuario.totalGanho += valorRoubado;
        usuario.ultimoRoubo = Date.now();
        usuario.roubosFeitos++;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `🏴‍☠️ **ROUBO BEM-SUCEDIDO!** 💰\n\n🎯 **Local:** ${localRoubo.nome}\n💰 **Valor roubado:** ${valorRoubado.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n⚠️ **Risco assumido:** ${riscoFinal}%\n⏰ Cooldown: 1 hora`
        };
    });
}

// ==================== SISTEMA DE EDUCAÇÃO ====================
async function estudar(userId, nivel) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };

        const cooldown = verificarCooldown(usuario.ultimoEstudo, 2 * 60 * 60 * 1000); // 2 horas
        if (cooldown > 0) {
            return { erro: 'Cooldown', mensagem: `📚 Aguarde **${formatarTempo(cooldown)}** para estudar novamente!` };
        }

        if (!nivel) {
            let lista = '🎓 **SISTEMA DE EDUCAÇÃO**\n\n';
            lista += `📊 **Seu nível atual:** ${usuario.educacao_nivel || 1}\n\n`;
            
            lista += '**📚 EDUCAÇÃO BÁSICA:**\n';
            Object.entries(educacao).forEach(([num, dados]) => {
                const status = (usuario.educacao_nivel >= num) ? '✅' : '📖';
                lista += `${status} **${dados.nome}** (Nível ${num})\n`;
                lista += `   💰 Custo: ${dados.custo.toLocaleString()} Gold\n`;
                lista += `   💼 Salário mínimo: ${dados.salarioMin.toLocaleString()} Gold/trabalho\n\n`;
            });

            lista += '**🎓 FACULDADES ESPECIALIZADAS:**\n';
            Object.entries(faculdades).forEach(([id, dados]) => {
                const completa = usuario.faculdades_completas?.includes(id) ? '✅' : '🎓';
                lista += `${completa} **${dados.nome}**\n`;
                lista += `   💰 Custo: ${dados.custo.toLocaleString()} Gold\n`;
                lista += `   💼 Salário: +${dados.salario.toLocaleString()} Gold/trabalho\n\n`;
            });

            lista += '💡 **Use:** `.estudar [nível]` ou `.estudar [faculdade]`';
            return { mensagem: lista };
        }

        // Verifica se é nível básico de educação
        const nivelNum = parseInt(nivel);
        if (nivelNum && educacao[nivelNum]) {
            const cursoEducacao = educacao[nivelNum];
            
            if (usuario.educacao_nivel >= nivelNum) {
                return { erro: 'Você já completou este nível de educação!' };
            }

            if (usuario.educacao_nivel < nivelNum - 1) {
                return { erro: `Você precisa completar o nível ${nivelNum - 1} primeiro!` };
            }

            if (usuario.saldo < cursoEducacao.custo) {
                return { erro: `Você precisa de ${cursoEducacao.custo.toLocaleString()} Gold para este curso!` };
            }

            usuario.saldo -= cursoEducacao.custo;
            usuario.totalGasto += cursoEducacao.custo;
            usuario.educacao_nivel = nivelNum;
            usuario.ultimoEstudo = Date.now();

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: true,
                mensagem: `🎓 **EDUCAÇÃO CONCLUÍDA!**\n\n📚 **${cursoEducacao.nome}** completado!\n💰 **Custo:** ${cursoEducacao.custo.toLocaleString()} Gold\n🎯 **Novo nível:** ${nivelNum}\n💼 **Novo salário mínimo:** ${cursoEducacao.salarioMin.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n✨ Novos trabalhos desbloqueados!`
            };
        }

        // Verifica se é faculdade
        const faculdade = faculdades[nivel.toLowerCase()];
        if (faculdade) {
            if (usuario.faculdades_completas?.includes(nivel.toLowerCase())) {
                return { erro: 'Você já completou esta faculdade!' };
            }

            if (usuario.educacao_nivel < 4) {
                return { erro: 'Você precisa ter pelo menos graduação (nível 4) para fazer faculdade!' };
            }

            if (usuario.saldo < faculdade.custo) {
                return { erro: `Você precisa de ${faculdade.custo.toLocaleString()} Gold para esta faculdade!` };
            }

            usuario.saldo -= faculdade.custo;
            usuario.totalGasto += faculdade.custo;
            if (!usuario.faculdades_completas) usuario.faculdades_completas = [];
            usuario.faculdades_completas.push(nivel.toLowerCase());
            usuario.ultimoEstudo = Date.now();

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: true,
                mensagem: `🎓 **FACULDADE CONCLUÍDA!**\n\n🎯 **${faculdade.nome}** completado!\n💰 **Custo:** ${faculdade.custo.toLocaleString()} Gold\n💼 **Bônus salarial:** +${faculdade.salario.toLocaleString()} Gold/trabalho\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n✨ Trabalho especializado desbloqueado!`
            };
        }

        return { erro: 'Curso não encontrado! Use .estudar para ver as opções.' };
    });
}

// ==================== SISTEMA DE INVESTIMENTOS ====================
async function investir(userId, tipo, valor) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (usuario.morreu) return { erro: 'Você está morto! Use .reviver' };

        if (!tipo || !valor) {
            let lista = '💹 **TIPOS DE INVESTIMENTOS**\n\n';
            Object.entries(investimentos).forEach(([id, dados]) => {
                lista += `📈 **${dados.nome}**\n`;
                lista += `   💰 Rendimento: ${dados.rendimento}%\n`;
                lista += `   ⚠️ Risco: ${dados.risco}%\n`;
                lista += `   ⏱️ Tempo: ${dados.tempo}h\n\n`;
            });
            lista += '💡 **Use:** `.investir [tipo] [valor]`\n';
            lista += '📊 **Exemplo:** `.investir bitcoin 5000`';
            return { mensagem: lista };
        }

        const tipoInvestimento = investimentos[tipo.toLowerCase()];
        if (!tipoInvestimento) {
            return { erro: 'Tipo de investimento inválido! Use .investir para ver as opções.' };
        }

        const valorInvestir = parseInt(valor);
        if (isNaN(valorInvestir) || valorInvestir < 100) {
            return { erro: 'Valor mínimo para investir: 100 Gold' };
        }

        if (usuario.saldo < valorInvestir) {
            return { erro: 'Saldo insuficiente!' };
        }

        // Verifica se já tem investimento ativo do mesmo tipo
        if (usuario.investimentos_ativos[tipo.toLowerCase()]) {
            return { erro: 'Você já tem um investimento ativo deste tipo!' };
        }

        usuario.saldo -= valorInvestir;
        usuario.totalGasto += valorInvestir;
        usuario.investimentosFeitos++;

        // Cria o investimento
        const tempoVencimento = Date.now() + (tipoInvestimento.tempo * 60 * 60 * 1000);
        usuario.investimentos_ativos[tipo.toLowerCase()] = {
            valor_investido: valorInvestir,
            tipo: tipo.toLowerCase(),
            vencimento: tempoVencimento,
            rendimento_esperado: tipoInvestimento.rendimento,
            risco: tipoInvestimento.risco
        };

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `💹 **INVESTIMENTO REALIZADO!**\n\n📈 **Tipo:** ${tipoInvestimento.nome}\n💰 **Valor investido:** ${valorInvestir.toLocaleString()} Gold\n📊 **Rendimento esperado:** ${tipoInvestimento.rendimento}%\n⚠️ **Risco:** ${tipoInvestimento.risco}%\n⏰ **Vencimento:** ${tipoInvestimento.tempo} horas\n\n💳 **Saldo restante:** ${usuario.saldo.toLocaleString()} Gold`
        };
    });
}

// ==================== SISTEMA DE LOJA ====================
function listarLoja(categoria) {
    if (!categoria) {
        return {
            mensagem: '🛍️ **LOJA NEEXTCITY - MEGA STORE**\n\n' +
                     '**📦 CATEGORIAS (100+ ITENS):**\n\n' +
                     '🏠 `propriedades` - Casas, fazendas, ilhas (15 itens)\n' +
                     '🐾 `animais` - Pets, gado, dragões (15 itens)\n' +
                     '🔧 `ferramentas` - Varas, picaretas, armas (20 itens)\n' +
                     '🚗 `veiculos` - Carros, aviões, foguetes (20 itens)\n' +
                     '🏢 `negocios` - Lojas, empresas, bancos (15 itens)\n' +
                     '💻 `tecnologia` - PCs, servidores, IA (15 itens)\n\n' +
                     '💡 **Use:** `.loja [categoria]`\n' +
                     '🛒 **Comprar:** `.comprar [id_item] [quantidade]`'
        };
    }

    const itens = loja[categoria.toLowerCase()];
    if (!itens) return { erro: 'Categoria não encontrada!' };

    let mensagem = `🛍️ **LOJA - ${categoria.toUpperCase()}**\n\n`;

    Object.values(itens).forEach(item => {
        mensagem += `${item.emoji} **${item.nome}**\n`;
        mensagem += `   💰 ${item.preco.toLocaleString()} Gold\n`;
        mensagem += `   🔧 ${item.durabilidade_max || 'Permanente'} usos\n`;
        mensagem += `   📝 ${item.beneficio}\n`;
        mensagem += `   🆔 \`${item.id}\`\n\n`;
    });

    mensagem += '💡 **Use:** `.comprar [id] [quantidade]`';
    return { mensagem: mensagem };
}

// Função comprar
function comprarItem(userId, itemId, quantidade = 1) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        const item = encontrarItem(itemId);
        if (!item) return { erro: 'Item não encontrado!' };

        const qtd = Math.max(1, Math.min(10, quantidade)); // Máximo 10 por compra
        const custoTotal = item.preco * qtd;

        if (usuario.saldo < custoTotal) {
            return { erro: `Saldo insuficiente! Você precisa de ${custoTotal.toLocaleString()} Gold` };
        }

        usuario.saldo -= custoTotal;
        usuario.totalGasto += custoTotal;
        
        for (let i = 0; i < qtd; i++) {
            adicionarItem(usuario, itemId, 1);
        }

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `🛒 **COMPRA REALIZADA!**\n\n${item.emoji} **${item.nome}** x${qtd}\n💰 **Custo total:** ${custoTotal.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n💡 **Benefício:** ${item.beneficio}`
        };
    });
}

// ==================== OUTRAS FUNÇÕES ====================

// Função reviver
function reviver(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = garantirEstruturaUsuario(usuario);

        if (!usuario.morreu) {
            return { erro: 'Você não está morto!' };
        }

        const custoReviver = 2000;
        if (usuario.saldo < custoReviver) {
            return { erro: `Você precisa de ${custoReviver.toLocaleString()} Gold para reviver!` };
        }

        usuario.saldo -= custoReviver;
        usuario.totalGasto += custoReviver;
        usuario.vida = usuario.vida_max;
        usuario.morreu = false;
        usuario.causa_morte = null;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `⚡ **REVIVIDO COM SUCESSO!**\n\nVocê voltou à vida!\n💰 **Custo:** ${custoReviver.toLocaleString()} Gold\n❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n✨ Bem-vindo de volta à NeextCity!`
        };
    });
}

// Função perfil
function obterPerfil(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;

    usuario = garantirEstruturaUsuario(usuario);

    // Calcula valor do inventário
    let valorInventario = 0;
    let totalItens = 0;
    Object.entries(usuario.inventario).forEach(([itemId, dados]) => {
        const item = encontrarItem(itemId);
        if (item) {
            valorInventario += item.preco * dados.quantidade;
            totalItens += dados.quantidade;
        }
    });

    // Status do usuário
    let status = '✅ Vivo';
    if (usuario.morreu) status = `💀 Morto (${usuario.causa_morte})`;
    else if (usuario.preso) status = `⛓️ Preso (${Math.ceil(usuario.tempo_prisao / 60000)} min)`;

    // Investimentos ativos
    let investimentosAtivos = 0;
    Object.keys(usuario.investimentos_ativos || {}).forEach(tipo => {
        investimentosAtivos++;
    });

    const perfil = `👤 **PERFIL - ${usuario.nome.toUpperCase()}**\n\n` +
                  `${usuario.banco.emoji} **Banco:** ${usuario.banco.nome}\n` +
                  `💰 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n` +
                  `❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}\n` +
                  `🎯 **Status:** ${status}\n` +
                  `🎓 **Educação:** Nível ${usuario.educacao_nivel}\n` +
                  `🎓 **Faculdades:** ${usuario.faculdades_completas?.length || 0}\n\n` +
                  
                  `📊 **ESTATÍSTICAS:**\n` +
                  `🎣 Pescas: ${usuario.pescasFeitas}\n` +
                  `⛏️ Minerações: ${usuario.mineracoesFeitas}\n` +
                  `💼 Trabalhos: ${usuario.trabalhosFeitos}\n` +
                  `🔫 Caçadas: ${usuario.cacadasFeitas}\n` +
                  `🏴‍☠️ Roubos: ${usuario.roubosFeitos || 0}\n` +
                  `💹 Investimentos: ${usuario.investimentosFeitos || 0}\n\n` +
                  
                  `💼 **PATRIMÔNIO:**\n` +
                  `🎒 Itens no inventário: ${totalItens}\n` +
                  `💎 Valor do inventário: ${valorInventario.toLocaleString()} Gold\n` +
                  `💹 Investimentos ativos: ${investimentosAtivos}\n` +
                  `📈 Total ganho: ${usuario.totalGanho.toLocaleString()} Gold\n` +
                  `📉 Total gasto: ${usuario.totalGasto.toLocaleString()} Gold\n\n` +
                  
                  `📅 **Registro:** ${new Date(usuario.registrado).toLocaleDateString('pt-BR')}`;

    return {
        usuario: usuario,
        mensagem: perfil,
        totalItens: totalItens,
        valorInventario: valorInventario
    };
}

// Função ranking
function obterRanking() {
    const dados = carregarDadosRPG();
    const jogadores = Object.entries(dados.jogadores)
        .map(([id, dados]) => ({ id, ...dados }))
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 10);

    if (jogadores.length === 0) {
        return { mensagem: '📊 Nenhum jogador registrado ainda!' };
    }

    let ranking = '🏆 **RANKING NEEXTCITY - TOP 10**\n\n';

    jogadores.forEach((jogador, index) => {
        const posicao = index + 1;
        const medal = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}°`;
        const status = jogador.morreu ? '💀' : jogador.preso ? '⛓️' : '✅';

        ranking += `${medal} **${jogador.nome}** ${status}\n`;
        ranking += `   ${jogador.banco.emoji} ${jogador.saldo.toLocaleString()} Gold\n`;
        ranking += `   🎓 Educação: Nível ${jogador.educacao_nivel || 1}\n`;
        ranking += `   💼 Trabalhos: ${jogador.trabalhosFeitos || 0}\n\n`;
    });

    return { mensagem: ranking };
}

// ==================== EXPORTAÇÕES ====================
module.exports = {
    // Dados base
    carregarDadosRPG,
    salvarDadosRPG,
    bancos,
    loja,
    educacao,
    faculdades,
    investimentos,
    locaisRoubo,

    // Controle básico
    isRPGAtivo,
    toggleRPG,
    isUsuarioRegistrado,
    registrarUsuario,
    obterDadosUsuario,

    // Ações principais
    pescar,
    minerar,
    cacar,
    trabalhar,
    roubar,
    estudar,
    investir,

    // Loja e itens
    listarLoja,
    comprarItem,
    encontrarItem,
    temItem,
    usarItem,
    adicionarItem,

    // Perfil e ranking
    obterPerfil,
    obterRanking,
    reviver,

    // Utilitários
    verificarCooldown,
    formatarTempo,
    garantirEstruturaUsuario
};

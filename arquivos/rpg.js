
// Sistema RPG NeextCity - REALISTA E COMPLETO
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Caminho para o arquivo de dados do RPG
const rpgDataFile = path.join(__dirname, '../database/grupos/rpg_data.json');

// Sistema de Mutex simples para evitar race conditions
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

// Bancos disponíveis
const bancos = [
    { id: 'caixa', nome: '🏦 Caixa Econômica Federal', emoji: '🏦' },
    { id: 'santander', nome: '🔴 Santander', emoji: '🔴' },
    { id: 'nubank', nome: '💜 Nubank', emoji: '💜' },
    { id: 'bradesco', nome: '🔵 Bradesco', emoji: '🔵' },
    { id: 'itau', nome: '🟠 Itaú', emoji: '🟠' },
    { id: 'bb', nome: '🟡 Banco do Brasil', emoji: '🟡' },
    { id: 'inter', nome: '🧡 Inter', emoji: '🧡' },
    { id: 'picpay', nome: '💚 PicPay', emoji: '💚' },
    { id: 'c6bank', nome: '⚫ C6 Bank', emoji: '⚫' },
    { id: 'next', nome: '⚪ Next', emoji: '⚪' }
];

// Níveis de educação
const niveisEducacao = {
    fundamental: { id: 'fundamental', nome: 'Ensino Fundamental', nivel: 1, preco: 0, tempo: 2 },
    medio: { id: 'medio', nome: 'Ensino Médio', nivel: 2, preco: 500, tempo: 3, requer: 'fundamental' },
    tecnico: { id: 'tecnico', nome: 'Curso Técnico', nivel: 3, preco: 1500, tempo: 4, requer: 'medio' },
    graduacao: { id: 'graduacao', nome: 'Graduação', nivel: 4, preco: 5000, tempo: 6, requer: 'medio' },
    mestrado: { id: 'mestrado', nome: 'Mestrado', nivel: 5, preco: 15000, tempo: 8, requer: 'graduacao' },
    doutorado: { id: 'doutorado', nome: 'Doutorado', nivel: 6, preco: 30000, tempo: 12, requer: 'mestrado' }
};

// Cursos universitários
const cursosUniversitarios = {
    medicina: { id: 'medicina', nome: 'Medicina', preco: 50000, tempo: 12, nivel_min: 4 },
    engenharia: { id: 'engenharia', nome: 'Engenharia', preco: 25000, tempo: 10, nivel_min: 4 },
    direito: { id: 'direito', nome: 'Direito', preco: 20000, tempo: 10, nivel_min: 4 },
    administracao: { id: 'administracao', nome: 'Administração', preco: 15000, tempo: 8, nivel_min: 4 },
    ti: { id: 'ti', nome: 'Tecnologia da Informação', preco: 18000, tempo: 8, nivel_min: 4 },
    psicologia: { id: 'psicologia', nome: 'Psicologia', preco: 22000, tempo: 10, nivel_min: 4 }
};

// CATÁLOGO COMPLETO DE ITENS (100+ itens)
const catalogoItens = {
    // ==================== FERRAMENTAS DE PESCA ====================
    pescaria: {
        vara_bambu: { 
            id: 'vara_bambu', nome: '🎋 Vara de Bambu', preco: 50, categoria: 'pescaria', emoji: '🎋', 
            durabilidade: 20, durabilidade_max: 20, beneficio: 'Pesca básica (+5% chance)', bonus_pesca: 5,
            descricao: 'Vara simples para iniciantes na pesca'
        },
        vara_madeira: { 
            id: 'vara_madeira', nome: '🪵 Vara de Madeira', preco: 150, categoria: 'pescaria', emoji: '🪵', 
            durabilidade: 35, durabilidade_max: 35, beneficio: 'Pesca melhorada (+10% chance)', bonus_pesca: 10,
            descricao: 'Vara mais resistente que a de bambu'
        },
        vara_ferro: { 
            id: 'vara_ferro', nome: '🎣 Vara de Ferro', preco: 500, categoria: 'pescaria', emoji: '🎣', 
            durabilidade: 60, durabilidade_max: 60, beneficio: 'Pesca avançada (+20% chance)', bonus_pesca: 20,
            descricao: 'Vara profissional para pescadores experientes'
        },
        vara_carbono: { 
            id: 'vara_carbono', nome: '🏴‍☠️ Vara de Carbono', preco: 1500, categoria: 'pescaria', emoji: '🏴‍☠️', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Pesca master (+35% chance)', bonus_pesca: 35,
            descricao: 'A melhor vara disponível no mercado'
        },
        isca_minhoca: { 
            id: 'isca_minhoca', nome: '🪱 Isca de Minhoca', preco: 20, categoria: 'pescaria', emoji: '🪱', 
            durabilidade: 5, durabilidade_max: 5, beneficio: 'Atrai peixes básicos (+10% chance)', bonus_pesca: 10,
            descricao: 'Isca natural para peixes pequenos'
        },
        isca_artificial: { 
            id: 'isca_artificial', nome: '🎯 Isca Artificial', preco: 80, categoria: 'pescaria', emoji: '🎯', 
            durabilidade: 15, durabilidade_max: 15, beneficio: 'Atrai peixes grandes (+25% chance)', bonus_pesca: 25,
            descricao: 'Isca colorida que atrai peixes maiores'
        }
    },

    // ==================== FERRAMENTAS DE MINERAÇÃO ====================
    mineracao: {
        picareta_madeira: { 
            id: 'picareta_madeira', nome: '🪓 Picareta de Madeira', preco: 100, categoria: 'mineracao', emoji: '🪓', 
            durabilidade: 25, durabilidade_max: 25, beneficio: 'Mineração básica (+5% chance)', bonus_mineracao: 5,
            descricao: 'Ferramenta básica para mineração'
        },
        picareta_ferro: { 
            id: 'picareta_ferro', nome: '⛏️ Picareta de Ferro', preco: 400, categoria: 'mineracao', emoji: '⛏️', 
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Mineração avançada (+15% chance)', bonus_mineracao: 15,
            descricao: 'Picareta mais resistente para minerais duros'
        },
        picareta_diamante: { 
            id: 'picareta_diamante', nome: '💎 Picareta de Diamante', preco: 2000, categoria: 'mineracao', emoji: '💎', 
            durabilidade: 120, durabilidade_max: 120, beneficio: 'Mineração master (+30% chance)', bonus_mineracao: 30,
            descricao: 'A picareta mais poderosa disponível'
        },
        capacete_mineracao: { 
            id: 'capacete_mineracao', nome: '⛑️ Capacete de Mineração', preco: 300, categoria: 'mineracao', emoji: '⛑️', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Protege contra acidentes (-50% chance morte)', proteção: 50,
            descricao: 'Equipamento de segurança essencial'
        },
        detector_metais: { 
            id: 'detector_metais', nome: '📡 Detector de Metais', preco: 1500, categoria: 'mineracao', emoji: '📡', 
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Encontra metais preciosos (+40% chance)', bonus_mineracao: 40,
            descricao: 'Tecnologia avançada para encontrar tesouros'
        }
    },

    // ==================== ARMAS PARA CAÇA ====================
    armas: {
        rifle_madeira: { 
            id: 'rifle_madeira', nome: '🔫 Rifle de Madeira', preco: 200, categoria: 'armas', emoji: '🔫', 
            durabilidade: 30, durabilidade_max: 30, beneficio: 'Caça básica (+10% chance)', bonus_caca: 10, dano: 20,
            descricao: 'Arma simples para caça de pequenos animais'
        },
        espingarda: { 
            id: 'espingarda', nome: '💥 Espingarda', preco: 800, categoria: 'armas', emoji: '💥', 
            durabilidade: 60, durabilidade_max: 60, beneficio: 'Caça avançada (+25% chance)', bonus_caca: 25, dano: 40,
            descricao: 'Arma poderosa para animais médios'
        },
        rifle_precisao: { 
            id: 'rifle_precisao', nome: '🎯 Rifle de Precisão', preco: 2500, categoria: 'armas', emoji: '🎯', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Caça master (+40% chance)', bonus_caca: 40, dano: 80,
            descricao: 'Arma de elite para grandes predadores'
        },
        arco_flecha: { 
            id: 'arco_flecha', nome: '🏹 Arco e Flecha', preco: 300, categoria: 'armas', emoji: '🏹', 
            durabilidade: 40, durabilidade_max: 40, beneficio: 'Caça silenciosa (+15% chance)', bonus_caca: 15, dano: 25,
            descricao: 'Arma silenciosa para não assustar outros animais'
        },
        municao: { 
            id: 'municao', nome: '🔰 Munição', preco: 50, categoria: 'armas', emoji: '🔰', 
            durabilidade: 10, durabilidade_max: 10, beneficio: 'Necessário para usar armas de fogo', 
            descricao: 'Balas para rifles e espingardas'
        },
        flechas: { 
            id: 'flechas', nome: '🏹 Flechas', preco: 30, categoria: 'armas', emoji: '🏹', 
            durabilidade: 8, durabilidade_max: 8, beneficio: 'Necessário para arco e flecha',
            descricao: 'Flechas para o arco'
        }
    },

    // ==================== FERRAMENTAS AGRÍCOLAS ====================
    agricultura: {
        enxada_madeira: { 
            id: 'enxada_madeira', nome: '🪓 Enxada de Madeira', preco: 80, categoria: 'agricultura', emoji: '🪓', 
            durabilidade: 20, durabilidade_max: 20, beneficio: 'Plantio básico (+5% produção)', bonus_agricultura: 5,
            descricao: 'Ferramenta básica para agricultura'
        },
        enxada_ferro: { 
            id: 'enxada_ferro', nome: '⚒️ Enxada de Ferro', preco: 300, categoria: 'agricultura', emoji: '⚒️', 
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Plantio avançado (+15% produção)', bonus_agricultura: 15,
            descricao: 'Enxada mais eficiente para plantações'
        },
        sementes_trigo: { 
            id: 'sementes_trigo', nome: '🌾 Sementes de Trigo', preco: 25, categoria: 'agricultura', emoji: '🌾', 
            durabilidade: 1, durabilidade_max: 1, beneficio: 'Planta trigo (valor: 100 gold)', valor_plantio: 100,
            descricao: 'Sementes para plantar trigo'
        },
        sementes_milho: { 
            id: 'sementes_milho', nome: '🌽 Sementes de Milho', preco: 40, categoria: 'agricultura', emoji: '🌽', 
            durabilidade: 1, durabilidade_max: 1, beneficio: 'Planta milho (valor: 150 gold)', valor_plantio: 150,
            descricao: 'Sementes para plantar milho'
        },
        fertilizante: { 
            id: 'fertilizante', nome: '🧪 Fertilizante', preco: 60, categoria: 'agricultura', emoji: '🧪', 
            durabilidade: 5, durabilidade_max: 5, beneficio: 'Aumenta produção (+30%)', bonus_agricultura: 30,
            descricao: 'Produto químico que aumenta a produtividade'
        },
        trator: { 
            id: 'trator', nome: '🚜 Trator', preco: 15000, categoria: 'agricultura', emoji: '🚜', 
            durabilidade: 500, durabilidade_max: 500, beneficio: 'Plantio em massa (+100% produção)', bonus_agricultura: 100,
            descricao: 'Máquina agrícola para grandes plantações'
        }
    },

    // ==================== VEÍCULOS ====================
    veiculos: {
        bicicleta: { 
            id: 'bicicleta', nome: '🚲 Bicicleta', preco: 500, categoria: 'veiculos', emoji: '🚲', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Transporte básico (+10% speed trabalhos)', bonus_velocidade: 10,
            descricao: 'Meio de transporte ecológico'
        },
        motocicleta: { 
            id: 'motocicleta', nome: '🏍️ Motocicleta', preco: 3000, categoria: 'veiculos', emoji: '🏍️', 
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Transporte rápido (+25% speed)', bonus_velocidade: 25,
            descricao: 'Moto para trabalhos de entrega'
        },
        carro_popular: { 
            id: 'carro_popular', nome: '🚗 Carro Popular', preco: 15000, categoria: 'veiculos', emoji: '🚗', 
            durabilidade: 300, durabilidade_max: 300, beneficio: 'Conforto (+20% ganhos trabalho)', bonus_trabalho: 20,
            descricao: 'Carro básico para o dia a dia'
        },
        carro_luxo: { 
            id: 'carro_luxo', nome: '🏎️ Carro de Luxo', preco: 80000, categoria: 'veiculos', emoji: '🏎️', 
            durabilidade: 500, durabilidade_max: 500, beneficio: 'Prestígio (+50% ganhos)', bonus_trabalho: 50,
            descricao: 'Carro de alto padrão que impressiona'
        },
        caminhao: { 
            id: 'caminhao', nome: '🚛 Caminhão', preco: 50000, categoria: 'veiculos', emoji: '🚛', 
            durabilidade: 400, durabilidade_max: 400, beneficio: 'Transporte pesado (trabalhos especiais)', bonus_trabalho: 30,
            descricao: 'Veículo para trabalhos pesados'
        }
    },

    // ==================== PROPRIEDADES ====================
    propriedades: {
        barraca: { 
            id: 'barraca', nome: '⛺ Barraca', preco: 200, categoria: 'propriedades', emoji: '⛺', 
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Abrigo básico (+5 gold/dia)', renda_passiva: 5,
            descricao: 'Abrigo temporário básico'
        },
        casa_madeira: { 
            id: 'casa_madeira', nome: '🏠 Casa de Madeira', preco: 5000, categoria: 'propriedades', emoji: '🏠', 
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Moradia simples (+25 gold/dia)', renda_passiva: 25,
            descricao: 'Casa básica para morar'
        },
        casa_alvenaria: { 
            id: 'casa_alvenaria', nome: '🏘️ Casa de Alvenaria', preco: 25000, categoria: 'propriedades', emoji: '🏘️', 
            durabilidade: 500, durabilidade_max: 500, beneficio: 'Moradia confortável (+75 gold/dia)', renda_passiva: 75,
            descricao: 'Casa sólida e confortável'
        },
        mansao: { 
            id: 'mansao', nome: '🏰 Mansão', preco: 150000, categoria: 'propriedades', emoji: '🏰', 
            durabilidade: 1000, durabilidade_max: 1000, beneficio: 'Luxo máximo (+300 gold/dia)', renda_passiva: 300,
            descricao: 'A casa dos sonhos'
        },
        fazenda: { 
            id: 'fazenda', nome: '🚜 Fazenda', preco: 80000, categoria: 'propriedades', emoji: '🚜', 
            durabilidade: 800, durabilidade_max: 800, beneficio: 'Produção agrícola (+150 gold/dia)', renda_passiva: 150,
            descricao: 'Propriedade rural para agricultura'
        }
    },

    // ==================== NEGÓCIOS ====================
    negocios: {
        barraquinha: { 
            id: 'barraquinha', nome: '🏪 Barraquinha', preco: 2000, categoria: 'negocios', emoji: '🏪', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Negócio básico (+50 gold/dia)', renda_passiva: 50,
            descricao: 'Pequeno comércio de rua'
        },
        loja_roupas: { 
            id: 'loja_roupas', nome: '👕 Loja de Roupas', preco: 15000, categoria: 'negocios', emoji: '👕', 
            durabilidade: 300, durabilidade_max: 300, beneficio: 'Comércio de moda (+120 gold/dia)', renda_passiva: 120,
            descricao: 'Loja especializada em roupas'
        },
        restaurante: { 
            id: 'restaurante', nome: '🍽️ Restaurante', preco: 50000, categoria: 'negocios', emoji: '🍽️', 
            durabilidade: 400, durabilidade_max: 400, beneficio: 'Gastronomia (+250 gold/dia)', renda_passiva: 250,
            descricao: 'Estabelecimento gastronômico'
        },
        hotel: { 
            id: 'hotel', nome: '🏨 Hotel', preco: 200000, categoria: 'negocios', emoji: '🏨', 
            durabilidade: 800, durabilidade_max: 800, beneficio: 'Hospedagem (+600 gold/dia)', renda_passiva: 600,
            descricao: 'Negócio de hospedagem de luxo'
        },
        banco: { 
            id: 'banco', nome: '🏦 Banco', preco: 1000000, categoria: 'negocios', emoji: '🏦', 
            durabilidade: 2000, durabilidade_max: 2000, beneficio: 'Império financeiro (+2000 gold/dia)', renda_passiva: 2000,
            descricao: 'O negócio mais lucrativo'
        }
    },

    // ==================== ANIMAIS ====================
    animais: {
        galinha: { 
            id: 'galinha', nome: '🐔 Galinha', preco: 150, categoria: 'animais', emoji: '🐔', 
            durabilidade: 60, durabilidade_max: 60, beneficio: 'Produz 2 ovos/dia (40 gold)', producao_diaria: 40,
            descricao: 'Ave doméstica que produz ovos'
        },
        vaca: { 
            id: 'vaca', nome: '🐄 Vaca', preco: 2000, categoria: 'animais', emoji: '🐄', 
            durabilidade: 150, durabilidade_max: 150, beneficio: 'Produz leite (80 gold/dia)', producao_diaria: 80,
            descricao: 'Animal que produz leite fresco'
        },
        porco: { 
            id: 'porco', nome: '🐷 Porco', preco: 800, categoria: 'animais', emoji: '🐷', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Produz carne (120 gold eventual)', producao_eventual: 120,
            descricao: 'Suíno para produção de carne'
        },
        cavalo: { 
            id: 'cavalo', nome: '🐴 Cavalo', preco: 5000, categoria: 'animais', emoji: '🐴', 
            durabilidade: 200, durabilidade_max: 200, beneficio: 'Transporte (+15% velocidade)', bonus_velocidade: 15,
            descricao: 'Animal de transporte e trabalho'
        },
        cachorro: { 
            id: 'cachorro', nome: '🐕 Cachorro', preco: 400, categoria: 'animais', emoji: '🐕', 
            durabilidade: 120, durabilidade_max: 120, beneficio: 'Proteção (+20% defesa assaltos)', bonus_defesa: 20,
            descricao: 'Fiel companheiro e guardião'
        }
    },

    // ==================== EQUIPAMENTOS DE PROTEÇÃO ====================
    protecao: {
        colete_kevlar: { 
            id: 'colete_kevlar', nome: '🦺 Colete de Kevlar', preco: 3000, categoria: 'protecao', emoji: '🦺', 
            durabilidade: 80, durabilidade_max: 80, beneficio: 'Proteção contra ataques (-70% dano)', bonus_defesa: 70,
            descricao: 'Proteção corporal avançada'
        },
        capacete_seguranca: { 
            id: 'capacete_seguranca', nome: '⛑️ Capacete de Segurança', preco: 200, categoria: 'protecao', emoji: '⛑️', 
            durabilidade: 50, durabilidade_max: 50, beneficio: 'Proteção da cabeça (-40% chance morte)', bonus_defesa: 40,
            descricao: 'Equipamento de proteção individual'
        },
        kit_primeiros_socorros: { 
            id: 'kit_primeiros_socorros', nome: '🏥 Kit Primeiros Socorros', preco: 150, categoria: 'protecao', emoji: '🏥', 
            durabilidade: 10, durabilidade_max: 10, beneficio: 'Recupera vida em emergências', cura: 100,
            descricao: 'Kit médico para emergências'
        }
    },

    // ==================== TECNOLOGIA ====================
    tecnologia: {
        celular_basico: { 
            id: 'celular_basico', nome: '📱 Celular Básico', preco: 300, categoria: 'tecnologia', emoji: '📱', 
            durabilidade: 60, durabilidade_max: 60, beneficio: 'Comunicação básica (+5% trabalhos)', bonus_trabalho: 5,
            descricao: 'Telefone simples para comunicação'
        },
        smartphone: { 
            id: 'smartphone', nome: '📲 Smartphone', preco: 1500, categoria: 'tecnologia', emoji: '📲', 
            durabilidade: 100, durabilidade_max: 100, beneficio: 'Tecnologia avançada (+15% trabalhos)', bonus_trabalho: 15,
            descricao: 'Telefone inteligente com apps'
        },
        laptop: { 
            id: 'laptop', nome: '💻 Laptop', preco: 3000, categoria: 'tecnologia', emoji: '💻', 
            durabilidade: 150, durabilidade_max: 150, beneficio: 'Trabalho digital (+25% programação)', bonus_programacao: 25,
            descricao: 'Computador portátil para trabalho'
        },
        servidor: { 
            id: 'servidor', nome: '🖥️ Servidor', preco: 20000, categoria: 'tecnologia', emoji: '🖥️', 
            durabilidade: 300, durabilidade_max: 300, beneficio: 'Renda digital (+100 gold/dia)', renda_passiva: 100,
            descricao: 'Servidor para negócios online'
        }
    },

    // ==================== CONSUMÍVEIS ====================
    consumiveis: {
        energia_drink: { 
            id: 'energia_drink', nome: '⚡ Energy Drink', preco: 50, categoria: 'consumiveis', emoji: '⚡', 
            durabilidade: 1, durabilidade_max: 1, beneficio: 'Reduz cooldown em 50% (próxima ação)', bonus_energia: 50,
            descricao: 'Bebida energética que acelera ações'
        },
        proteina: { 
            id: 'proteina', nome: '💪 Proteína', preco: 80, categoria: 'consumiveis', emoji: '💪', 
            durabilidade: 1, durabilidade_max: 1, beneficio: 'Aumenta força (+20% ganhos físicos)', bonus_forca: 20,
            descricao: 'Suplemento para aumentar força física'
        },
        livro_skill: { 
            id: 'livro_skill', nome: '📚 Livro de Habilidades', preco: 200, categoria: 'consumiveis', emoji: '📚', 
            durabilidade: 1, durabilidade_max: 1, beneficio: 'Aumenta XP de trabalho (+50%)', bonus_xp: 50,
            descricao: 'Livro que ensina novas habilidades'
        }
    }
};

// Trabalhos disponíveis com requisitos
const trabalhos = {
    basicos: {
        faxineiro: { nome: 'Faxineiro', salario: [80, 120], emoji: '🧹', educacao_min: 0, requisitos: [] },
        entregador: { nome: 'Entregador', salario: [100, 160], emoji: '🚴', educacao_min: 0, requisitos: ['bicicleta'] },
        vendedor: { nome: 'Vendedor', salario: [120, 180], emoji: '🛒', educacao_min: 1, requisitos: [] },
        seguranca: { nome: 'Segurança', salario: [150, 220], emoji: '👮', educacao_min: 2, requisitos: [] }
    },
    tecnicos: {
        eletricista: { nome: 'Eletricista', salario: [200, 300], emoji: '⚡', educacao_min: 3, requisitos: [] },
        mecanico: { nome: 'Mecânico', salario: [180, 280], emoji: '🔧', educacao_min: 3, requisitos: [] },
        programador_jr: { nome: 'Programador Júnior', salario: [250, 400], emoji: '💻', educacao_min: 3, requisitos: ['laptop'] }
    },
    superiores: {
        engenheiro: { nome: 'Engenheiro', salario: [500, 800], emoji: '🏗️', educacao_min: 4, requisitos: [], curso: 'engenharia' },
        medico: { nome: 'Médico', salario: [800, 1200], emoji: '👨‍⚕️', educacao_min: 4, requisitos: [], curso: 'medicina' },
        advogado: { nome: 'Advogado', salario: [600, 1000], emoji: '⚖️', educacao_min: 4, requisitos: [], curso: 'direito' },
        administrador: { nome: 'Administrador', salario: [400, 700], emoji: '👨‍💼', educacao_min: 4, requisitos: [], curso: 'administracao' }
    }
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
function ensureUserDefaults(usuario) {
    return {
        nome: usuario.nome || 'Jogador',
        banco: usuario.banco || bancos[0],
        saldo: usuario.saldo || 0,
        vida: usuario.vida || 100,
        vida_max: usuario.vida_max || 100,
        registrado: usuario.registrado || new Date().toISOString(),
        inventario: usuario.inventario || {},
        educacao: usuario.educacao || { nivel: 0, curso_atual: null, progresso: 0 },
        cursos_concluidos: usuario.cursos_concluidos || [],
        trabalho_atual: usuario.trabalho_atual || null,
        experiencia: usuario.experiencia || {},
        // Estatísticas
        pescasFeitas: usuario.pescasFeitas || 0,
        mineracoesFeitas: usuario.mineracoesFeitas || 0,
        trabalhosFeitos: usuario.trabalhosFeitos || 0,
        assaltosFeitos: usuario.assaltosFeitos || 0,
        cacadasFeitas: usuario.cacadasFeitas || 0,
        plantiosFeitos: usuario.plantiosFeitos || 0,
        mortesEvitadas: usuario.mortesEvitadas || 0,
        // Cooldowns
        ultimaPesca: usuario.ultimaPesca || 0,
        ultimaMineracao: usuario.ultimaMineracao || 0,
        ultimoTrabalho: usuario.ultimoTrabalho || 0,
        ultimoAssalto: usuario.ultimoAssalto || 0,
        ultimaCaca: usuario.ultimaCaca || 0,
        ultimoPlantio: usuario.ultimoPlantio || 0,
        ultimoEstudo: usuario.ultimoEstudo || 0,
        // Outros
        totalGanho: usuario.totalGanho || 0,
        morreu: usuario.morreu || false,
        causa_morte: usuario.causa_morte || null
    };
}

// Encontra item em qualquer categoria
function encontrarItem(itemId) {
    for (const categoria of Object.values(catalogoItens)) {
        if (categoria[itemId]) {
            return categoria[itemId];
        }
    }
    return null;
}

// Verifica se usuário tem item
function temItem(usuario, itemId, quantidade = 1) {
    return (usuario.inventario[itemId] || 0) >= quantidade;
}

// Usa item (reduz durabilidade)
function usarItem(usuario, itemId) {
    if (!usuario.inventario[itemId]) return false;
    
    const item = encontrarItem(itemId);
    if (!item) return false;

    // Reduz durabilidade
    usuario.inventario[itemId].durabilidade = (usuario.inventario[itemId].durabilidade || item.durabilidade) - 1;
    
    // Remove item se durabilidade chegou a 0
    if (usuario.inventario[itemId].durabilidade <= 0) {
        delete usuario.inventario[itemId];
        return { quebrou: true, item: item };
    }
    
    return { quebrou: false, item: item };
}

// Adiciona item ao inventário
function adicionarItem(usuario, itemId, quantidade = 1, durabilidade = null) {
    const item = encontrarItem(itemId);
    if (!item) return false;

    if (!usuario.inventario[itemId]) {
        usuario.inventario[itemId] = {
            quantidade: 0,
            durabilidade: durabilidade || item.durabilidade_max
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

// Itens iniciais para novos jogadores
function obterItensIniciais() {
    return {
        vara_bambu: { quantidade: 1, durabilidade: 20 },
        rifle_madeira: { quantidade: 1, durabilidade: 30 },
        picareta_madeira: { quantidade: 1, durabilidade: 25 },
        enxada_madeira: { quantidade: 1, durabilidade: 20 },
        kit_primeiros_socorros: { quantidade: 2, durabilidade: 10 }
    };
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

    dados.jogadores[userId] = ensureUserDefaults({
        nome: nome,
        banco: banco,
        saldo: 500, // Começa com mais dinheiro
        inventario: obterItensIniciais()
    });

    return salvarDadosRPG(dados);
}

// Obtém dados do usuário
function obterDadosUsuario(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;

    return ensureUserDefaults(usuario);
}

// ==================== SISTEMA DE PESCA REALISTA ====================
function pescar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        // Verifica se está morto
        if (usuario.morreu) {
            return { erro: 'Você está morto! Use o comando reviver.' };
        }

        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaPesca, 10 * 60 * 1000); // 10 minutos
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🎣 Você precisa esperar **${formatarTempo(cooldown)}** para pescar novamente!`
            };
        }

        // Verifica se tem vara de pescar
        const varas = ['vara_bambu', 'vara_madeira', 'vara_ferro', 'vara_carbono'];
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
            return { erro: 'Você precisa de uma vara de pescar! Compre uma na loja.' };
        }

        // Usa a vara (reduz durabilidade)
        const resultadoUso = usarItem(usuario, varaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Verifica se tem isca para bonus
        let bonusIsca = 0;
        if (temItem(usuario, 'isca_minhoca')) {
            usarItem(usuario, 'isca_minhoca');
            bonusIsca = 10;
        } else if (temItem(usuario, 'isca_artificial')) {
            usarItem(usuario, 'isca_artificial');
            bonusIsca = 25;
        }

        // Calcula chance de sucesso
        const chanceBase = 60;
        const chanceTotal = Math.min(95, chanceBase + bonusPesca + bonusIsca);
        const sucesso = Math.random() * 100 < chanceTotal;

        usuario.ultimaPesca = Date.now();
        usuario.pescasFeitas++;

        if (!sucesso) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return { 
                sucesso: false, 
                mensagem: `🎣 **PESCA SEM SUCESSO**\n\nOs peixes não morderam a isca desta vez!${mensagemQuebra}\n\n⏰ **Cooldown:** 10 minutos` 
            };
        }

        // Peixes com raridades e valores
        const peixes = [
            { nome: 'Peixe Dourado Lendário', valor: 800, chance: 2, emoji: '🐠' },
            { nome: 'Salmão Grande', valor: 400, chance: 8, emoji: '🐟' },
            { nome: 'Truta Prateada', valor: 250, chance: 15, emoji: '🐟' },
            { nome: 'Sardinha', valor: 150, chance: 30, emoji: '🐟' },
            { nome: 'Bagre', valor: 100, chance: 45, emoji: '🐟' }
        ];

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

        // Fallback para o peixe mais comum
        if (!peixePescado) {
            peixePescado = peixes[peixes.length - 1];
        }

        usuario.saldo += peixePescado.valor;
        usuario.totalGanho += peixePescado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            peixe: peixePescado,
            mensagem: `🎣 **PESCA BEM-SUCEDIDA!** ${peixePescado.emoji}\n\n${peixePescado.nome} pescado!\n💰 **Ganhou:** ${peixePescado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold${mensagemQuebra}\n\n⏰ **Cooldown:** 10 minutos`
        };
    });
}

// ==================== SISTEMA DE MINERAÇÃO REALISTA ====================
function minerar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (usuario.morreu) {
            return { erro: 'Você está morto! Use o comando reviver.' };
        }

        const cooldown = verificarCooldown(usuario.ultimaMineracao, 15 * 60 * 1000); // 15 minutos
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `⛏️ Você precisa esperar **${formatarTempo(cooldown)}** para minerar novamente!`
            };
        }

        // Verifica se tem picareta
        const picaretas = ['picareta_madeira', 'picareta_ferro', 'picareta_diamante'];
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
            return { erro: 'Você precisa de uma picareta! Compre uma na loja.' };
        }

        // Verifica proteção
        let protecao = 0;
        if (temItem(usuario, 'capacete_mineracao')) {
            protecao = 50;
        }

        // Risco de acidente na mineração (morte)
        const chanceAcidente = Math.max(5, 20 - protecao); // 5-20% de chance
        if (Math.random() * 100 < chanceAcidente) {
            usuario.vida = 0;
            usuario.morreu = true;
            usuario.causa_morte = 'Acidente de mineração';
            usuario.saldo = Math.floor(usuario.saldo * 0.5); // Perde 50% do dinheiro

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: false,
                mensagem: `💀 **ACIDENTE FATAL NA MINERAÇÃO!**\n\nUm desabamento te matou!\n💰 Perdeu 50% do seu dinheiro\n⚰️ Use o comando \`.reviver\` para voltar\n\n💡 **Dica:** Use capacete de mineração para reduzir riscos!`
            };
        }

        // Usa a picareta
        const resultadoUso = usarItem(usuario, picaretaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Calcula sucesso
        const chanceBase = 50;
        const chanceTotal = Math.min(90, chanceBase + bonusMineracao);
        const sucesso = Math.random() * 100 < chanceTotal;

        usuario.ultimaMineracao = Date.now();
        usuario.mineracoesFeitas++;

        if (!sucesso) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return { 
                sucesso: false, 
                mensagem: `⛏️ **MINERAÇÃO SEM SUCESSO**\n\nApenas pedras comuns foram encontradas!${mensagemQuebra}\n\n⏰ **Cooldown:** 15 minutos` 
            };
        }

        // Minerais com raridades
        const minerais = [
            { nome: 'Diamante Puro', valor: 1500, chance: 1, emoji: '💎' },
            { nome: 'Ouro Bruto', valor: 800, chance: 5, emoji: '🥇' },
            { nome: 'Prata', valor: 400, chance: 12, emoji: '🥈' },
            { nome: 'Ferro', valor: 200, chance: 30, emoji: '⚡' },
            { nome: 'Carvão', valor: 100, chance: 52, emoji: '⚫' }
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

        if (!mineralEncontrado) {
            mineralEncontrado = minerais[minerais.length - 1];
        }

        usuario.saldo += mineralEncontrado.valor;
        usuario.totalGanho += mineralEncontrado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            mineral: mineralEncontrado,
            mensagem: `⛏️ **MINERAÇÃO BEM-SUCEDIDA!** ${mineralEncontrado.emoji}\n\n${mineralEncontrado.nome} encontrado!\n💰 **Ganhou:** ${mineralEncontrado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold${mensagemQuebra}\n\n⏰ **Cooldown:** 15 minutos`
        };
    });
}

// ==================== SISTEMA DE CAÇA REALISTA ====================
function cacar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (usuario.morreu) {
            return { erro: 'Você está morto! Use o comando reviver.' };
        }

        const cooldown = verificarCooldown(usuario.ultimaCaca, 20 * 60 * 1000); // 20 minutos
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🔫 Você precisa esperar **${formatarTempo(cooldown)}** para caçar novamente!`
            };
        }

        // Verifica se tem arma
        const armas = ['rifle_madeira', 'espingarda', 'rifle_precisao', 'arco_flecha'];
        let armaUsada = null;
        let bonusCaca = 0;
        let danoArma = 0;

        for (const arma of armas) {
            if (temItem(usuario, arma)) {
                armaUsada = arma;
                const item = encontrarItem(arma);
                bonusCaca = item.bonus_caca || 0;
                danoArma = item.dano || 0;
                break;
            }
        }

        if (!armaUsada) {
            return { erro: 'Você precisa de uma arma para caçar! Compre uma na loja.' };
        }

        // Verifica munição
        let temMunicao = false;
        if (armaUsada === 'arco_flecha') {
            if (temItem(usuario, 'flechas')) {
                usarItem(usuario, 'flechas');
                temMunicao = true;
            }
        } else {
            if (temItem(usuario, 'municao')) {
                usarItem(usuario, 'municao');
                temMunicao = true;
            }
        }

        if (!temMunicao) {
            return { erro: `Você precisa de ${armaUsada === 'arco_flecha' ? 'flechas' : 'munição'}!` };
        }

        // Usa a arma
        const resultadoUso = usarItem(usuario, armaUsada);
        let mensagemQuebra = '';
        if (resultadoUso.quebrou) {
            mensagemQuebra = `\n💥 Sua ${resultadoUso.item.nome} quebrou!`;
        }

        // Animais com diferentes níveis de perigo
        const animais = [
            { nome: 'Coelho', valor: 100, chance: 40, perigo: 0, emoji: '🐰' },
            { nome: 'Veado', valor: 250, chance: 25, perigo: 5, emoji: '🦌' },
            { nome: 'Javali', valor: 400, chance: 20, perigo: 25, emoji: '🐗' },
            { nome: 'Urso', valor: 800, chance: 10, perigo: 60, emoji: '🐻' },
            { nome: 'Leão', valor: 1200, chance: 5, perigo: 80, emoji: '🦁' }
        ];

        // Seleciona animal aleatório
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

        if (!animalEncontrado) {
            animalEncontrado = animais[0];
        }

        // Verifica se consegue matar o animal
        const chanceSuccesso = Math.min(95, 60 + bonusCaca - (animalEncontrado.perigo / 2));
        const matou = Math.random() * 100 < chanceSuccesso;

        // Se não matou, animal pode contra-atacar
        if (!matou && animalEncontrado.perigo > 0) {
            const chanceContraAtaque = animalEncontrado.perigo;
            if (Math.random() * 100 < chanceContraAtaque) {
                // Verifica proteção
                let protecao = 0;
                if (temItem(usuario, 'colete_kevlar')) {
                    protecao = 70;
                }

                const danoRecebido = Math.floor(animalEncontrado.perigo * (1 - protecao / 100));
                usuario.vida -= danoRecebido;

                if (usuario.vida <= 0) {
                    usuario.vida = 0;
                    usuario.morreu = true;
                    usuario.causa_morte = `Atacado por ${animalEncontrado.nome}`;
                    usuario.saldo = Math.floor(usuario.saldo * 0.3); // Perde 70% do dinheiro

                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);

                    return {
                        sucesso: false,
                        mensagem: `💀 **MORTO POR ${animalEncontrado.nome.toUpperCase()}!** ${animalEncontrado.emoji}\n\nO animal te atacou e você morreu!\n💰 Perdeu 70% do seu dinheiro\n⚰️ Use o comando \`.reviver\` para voltar\n\n💡 **Dica:** Use equipamentos de proteção!`
                    };
                } else {
                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);

                    return {
                        sucesso: false,
                        mensagem: `🩸 **ATACADO POR ${animalEncontrado.nome.toUpperCase()}!** ${animalEncontrado.emoji}\n\nO animal te atacou!\n❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}\n💡 **Dica:** Use kit de primeiros socorros para se curar!${mensagemQuebra}`
                    };
                }
            }
        }

        usuario.ultimaCaca = Date.now();
        usuario.cacadasFeitas++;

        if (!matou) {
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return { 
                sucesso: false, 
                mensagem: `🔫 **CAÇA SEM SUCESSO**\n\nVocê errou o tiro no ${animalEncontrado.nome}!${mensagemQuebra}\n\n⏰ **Cooldown:** 20 minutos` 
            };
        }

        usuario.saldo += animalEncontrado.valor;
        usuario.totalGanho += animalEncontrado.valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            animal: animalEncontrado,
            mensagem: `🔫 **CAÇA BEM-SUCEDIDA!** ${animalEncontrado.emoji}\n\n${animalEncontrado.nome} abatido!\n💰 **Ganhou:** ${animalEncontrado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold${mensagemQuebra}\n\n⏰ **Cooldown:** 20 minutos`
        };
    });
}

// ==================== SISTEMA DE TRABALHO REALISTA ====================
function trabalhar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (usuario.morreu) {
            return { erro: 'Você está morto! Use o comando reviver.' };
        }

        const cooldown = verificarCooldown(usuario.ultimoTrabalho, 30 * 60 * 1000); // 30 minutos
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `💼 Você precisa esperar **${formatarTempo(cooldown)}** para trabalhar novamente!`
            };
        }

        // Filtra trabalhos disponíveis baseado na educação
        const nivelEducacao = usuario.educacao.nivel;
        const cursosCompletos = usuario.cursos_concluidos || [];
        
        let trabalhosDisponiveis = [];
        
        // Adiciona trabalhos básicos
        for (const trabalho of Object.values(trabalhos.basicos)) {
            if (nivelEducacao >= trabalho.educacao_min) {
                // Verifica requisitos
                const temRequisitos = trabalho.requisitos.every(req => temItem(usuario, req));
                if (temRequisitos) {
                    trabalhosDisponiveis.push(trabalho);
                }
            }
        }

        // Adiciona trabalhos técnicos
        for (const trabalho of Object.values(trabalhos.tecnicos)) {
            if (nivelEducacao >= trabalho.educacao_min) {
                const temRequisitos = trabalho.requisitos.every(req => temItem(usuario, req));
                if (temRequisitos) {
                    trabalhosDisponiveis.push(trabalho);
                }
            }
        }

        // Adiciona trabalhos superiores
        for (const trabalho of Object.values(trabalhos.superiores)) {
            if (nivelEducacao >= trabalho.educacao_min) {
                if (!trabalho.curso || cursosCompletos.includes(trabalho.curso)) {
                    trabalhosDisponiveis.push(trabalho);
                }
            }
        }

        if (trabalhosDisponiveis.length === 0) {
            return { 
                erro: 'Nenhum trabalho disponível para seu nível de educação ou faltam requisitos!' 
            };
        }

        // Escolhe trabalho aleatório
        const trabalhoEscolhido = trabalhosDisponiveis[Math.floor(Math.random() * trabalhosDisponiveis.length)];
        
        // Calcula salário
        const [salarioMin, salarioMax] = trabalhoEscolhido.salario;
        let salario = Math.floor(Math.random() * (salarioMax - salarioMin + 1)) + salarioMin;

        // Bonus por veículos e tecnologia
        let bonusTotal = 0;
        if (temItem(usuario, 'carro_luxo')) bonusTotal += 50;
        else if (temItem(usuario, 'carro_popular')) bonusTotal += 20;
        else if (temItem(usuario, 'motocicleta')) bonusTotal += 25;
        else if (temItem(usuario, 'bicicleta')) bonusTotal += 10;

        if (temItem(usuario, 'smartphone')) bonusTotal += 15;
        else if (temItem(usuario, 'celular_basico')) bonusTotal += 5;

        if (temItem(usuario, 'laptop')) bonusTotal += 25;

        salario = Math.floor(salario * (1 + bonusTotal / 100));

        usuario.saldo += salario;
        usuario.totalGanho += salario;
        usuario.ultimoTrabalho = Date.now();
        usuario.trabalhosFeitos++;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: true, 
            trabalho: trabalhoEscolhido,
            salario: salario,
            bonus: bonusTotal,
            mensagem: `💼 **TRABALHO CONCLUÍDO!** ${trabalhoEscolhido.emoji}\n\n**Profissão:** ${trabalhoEscolhido.nome}\n💰 **Salário:** ${salario} Gold\n📊 **Bonus:** +${bonusTotal}%\n💳 **Saldo:** ${usuario.saldo} Gold\n\n⏰ **Cooldown:** 30 minutos`
        };
    });
}

// ==================== SISTEMA DE EDUCAÇÃO ====================
function estudar(userId, curso = null) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (usuario.morreu) {
            return { erro: 'Você está morto! Use o comando reviver.' };
        }

        const cooldown = verificarCooldown(usuario.ultimoEstudo, 60 * 60 * 1000); // 1 hora
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `📚 Você precisa esperar **${formatarTempo(cooldown)}** para estudar novamente!`
            };
        }

        // Se não especificou curso, mostra opções
        if (!curso) {
            let opcoes = '📚 **SISTEMA DE EDUCAÇÃO**\n\n';
            opcoes += `🎓 **Seu nível atual:** ${usuario.educacao.nivel}\n\n`;
            opcoes += '**Cursos disponíveis:**\n';

            for (const [id, nivel] of Object.entries(niveisEducacao)) {
                if (nivel.nivel <= usuario.educacao.nivel + 1) {
                    const disponivel = !nivel.requer || usuario.educacao.nivel >= niveisEducacao[nivel.requer].nivel;
                    const status = usuario.educacao.nivel >= nivel.nivel ? '✅' : disponivel ? '📖' : '🔒';
                    opcoes += `${status} **${nivel.nome}** - ${nivel.preco} Gold\n`;
                }
            }

            opcoes += '\n**Cursos universitários:**\n';
            for (const [id, curso_obj] of Object.entries(cursosUniversitarios)) {
                if (usuario.educacao.nivel >= curso_obj.nivel_min) {
                    const completo = usuario.cursos_concluidos.includes(id);
                    const status = completo ? '✅' : '🎓';
                    opcoes += `${status} **${curso_obj.nome}** - ${curso_obj.preco} Gold\n`;
                }
            }

            opcoes += '\n💡 **Use:** `.estudar [curso]`';
            return { mensagem: opcoes };
        }

        // Verifica se é curso básico
        if (niveisEducacao[curso]) {
            const nivelCurso = niveisEducacao[curso];
            
            // Verifica se já completou
            if (usuario.educacao.nivel >= nivelCurso.nivel) {
                return { erro: 'Você já completou este nível de educação!' };
            }

            // Verifica pré-requisitos
            if (nivelCurso.requer && usuario.educacao.nivel < niveisEducacao[nivelCurso.requer].nivel) {
                return { erro: `Você precisa completar ${niveisEducacao[nivelCurso.requer].nome} primeiro!` };
            }

            // Verifica dinheiro
            if (usuario.saldo < nivelCurso.preco) {
                return { erro: `Você precisa de ${nivelCurso.preco} Gold para este curso!` };
            }

            usuario.saldo -= nivelCurso.preco;
            usuario.educacao.nivel = nivelCurso.nivel;
            usuario.ultimoEstudo = Date.now();

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: true,
                mensagem: `🎓 **CURSO CONCLUÍDO!**\n\n📚 **${nivelCurso.nome}** completado!\n💰 **Custo:** ${nivelCurso.preco} Gold\n🎓 **Novo nível:** ${nivelCurso.nivel}\n💳 **Saldo:** ${usuario.saldo} Gold\n\n✨ Novos trabalhos desbloqueados!`
            };
        }

        // Verifica se é curso universitário
        if (cursosUniversitarios[curso]) {
            const cursoUniv = cursosUniversitarios[curso];

            // Verifica se já completou
            if (usuario.cursos_concluidos.includes(curso)) {
                return { erro: 'Você já completou este curso!' };
            }

            // Verifica nível mínimo
            if (usuario.educacao.nivel < cursoUniv.nivel_min) {
                return { erro: `Você precisa de nível ${cursoUniv.nivel_min} de educação para este curso!` };
            }

            // Verifica dinheiro
            if (usuario.saldo < cursoUniv.preco) {
                return { erro: `Você precisa de ${cursoUniv.preco} Gold para este curso!` };
            }

            usuario.saldo -= cursoUniv.preco;
            usuario.cursos_concluidos.push(curso);
            usuario.ultimoEstudo = Date.now();

            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);

            return {
                sucesso: true,
                mensagem: `🎓 **CURSO UNIVERSITÁRIO CONCLUÍDO!**\n\n📚 **${cursoUniv.nome}** completado!\n💰 **Custo:** ${cursoUniv.preco} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n✨ Trabalhos especializados desbloqueados!`
            };
        }

        return { erro: 'Curso não encontrado!' };
    });
}

// ==================== OUTRAS FUNÇÕES ====================

// Função reviver
function reviver(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (!usuario.morreu) {
            return { erro: 'Você não está morto!' };
        }

        const custoReviver = 1000;
        if (usuario.saldo < custoReviver) {
            return { erro: `Você precisa de ${custoReviver} Gold para reviver!` };
        }

        usuario.saldo -= custoReviver;
        usuario.vida = usuario.vida_max;
        usuario.morreu = false;
        usuario.causa_morte = null;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `⚡ **REVIVIDO!**\n\nVocê voltou à vida!\n💰 **Custo:** ${custoReviver} Gold\n❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}\n💳 **Saldo:** ${usuario.saldo} Gold`
        };
    });
}

// Função usar (para usar itens como kit de primeiros socorros)
function usarConsumivel(userId, itemId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        if (!temItem(usuario, itemId)) {
            return { erro: 'Você não tem este item!' };
        }

        const item = encontrarItem(itemId);
        if (!item) return { erro: 'Item não encontrado!' };

        let mensagem = '';

        // Kit de primeiros socorros
        if (itemId === 'kit_primeiros_socorros') {
            if (usuario.vida >= usuario.vida_max) {
                return { erro: 'Sua vida já está no máximo!' };
            }
            
            const cura = item.cura || 50;
            usuario.vida = Math.min(usuario.vida_max, usuario.vida + cura);
            mensagem = `🏥 **KIT USADO!**\n\nVida restaurada!\n❤️ **Vida:** ${usuario.vida}/${usuario.vida_max}`;
        }

        // Remove o item do inventário
        usarItem(usuario, itemId);

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { sucesso: true, mensagem: mensagem };
    });
}

// ==================== LOJA E INVENTÁRIO ====================

// Função listar loja
function listarLoja(categoria) {
    if (!categoria) {
        return {
            mensagem: '🛍️ **LOJA NEEXTCITY - NOVA GERAÇÃO**\n\n' +
                     '**📦 Categorias disponíveis:**\n' +
                     '🎣 pescaria - Equipamentos de pesca\n' +
                     '⛏️ mineracao - Ferramentas de mineração\n' +
                     '🔫 armas - Armas para caça\n' +
                     '🌾 agricultura - Ferramentas agrícolas\n' +
                     '🚗 veiculos - Meios de transporte\n' +
                     '🏠 propriedades - Casas e terrenos\n' +
                     '🏢 negocios - Empreendimentos\n' +
                     '🐾 animais - Animais domésticos\n' +
                     '🛡️ protecao - Equipamentos de proteção\n' +
                     '💻 tecnologia - Eletrônicos\n' +
                     '💊 consumiveis - Itens de uso único\n\n' +
                     '💡 **Use:** `.loja [categoria]`\n' +
                     '🛒 **Comprar:** `.comprar [id_item]`'
        };
    }

    const itens = catalogoItens[categoria.toLowerCase()];
    if (!itens) return { erro: 'Categoria não encontrada!' };

    let mensagem = `🛍️ **LOJA - ${categoria.toUpperCase()}**\n\n`;

    Object.values(itens).forEach(item => {
        mensagem += `${item.emoji} **${item.nome}**\n`;
        mensagem += `   💰 ${item.preco.toLocaleString()} Gold\n`;
        mensagem += `   🔧 ${item.durabilidade_max || 'N/A'} usos\n`;
        mensagem += `   📝 ${item.beneficio}\n`;
        mensagem += `   🆔 \`${item.id}\`\n\n`;
    });

    mensagem += '💡 **Use:** `.comprar [id]`';

    return { mensagem: mensagem };
}

// Função comprar
function comprarItem(userId, itemId, quantidade = 1) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };

        usuario = ensureUserDefaults(usuario);

        const item = encontrarItem(itemId);
        if (!item) return { erro: 'Item não encontrado!' };

        const custoTotal = item.preco * quantidade;
        if (usuario.saldo < custoTotal) {
            return { erro: `Saldo insuficiente! Você precisa de ${custoTotal.toLocaleString()} Gold` };
        }

        usuario.saldo -= custoTotal;
        
        for (let i = 0; i < quantidade; i++) {
            adicionarItem(usuario, itemId, 1);
        }

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            mensagem: `🛒 **COMPRA REALIZADA!**\n\n${item.emoji} **${item.nome}** x${quantidade}\n💰 **Custo:** ${custoTotal.toLocaleString()} Gold\n💳 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n\n💡 **Benefício:** ${item.beneficio}`
        };
    });
}

// Função obter perfil completo
function obterPerfilCompleto(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;

    usuario = ensureUserDefaults(usuario);

    // Conta itens no inventário
    const itensInventario = Object.entries(usuario.inventario);
    const totalItens = itensInventario.reduce((total, [_, data]) => total + (data.quantidade || 1), 0);
    let valorInventario = 0;

    // Calcula valor do inventário
    itensInventario.forEach(([itemId, data]) => {
        const item = encontrarItem(itemId);
        if (item) {
            valorInventario += item.preco * (data.quantidade || 1);
        }
    });

    // Texto do inventário
    let inventarioTexto = '';
    if (totalItens > 0) {
        itensInventario.forEach(([itemId, data]) => {
            const item = encontrarItem(itemId);
            if (item) {
                const quantidade = data.quantidade || 1;
                const durabilidade = data.durabilidade || 'N/A';
                inventarioTexto += `${item.emoji} ${item.nome} x${quantidade} (${durabilidade}/${item.durabilidade_max || 'N/A'})\n`;
            }
        });
    } else {
        inventarioTexto = 'Inventário vazio';
    }

    return {
        usuario: usuario,
        totalItens: totalItens,
        valorInventario: valorInventario,
        inventarioTexto: inventarioTexto
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

    let ranking = '🏆 **RANKING NEEXTCITY - NOVA ERA**\n\n';

    jogadores.forEach((jogador, index) => {
        const posicao = index + 1;
        const medal = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}°`;
        const status = jogador.morreu ? '💀' : '✅';

        ranking += `${medal} **${jogador.nome}** ${status}\n`;
        ranking += `   ${jogador.banco.emoji} ${jogador.banco.nome}\n`;
        ranking += `   💰 ${jogador.saldo.toLocaleString()} Gold\n`;
        ranking += `   🎓 Nível Educação: ${jogador.educacao?.nivel || 0}\n\n`;
    });

    return { mensagem: ranking };
}

// ==================== EXPORTAÇÕES ====================

module.exports = {
    carregarDadosRPG,
    salvarDadosRPG,
    isRPGAtivo,
    toggleRPG,
    isUsuarioRegistrado,
    registrarUsuario,
    obterDadosUsuario,
    pescar,
    minerar,
    trabalhar,
    cacar,
    estudar,
    reviver,
    usarConsumivel,
    listarLoja,
    comprarItem,
    obterPerfilCompleto,
    obterRanking,
    bancos,
    catalogoItens,
    trabalhos,
    niveisEducacao,
    cursosUniversitarios
};

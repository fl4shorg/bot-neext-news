// Sistema de RPG - NeextCity ENHANCED
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de dados do RPG
const rpgDataFile = path.join(__dirname, '../database/grupos/rpg_data.json');
const moment = require('moment-timezone');

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

// Limites diários configuráveis
const DAILY_LIMITS = {
    pesca: 10,
    mineracao: 8,
    trabalho: 6,
    caca: 5,
    agricultura: 7,
    entrega: 4,
    corrida: 3,
    coleta: 15
};

// Sistema de configurações dinâmicas
function obterConfiguracoes() {
    try {
        delete require.cache[require.resolve('../settings/settings.json')];
        return require('../settings/settings.json');
    } catch (err) {
        console.error("❌ Erro ao carregar configurações RPG:", err);
        return {
            prefix: ".",
            nomeDoBot: "WhatsApp Bot",
            nickDoDono: "Owner",
            numeroDoDono: "5500000000000"
        };
    }
}

// Bancos disponíveis
const bancos = [
    { id: 'caixa', nome: '🏦 Caixa Econômica Federal', emoji: '🏦' },
    { id: 'santander', nome: '🔴 Santander', emoji: '🔴' },
    { id: 'nubank', nome: '💜 Nubank', emoji: '💜' },
    { id: 'bradesco', nome: '🔵 Bradesco', emoji: '🔵' },
    { id: 'itau', nome: '🟠 Itaú', emoji: '🟠' },
    { id: 'bb', nome: '🟡 Banco do Brasil', emoji: '🟡' },
    { id: 'pix', nome: '📱 PIX', emoji: '📱' },
    { id: 'inter', nome: '🧡 Inter', emoji: '🧡' }
];

// ==================== SISTEMA DE LOJA ====================
// Catálogo completo de itens para compra
const catalogoItens = {
    // PROPRIEDADES
    propriedades: {
        casa_simples: {
            id: 'casa_simples',
            nome: '🏠 Casa Simples',
            preco: 5000,
            categoria: 'propriedades',
            descricao: 'Uma casa básica para morar',
            emoji: '🏠',
            beneficio: 'Renda passiva: +50 gold/dia'
        },
        casa_luxo: {
            id: 'casa_luxo', 
            nome: '🏘️ Casa de Luxo',
            preco: 15000,
            categoria: 'propriedades',
            descricao: 'Uma mansão elegante',
            emoji: '🏘️',
            beneficio: 'Renda passiva: +150 gold/dia'
        },
        fazenda: {
            id: 'fazenda',
            nome: '🚜 Fazenda',
            preco: 25000,
            categoria: 'propriedades', 
            descricao: 'Terra para agricultura e criação',
            emoji: '🚜',
            beneficio: 'Permite agricultura e criação'
        },
        posto_gasolina: {
            id: 'posto_gasolina',
            nome: '⛽ Posto de Gasolina',
            preco: 35000,
            categoria: 'propriedades',
            descricao: 'Negócio lucrativo',
            emoji: '⛽',
            beneficio: 'Renda passiva: +300 gold/dia'
        }
    },
    // ANIMAIS E CRIAÇÃO
    animais: {
        galinha: {
            id: 'galinha',
            nome: '🐔 Galinha',
            preco: 500,
            categoria: 'animais',
            descricao: 'Produz ovos diariamente',
            emoji: '🐔',
            beneficio: 'Produz 3 ovos/dia (30 gold cada)'
        },
        pato: {
            id: 'pato',
            nome: '🦆 Pato', 
            preco: 800,
            categoria: 'animais',
            descricao: 'Pato para criação',
            emoji: '🦆',
            beneficio: 'Produz carne valiosa'
        },
        cavalo: {
            id: 'cavalo',
            nome: '🐎 Cavalo',
            preco: 8000,
            categoria: 'animais',
            descricao: 'Para corridas e transporte',
            emoji: '🐎',
            beneficio: 'Permite corridas e +50% velocidade entrega'
        },
        gato: {
            id: 'gato', 
            nome: '🐱 Gato',
            preco: 200,
            categoria: 'animais',
            descricao: 'Companheiro fiel',
            emoji: '🐱',
            beneficio: 'Traz sorte (+5% chance crítico)'
        },
        cachorro: {
            id: 'cachorro',
            nome: '🐶 Cachorro',
            preco: 300,
            categoria: 'animais', 
            descricao: 'Melhor amigo do homem',
            emoji: '🐶',
            beneficio: 'Protege contra assaltos (+20% defesa)'
        },
        vaca: {
            id: 'vaca',
            nome: '🐄 Vaca',
            preco: 2500,
            categoria: 'animais',
            descricao: 'Produz leite fresco',
            emoji: '🐄',
            beneficio: 'Produz 5 litros leite/dia (25 gold cada)'
        },
        porco: {
            id: 'porco',
            nome: '🐷 Porco', 
            preco: 1200,
            categoria: 'animais',
            descricao: 'Criação rentável',
            emoji: '🐷',
            beneficio: 'Renda de 80 gold/dia'
        }
    },
    // FERRAMENTAS E UPGRADES
    ferramentas: {
        vara_ouro: {
            id: 'vara_ouro',
            nome: '🎣 Vara de Ouro',
            preco: 3000,
            categoria: 'ferramentas',
            descricao: 'Vara de pesca premium',
            emoji: '🎣',
            beneficio: '+25% chance peixes raros'
        },
        picareta_diamante: {
            id: 'picareta_diamante',
            nome: '⛏️ Picareta de Diamante',
            preco: 4500,
            categoria: 'ferramentas',
            descricao: 'Ferramenta de mineração suprema',
            emoji: '⛏️',
            beneficio: '+30% chance minerais valiosos'
        },
        trator: {
            id: 'trator',
            nome: '🚜 Trator',
            preco: 12000,
            categoria: 'ferramentas',
            descricao: 'Para agricultura avançada',
            emoji: '🚜',
            beneficio: '+50% produção agrícola'
        }
    },
    // VEÍCULOS
    veiculos: {
        bike: {
            id: 'bike',
            nome: '🚲 Bicicleta',
            preco: 800,
            categoria: 'veiculos',
            descricao: 'Transporte básico',
            emoji: '🚲', 
            beneficio: '+10% velocidade trabalhos'
        },
        moto: {
            id: 'moto',
            nome: '🏍️ Motocicleta',
            preco: 5000,
            categoria: 'veiculos',
            descricao: 'Para entregas rápidas',
            emoji: '🏍️',
            beneficio: 'Habilita trabalho entregador'
        },
        carro: {
            id: 'carro',
            nome: '🚗 Carro',
            preco: 20000,
            categoria: 'veiculos',
            descricao: 'Automóvel confortável',
            emoji: '🚗',
            beneficio: 'Habilita trabalho uber (+200 gold/viagem)'
        },
        carro_esportivo: {
            id: 'carro_esportivo',
            nome: '🏎️ Carro Esportivo',
            preco: 80000,
            categoria: 'veiculos',
            descricao: 'Velocidade e estilo',
            emoji: '🏎️',
            beneficio: 'Corridas de rua (+1000 gold/vitória)'
        },
        caminhao: {
            id: 'caminhao',
            nome: '🚛 Caminhão',
            preco: 45000,
            categoria: 'veiculos',
            descricao: 'Para cargas pesadas',
            emoji: '🚛',
            beneficio: 'Trabalho caminhoneiro (+500 gold/viagem)'
        },
        barco: {
            id: 'barco',
            nome: '🛥️ Barco',
            preco: 150000,
            categoria: 'veiculos',
            descricao: 'Navegação de luxo',
            emoji: '🛥️',
            beneficio: 'Trabalho capitão (+600 gold/viagem)'
        },
        aviao: {
            id: 'aviao',
            nome: '✈️ Avião Particular',
            preco: 500000,
            categoria: 'veiculos',
            descricao: 'Luxo máximo nos céus',
            emoji: '✈️',
            beneficio: 'Trabalho piloto (+800 gold/voo)'
        }
    },
    
    // NEGÓCIOS E EMPRESAS
    negocios: {
        lanchonete: {
            id: 'lanchonete',
            nome: '🍔 Lanchonete',
            preco: 50000,
            categoria: 'negocios',
            descricao: 'Negócio de alimentação',
            emoji: '🍔',
            beneficio: 'Renda passiva: +400 gold/dia'
        },
        academia: {
            id: 'academia',
            nome: '💪 Academia',
            preco: 80000,
            categoria: 'negocios',
            descricao: 'Centro de fitness',
            emoji: '💪',
            beneficio: 'Renda passiva: +600 gold/dia'
        },
        empresa: {
            id: 'empresa',
            nome: '🏢 Empresa',
            preco: 200000,
            categoria: 'negocios',
            descricao: 'Grande corporação',
            emoji: '🏢',
            beneficio: 'Habilita trabalho CEO (+1200 gold/dia)'
        },
        banco: {
            id: 'banco',
            nome: '🏦 Banco',
            preco: 1000000,
            categoria: 'negocios',
            descricao: 'Instituição financeira',
            emoji: '🏦',
            beneficio: 'Renda passiva: +5000 gold/dia'
        }
    },
    
    // TECNOLOGIA E SETUP
    tecnologia: {
        smartphone: {
            id: 'smartphone',
            nome: '📱 Smartphone',
            preco: 2000,
            categoria: 'tecnologia',
            descricao: 'Celular moderno',
            emoji: '📱',
            beneficio: '+10% eficiência em trabalhos'
        },
        computador: {
            id: 'computador',
            nome: '💻 Computador',
            preco: 8000,
            categoria: 'tecnologia',
            descricao: 'PC para trabalho',
            emoji: '💻',
            beneficio: 'Habilita trabalho programador'
        },
        setup_stream: {
            id: 'setup_stream',
            nome: '📹 Setup de Stream',
            preco: 25000,
            categoria: 'tecnologia',
            descricao: 'Equipamentos para streaming',
            emoji: '📹',
            beneficio: 'Habilita trabalho streamer (+300 gold/stream)'
        },
        servidor: {
            id: 'servidor',
            nome: '🖥️ Servidor',
            preco: 100000,
            categoria: 'tecnologia',
            descricao: 'Servidor dedicado',
            emoji: '🖥️',
            beneficio: 'Renda passiva: +1000 gold/dia'
        }
    }
};

// Peixes disponíveis para pesca
const peixes = [
    { nome: 'Peixe Dourado', valor: 250, raridade: 'lendario', emoji: '🐠', chance: 2 },
    { nome: 'Salmão', valor: 180, raridade: 'epico', emoji: '🐟', chance: 5 },
    { nome: 'Atum', valor: 120, raridade: 'raro', emoji: '🐟', chance: 10 },
    { nome: 'Sardinha', valor: 80, raridade: 'comum', emoji: '🐟', chance: 25 },
    { nome: 'Tilápia', valor: 60, raridade: 'comum', emoji: '🐟', chance: 30 },
    { nome: 'Bagre', valor: 40, raridade: 'comum', emoji: '🐟', chance: 28 }
];

// Animais para caça
const animaisCaca = [
    { nome: 'Javali', valor: 300, raridade: 'lendario', emoji: '🐗', chance: 3 },
    { nome: 'Veado', valor: 200, raridade: 'epico', emoji: '🦌', chance: 8 },
    { nome: 'Coelho', valor: 100, raridade: 'raro', emoji: '🐰', chance: 15 },
    { nome: 'Pato Selvagem', valor: 80, raridade: 'comum', emoji: '🦆', chance: 30 },
    { nome: 'Perdiz', valor: 60, raridade: 'comum', emoji: '🐦', chance: 44 }
];

// Cultivos para agricultura
const cultivos = [
    { nome: 'Milho', valor: 120, tempo: 60, emoji: '🌽', categoria: 'cereal' },
    { nome: 'Tomate', valor: 100, tempo: 45, emoji: '🍅', categoria: 'verdura' },
    { nome: 'Batata', valor: 80, tempo: 90, emoji: '🥔', categoria: 'tubérculo' },
    { nome: 'Cenoura', valor: 70, tempo: 30, emoji: '🥕', categoria: 'verdura' },
    { nome: 'Alface', valor: 50, tempo: 20, emoji: '🥬', categoria: 'folha' }
];

// Minerais disponíveis para mineração
const minerais = [
    { nome: 'Diamante', valor: 500, raridade: 'lendario', emoji: '💎', chance: 1 },
    { nome: 'Ouro', valor: 300, raridade: 'epico', emoji: '🥇', chance: 3 },
    { nome: 'Prata', valor: 200, raridade: 'raro', emoji: '🥈', chance: 8 },
    { nome: 'Ferro', valor: 100, raridade: 'comum', emoji: '⚡', chance: 25 },
    { nome: 'Cobre', valor: 60, raridade: 'comum', emoji: '🟤', chance: 35 },
    { nome: 'Carvão', valor: 30, raridade: 'comum', emoji: '⚫', chance: 28 }
];

// Trabalhos disponíveis  
const trabalhos = [
    { nome: 'Programador', salario: 150, emoji: '💻', requisito: null },
    { nome: 'Médico', salario: 200, emoji: '👨‍⚕️', requisito: null },
    { nome: 'Professor', salario: 120, emoji: '👨‍🏫', requisito: null },
    { nome: 'Vendedor', salario: 100, emoji: '👨‍💼', requisito: null },
    { nome: 'Motorista', salario: 80, emoji: '🚗', requisito: null },
    { nome: 'Segurança', salario: 90, emoji: '🛡️', requisito: null },
    { nome: 'Entregador', salario: 120, emoji: '🏍️', requisito: 'moto' },
    { nome: 'Uber', salario: 200, emoji: '🚗', requisito: 'carro' },
    { nome: 'Caminhoneiro', salario: 500, emoji: '🚛', requisito: 'caminhao' },
    { nome: 'Fazendeiro', salario: 180, emoji: '🚜', requisito: 'fazenda' },
    { nome: 'Piloto', salario: 800, emoji: '✈️', requisito: 'aviao' },
    { nome: 'Capitão de Barco', salario: 600, emoji: '🛥️', requisito: 'barco' },
    { nome: 'CEO', salario: 1200, emoji: '🏢', requisito: 'empresa' },
    { nome: 'Streamer', salario: 300, emoji: '📹', requisito: 'setup_stream' }
];

// Cursos e educação disponíveis
const cursos = [
    { nome: 'Ensino Médio', salario: 50, duracao: 30, emoji: '🎓', nivel: 1 },
    { nome: 'Curso Técnico', salario: 100, duracao: 45, emoji: '🔧', nivel: 2 },
    { nome: 'Graduação', salario: 200, duracao: 60, emoji: '👨‍🎓', nivel: 3 },
    { nome: 'Pós-Graduação', salario: 350, duracao: 90, emoji: '🎖️', nivel: 4 },
    { nome: 'Mestrado', salario: 500, duracao: 120, emoji: '📜', nivel: 5 },
    { nome: 'Doutorado', salario: 800, duracao: 180, emoji: '🏆', nivel: 6 }
];

// Investimentos disponíveis
const investimentos = [
    { nome: 'Poupança', multiplicador: 1.05, risco: 5, emoji: '🏦', minimo: 1000 },
    { nome: 'Tesouro Direto', multiplicador: 1.15, risco: 10, emoji: '🏛️', minimo: 2000 },
    { nome: 'CDB', multiplicador: 1.25, risco: 15, emoji: '💳', minimo: 5000 },
    { nome: 'Ações', multiplicador: 1.50, risco: 40, emoji: '📈', minimo: 10000 },
    { nome: 'Forex', multiplicador: 2.00, risco: 60, emoji: '💱', minimo: 20000 },
    { nome: 'Crypto', multiplicador: 3.00, risco: 80, emoji: '₿', minimo: 15000 }
];

// Imagens do sistema
const imagens = {
    pesca: [
        'https://i.ibb.co/TMyLLC3R/41c684278e9f0d135ebc9e256b48868a.jpg',
        'https://i.ibb.co/DXvzXGn/20d09f32ae9946cd9ea3157f9c15185a.jpg'
    ],
    mineracao: [
        'https://i.ibb.co/zWsQKzYn/fd4e0eac6d004504ca5a16413fa90ad6.jpg', 
        'https://i.ibb.co/5hyff8B4/3b938d5b6b50323e58414c9edb72053b.jpg'
    ],
    tigrinho: [
        'https://i.ibb.co/xG9QxjD/tigrinho-cassino-1.jpg',
        'https://i.ibb.co/yNpL4zV/tigrinho-cassino-2.jpg',
        'https://i.ibb.co/RQfvXdt/tigrinho-perdeu-tudo.jpg'
    ],
    trabalho: [
        'https://i.ibb.co/hL8tKyS/trabalho-escritorio.jpg',
        'https://i.ibb.co/QdR4fVp/trabalho-construcao.jpg'
    ],
    caca: [
        'https://i.ibb.co/mNvLFzD/cacador-floresta.jpg',
        'https://i.ibb.co/KWp2YjS/caca-animais.jpg' 
    ],
    agricultura: [
        'https://i.ibb.co/yX8bJgT/fazenda-plantacao.jpg',
        'https://i.ibb.co/VHGKqNf/agricultura-colheita.jpg'
    ],
    loja: [
        'https://i.ibb.co/pWqKbZR/loja-neext-city.jpg',
        'https://i.ibb.co/dMfQxYG/compras-rpg.jpg'
    ],
    pix: [
        'https://i.ibb.co/XsRtKgD/pix-transferencia.jpg',
        'https://i.ibb.co/qjPgHmW/pix-banco.jpg'
    ],
    corrida: [
        'https://i.ibb.co/kDgHtNm/corrida-cavalos.jpg',
        'https://i.ibb.co/7Y4pbLz/hipismo-corrida.jpg'
    ]
};

// Frases motivacionais
const frasesMotivacionais = [
    '💪 Continue trabalhando duro!',
    '🌟 Você está no caminho certo!',
    '🚀 Rumo ao sucesso em NeextCity!',
    '💰 O dinheiro não dorme!',
    '🏆 Seja o melhor de NeextCity!'
];

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

// Função para garantir estrutura completa do usuário
function ensureUserDefaults(usuario) {
    const hoje = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
    
    return {
        nome: usuario.nome || 'Jogador',
        banco: usuario.banco || bancos[0],
        saldo: usuario.saldo || 100,
        registrado: usuario.registrado || new Date().toISOString(),
        
        // Inventário e propriedades
        inventario: usuario.inventario || {},
        propriedades: usuario.propriedades || {},
        
        // Contadores de atividades
        pescasFeitas: usuario.pescasFeitas || 0,
        mineracoesFeitas: usuario.mineracoesFeitas || 0,
        trabalhosFeitos: usuario.trabalhosFeitos || 0,
        assaltosFeitos: usuario.assaltosFeitos || 0,
        cacasFeitas: usuario.cacasFeitas || 0,
        agriculturasFeitas: usuario.agriculturasFeitas || 0,
        entregasFeitas: usuario.entregasFeitas || 0,
        corridasFeitas: usuario.corridasFeitas || 0,
        coletasFeitas: usuario.coletasFeitas || 0,
        estudosFeitos: usuario.estudosFeitos || 0,
        investimentosFeitos: usuario.investimentosFeitos || 0,
        apostasFeitas: usuario.apostasFeitas || 0,
        
        // Última vez que fez cada atividade
        ultimaPesca: usuario.ultimaPesca || 0,
        ultimaMineracao: usuario.ultimaMineracao || 0,
        ultimoTrabalho: usuario.ultimoTrabalho || 0,
        ultimoAssalto: usuario.ultimoAssalto || 0,
        ultimaCaca: usuario.ultimaCaca || 0,
        ultimaAgricultura: usuario.ultimaAgricultura || 0,
        ultimaEntrega: usuario.ultimaEntrega || 0,
        ultimaCorrida: usuario.ultimaCorrida || 0,
        ultimaColeta: usuario.ultimaColeta || 0,
        ultimoEstudo: usuario.ultimoEstudo || 0,
        ultimoInvestimento: usuario.ultimoInvestimento || 0,
        ultimaAposta: usuario.ultimaAposta || 0,
        
        // Sistema de limites diários
        limites: usuario.limites || {},
        limitesData: usuario.limitesData || hoje,
        
        // Cultivos em andamento
        cultivos: usuario.cultivos || [],
        
        // Histórico de PIX
        pixEnviados: usuario.pixEnviados || [],
        pixRecebidos: usuario.pixRecebidos || [],
        
        // Sistema educacional
        educacao: usuario.educacao || {
            nivel: 0,
            cursosCompletos: [],
            estudandoAtualmente: null
        },
        
        // Investimentos ativos
        investimentosAtivos: usuario.investimentosAtivos || [],
        
        // Estatísticas especiais
        totalGanho: usuario.totalGanho || 0,
        totalGasto: usuario.totalGasto || 0,
        maiorGanho: usuario.maiorGanho || 0,
        tigrinhoJogadas: usuario.tigrinhoJogadas || 0,
        tigrinhoPerdas: usuario.tigrinhoPerdas || 0
    };
}

// Reseta limites diários se necessário
function resetDailyLimitsIfNeeded(usuario) {
    const hoje = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
    
    if (usuario.limitesData !== hoje) {
        usuario.limites = {};
        usuario.limitesData = hoje;
        
        // Coleta automática de renda passiva
        let rendaPassiva = 0;
        if (usuario.propriedades) {
            Object.keys(usuario.propriedades).forEach(propId => {
                const item = catalogoItens.propriedades[propId];
                if (item && item.beneficio.includes('Renda passiva')) {
                    const valor = parseInt(item.beneficio.match(/\d+/)?.[0] || 0);
                    rendaPassiva += valor * (usuario.propriedades[propId] || 1);
                }
            });
        }
        
        if (rendaPassiva > 0) {
            usuario.saldo += rendaPassiva;
            usuario.totalGanho += rendaPassiva;
        }
    }
    
    return usuario;
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
    return withLock(async () => {
        const dados = carregarDadosRPG();
        const banco = bancos.find(b => b.id === bancoId);
        if (!banco) return false;

        const novoUsuario = {
            nome: nome,
            banco: banco,
            saldo: 100 // Saldo inicial
        };

        dados.jogadores[userId] = ensureUserDefaults(novoUsuario);
        return salvarDadosRPG(dados);
    });
}

// Obtém dados do usuário
function obterDadosUsuario(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;
    
    usuario = ensureUserDefaults(usuario);
    usuario = resetDailyLimitsIfNeeded(usuario);
    
    return usuario;
}

// ==================== SISTEMA PIX ====================
// Função para transferir dinheiro entre jogadores
function pixTransferir(deUserId, paraUserId, valor, deNome, paraNome) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        
        let usuarioDe = dados.jogadores[deUserId];
        let usuarioPara = dados.jogadores[paraUserId];
        
        if (!usuarioDe) return { erro: 'Você não está registrado no RPG' };
        if (!usuarioPara) return { erro: 'Destinatário não está registrado no RPG' };
        
        usuarioDe = ensureUserDefaults(usuarioDe);
        usuarioPara = ensureUserDefaults(usuarioPara);
        
        if (deUserId === paraUserId) return { erro: 'Não é possível transferir para si mesmo' };
        if (valor <= 0) return { erro: 'Valor deve ser positivo' };
        if (valor < 10) return { erro: 'Valor mínimo para PIX é 10 Gold' };
        if (usuarioDe.saldo < valor) return { erro: `Saldo insuficiente. Você tem ${usuarioDe.saldo} Gold` };
        
        // Taxa de 2% para transferências
        const taxa = Math.floor(valor * 0.02);
        const valorFinal = valor - taxa;
        
        // Realiza a transferência
        usuarioDe.saldo -= valor;
        usuarioPara.saldo += valorFinal;
        
        // Registra no histórico
        const agora = new Date().toISOString();
        const pixEnviado = {
            para: paraUserId,
            paraNome: paraNome || usuarioPara.nome,
            valor: valor,
            taxa: taxa,
            valorFinal: valorFinal,
            data: agora
        };
        
        const pixRecebido = {
            de: deUserId,
            deNome: deNome || usuarioDe.nome,
            valor: valorFinal,
            data: agora
        };
        
        usuarioDe.pixEnviados.push(pixEnviado);
        usuarioPara.pixRecebidos.push(pixRecebido);
        
        // Limita histórico a 50 transações
        if (usuarioDe.pixEnviados.length > 50) usuarioDe.pixEnviados.shift();
        if (usuarioPara.pixRecebidos.length > 50) usuarioPara.pixRecebidos.shift();
        
        dados.jogadores[deUserId] = usuarioDe;
        dados.jogadores[paraUserId] = usuarioPara;
        
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            valor: valor,
            taxa: taxa,
            valorFinal: valorFinal,
            saldoRemetente: usuarioDe.saldo,
            saldoDestinatario: usuarioPara.saldo,
            mensagem: `💸 **PIX REALIZADO COM SUCESSO!** ✅\n\n` +
                     `👤 **De:** ${usuarioDe.nome}\n` +
                     `👤 **Para:** ${usuarioPara.nome}\n` +
                     `💰 **Valor:** ${valor} Gold\n` +
                     `💳 **Taxa (2%):** ${taxa} Gold\n` +
                     `✅ **Recebido:** ${valorFinal} Gold\n\n` +
                     `🏦 **Seu saldo atual:** ${usuarioDe.saldo} Gold\n\n` +
                     `⏰ **Data:** ${new Date().toLocaleString('pt-BR')}`
        };
    });
}

// Atualiza saldo do usuário
function atualizarSaldo(userId, novoSaldo) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        if (dados.jogadores[userId]) {
            dados.jogadores[userId].saldo = novoSaldo;
            return salvarDadosRPG(dados);
        }
        return false;
    });
}

// ==================== SISTEMA DE LOJA ====================
// Comprar item da loja
function comprarItem(userId, itemId, quantidade = 1) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Procura o item em todas as categorias
        let item = null;
        let categoria = null;
        
        Object.keys(catalogoItens).forEach(cat => {
            if (catalogoItens[cat][itemId]) {
                item = catalogoItens[cat][itemId];
                categoria = cat;
            }
        });
        
        if (!item) return { erro: 'Item não encontrado na loja' };
        
        const custoTotal = item.preco * quantidade;
        if (usuario.saldo < custoTotal) {
            return { erro: `Saldo insuficiente! Você precisa de ${custoTotal} Gold (tem ${usuario.saldo} Gold)` };
        }
        
        // Realiza a compra
        usuario.saldo -= custoTotal;
        usuario.totalGasto += custoTotal;
        
        if (categoria === 'propriedades') {
            usuario.propriedades[itemId] = (usuario.propriedades[itemId] || 0) + quantidade;
        } else {
            usuario.inventario[itemId] = (usuario.inventario[itemId] || 0) + quantidade;
        }
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            item: item,
            quantidade: quantidade,
            custoTotal: custoTotal,
            saldo: usuario.saldo,
            mensagem: `🛒 **COMPRA REALIZADA!** ✅\n\n` +
                     `${item.emoji} **${item.nome}**\n` +
                     `📦 **Quantidade:** ${quantidade}\n` +
                     `💰 **Custo total:** ${custoTotal} Gold\n` +
                     `💡 **Benefício:** ${item.beneficio}\n\n` +
                     `🏦 **Saldo restante:** ${usuario.saldo} Gold`,
            imagem: imagens.loja[Math.floor(Math.random() * imagens.loja.length)]
        };
    });
}

// Listar itens da loja por categoria
function listarLoja(categoria = null) {
    const config = obterConfiguracoes();
    let mensagem = '🏪 **LOJA NEEXTCITY** 🏪\n\n';
    
    if (categoria && catalogoItens[categoria]) {
        const itens = catalogoItens[categoria];
        mensagem += `📂 **Categoria: ${categoria.toUpperCase()}**\n\n`;
        
        Object.values(itens).forEach(item => {
            mensagem += `${item.emoji} **${item.nome}**\n`;
            mensagem += `   💰 **Preço:** ${item.preco} Gold\n`;
            mensagem += `   💡 **Benefício:** ${item.beneficio}\n`;
            mensagem += `   🛒 **Comprar:** \`${config.prefix}comprar ${item.id}\`\n\n`;
        });
    } else {
        mensagem += '📂 **CATEGORIAS DISPONÍVEIS:**\n\n';
        mensagem += '🏠 **Propriedades** - Casas, fazendas, postos\n';
        mensagem += `   \`${config.prefix}loja propriedades\`\n\n`;
        mensagem += '🐾 **Animais** - Galinhas, cavalos, gatos\n';
        mensagem += `   \`${config.prefix}loja animais\`\n\n`;
        mensagem += '🔧 **Ferramentas** - Varas, picaretas, tratores\n';
        mensagem += `   \`${config.prefix}loja ferramentas\`\n\n`;
        mensagem += '🚗 **Veículos** - Bikes, motos, carros\n';
        mensagem += `   \`${config.prefix}loja veiculos\`\n\n`;
        mensagem += `💡 **Para comprar:** \`${config.prefix}comprar [item_id]\`\n`;
    }
    
    return {
        mensagem: mensagem,
        imagem: imagens.loja[Math.floor(Math.random() * imagens.loja.length)]
    };
}

// Ver inventário do jogador
function verInventario(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };
    
    usuario = ensureUserDefaults(usuario);
    
    let mensagem = `📦 **INVENTÁRIO DE ${usuario.nome.toUpperCase()}** 📦\n\n`;
    mensagem += `💰 **Saldo:** ${usuario.saldo} Gold\n\n`;
    
    // Propriedades
    if (Object.keys(usuario.propriedades).length > 0) {
        mensagem += '🏠 **PROPRIEDADES:**\n';
        Object.entries(usuario.propriedades).forEach(([itemId, qtd]) => {
            const item = catalogoItens.propriedades[itemId];
            if (item) {
                mensagem += `   ${item.emoji} **${item.nome}** (${qtd}x)\n`;
            }
        });
        mensagem += '\n';
    }
    
    // Inventário geral
    if (Object.keys(usuario.inventario).length > 0) {
        mensagem += '📦 **ITENS:**\n';
        Object.entries(usuario.inventario).forEach(([itemId, qtd]) => {
            // Procura o item em todas as categorias
            let item = null;
            Object.values(catalogoItens).forEach(categoria => {
                if (categoria[itemId]) {
                    item = categoria[itemId];
                }
            });
            
            if (item) {
                mensagem += `   ${item.emoji} **${item.nome}** (${qtd}x)\n`;
            }
        });
        mensagem += '\n';
    }
    
    if (Object.keys(usuario.propriedades).length === 0 && Object.keys(usuario.inventario).length === 0) {
        const config = obterConfiguracoes();
        mensagem += '📭 **Inventário vazio!**\n\n';
        mensagem += `🛒 **Visite a loja:** \`${config.prefix}loja\`\n`;
    }
    
    return { mensagem: mensagem };
}

// Verifica cooldown
function verificarCooldown(ultimaAcao, tempoEspera) {
    const agora = Date.now();
    const tempoRestante = (ultimaAcao + tempoEspera) - agora;
    return tempoRestante > 0 ? tempoRestante : 0;
}

// Verifica limite diário
function verificarLimiteDiario(usuario, atividade) {
    const limiteMax = DAILY_LIMITS[atividade] || 10;
    const usoAtual = usuario.limites[atividade] || 0;
    
    if (usoAtual >= limiteMax) {
        return {
            excedido: true,
            atual: usoAtual,
            maximo: limiteMax,
            restantes: 0
        };
    }
    
    return {
        excedido: false,
        atual: usoAtual,
        maximo: limiteMax,
        restantes: limiteMax - usoAtual
    };
}

// Incrementa uso diário
function incrementarLimiteDiario(usuario, atividade) {
    if (!usuario.limites) usuario.limites = {};
    usuario.limites[atividade] = (usuario.limites[atividade] || 0) + 1;
}

// Formata tempo restante
function formatarTempo(milissegundos) {
    const segundos = Math.ceil(milissegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    
    if (minutos > 0) {
        return `${minutos}m ${seg}s`;
    }
    return `${seg}s`;
}

// Sistema de Pesca
function pescar(userId) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    // Verifica cooldown (5 minutos)
    const cooldown = verificarCooldown(usuario.ultimaPesca, 5 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            tempo: formatarTempo(cooldown),
            mensagem: `🎣 Você precisa esperar **${formatarTempo(cooldown)}** para pescar novamente!`
        };
    }

    // Chance de falha (anzol quebrar, etc.)
    const chancefalha = Math.random() * 100;
    if (chancefalha < 15) {
        usuario.ultimaPesca = Date.now();
        salvarDadosRPG(dados);
        
        const falhas = [
            '🎣 Seu anzol quebrou! Que azar...',
            '🎣 O peixe escapou! Tente novamente mais tarde.',
            '🎣 Sua linha de pesca se embaraçou!',
            '🎣 Você não conseguiu pescar nada desta vez.',
            '🎣 Um peixe grande levou sua isca!'
        ];
        
        return {
            sucesso: false,
            mensagem: falhas[Math.floor(Math.random() * falhas.length)],
            imagem: imagens.pesca[Math.floor(Math.random() * imagens.pesca.length)]
        };
    }

    // Determina qual peixe foi pescado
    const rand = Math.random() * 100;
    let chanceAcumulada = 0;
    let peixePescado = null;

    for (const peixe of peixes) {
        chanceAcumulada += peixe.chance;
        if (rand <= chanceAcumulada) {
            peixePescado = peixe;
            break;
        }
    }

    if (!peixePescado) peixePescado = peixes[peixes.length - 1];

    // Atualiza dados do usuário
    usuario.saldo += peixePescado.valor;
    usuario.ultimaPesca = Date.now();
    usuario.pescasFeitas++;
    salvarDadosRPG(dados);

    const raridadeEmoji = {
        'lendario': '🌟',
        'epico': '💜',
        'raro': '💙',
        'comum': '⚪'
    };

    return {
        sucesso: true,
        peixe: peixePescado,
        mensagem: `🎣 **PESCA REALIZADA!**\n\n` +
                 `${raridadeEmoji[peixePescado.raridade]} **${peixePescado.nome}** ${peixePescado.emoji}\n` +
                 `💰 **+${peixePescado.valor} Gold**\n` +
                 `🏦 **Saldo:** ${usuario.saldo} Gold\n` +
                 `🎣 **Pescas feitas:** ${usuario.pescasFeitas}`,
        imagem: imagens.pesca[Math.floor(Math.random() * imagens.pesca.length)]
    };
}

// Sistema de Mineração
function minerar(userId) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    // Verifica cooldown (7 minutos)
    const cooldown = verificarCooldown(usuario.ultimaMineracao, 7 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            tempo: formatarTempo(cooldown),
            mensagem: `⛏️ Você precisa esperar **${formatarTempo(cooldown)}** para minerar novamente!`
        };
    }

    // Chance de falha (picareta quebrar, etc.)
    const chancefalha = Math.random() * 100;
    if (chancefalha < 20) {
        usuario.ultimaMineracao = Date.now();
        salvarDadosRPG(dados);
        
        const falhas = [
            '⛏️ Sua picareta quebrou na pedra!',
            '⛏️ Você não encontrou nada nesta área.',
            '⛏️ A mina desabou! Que azar...',
            '⛏️ Você se cansou e não conseguiu minerar.',
            '⛏️ A rocha estava muito dura!'
        ];
        
        return {
            sucesso: false,
            mensagem: falhas[Math.floor(Math.random() * falhas.length)],
            imagem: imagens.mineracao[Math.floor(Math.random() * imagens.mineracao.length)]
        };
    }

    // Determina qual mineral foi encontrado
    const rand = Math.random() * 100;
    let chanceAcumulada = 0;
    let mineralEncontrado = null;

    for (const mineral of minerais) {
        chanceAcumulada += mineral.chance;
        if (rand <= chanceAcumulada) {
            mineralEncontrado = mineral;
            break;
        }
    }

    if (!mineralEncontrado) mineralEncontrado = minerais[minerais.length - 1];

    // Atualiza dados do usuário
    usuario.saldo += mineralEncontrado.valor;
    usuario.ultimaMineracao = Date.now();
    usuario.mineracoesFeitas++;
    salvarDadosRPG(dados);

    const raridadeEmoji = {
        'lendario': '🌟',
        'epico': '💜',
        'raro': '💙',
        'comum': '⚪'
    };

    return {
        sucesso: true,
        mineral: mineralEncontrado,
        mensagem: `⛏️ **MINERAÇÃO REALIZADA!**\n\n` +
                 `${raridadeEmoji[mineralEncontrado.raridade]} **${mineralEncontrado.nome}** ${mineralEncontrado.emoji}\n` +
                 `💰 **+${mineralEncontrado.valor} Gold**\n` +
                 `🏦 **Saldo:** ${usuario.saldo} Gold\n` +
                 `⛏️ **Minerações feitas:** ${usuario.mineracoesFeitas}`,
        imagem: imagens.mineracao[Math.floor(Math.random() * imagens.mineracao.length)]
    };
}

// Sistema de Trabalho
function trabalhar(userId) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    // Verifica cooldown (10 minutos)
    const cooldown = verificarCooldown(usuario.ultimoTrabalho, 10 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            tempo: formatarTempo(cooldown),
            mensagem: `💼 Você precisa esperar **${formatarTempo(cooldown)}** para trabalhar novamente!`
        };
    }

    // Escolhe trabalho aleatório
    const trabalho = trabalhos[Math.floor(Math.random() * trabalhos.length)];
    
    // Atualiza dados do usuário
    usuario.saldo += trabalho.salario;
    usuario.ultimoTrabalho = Date.now();
    usuario.trabalhosFeitos++;
    salvarDadosRPG(dados);

    return {
        sucesso: true,
        trabalho: trabalho,
        mensagem: `💼 **TRABALHO REALIZADO!**\n\n` +
                 `${trabalho.emoji} **${trabalho.nome}**\n` +
                 `💰 **+${trabalho.salario} Gold**\n` +
                 `🏦 **Saldo:** ${usuario.saldo} Gold\n` +
                 `💼 **Trabalhos feitos:** ${usuario.trabalhosFeitos}`
    };
}

// JOGO DO TIGRINHO APRIMORADO - ROUBA 50% DO DINHEIRO!
function jogarTigrinho(userId, aposta) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        usuario = resetDailyLimitsIfNeeded(usuario);
        
        if (aposta < 10) return { erro: 'Aposta mínima é 10 Gold' };
        if (aposta > usuario.saldo) return { erro: 'Saldo insuficiente' };
        
        // Sistema predatório: apenas 15% de chance de ganhar!
        const chanceGanhar = Math.random() * 100;
        const simbolos = ['🐅', '🍎', '🍒', '🍋', '🔔', '💎', '🎰', '⭐'];
        
        let resultado, ganhou, premioFinal = 0, perdaExtra = 0;
        
        usuario.tigrinhoJogadas++;
        
        if (chanceGanhar <= 15) { // Apenas 15% de chance de ganhar
            // GANHOU - mas pouco
            ganhou = true;
            resultado = [simbolos[0], simbolos[0], simbolos[0]]; // Forçar combinação
            
            if (chanceGanhar <= 2) {
                // Jackpot ultra raro (2%)
                multiplicador = 3;
                resultado = ['💎', '💎', '💎'];
            } else if (chanceGanhar <= 5) {
                // Tigrinho raro (3%)
                multiplicador = 2;
                resultado = ['🐅', '🐅', '🐅'];
            } else {
                // Ganho pequeno (10%)
                multiplicador = 1.2;
                resultado = ['⭐', '⭐', '⭐'];
            }
            
            premioFinal = Math.floor(aposta * multiplicador);
            usuario.saldo = usuario.saldo - aposta + premioFinal;
            usuario.totalGanho += (premioFinal - aposta);
            
        } else {
            // PERDEU - e perde MUITO!
            ganhou = false;
            usuario.tigrinhoPerdas++;
            
            // Gera resultado perdedor
            resultado = [
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)]
            ];
            
            // Garantir que não seja uma combinação vencedora
            while (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                resultado[2] = simbolos[Math.floor(Math.random() * simbolos.length)];
            }
            
            // AQUI ESTÁ A ARMADILHA: Perde a aposta + 50% do saldo restante!
            const saldoRestante = usuario.saldo - aposta;
            perdaExtra = Math.floor(saldoRestante * 0.5); // 50% do saldo restante
            
            usuario.saldo -= aposta + perdaExtra;
            usuario.totalGasto += aposta + perdaExtra;
            
            // Não deixa ficar negativo
            if (usuario.saldo < 0) {
                perdaExtra += usuario.saldo; // Ajusta a perda extra
                usuario.saldo = 0;
            }
        }
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        const config = obterConfiguracoes();
        
        return {
            sucesso: true,
            ganhou: ganhou,
            resultado: resultado,
            aposta: aposta,
            premio: premioFinal,
            perdaExtra: perdaExtra,
            saldo: usuario.saldo,
            imagem: imagens.tigrinho[ganhou ? 0 : Math.floor(Math.random() * 2) + 1],
            mensagem: `🎰 **JOGO DO TIGRINHO** 🐅\n\n` +
                     `🎲 [ ${resultado.join(' | ')} ]\n\n` +
                     (ganhou ? 
                        `🎉 **PARABÉNS! VOCÊ GANHOU!** 🎊\n💰 **Ganho:** +${premioFinal - aposta} Gold\n` :
                        `💀 **VOCÊ PERDEU TUDO!** 😭\n💸 **Aposta perdida:** -${aposta} Gold\n` +
                        (perdaExtra > 0 ? `🔥 **TIGRINHO ROUBOU 50%:** -${perdaExtra} Gold\n` : '') +
                        `⚠️ **O Tigrinho é viciante e rouba seu dinheiro!**\n`
                     ) +
                     `🏦 **Saldo atual:** ${usuario.saldo} Gold\n` +
                     `🎯 **Jogadas:** ${usuario.tigrinhoJogadas} | 📉 **Perdas:** ${usuario.tigrinhoPerdas}\n\n` +
                     (usuario.saldo < 100 ? `⚠️ **CUIDADO:** Seu saldo está baixo! Use \`${config.prefix}trabalhar\` ou \`${config.prefix}pescar\` para recuperar!` : 
                     `💡 **Dica:** Pare enquanto ainda tem dinheiro! Use \`${config.prefix}rank\` para ver os mais ricos!`)
        };
    });
}

// Sistema de Assalto
function assaltar(userId, targetId) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    const alvo = dados.jogadores[targetId];
    
    if (!usuario) return { erro: 'Você não está registrado' };
    if (!alvo) return { erro: 'Usuário alvo não está registrado' };
    if (userId === targetId) return { erro: 'Você não pode assaltar a si mesmo' };

    // Verifica cooldown (15 minutos)
    const cooldown = verificarCooldown(usuario.ultimoAssalto, 15 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            tempo: formatarTempo(cooldown),
            mensagem: `🔫 Você precisa esperar **${formatarTempo(cooldown)}** para assaltar novamente!`
        };
    }

    if (alvo.saldo < 50) return { erro: 'O alvo não tem Gold suficiente para ser assaltado (mínimo 50)' };

    // Chance de sucesso (60%)
    const sucesso = Math.random() < 0.6;
    const valorAssaltado = Math.floor(alvo.saldo * 0.2); // 20% do saldo do alvo

    usuario.ultimoAssalto = Date.now();
    usuario.assaltosFeitos++;

    if (sucesso) {
        usuario.saldo += valorAssaltado;
        alvo.saldo -= valorAssaltado;
        
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            assalto: true,
            valor: valorAssaltado,
            mensagem: `🔫 **ASSALTO BEM-SUCEDIDO!**\n\n` +
                     `💰 **+${valorAssaltado} Gold** roubados de ${alvo.nome}\n` +
                     `🏦 **Seu saldo:** ${usuario.saldo} Gold\n` +
                     `🔫 **Assaltos feitos:** ${usuario.assaltosFeitos}`
        };
    } else {
        // Falha no assalto - perde 30 Gold como multa
        const multa = Math.min(30, usuario.saldo);
        usuario.saldo -= multa;
        
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            assalto: false,
            multa: multa,
            mensagem: `🔫 **ASSALTO FALHOU!**\n\n` +
                     `🚨 Você foi pego e pagou **${multa} Gold** de multa!\n` +
                     `🏦 **Seu saldo:** ${usuario.saldo} Gold\n` +
                     `🔫 **Assaltos feitos:** ${usuario.assaltosFeitos}`
        };
    }
}

// Sistema de Ranking
function obterRanking() {
    const dados = carregarDadosRPG();
    const jogadores = Object.entries(dados.jogadores)
        .map(([id, dados]) => ({ id, ...dados }))
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 10); // Top 10

    if (jogadores.length === 0) {
        return { mensagem: '📊 Nenhum jogador registrado ainda!' };
    }

    let ranking = '🏆 **RANKING DOS MAIS RICOS - NEEXTCITY**\n\n';
    
    jogadores.forEach((jogador, index) => {
        const posicao = index + 1;
        const medal = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}°`;
        
        ranking += `${medal} **${jogador.nome}**\n`;
        ranking += `   ${jogador.banco.emoji} ${jogador.banco.nome}\n`;
        ranking += `   💰 ${jogador.saldo} Gold\n\n`;
    });

    return { mensagem: ranking };
}

// ==================== SISTEMA DE EDUCAÇÃO ====================
// Função para estudar
function estudar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica cooldown (20 minutos)
        const cooldown = verificarCooldown(usuario.ultimoEstudo, 20 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                tempo: formatarTempo(cooldown),
                mensagem: `📚 Você precisa esperar **${formatarTempo(cooldown)}** para estudar novamente!`
            };
        }
        
        // Verifica se já está estudando um curso
        if (usuario.educacao.estudandoAtualmente) {
            const cursoAtual = cursos.find(c => c.nome === usuario.educacao.estudandoAtualmente.nome);
            const tempoRestante = usuario.educacao.estudandoAtualmente.tempoFim - Date.now();
            
            if (tempoRestante > 0) {
                return {
                    erro: 'Já estudando',
                    mensagem: `📚 Você já está estudando **${cursoAtual.nome}**!\n⏰ Tempo restante: **${formatarTempo(tempoRestante)}**`
                };
            } else {
                // Curso finalizado
                const salario = cursoAtual.salario;
                usuario.saldo += salario;
                usuario.totalGanho += salario;
                usuario.educacao.nivel = cursoAtual.nivel;
                usuario.educacao.cursosCompletos.push(cursoAtual.nome);
                usuario.educacao.estudandoAtualmente = null;
                
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return {
                    sucesso: true,
                    cursoCompleto: true,
                    curso: cursoAtual,
                    mensagem: `🎓 **CURSO FINALIZADO!** ✅\n\n` +
                             `${cursoAtual.emoji} **${cursoAtual.nome}**\n` +
                             `💰 **Recompensa:** ${salario} Gold\n` +
                             `📈 **Novo nível educacional:** ${cursoAtual.nivel}\n` +
                             `🏦 **Saldo:** ${usuario.saldo} Gold\n\n` +
                             `🎯 Use \`.estudar\` novamente para iniciar outro curso!`
                };
            }
        }
        
        // Mostra cursos disponíveis
        const proximoNivel = usuario.educacao.nivel + 1;
        const cursosDisponiveis = cursos.filter(c => c.nivel <= proximoNivel);
        
        let listaCursos = '';
        cursosDisponiveis.forEach((curso, index) => {
            const jaFez = usuario.educacao.cursosCompletos.includes(curso.nome);
            listaCursos += `${index + 1}. ${curso.emoji} **${curso.nome}**\n` +
                          `   💰 Recompensa: ${curso.salario} Gold\n` +
                          `   ⏰ Duração: ${curso.duracao} minutos\n` +
                          `   ${jaFez ? '✅ Já concluído' : '📚 Disponível'}\n\n`;
        });
        
        return {
            listaCursos: true,
            mensagem: `📚 **SISTEMA DE EDUCAÇÃO - NEEXTCITY**\n\n` +
                     `🎓 **Seu nível educacional:** ${usuario.educacao.nivel}\n` +
                     `📜 **Cursos concluídos:** ${usuario.educacao.cursosCompletos.length}\n\n` +
                     `📋 **CURSOS DISPONÍVEIS:**\n\n${listaCursos}` +
                     `💡 **Como usar:** \`.estudar [número]\`\n` +
                     `📝 **Exemplo:** \`.estudar 2\``
        };
    });
}

// Iniciar curso específico
function iniciarCurso(userId, cursoNum) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        const proximoNivel = usuario.educacao.nivel + 1;
        const cursosDisponiveis = cursos.filter(c => c.nivel <= proximoNivel);
        const curso = cursosDisponiveis[cursoNum - 1];
        
        if (!curso) return { erro: 'Curso não encontrado' };
        
        const jaFez = usuario.educacao.cursosCompletos.includes(curso.nome);
        if (jaFez && curso.nivel <= usuario.educacao.nivel) {
            return { erro: 'Você já concluiu este curso' };
        }
        
        // Inicia o curso
        usuario.educacao.estudandoAtualmente = {
            nome: curso.nome,
            tempoFim: Date.now() + (curso.duracao * 60 * 1000)
        };
        usuario.ultimoEstudo = Date.now();
        usuario.estudosFeitos++;
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            curso: curso,
            mensagem: `📚 **ESTUDO INICIADO!** ✅\n\n` +
                     `${curso.emoji} **${curso.nome}**\n` +
                     `⏰ **Duração:** ${curso.duracao} minutos\n` +
                     `💰 **Recompensa ao completar:** ${curso.salario} Gold\n\n` +
                     `📖 Você está estudando... Volte em ${curso.duracao} minutos!`
        };
    });
}

// ==================== SISTEMA DE INVESTIMENTOS ====================
// Função para investir
function investir(userId, tipoInvestimento, valor) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica cooldown (30 minutos)
        const cooldown = verificarCooldown(usuario.ultimoInvestimento, 30 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                tempo: formatarTempo(cooldown),
                mensagem: `💼 Você precisa esperar **${formatarTempo(cooldown)}** para investir novamente!`
            };
        }
        
        if (!tipoInvestimento || !valor) {
            let listaInvestimentos = '';
            investimentos.forEach((inv, index) => {
                listaInvestimentos += `${index + 1}. ${inv.emoji} **${inv.nome}**\n` +
                                    `   📈 Multiplicador: ${inv.multiplicador}x\n` +
                                    `   ⚠️ Risco: ${inv.risco}%\n` +
                                    `   💰 Mínimo: ${inv.minimo} Gold\n\n`;
            });
            
            return {
                listaInvestimentos: true,
                mensagem: `💼 **SISTEMA DE INVESTIMENTOS - NEEXTCITY**\n\n` +
                         `💰 **Seu saldo:** ${usuario.saldo} Gold\n` +
                         `📊 **Investimentos ativos:** ${usuario.investimentosAtivos.length}\n\n` +
                         `📋 **OPÇÕES DISPONÍVEIS:**\n\n${listaInvestimentos}` +
                         `💡 **Como usar:** \`.investir [número] [valor]\`\n` +
                         `📝 **Exemplo:** \`.investir 1 5000\``
            };
        }
        
        const investimento = investimentos[tipoInvestimento - 1];
        if (!investimento) return { erro: 'Tipo de investimento inválido' };
        
        valor = parseInt(valor);
        if (isNaN(valor) || valor < investimento.minimo) {
            return { erro: `Valor mínimo para ${investimento.nome} é ${investimento.minimo} Gold` };
        }
        
        if (usuario.saldo < valor) {
            return { erro: `Saldo insuficiente! Você tem ${usuario.saldo} Gold` };
        }
        
        // Calcula resultado
        const sucesso = Math.random() * 100 > investimento.risco;
        let ganho = 0;
        
        if (sucesso) {
            ganho = Math.floor(valor * (investimento.multiplicador - 1));
            usuario.saldo += ganho;
            usuario.totalGanho += ganho;
        } else {
            usuario.saldo -= valor;
            ganho = -valor;
        }
        
        usuario.ultimoInvestimento = Date.now();
        usuario.investimentosFeitos++;
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: sucesso,
            investimento: investimento,
            valor: valor,
            ganho: ganho,
            mensagem: sucesso ? 
                `📈 **INVESTIMENTO LUCROU!** ✅\n\n` +
                `${investimento.emoji} **${investimento.nome}**\n` +
                `💰 **Investido:** ${valor} Gold\n` +
                `💵 **Lucro:** +${ganho} Gold\n` +
                `🏦 **Saldo atual:** ${usuario.saldo} Gold\n\n` +
                `🎉 Parabéns pelo investimento bem-sucedido!` :
                `📉 **INVESTIMENTO FALHOU!** ❌\n\n` +
                `${investimento.emoji} **${investimento.nome}**\n` +
                `💰 **Perdido:** ${valor} Gold\n` +
                `🏦 **Saldo atual:** ${usuario.saldo} Gold\n\n` +
                `😔 Infelizmente desta vez não deu certo...`
        };
    });
}

// ==================== SISTEMA DE APOSTAS ====================
// Função para apostar
function apostar(userId, valor) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica cooldown (15 minutos)
        const cooldown = verificarCooldown(usuario.ultimaAposta, 15 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                tempo: formatarTempo(cooldown),
                mensagem: `🎲 Você precisa esperar **${formatarTempo(cooldown)}** para apostar novamente!`
            };
        }
        
        if (!valor) {
            return {
                info: true,
                mensagem: `🎲 **SISTEMA DE APOSTAS - NEEXTCITY**\n\n` +
                         `💰 **Seu saldo:** ${usuario.saldo} Gold\n` +
                         `🎯 **Apostas feitas:** ${usuario.apostasFeitas}\n\n` +
                         `🎮 **Como funciona:**\n` +
                         `• 50% chance de ganhar 2x o valor\n` +
                         `• 50% chance de perder tudo\n` +
                         `• Valor mínimo: 100 Gold\n` +
                         `• Valor máximo: 10,000 Gold\n\n` +
                         `💡 **Como usar:** \`.apostar [valor]\`\n` +
                         `📝 **Exemplo:** \`.apostar 1000\``
            };
        }
        
        valor = parseInt(valor);
        if (isNaN(valor) || valor < 100) {
            return { erro: 'Valor mínimo para apostar é 100 Gold' };
        }
        
        if (valor > 10000) {
            return { erro: 'Valor máximo para apostar é 10,000 Gold' };
        }
        
        if (usuario.saldo < valor) {
            return { erro: `Saldo insuficiente! Você tem ${usuario.saldo} Gold` };
        }
        
        // 50% de chance de ganhar
        const ganhou = Math.random() >= 0.5;
        
        usuario.ultimaAposta = Date.now();
        usuario.apostasFeitas++;
        
        if (ganhou) {
            const ganho = valor;
            usuario.saldo += ganho;
            usuario.totalGanho += ganho;
            
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return {
                sucesso: true,
                valor: valor,
                ganho: ganho,
                mensagem: `🎲 **APOSTA VENCEDORA!** ✅\n\n` +
                         `💰 **Apostado:** ${valor} Gold\n` +
                         `💵 **Ganho:** +${ganho} Gold\n` +
                         `🏦 **Saldo atual:** ${usuario.saldo} Gold\n\n` +
                         `🎉 Parabéns! Você dobrou seu dinheiro!`
            };
        } else {
            usuario.saldo -= valor;
            
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return {
                sucesso: false,
                valor: valor,
                mensagem: `🎲 **APOSTA PERDIDA!** ❌\n\n` +
                         `💰 **Perdido:** ${valor} Gold\n` +
                         `🏦 **Saldo atual:** ${usuario.saldo} Gold\n\n` +
                         `😔 Que pena! Melhor sorte na próxima!`
            };
        }
    });
}

// ==================== PERFIL COMPLETO ====================
// Função para mostrar perfil completo com inventário
function obterPerfilCompleto(userId) {
    const usuario = obterDadosUsuario(userId);
    if (!usuario) return null;
    
    // Conta total de itens
    let totalItens = 0;
    let valorInventario = 0;
    let perfilTexto = '';
    
    // Propriedades
    if (Object.keys(usuario.propriedades).length > 0) {
        perfilTexto += `🏠 **PROPRIEDADES:**\n`;
        Object.keys(usuario.propriedades).forEach(itemId => {
            const quantidade = usuario.propriedades[itemId];
            const item = catalogoItens.propriedades[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    // Veículos
    const veiculosUsuario = Object.keys(usuario.inventario).filter(id => catalogoItens.veiculos[id]);
    if (veiculosUsuario.length > 0) {
        perfilTexto += `🚗 **VEÍCULOS:**\n`;
        veiculosUsuario.forEach(itemId => {
            const quantidade = usuario.inventario[itemId];
            const item = catalogoItens.veiculos[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    // Negócios
    const negociosUsuario = Object.keys(usuario.inventario).filter(id => catalogoItens.negocios[id]);
    if (negociosUsuario.length > 0) {
        perfilTexto += `🏢 **NEGÓCIOS:**\n`;
        negociosUsuario.forEach(itemId => {
            const quantidade = usuario.inventario[itemId];
            const item = catalogoItens.negocios[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    // Tecnologia
    const tecnologiaUsuario = Object.keys(usuario.inventario).filter(id => catalogoItens.tecnologia[id]);
    if (tecnologiaUsuario.length > 0) {
        perfilTexto += `📱 **TECNOLOGIA:**\n`;
        tecnologiaUsuario.forEach(itemId => {
            const quantidade = usuario.inventario[itemId];
            const item = catalogoItens.tecnologia[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    // Animais
    const animaisUsuario = Object.keys(usuario.inventario).filter(id => catalogoItens.animais[id]);
    if (animaisUsuario.length > 0) {
        perfilTexto += `🐾 **ANIMAIS:**\n`;
        animaisUsuario.forEach(itemId => {
            const quantidade = usuario.inventario[itemId];
            const item = catalogoItens.animais[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    // Ferramentas
    const ferramentasUsuario = Object.keys(usuario.inventario).filter(id => catalogoItens.ferramentas[id]);
    if (ferramentasUsuario.length > 0) {
        perfilTexto += `🔧 **FERRAMENTAS:**\n`;
        ferramentasUsuario.forEach(itemId => {
            const quantidade = usuario.inventario[itemId];
            const item = catalogoItens.ferramentas[itemId];
            if (item && quantidade > 0) {
                perfilTexto += `${item.emoji} ${item.nome} (${quantidade}x)\n`;
                totalItens += quantidade;
                valorInventario += item.preco * quantidade;
            }
        });
        perfilTexto += '\n';
    }
    
    if (totalItens === 0) {
        perfilTexto = '📦 **Inventário vazio**\nVá à loja para comprar seus primeiros itens!\n\n';
    }
    
    return {
        usuario: usuario,
        inventarioTexto: perfilTexto,
        totalItens: totalItens,
        valorInventario: valorInventario
    };
}

module.exports = {
    carregarDadosRPG,
    salvarDadosRPG,
    isRPGAtivo,
    toggleRPG,
    isUsuarioRegistrado,
    registrarUsuario,
    obterDadosUsuario,
    atualizarSaldo,
    pescar,
    minerar,
    trabalhar,
    jogarTigrinho,
    assaltar,
    obterRanking,
    estudar,
    iniciarCurso,
    investir,
    apostar,
    obterPerfilCompleto,
    pixTransferir,
    comprarItem,
    verificarCooldown,
    formatarTempo,
    bancos,
    catalogoItens
};
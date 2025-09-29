// Sistema de RPG - NeextCity ENHANCED MEGA 2.0
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

// ==================== BANCOS EXPANDIDOS ====================
const bancos = [
    { id: 'caixa', nome: '🏦 Caixa Econômica Federal', emoji: '🏦' },
    { id: 'santander', nome: '🔴 Santander', emoji: '🔴' },
    { id: 'nubank', nome: '💜 Nubank', emoji: '💜' },
    { id: 'bradesco', nome: '🔵 Bradesco', emoji: '🔵' },
    { id: 'itau', nome: '🟠 Itaú', emoji: '🟠' },
    { id: 'bb', nome: '🟡 Banco do Brasil', emoji: '🟡' },
    { id: 'pix', nome: '📱 PIX', emoji: '📱' },
    { id: 'inter', nome: '🧡 Inter', emoji: '🧡' },
    { id: 'picpay', nome: '💚 PicPay', emoji: '💚' },
    { id: 'c6bank', nome: '⚫ C6 Bank', emoji: '⚫' },
    { id: 'original', nome: '🔶 Original', emoji: '🔶' },
    { id: 'next', nome: '🟣 Next', emoji: '🟣' },
    { id: 'neon', nome: '🔺 Neon', emoji: '🔺' },
    { id: 'sicoob', nome: '🟢 Sicoob', emoji: '🟢' },
    { id: 'sicredi', nome: '🔷 Sicredi', emoji: '🔷' },
    { id: 'safra', nome: '🟧 Safra', emoji: '🟧' },
    { id: 'hsbc', nome: '🔻 HSBC', emoji: '🔻' },
    { id: 'btg', nome: '⚪ BTG Pactual', emoji: '⚪' }
];

// ==================== LOJA MASSIVAMENTE EXPANDIDA ====================
const catalogoItens = {
    // PROPRIEDADES EXPANDIDAS
    propriedades: {
        casa_simples: { id: 'casa_simples', nome: '🏠 Casa Simples', preco: 5000, categoria: 'propriedades', emoji: '🏠', beneficio: 'Renda passiva: +50 gold/dia' },
        casa_luxo: { id: 'casa_luxo', nome: '🏘️ Casa de Luxo', preco: 15000, categoria: 'propriedades', emoji: '🏘️', beneficio: 'Renda passiva: +150 gold/dia' },
        mansao: { id: 'mansao', nome: '🏰 Mansão', preco: 50000, categoria: 'propriedades', emoji: '🏰', beneficio: 'Renda passiva: +500 gold/dia' },
        penthouse: { id: 'penthouse', nome: '🏢 Penthouse', preco: 120000, categoria: 'propriedades', emoji: '🏢', beneficio: 'Renda passiva: +1000 gold/dia' },
        fazenda: { id: 'fazenda', nome: '🚜 Fazenda', preco: 25000, categoria: 'propriedades', emoji: '🚜', beneficio: 'Permite agricultura e criação' },
        fazenda_mega: { id: 'fazenda_mega', nome: '🌾 Mega Fazenda', preco: 80000, categoria: 'propriedades', emoji: '🌾', beneficio: 'Renda passiva: +800 gold/dia + Agricultura 2x' },
        posto_gasolina: { id: 'posto_gasolina', nome: '⛽ Posto de Gasolina', preco: 35000, categoria: 'propriedades', emoji: '⛽', beneficio: 'Renda passiva: +300 gold/dia' },
        shopping: { id: 'shopping', nome: '🛍️ Shopping Center', preco: 200000, categoria: 'propriedades', emoji: '🛍️', beneficio: 'Renda passiva: +1500 gold/dia' },
        hotel: { id: 'hotel', nome: '🏨 Hotel', preco: 150000, categoria: 'propriedades', emoji: '🏨', beneficio: 'Renda passiva: +1200 gold/dia' },
        resort: { id: 'resort', nome: '🏖️ Resort', preco: 500000, categoria: 'propriedades', emoji: '🏖️', beneficio: 'Renda passiva: +3000 gold/dia' },
        ilha_privada: { id: 'ilha_privada', nome: '🏝️ Ilha Privada', preco: 2000000, categoria: 'propriedades', emoji: '🏝️', beneficio: 'Renda passiva: +10000 gold/dia' },
        casino: { id: 'casino', nome: '🎰 Cassino', preco: 800000, categoria: 'propriedades', emoji: '🎰', beneficio: 'Renda passiva: +5000 gold/dia + Apostas 2x' }
    },

    // ANIMAIS EXPANDIDOS
    animais: {
        galinha: { id: 'galinha', nome: '🐔 Galinha', preco: 500, categoria: 'animais', emoji: '🐔', beneficio: 'Produz 3 ovos/dia (30 gold cada)' },
        pato: { id: 'pato', nome: '🦆 Pato', preco: 800, categoria: 'animais', emoji: '🦆', beneficio: 'Produz carne valiosa' },
        gato: { id: 'gato', nome: '🐱 Gato', preco: 200, categoria: 'animais', emoji: '🐱', beneficio: 'Traz sorte (+5% chance crítico)' },
        cachorro: { id: 'cachorro', nome: '🐶 Cachorro', preco: 300, categoria: 'animais', emoji: '🐶', beneficio: 'Protege contra assaltos (+20% defesa)' },
        vaca: { id: 'vaca', nome: '🐄 Vaca', preco: 2500, categoria: 'animais', emoji: '🐄', beneficio: 'Produz 5 litros leite/dia (25 gold cada)' },
        porco: { id: 'porco', nome: '🐷 Porco', preco: 1200, categoria: 'animais', emoji: '🐷', beneficio: 'Renda de 80 gold/dia' },
        cavalo: { id: 'cavalo', nome: '🐎 Cavalo', preco: 8000, categoria: 'animais', emoji: '🐎', beneficio: 'Permite corridas e +50% velocidade entrega' },
        cavalo_corrida: { id: 'cavalo_corrida', nome: '🏇 Cavalo de Corrida', preco: 25000, categoria: 'animais', emoji: '🏇', beneficio: 'Corridas premium +2000 gold/vitória' },
        ovelha: { id: 'ovelha', nome: '🐑 Ovelha', preco: 1500, categoria: 'animais', emoji: '🐑', beneficio: 'Produz lã valiosa (100 gold/dia)' },
        coelho: { id: 'coelho', nome: '🐰 Coelho', preco: 600, categoria: 'animais', emoji: '🐰', beneficio: 'Reprodução rápida (+10% gold todas atividades)' },
        peixe_ornamental: { id: 'peixe_ornamental', nome: '🐠 Peixe Ornamental', preco: 1000, categoria: 'animais', emoji: '🐠', beneficio: 'Decoração (+5% sorte)' },
        papagaio: { id: 'papagaio', nome: '🦜 Papagaio', preco: 3000, categoria: 'animais', emoji: '🦜', beneficio: 'Atrai clientes (+15% renda passiva)' },
        cobra: { id: 'cobra', nome: '🐍 Cobra', preco: 5000, categoria: 'animais', emoji: '🐍', beneficio: 'Proteção extrema (+50% defesa assaltos)' },
        tigre: { id: 'tigre', nome: '🐅 Tigre', preco: 50000, categoria: 'animais', emoji: '🐅', beneficio: 'Intimidação máxima (imune a assaltos)' },
        dragao: { id: 'dragao', nome: '🐲 Dragão', preco: 500000, categoria: 'animais', emoji: '🐲', beneficio: 'Lendário: +1000 gold/dia + Sorte máxima' }
    },

    // FERRAMENTAS EXPANDIDAS
    ferramentas: {
        picareta_madeira: { id: 'picareta_madeira', nome: '🪓 Picareta de Madeira', preco: 100, categoria: 'ferramentas', emoji: '🪓', beneficio: 'Permite mineração básica' },
        picareta_ferro: { id: 'picareta_ferro', nome: '⛏️ Picareta de Ferro', preco: 500, categoria: 'ferramentas', emoji: '⛏️', beneficio: '+15% chance minerais valiosos' },
        picareta_diamante: { id: 'picareta_diamante', nome: '💎 Picareta de Diamante', preco: 4500, categoria: 'ferramentas', emoji: '💎', beneficio: '+30% chance minerais valiosos' },
        picareta_netherite: { id: 'picareta_netherite', nome: '⚫ Picareta de Netherite', preco: 15000, categoria: 'ferramentas', emoji: '⚫', beneficio: '+50% chance minerais raros' },
        vara_bambu: { id: 'vara_bambu', nome: '🎋 Vara de Bambu', preco: 50, categoria: 'ferramentas', emoji: '🎋', beneficio: 'Permite pesca básica' },
        vara_ferro: { id: 'vara_ferro', nome: '🎣 Vara de Ferro', preco: 300, categoria: 'ferramentas', emoji: '🎣', beneficio: '+10% chance peixes raros' },
        vara_ouro: { id: 'vara_ouro', nome: '🥇 Vara de Ouro', preco: 3000, categoria: 'ferramentas', emoji: '🥇', beneficio: '+25% chance peixes raros' },
        vara_lendaria: { id: 'vara_lendaria', nome: '🌟 Vara Lendária', preco: 10000, categoria: 'ferramentas', emoji: '🌟', beneficio: '+40% chance peixes lendários' },
        sementes_basicas: { id: 'sementes_basicas', nome: '🌱 Sementes Básicas', preco: 20, categoria: 'ferramentas', emoji: '🌱', beneficio: 'Permite agricultura básica' },
        sementes_premium: { id: 'sementes_premium', nome: '🌿 Sementes Premium', preco: 200, categoria: 'ferramentas', emoji: '🌿', beneficio: '+25% produção agrícola' },
        trator: { id: 'trator', nome: '🚜 Trator', preco: 12000, categoria: 'ferramentas', emoji: '🚜', beneficio: '+50% produção agrícola' },
        trator_automatico: { id: 'trator_automatico', nome: '🤖 Trator Automático', preco: 50000, categoria: 'ferramentas', emoji: '🤖', beneficio: '+100% produção agrícola' },
        rifle_caca: { id: 'rifle_caca', nome: '🔫 Rifle de Caça', preco: 2000, categoria: 'ferramentas', emoji: '🔫', beneficio: 'Permite caça' },
        rifle_sniper: { id: 'rifle_sniper', nome: '🎯 Rifle Sniper', preco: 8000, categoria: 'ferramentas', emoji: '🎯', beneficio: '+30% chance caça bem-sucedida' },
        armadilha: { id: 'armadilha', nome: '🪤 Armadilha', preco: 500, categoria: 'ferramentas', emoji: '🪤', beneficio: 'Caça passiva (20 gold/dia)' }
    },

    // VEÍCULOS EXPANDIDOS
    veiculos: {
        bike: { id: 'bike', nome: '🚲 Bicicleta', preco: 800, categoria: 'veiculos', emoji: '🚲', beneficio: '+10% velocidade trabalhos' },
        bike_eletrica: { id: 'bike_eletrica', nome: '⚡ Bike Elétrica', preco: 3000, categoria: 'veiculos', emoji: '⚡', beneficio: '+20% velocidade trabalhos' },
        patinete: { id: 'patinete', nome: '🛴 Patinete', preco: 400, categoria: 'veiculos', emoji: '🛴', beneficio: '+5% velocidade trabalhos' },
        moto: { id: 'moto', nome: '🏍️ Motocicleta', preco: 5000, categoria: 'veiculos', emoji: '🏍️', beneficio: 'Habilita trabalho entregador' },
        moto_esportiva: { id: 'moto_esportiva', nome: '🏁 Moto Esportiva', preco: 20000, categoria: 'veiculos', emoji: '🏁', beneficio: '+50% ganho entregas' },
        carro: { id: 'carro', nome: '🚗 Carro', preco: 20000, categoria: 'veiculos', emoji: '🚗', beneficio: 'Habilita trabalho uber (+200 gold/viagem)' },
        carro_luxo: { id: 'carro_luxo', nome: '🚙 Carro de Luxo', preco: 80000, categoria: 'veiculos', emoji: '🚙', beneficio: 'Uber premium (+500 gold/viagem)' },
        carro_esportivo: { id: 'carro_esportivo', nome: '🏎️ Carro Esportivo', preco: 150000, categoria: 'veiculos', emoji: '🏎️', beneficio: 'Corridas de rua (+1000 gold/vitória)' },
        ferrari: { id: 'ferrari', nome: '🟥 Ferrari', preco: 500000, categoria: 'veiculos', emoji: '🟥', beneficio: 'Corridas premium (+3000 gold/vitória)' },
        lamborghini: { id: 'lamborghini', nome: '🟨 Lamborghini', preco: 600000, categoria: 'veiculos', emoji: '🟨', beneficio: 'Status máximo (+2000 gold corridas)' },
        caminhao: { id: 'caminhao', nome: '🚛 Caminhão', preco: 45000, categoria: 'veiculos', emoji: '🚛', beneficio: 'Trabalho caminhoneiro (+500 gold/viagem)' },
        caminhao_carga: { id: 'caminhao_carga', nome: '🚚 Caminhão de Carga', preco: 80000, categoria: 'veiculos', emoji: '🚚', beneficio: 'Carga pesada (+800 gold/viagem)' },
        onibus: { id: 'onibus', nome: '🚌 Ônibus', preco: 100000, categoria: 'veiculos', emoji: '🚌', beneficio: 'Transporte público (+1000 gold/dia)' },
        barco: { id: 'barco', nome: '🛥️ Barco', preco: 150000, categoria: 'veiculos', emoji: '🛥️', beneficio: 'Trabalho capitão (+600 gold/viagem)' },
        iate: { id: 'iate', nome: '🛳️ Iate', preco: 800000, categoria: 'veiculos', emoji: '🛳️', beneficio: 'Turismo marítimo (+2000 gold/dia)' },
        submarino: { id: 'submarino', nome: '🚢 Submarino', preco: 2000000, categoria: 'veiculos', emoji: '🚢', beneficio: 'Exploração submarina (+5000 gold/dia)' },
        aviao: { id: 'aviao', nome: '✈️ Avião Particular', preco: 500000, categoria: 'veiculos', emoji: '✈️', beneficio: 'Trabalho piloto (+800 gold/voo)' },
        jato_privado: { id: 'jato_privado', nome: '🛩️ Jato Privado', preco: 2000000, categoria: 'veiculos', emoji: '🛩️', beneficio: 'Voos VIP (+3000 gold/voo)' },
        foguete: { id: 'foguete', nome: '🚀 Foguete', preco: 10000000, categoria: 'veiculos', emoji: '🚀', beneficio: 'Turismo espacial (+20000 gold/voo)' }
    },

    // NEGÓCIOS EXPANDIDOS
    negocios: {
        barraquinha: { id: 'barraquinha', nome: '🏪 Barraquinha', preco: 5000, categoria: 'negocios', emoji: '🏪', beneficio: 'Renda passiva: +100 gold/dia' },
        lanchonete: { id: 'lanchonete', nome: '🍔 Lanchonete', preco: 50000, categoria: 'negocios', emoji: '🍔', beneficio: 'Renda passiva: +400 gold/dia' },
        restaurante: { id: 'restaurante', nome: '🍽️ Restaurante', preco: 120000, categoria: 'negocios', emoji: '🍽️', beneficio: 'Renda passiva: +800 gold/dia' },
        restaurante_gourmet: { id: 'restaurante_gourmet', nome: '👨‍🍳 Restaurante Gourmet', preco: 300000, categoria: 'negocios', emoji: '👨‍🍳', beneficio: 'Renda passiva: +1500 gold/dia' },
        padaria: { id: 'padaria', nome: '🥐 Padaria', preco: 30000, categoria: 'negocios', emoji: '🥐', beneficio: 'Renda passiva: +250 gold/dia' },
        pizzaria: { id: 'pizzaria', nome: '🍕 Pizzaria', preco: 80000, categoria: 'negocios', emoji: '🍕', beneficio: 'Renda passiva: +600 gold/dia' },
        sorveteria: { id: 'sorveteria', nome: '🍦 Sorveteria', preco: 40000, categoria: 'negocios', emoji: '🍦', beneficio: 'Renda passiva: +300 gold/dia' },
        academia: { id: 'academia', nome: '💪 Academia', preco: 80000, categoria: 'negocios', emoji: '💪', beneficio: 'Renda passiva: +600 gold/dia' },
        academia_premium: { id: 'academia_premium', nome: '🏋️ Academia Premium', preco: 200000, categoria: 'negocios', emoji: '🏋️', beneficio: 'Renda passiva: +1200 gold/dia' },
        salao_beleza: { id: 'salao_beleza', nome: '💇 Salão de Beleza', preco: 60000, categoria: 'negocios', emoji: '💇', beneficio: 'Renda passiva: +450 gold/dia' },
        barbearia: { id: 'barbearia', nome: '✂️ Barbearia', preco: 35000, categoria: 'negocios', emoji: '✂️', beneficio: 'Renda passiva: +280 gold/dia' },
        clinica: { id: 'clinica', nome: '🏥 Clínica', preco: 150000, categoria: 'negocios', emoji: '🏥', beneficio: 'Renda passiva: +1000 gold/dia' },
        hospital: { id: 'hospital', nome: '🏨 Hospital', preco: 500000, categoria: 'negocios', emoji: '🏨', beneficio: 'Renda passiva: +3000 gold/dia' },
        escola: { id: 'escola', nome: '🏫 Escola', preco: 200000, categoria: 'negocios', emoji: '🏫', beneficio: 'Renda passiva: +1300 gold/dia' },
        universidade: { id: 'universidade', nome: '🎓 Universidade', preco: 800000, categoria: 'negocios', emoji: '🎓', beneficio: 'Renda passiva: +4000 gold/dia' },
        empresa: { id: 'empresa', nome: '🏢 Empresa', preco: 200000, categoria: 'negocios', emoji: '🏢', beneficio: 'Habilita trabalho CEO (+1200 gold/dia)' },
        multinacional: { id: 'multinacional', nome: '🌐 Multinacional', preco: 2000000, categoria: 'negocios', emoji: '🌐', beneficio: 'CEO global (+10000 gold/dia)' },
        banco: { id: 'banco', nome: '🏦 Banco', preco: 1000000, categoria: 'negocios', emoji: '🏦', beneficio: 'Renda passiva: +5000 gold/dia' },
        bolsa_valores: { id: 'bolsa_valores', nome: '📈 Bolsa de Valores', preco: 5000000, categoria: 'negocios', emoji: '📈', beneficio: 'Controle do mercado (+20000 gold/dia)' }
    },

    // TECNOLOGIA EXPANDIDA
    tecnologia: {
        celular_basico: { id: 'celular_basico', nome: '📞 Celular Básico', preco: 200, categoria: 'tecnologia', emoji: '📞', beneficio: '+5% eficiência trabalhos' },
        smartphone: { id: 'smartphone', nome: '📱 Smartphone', preco: 2000, categoria: 'tecnologia', emoji: '📱', beneficio: '+10% eficiência trabalhos' },
        iphone: { id: 'iphone', nome: '📲 iPhone', preco: 8000, categoria: 'tecnologia', emoji: '📲', beneficio: '+20% eficiência + Status' },
        tablet: { id: 'tablet', nome: '📱 Tablet', preco: 3000, categoria: 'tecnologia', emoji: '📱', beneficio: '+15% eficiência trabalhos' },
        computador: { id: 'computador', nome: '💻 Computador', preco: 8000, categoria: 'tecnologia', emoji: '💻', beneficio: 'Habilita trabalho programador' },
        computador_gamer: { id: 'computador_gamer', nome: '🖥️ PC Gamer', preco: 25000, categoria: 'tecnologia', emoji: '🖥️', beneficio: 'Streaming + Programação avançada' },
        servidor: { id: 'servidor', nome: '🖥️ Servidor', preco: 100000, categoria: 'tecnologia', emoji: '🖥️', beneficio: 'Renda passiva: +1000 gold/dia' },
        supercomputador: { id: 'supercomputador', nome: '⚡ Supercomputador', preco: 500000, categoria: 'tecnologia', emoji: '⚡', beneficio: 'Renda passiva: +3000 gold/dia' },
        setup_stream_basico: { id: 'setup_stream_basico', nome: '📹 Setup Stream Básico', preco: 5000, categoria: 'tecnologia', emoji: '📹', beneficio: 'Habilita streamer (+100 gold/stream)' },
        setup_stream: { id: 'setup_stream', nome: '🎬 Setup Stream Pro', preco: 25000, categoria: 'tecnologia', emoji: '🎬', beneficio: 'Streamer profissional (+300 gold/stream)' },
        setup_youtube: { id: 'setup_youtube', nome: '🎥 Setup YouTube', preco: 50000, categoria: 'tecnologia', emoji: '🎥', beneficio: 'Habilita YouTuber (seguidores + renda)' },
        setup_tiktok: { id: 'setup_tiktok', nome: '📱 Setup TikTok', preco: 30000, categoria: 'tecnologia', emoji: '📱', beneficio: 'Habilita TikToker (seguidores + renda)' },
        estudio_gravacao: { id: 'estudio_gravacao', nome: '🎙️ Estúdio de Gravação', preco: 150000, categoria: 'tecnologia', emoji: '🎙️', beneficio: 'Múltiplas plataformas (3000 gold/vídeo)' }
    },

    // DECORAÇÃO E LUXO
    decoracao: {
        sofa: { id: 'sofa', nome: '🛋️ Sofá', preco: 2000, categoria: 'decoracao', emoji: '🛋️', beneficio: '+5% conforto (bonus descanso)' },
        tv: { id: 'tv', nome: '📺 TV', preco: 3000, categoria: 'decoracao', emoji: '📺', beneficio: '+10% moral' },
        tv_4k: { id: 'tv_4k', nome: '📺 TV 4K', preco: 15000, categoria: 'decoracao', emoji: '📺', beneficio: '+20% moral + Status' },
        quadro: { id: 'quadro', nome: '🖼️ Quadro de Arte', preco: 5000, categoria: 'decoracao', emoji: '🖼️', beneficio: '+10% status' },
        obra_arte: { id: 'obra_arte', nome: '🎨 Obra de Arte', preco: 50000, categoria: 'decoracao', emoji: '🎨', beneficio: '+30% status + Renda passiva 200/dia' },
        piano: { id: 'piano', nome: '🎹 Piano', preco: 25000, categoria: 'decoracao', emoji: '🎹', beneficio: '+25% moral + Habilita música' },
        jacuzzi: { id: 'jacuzzi', nome: '🛁 Jacuzzi', preco: 40000, categoria: 'decoracao', emoji: '🛁', beneficio: '+35% relaxamento' },
        piscina: { id: 'piscina', nome: '🏊 Piscina', preco: 80000, categoria: 'decoracao', emoji: '🏊', beneficio: '+50% status + Renda eventos' },
        jardim: { id: 'jardim', nome: '🌺 Jardim', preco: 15000, categoria: 'decoracao', emoji: '🌺', beneficio: '+20% moral + Produção flores' },
        fonte: { id: 'fonte', nome: '⛲ Fonte', preco: 30000, categoria: 'decoracao', emoji: '⛲', beneficio: '+40% status' }
    },

    // ARMAS E SEGURANÇA
    seguranca: {
        cadeado: { id: 'cadeado', nome: '🔒 Cadeado', preco: 50, categoria: 'seguranca', emoji: '🔒', beneficio: '+5% proteção assaltos' },
        alarme: { id: 'alarme', nome: '🚨 Alarme', preco: 500, categoria: 'seguranca', emoji: '🚨', beneficio: '+15% proteção assaltos' },
        camera: { id: 'camera', nome: '📹 Câmera', preco: 2000, categoria: 'seguranca', emoji: '📹', beneficio: '+25% proteção + Evidências' },
        seguranca_privada: { id: 'seguranca_privada', nome: '👮 Segurança Privada', preco: 10000, categoria: 'seguranca', emoji: '👮', beneficio: '+50% proteção assaltos' },
        blindagem: { id: 'blindagem', nome: '🛡️ Blindagem', preco: 50000, categoria: 'seguranca', emoji: '🛡️', beneficio: '+80% proteção assaltos' },
        cofre: { id: 'cofre', nome: '🔐 Cofre', preco: 25000, categoria: 'seguranca', emoji: '🔐', beneficio: 'Protege 50% do dinheiro de assaltos' },
        bunker: { id: 'bunker', nome: '🏭 Bunker', preco: 500000, categoria: 'seguranca', emoji: '🏭', beneficio: 'Imunidade total a assaltos' }
    }
};

// ==================== SISTEMA DE TRABALHO COM FERRAMENTAS ====================
const trabalhos = [
    { nome: 'Mendigo', salario: 20, emoji: '🤲', requisito: null, descricao: 'Pedir esmolas na rua' },
    { nome: 'Vendedor Ambulante', salario: 50, emoji: '🚶', requisito: null, descricao: 'Vender produtos na rua' },
    { nome: 'Faxineiro', salario: 80, emoji: '🧹', requisito: null, descricao: 'Limpar estabelecimentos' },
    { nome: 'Entregador a Pé', salario: 100, emoji: '🚶', requisito: null, descricao: 'Entregar pedidos caminhando' },
    { nome: 'Ciclista', salario: 120, emoji: '🚴', requisito: 'bike', descricao: 'Delivery de bicicleta' },
    { nome: 'Entregador', salario: 180, emoji: '🏍️', requisito: 'moto', descricao: 'Delivery profissional' },
    { nome: 'Uber', salario: 250, emoji: '🚗', requisito: 'carro', descricao: 'Motorista de aplicativo' },
    { nome: 'Uber Black', salario: 400, emoji: '🚙', requisito: 'carro_luxo', descricao: 'Motorista premium' },
    { nome: 'Caminhoneiro', salario: 500, emoji: '🚛', requisito: 'caminhao', descricao: 'Transporte de carga' },
    { nome: 'Minerador', salario: 200, emoji: '⛏️', requisito: 'picareta_ferro', descricao: 'Trabalhar em minas' },
    { nome: 'Minerador Profissional', salario: 400, emoji: '💎', requisito: 'picareta_diamante', descricao: 'Mineração avançada' },
    { nome: 'Pescador', salario: 150, emoji: '🎣', requisito: 'vara_ferro', descricao: 'Pesca profissional' },
    { nome: 'Pescador Experiente', salario: 300, emoji: '🥇', requisito: 'vara_ouro', descricao: 'Pesca de alto nível' },
    { nome: 'Fazendeiro', salario: 200, emoji: '🚜', requisito: 'fazenda', descricao: 'Agricultura e criação' },
    { nome: 'Agricultor Industrial', salario: 500, emoji: '🤖', requisito: 'trator_automatico', descricao: 'Agricultura automatizada' },
    { nome: 'Caçador', salario: 300, emoji: '🔫', requisito: 'rifle_caca', descricao: 'Caça de animais selvagens' },
    { nome: 'Atirador de Elite', salario: 600, emoji: '🎯', requisito: 'rifle_sniper', descricao: 'Caça profissional' },
    { nome: 'Programador', salario: 400, emoji: '💻', requisito: 'computador', descricao: 'Desenvolvimento de software' },
    { nome: 'Streamer', salario: 300, emoji: '🎬', requisito: 'setup_stream', descricao: 'Transmissões ao vivo' },
    { nome: 'YouTuber', salario: 500, emoji: '🎥', requisito: 'setup_youtube', descricao: 'Criador de conteúdo' },
    { nome: 'TikToker', salario: 400, emoji: '📱', requisito: 'setup_tiktok', descricao: 'Vídeos virais' },
    { nome: 'Piloto', salario: 800, emoji: '✈️', requisito: 'aviao', descricao: 'Aviação comercial' },
    { nome: 'Piloto de Jato', salario: 2000, emoji: '🛩️', requisito: 'jato_privado', descricao: 'Voos VIP' },
    { nome: 'Astronauta', salario: 5000, emoji: '🚀', requisito: 'foguete', descricao: 'Exploração espacial' },
    { nome: 'Capitão de Barco', salario: 600, emoji: '🛥️', requisito: 'barco', descricao: 'Navegação marítima' },
    { nome: 'Capitão de Iate', salario: 1500, emoji: '🛳️', requisito: 'iate', descricao: 'Turismo de luxo' },
    { nome: 'CEO', salario: 1500, emoji: '🏢', requisito: 'empresa', descricao: 'Gestão empresarial' },
    { nome: 'CEO Global', salario: 5000, emoji: '🌐', requisito: 'multinacional', descricao: 'Império empresarial' }
];

// ==================== SISTEMA DE RISCOS E FALHAS ====================
const riscosTrabalho = {
    pesca: [
        { tipo: 'afogamento', chance: 2, perda: 100, msg: '🌊 Você quase se afogou! Perdeu equipamentos.' },
        { tipo: 'tempestade', chance: 5, perda: 50, msg: '⛈️ Uma tempestade destruiu seus equipamentos!' },
        { tipo: 'vara_quebrou', chance: 8, perda: 30, msg: '💔 Sua vara de pescar quebrou!' }
    ],
    mineracao: [
        { tipo: 'desabamento', chance: 3, perda: 200, msg: '⚰️ A mina desabou! Você morreu e perdeu tudo!' },
        { tipo: 'gas_toxico', chance: 5, perda: 150, msg: '☠️ Gás tóxico na mina! Tratamento médico caro.' },
        { tipo: 'picareta_quebrou', chance: 10, perda: 50, msg: '💔 Sua picareta quebrou!' },
        { tipo: 'acidente', chance: 7, perda: 80, msg: '🏥 Acidente na mina! Gastos médicos.' }
    ],
    caca: [
        { tipo: 'animal_ataca', chance: 4, perda: 300, msg: '🐻 Um urso te atacou! Você morreu e perdeu tudo!' },
        { tipo: 'tiro_errado', chance: 8, perda: 100, msg: '🎯 Tiro errado! Perdeu munição cara.' },
        { tipo: 'rifle_emperrou', chance: 12, perda: 60, msg: '🔫 Seu rifle emperrou! Gastos com reparo.' },
        { tipo: 'ferimento', chance: 10, perda: 80, msg: '🩸 Você se feriu! Tratamento médico.' }
    ],
    agricultura: [
        { tipo: 'praga', chance: 8, perda: 100, msg: '🦗 Praga devastou sua plantação!' },
        { tipo: 'seca', chance: 6, perda: 150, msg: '🏜️ Seca destruiu toda a colheita!' },
        { tipo: 'tempestade_destruiu', chance: 4, perda: 200, msg: '🌪️ Tornado destruiu a fazenda!' },
        { tipo: 'doenca_animal', chance: 7, perda: 120, msg: '🐄 Doença matou seus animais!' }
    ],
    trabalho_geral: [
        { tipo: 'acidente_trabalho', chance: 5, perda: 100, msg: '⚠️ Acidente de trabalho! Afastamento médico.' },
        { tipo: 'demitido', chance: 3, perda: 200, msg: '📋 Você foi demitido! Perdeu benefícios.' },
        { tipo: 'multa', chance: 8, perda: 50, msg: '💸 Multa por infração no trabalho!' }
    ]
};

// ==================== SISTEMA YOUTUBER/TIKTOK ====================
const plataformasDigitais = {
    youtube: {
        nome: 'YouTube',
        emoji: '🎥',
        seguidoresIniciais: 100,
        crescimentoBase: 50,
        rendaPorMil: 5,
        setup: 'setup_youtube'
    },
    tiktok: {
        nome: 'TikTok', 
        emoji: '📱',
        seguidoresIniciais: 200,
        crescimentoBase: 100,
        rendaPorMil: 3,
        setup: 'setup_tiktok'
    },
    twitch: {
        nome: 'Twitch',
        emoji: '🎮',
        seguidoresIniciais: 50,
        crescimentoBase: 30,
        rendaPorMil: 8,
        setup: 'setup_stream'
    }
};

// ==================== LOCAIS PARA ROUBAR ====================
const locaisRoubo = [
    { id: 'casa_vizinho', nome: '🏠 Casa do Vizinho', dificuldade: 20, recompensa: [50, 200], risco: 15 },
    { id: 'loja_conveniencia', nome: '🏪 Loja de Conveniência', dificuldade: 30, recompensa: [100, 400], risco: 25 },
    { id: 'farmacia', nome: '💊 Farmácia', dificuldade: 35, recompensa: [150, 500], risco: 30 },
    { id: 'posto_gasolina', nome: '⛽ Posto de Gasolina', dificuldade: 40, recompensa: [200, 600], risco: 35 },
    { id: 'loja_roupas', nome: '👕 Loja de Roupas', dificuldade: 45, recompensa: [300, 800], risco: 40 },
    { id: 'restaurante', nome: '🍽️ Restaurante', dificuldade: 50, recompensa: [400, 1000], risco: 45 },
    { id: 'supermercado', nome: '🛒 Supermercado', dificuldade: 60, recompensa: [500, 1200], risco: 55 },
    { id: 'loja_eletronicos', nome: '📱 Loja de Eletrônicos', dificuldade: 70, recompensa: [800, 2000], risco: 65 },
    { id: 'joalheria', nome: '💎 Joalheria', dificuldade: 80, recompensa: [1500, 4000], risco: 75 },
    { id: 'banco_pequeno', nome: '🏦 Banco (Agência)', dificuldade: 90, recompensa: [3000, 8000], risco: 85 },
    { id: 'banco_central', nome: '🏛️ Banco Central', dificuldade: 95, recompensa: [10000, 25000], risco: 90 },
    { id: 'casino', nome: '🎰 Cassino', dificuldade: 85, recompensa: [2000, 6000], risco: 80 }
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
        
        // Sistema de plataformas digitais
        plataformas: usuario.plataformas || {},
        
        // Contadores de atividades com limites diários
        limitesHoje: usuario.limitesHoje || {},
        ultimaResetData: usuario.ultimaResetData || hoje,
        
        // Contadores de atividades
        pescasFeitas: usuario.pescasFeitas || 0,
        mineracoesFeitas: usuario.mineracoesFeitas || 0,
        trabalhosFeitos: usuario.trabalhosFeitos || 0,
        assaltosFeitos: usuario.assaltosFeitos || 0,
        roubosFeitos: usuario.roubosFeitos || 0,
        cacasFeitas: usuario.cacasFeitas || 0,
        agriculturasFeitas: usuario.agriculturasFeitas || 0,
        entregasFeitas: usuario.entregasFeitas || 0,
        estudosFeitos: usuario.estudosFeitos || 0,
        investimentosFeitos: usuario.investimentosFeitos || 0,
        
        // Última vez que fez cada atividade
        ultimaPesca: usuario.ultimaPesca || 0,
        ultimaMineracao: usuario.ultimaMineracao || 0,
        ultimoTrabalho: usuario.ultimoTrabalho || 0,
        ultimoAssalto: usuario.ultimoAssalto || 0,
        ultimoRoubo: usuario.ultimoRoubo || 0,
        ultimaCaca: usuario.ultimaCaca || 0,
        ultimaAgricultura: usuario.ultimaAgricultura || 0,
        ultimaEntrega: usuario.ultimaEntrega || 0,
        ultimoEstudo: usuario.ultimoEstudo || 0,
        ultimoInvestimento: usuario.ultimoInvestimento || 0,
        
        // Sistema educacional
        educacao: usuario.educacao || {
            nivel: 0,
            cursosCompletos: [],
            estudandoAtualmente: null
        },
        
        // Estatísticas especiais
        totalGanho: usuario.totalGanho || 0,
        totalGasto: usuario.totalGasto || 0,
        maiorGanho: usuario.maiorGanho || 0,
        mortes: usuario.mortes || 0,
        nivelRisco: usuario.nivelRisco || 1
    };
}

// Verifica e reseta limites diários
function verificarLimitesHoje(usuario) {
    const hoje = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
    
    if (usuario.ultimaResetData !== hoje) {
        usuario.limitesHoje = {};
        usuario.ultimaResetData = hoje;
    }
    
    return usuario;
}

// Verifica se atingiu limite diário para atividade
function verificarLimiteAtividade(usuario, atividade, limite) {
    usuario = verificarLimitesHoje(usuario);
    const atual = usuario.limitesHoje[atividade] || 0;
    
    if (atual >= limite) {
        const horasRestantes = 24 - moment().tz('America/Sao_Paulo').hour();
        return {
            atingido: true,
            mensagem: `⏰ **LIMITE DIÁRIO ATINGIDO!**\n\n😴 Você já ${atividade} demais hoje!\n🕐 Volte em **${horasRestantes} horas** para continuar.`
        };
    }
    
    return { atingido: false };
}

// Atualiza contador de atividade
function atualizarContadorAtividade(usuario, atividade) {
    usuario = verificarLimitesHoje(usuario);
    usuario.limitesHoje[atividade] = (usuario.limitesHoje[atividade] || 0) + 1;
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
    return usuario;
}

// Função para verificar cooldown
function verificarCooldown(ultimaVez, cooldownMs) {
    const agora = Date.now();
    const tempoRestante = cooldownMs - (agora - ultimaVez);
    return tempoRestante > 0 ? tempoRestante : 0;
}

// Formatar tempo
function formatarTempo(ms) {
    const minutos = Math.ceil(ms / 60000);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
        return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Função pescar MELHORADA
function pescar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'pesca', 8);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica se tem vara de pescar
        const temVara = usuario.inventario.vara_bambu || usuario.inventario.vara_ferro || 
                       usuario.inventario.vara_ouro || usuario.inventario.vara_lendaria;
        
        if (!temVara) {
            return { erro: 'Você precisa de uma vara de pescar! Compre na loja.' };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaPesca, 15 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🎣 Você precisa esperar **${formatarTempo(cooldown)}** para pescar novamente!`
            };
        }
        
        // Verifica riscos
        for (const risco of riscosTrabalho.pesca) {
            if (Math.random() * 100 < risco.chance) {
                usuario.saldo = Math.max(0, usuario.saldo - risco.perda);
                if (risco.tipo === 'afogamento') usuario.mortes++;
                usuario.ultimaPesca = Date.now();
                usuario = atualizarContadorAtividade(usuario, 'pesca');
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return { 
                    sucesso: false,
                    risco: true,
                    mensagem: `🎣 **PESCA COM PROBLEMA!** ⚠️\n\n${risco.msg}\n💸 **Perdeu:** ${risco.perda} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
                };
            }
        }
        
        // Calcula bonus da vara
        let bonusChance = 0;
        if (usuario.inventario.vara_lendaria) bonusChance = 40;
        else if (usuario.inventario.vara_ouro) bonusChance = 25;
        else if (usuario.inventario.vara_ferro) bonusChance = 10;
        
        // Peixes com raridades
        const peixes = [
            { nome: 'Peixe Dourado Lendário', valor: 500, chance: 1 + bonusChance, emoji: '🐠' },
            { nome: 'Salmão Real', valor: 300, chance: 3 + bonusChance, emoji: '🐟' },
            { nome: 'Atum', valor: 180, chance: 8 + bonusChance, emoji: '🐟' },
            { nome: 'Sardinha', valor: 100, chance: 20, emoji: '🐟' },
            { nome: 'Tilápia', valor: 80, chance: 30, emoji: '🐟' },
            { nome: 'Bagre', valor: 60, chance: 38, emoji: '🐟' }
        ];
        
        let peixePescado = null;
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        
        for (const peixe of peixes) {
            chanceAcumulada += peixe.chance;
            if (sorte <= chanceAcumulada) {
                peixePescado = peixe;
                break;
            }
        }
        
        if (!peixePescado) {
            usuario.ultimaPesca = Date.now();
            usuario = atualizarContadorAtividade(usuario, 'pesca');
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return { 
                sucesso: false, 
                mensagem: "🎣 **PESCA SEM SUCESSO** 😞\n\nOs peixes não morderam a isca desta vez!\n\n⏰ **Cooldown:** 15 minutos" 
            };
        }
        
        usuario.saldo += peixePescado.valor;
        usuario.totalGanho += peixePescado.valor;
        usuario.ultimaPesca = Date.now();
        usuario.pescasFeitas++;
        usuario = atualizarContadorAtividade(usuario, 'pesca');
        
        const limitesRestantes = 8 - (usuario.limitesHoje.pesca || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            peixe: peixePescado,
            mensagem: `🎣 **PESCA BEM-SUCEDIDA!** ${peixePescado.emoji}\n\n${peixePescado.nome} pescado!\n💰 **Ganhou:** ${peixePescado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🎣 **Pescas restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 15 minutos`
        };
    });
}

// Função minerar MELHORADA
function minerar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'mineracao', 6);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica se tem picareta
        const temPicareta = usuario.inventario.picareta_madeira || usuario.inventario.picareta_ferro || 
                           usuario.inventario.picareta_diamante || usuario.inventario.picareta_netherite;
        
        if (!temPicareta) {
            return { erro: 'Você precisa de uma picareta para minerar! Compre na loja.' };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaMineracao, 20 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `⛏️ Você precisa esperar **${formatarTempo(cooldown)}** para minerar novamente!`
            };
        }
        
        // Verifica riscos MORTAIS
        for (const risco of riscosTrabalho.mineracao) {
            if (Math.random() * 100 < risco.chance) {
                if (risco.tipo === 'desabamento') {
                    // MORTE TOTAL - perde tudo
                    usuario.saldo = 0;
                    usuario.mortes++;
                    usuario.ultimaMineracao = Date.now();
                    usuario = atualizarContadorAtividade(usuario, 'mineracao');
                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);
                    
                    return { 
                        sucesso: false,
                        morte: true,
                        mensagem: `⛏️ **DESASTRE NA MINERAÇÃO!** ☠️\n\n⚰️ **A MINA DESABOU!**\n💀 **VOCÊ MORREU!**\n\n💸 **PERDEU TUDO:** Todo seu dinheiro!\n🏥 **Mortes:** ${usuario.mortes}\n\n😱 Na próxima seja mais cuidadoso...`
                    };
                } else {
                    usuario.saldo = Math.max(0, usuario.saldo - risco.perda);
                    usuario.ultimaMineracao = Date.now();
                    usuario = atualizarContadorAtividade(usuario, 'mineracao');
                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);
                    
                    return { 
                        sucesso: false,
                        risco: true,
                        mensagem: `⛏️ **MINERAÇÃO COM PROBLEMA!** ⚠️\n\n${risco.msg}\n💸 **Perdeu:** ${risco.perda} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
                    };
                }
            }
        }
        
        // Calcula bonus da picareta
        let bonusChance = 0;
        if (usuario.inventario.picareta_netherite) bonusChance = 50;
        else if (usuario.inventario.picareta_diamante) bonusChance = 30;
        else if (usuario.inventario.picareta_ferro) bonusChance = 15;
        
        // Minerais com raridades
        const minerais = [
            { nome: 'Netherite', valor: 1000, chance: 0.5 + bonusChance, emoji: '⚫' },
            { nome: 'Diamante', valor: 500, chance: 1 + bonusChance, emoji: '💎' },
            { nome: 'Ouro', valor: 300, chance: 3 + bonusChance, emoji: '🥇' },
            { nome: 'Prata', valor: 200, chance: 8 + bonusChance, emoji: '🥈' },
            { nome: 'Ferro', valor: 100, chance: 25, emoji: '⚡' },
            { nome: 'Cobre', valor: 60, chance: 35, emoji: '🟤' },
            { nome: 'Carvão', valor: 30, chance: 27.5, emoji: '⚫' }
        ];
        
        let mineralEncontrado = null;
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        
        for (const mineral of minerais) {
            chanceAcumulada += mineral.chance;
            if (sorte <= chanceAcumulada) {
                mineralEncontrado = mineral;
                break;
            }
        }
        
        if (!mineralEncontrado) {
            usuario.ultimaMineracao = Date.now();
            usuario = atualizarContadorAtividade(usuario, 'mineracao');
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return { 
                sucesso: false, 
                mensagem: "⛏️ **MINERAÇÃO SEM SUCESSO** 😞\n\nApenas pedras comuns foram encontradas!\n\n⏰ **Cooldown:** 20 minutos" 
            };
        }
        
        usuario.saldo += mineralEncontrado.valor;
        usuario.totalGanho += mineralEncontrado.valor;
        usuario.ultimaMineracao = Date.now();
        usuario.mineracoesFeitas++;
        usuario = atualizarContadorAtividade(usuario, 'mineracao');
        
        const limitesRestantes = 6 - (usuario.limitesHoje.mineracao || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            mineral: mineralEncontrado,
            mensagem: `⛏️ **MINERAÇÃO BEM-SUCEDIDA!** ${mineralEncontrado.emoji}\n\n${mineralEncontrado.nome} encontrado!\n💰 **Ganhou:** ${mineralEncontrado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n⛏️ **Minerações restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 20 minutos`
        };
    });
}

// Função trabalhar MELHORADA
function trabalhar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'trabalho', 4);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimoTrabalho, 25 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `💼 Você precisa esperar **${formatarTempo(cooldown)}** para trabalhar novamente!`
            };
        }
        
        // Encontra o melhor trabalho que o usuário pode fazer
        let melhorTrabalho = trabalhos[0]; // Mendigo como padrão
        
        for (const trabalho of trabalhos) {
            if (!trabalho.requisito) {
                melhorTrabalho = trabalho;
            } else if (usuario.inventario[trabalho.requisito]) {
                melhorTrabalho = trabalho;
            }
        }
        
        // Verifica riscos
        for (const risco of riscosTrabalho.trabalho_geral) {
            if (Math.random() * 100 < risco.chance) {
                usuario.saldo = Math.max(0, usuario.saldo - risco.perda);
                usuario.ultimoTrabalho = Date.now();
                usuario = atualizarContadorAtividade(usuario, 'trabalho');
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return { 
                    sucesso: false,
                    risco: true,
                    mensagem: `💼 **TRABALHO COM PROBLEMA!** ⚠️\n\n${risco.msg}\n💸 **Perdeu:** ${risco.perda} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
                };
            }
        }
        
        const ganho = melhorTrabalho.salario;
        usuario.saldo += ganho;
        usuario.totalGanho += ganho;
        usuario.ultimoTrabalho = Date.now();
        usuario.trabalhosFeitos++;
        usuario = atualizarContadorAtividade(usuario, 'trabalho');
        
        const limitesRestantes = 4 - (usuario.limitesHoje.trabalho || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            trabalho: melhorTrabalho,
            mensagem: `💼 **TRABALHO CONCLUÍDO!** ${melhorTrabalho.emoji}\n\n**Profissão:** ${melhorTrabalho.nome}\n**Descrição:** ${melhorTrabalho.descricao}\n💰 **Ganhou:** ${ganho} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n💼 **Trabalhos restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 25 minutos`
        };
    });
}

// Função caçar MELHORADA
function cacar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'caca', 3);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica se tem rifle
        const temRifle = usuario.inventario.rifle_caca || usuario.inventario.rifle_sniper;
        
        if (!temRifle) {
            return { erro: 'Você precisa de um rifle para caçar! Compre na loja.' };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaCaca, 20 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🔫 Você precisa esperar **${formatarTempo(cooldown)}** para caçar novamente!`
            };
        }
        
        // Verifica riscos MORTAIS
        for (const risco of riscosTrabalho.caca) {
            if (Math.random() * 100 < risco.chance) {
                if (risco.tipo === 'animal_ataca') {
                    // MORTE TOTAL
                    usuario.saldo = 0;
                    usuario.mortes++;
                    usuario.ultimaCaca = Date.now();
                    usuario = atualizarContadorAtividade(usuario, 'caca');
                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);
                    
                    return { 
                        sucesso: false,
                        morte: true,
                        mensagem: `🔫 **CAÇADA FATAL!** ☠️\n\n🐻 **UM URSO TE ATACOU!**\n💀 **VOCÊ MORREU!**\n\n💸 **PERDEU TUDO:** Todo seu dinheiro!\n🏥 **Mortes:** ${usuario.mortes}\n\n😱 A natureza é selvagem...`
                    };
                } else {
                    usuario.saldo = Math.max(0, usuario.saldo - risco.perda);
                    usuario.ultimaCaca = Date.now();
                    usuario = atualizarContadorAtividade(usuario, 'caca');
                    dados.jogadores[userId] = usuario;
                    salvarDadosRPG(dados);
                    
                    return { 
                        sucesso: false,
                        risco: true,
                        mensagem: `🔫 **CAÇADA COM PROBLEMA!** ⚠️\n\n${risco.msg}\n💸 **Perdeu:** ${risco.perda} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
                    };
                }
            }
        }
        
        // Calcula bonus do rifle
        let bonusChance = 0;
        if (usuario.inventario.rifle_sniper) bonusChance = 30;
        
        // Animais para caça
        const animais = [
            { nome: 'Dragão', valor: 2000, chance: 0.1 + bonusChance, emoji: '🐲' },
            { nome: 'Leão', valor: 800, chance: 1 + bonusChance, emoji: '🦁' },
            { nome: 'Javali', valor: 400, chance: 3 + bonusChance, emoji: '🐗' },
            { nome: 'Veado', valor: 250, chance: 8 + bonusChance, emoji: '🦌' },
            { nome: 'Coelho', valor: 120, chance: 15 + bonusChance, emoji: '🐰' },
            { nome: 'Pato Selvagem', valor: 100, chance: 30, emoji: '🦆' },
            { nome: 'Perdiz', valor: 80, chance: 42.9, emoji: '🐦' }
        ];
        
        let animalCacado = null;
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        
        for (const animal of animais) {
            chanceAcumulada += animal.chance;
            if (sorte <= chanceAcumulada) {
                animalCacado = animal;
                break;
            }
        }
        
        if (!animalCacado) {
            usuario.ultimaCaca = Date.now();
            usuario = atualizarContadorAtividade(usuario, 'caca');
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return { 
                sucesso: false, 
                mensagem: "🔫 **CAÇADA SEM SUCESSO** 😞\n\nOs animais escaparam desta vez!\n\n⏰ **Cooldown:** 20 minutos" 
            };
        }
        
        usuario.saldo += animalCacado.valor;
        usuario.totalGanho += animalCacado.valor;
        usuario.ultimaCaca = Date.now();
        usuario.cacasFeitas++;
        usuario = atualizarContadorAtividade(usuario, 'caca');
        
        const limitesRestantes = 3 - (usuario.limitesHoje.caca || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            animal: animalCacado,
            mensagem: `🔫 **CAÇADA BEM-SUCEDIDA!** ${animalCacado.emoji}\n\n${animalCacado.nome} caçado!\n💰 **Ganhou:** ${animalCacado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🔫 **Caçadas restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 20 minutos`
        };
    });
}

// Função agricultura MELHORADA
function agricultura(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'agricultura', 5);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica se tem sementes e fazenda
        const temSementes = usuario.inventario.sementes_basicas || usuario.inventario.sementes_premium;
        const temFazenda = usuario.inventario.fazenda || usuario.inventario.fazenda_mega;
        
        if (!temSementes) {
            return { erro: 'Você precisa de sementes para plantar! Compre na loja.' };
        }
        
        if (!temFazenda) {
            return { erro: 'Você precisa de uma fazenda para plantar! Compre na loja.' };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaAgricultura, 25 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🚜 Você precisa esperar **${formatarTempo(cooldown)}** para plantar novamente!`
            };
        }
        
        // Verifica riscos
        for (const risco of riscosTrabalho.agricultura) {
            if (Math.random() * 100 < risco.chance) {
                usuario.saldo = Math.max(0, usuario.saldo - risco.perda);
                usuario.ultimaAgricultura = Date.now();
                usuario = atualizarContadorAtividade(usuario, 'agricultura');
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return { 
                    sucesso: false,
                    risco: true,
                    mensagem: `🚜 **AGRICULTURA COM PROBLEMA!** ⚠️\n\n${risco.msg}\n💸 **Perdeu:** ${risco.perda} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
                };
            }
        }
        
        // Calcula bonus
        let bonusProducao = 1;
        if (usuario.inventario.fazenda_mega) bonusProducao += 1; // 2x
        if (usuario.inventario.trator_automatico) bonusProducao += 1; // +100%
        else if (usuario.inventario.trator) bonusProducao += 0.5; // +50%
        if (usuario.inventario.sementes_premium) bonusProducao += 0.25; // +25%
        
        // Cultivos
        const cultivos = [
            { nome: 'Milho Dourado', valor: 200, chance: 5, emoji: '🌽' },
            { nome: 'Tomate Premium', valor: 150, chance: 10, emoji: '🍅' },
            { nome: 'Batata', valor: 120, chance: 20, emoji: '🥔' },
            { nome: 'Cenoura', valor: 100, chance: 30, emoji: '🥕' },
            { nome: 'Alface', valor: 80, chance: 35, emoji: '🥬' }
        ];
        
        let cultivoColhido = null;
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        
        for (const cultivo of cultivos) {
            chanceAcumulada += cultivo.chance;
            if (sorte <= chanceAcumulada) {
                cultivoColhido = cultivo;
                break;
            }
        }
        
        if (!cultivoColhido) {
            usuario.ultimaAgricultura = Date.now();
            usuario = atualizarContadorAtividade(usuario, 'agricultura');
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return { 
                sucesso: false, 
                mensagem: "🚜 **AGRICULTURA SEM SUCESSO** 😞\n\nAs plantas não cresceram bem desta vez!\n\n⏰ **Cooldown:** 25 minutos" 
            };
        }
        
        const ganho = Math.floor(cultivoColhido.valor * bonusProducao);
        usuario.saldo += ganho;
        usuario.totalGanho += ganho;
        usuario.ultimaAgricultura = Date.now();
        usuario.agriculturasFeitas++;
        usuario = atualizarContadorAtividade(usuario, 'agricultura');
        
        const limitesRestantes = 5 - (usuario.limitesHoje.agricultura || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            cultivo: cultivoColhido,
            bonus: bonusProducao,
            mensagem: `🚜 **AGRICULTURA BEM-SUCEDIDA!** ${cultivoColhido.emoji}\n\n${cultivoColhido.nome} colhido!\n💰 **Ganhou:** ${ganho} Gold (${bonusProducao}x bonus)\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🚜 **Plantios restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 25 minutos`
        };
    });
}

// ==================== FUNÇÃO ROUBAR ====================
function roubar(userId, localId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'roubo', 2);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimoRoubo, 45 * 60 * 1000); // 45 minutos
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🏴‍☠️ Você precisa esperar **${formatarTempo(cooldown)}** para roubar novamente!`
            };
        }
        
        if (!localId) {
            let listaLocais = '🏴‍☠️ **LOCAIS PARA ROUBAR**\n\n';
            locaisRoubo.forEach((local, index) => {
                listaLocais += `${index + 1}. ${local.nome}\n`;
                listaLocais += `   💪 Dificuldade: ${local.dificuldade}%\n`;
                listaLocais += `   💰 Recompensa: ${local.recompensa[0]}-${local.recompensa[1]} Gold\n`;
                listaLocais += `   ⚠️ Risco prisão: ${local.risco}%\n\n`;
            });
            
            return {
                listaLocais: true,
                mensagem: listaLocais + `💡 **Como usar:** \`.roubar [número]\`\n📝 **Exemplo:** \`.roubar 1\``
            };
        }
        
        const local = locaisRoubo[localId - 1];
        if (!local) return { erro: 'Local inválido!' };
        
        // Calcula chance de sucesso baseada em habilidade e equipamentos
        let chanceBase = 100 - local.dificuldade;
        let bonusEquipamento = 0;
        
        // Bonus por equipamentos de segurança (irônico, ajuda no crime)
        if (usuario.inventario.camera) bonusEquipamento += 5;
        if (usuario.inventario.alarme) bonusEquipamento += 3;
        
        const chanceTotal = Math.min(95, chanceBase + bonusEquipamento);
        const sucesso = Math.random() * 100 < chanceTotal;
        
        usuario.ultimoRoubo = Date.now();
        usuario.roubosFeitos++;
        usuario = atualizarContadorAtividade(usuario, 'roubo');
        
        if (sucesso) {
            const recompensa = Math.floor(Math.random() * (local.recompensa[1] - local.recompensa[0] + 1)) + local.recompensa[0];
            usuario.saldo += recompensa;
            usuario.totalGanho += recompensa;
            
            const limitesRestantes = 2 - (usuario.limitesHoje.roubo || 0);
            
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return {
                sucesso: true,
                local: local,
                recompensa: recompensa,
                mensagem: `🏴‍☠️ **ROUBO BEM-SUCEDIDO!** 💰\n\n${local.nome} roubado!\n💰 **Roubou:** ${recompensa} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🏴‍☠️ **Roubos restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 45 minutos`
            };
        } else {
            // Falha - verifica se vai preso
            const prisao = Math.random() * 100 < local.risco;
            
            if (prisao) {
                const multa = Math.floor(usuario.saldo * 0.3); // 30% do saldo
                usuario.saldo = Math.max(0, usuario.saldo - multa);
                
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return {
                    sucesso: false,
                    prisao: true,
                    mensagem: `🏴‍☠️ **ROUBO FALHOU!** 🚨\n\n${local.nome}\n👮 **VOCÊ FOI PRESO!**\n💸 **Multa:** ${multa} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n😱 Na próxima planeje melhor!`
                };
            } else {
                dados.jogadores[userId] = usuario;
                salvarDadosRPG(dados);
                
                return {
                    sucesso: false,
                    mensagem: `🏴‍☠️ **ROUBO FALHOU!** 😞\n\n${local.nome}\n🏃 Você escapou por pouco!\n\n💡 Tente um local mais fácil na próxima.`
                };
            }
        }
    });
}

// ==================== SISTEMA YOUTUBER/TIKTOK ====================
function criarConteudo(userId, plataforma) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        const plat = plataformasDigitais[plataforma];
        if (!plat) return { erro: 'Plataforma inválida!' };
        
        // Verifica se tem equipamento necessário
        if (!usuario.inventario[plat.setup]) {
            return { erro: `Você precisa de ${plat.setup.replace('_', ' ')} para ser ${plat.nome}! Compre na loja.` };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario[`ultimo_${plataforma}`] || 0, 60 * 60 * 1000); // 1 hora
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `${plat.emoji} Você precisa esperar **${formatarTempo(cooldown)}** para criar conteúdo no ${plat.nome} novamente!`
            };
        }
        
        // Inicializa plataforma se necessário
        if (!usuario.plataformas[plataforma]) {
            usuario.plataformas[plataforma] = {
                seguidores: plat.seguidoresIniciais,
                videos: 0,
                rendaTotal: 0
            };
        }
        
        const dadosPlataforma = usuario.plataformas[plataforma];
        
        // Simula crescimento de seguidores
        const crescimento = Math.floor(Math.random() * plat.crescimentoBase * 2) + plat.crescimentoBase;
        dadosPlataforma.seguidores += crescimento;
        dadosPlataforma.videos++;
        
        // Calcula renda baseada em seguidores
        const renda = Math.floor((dadosPlataforma.seguidores / 1000) * plat.rendaPorMil);
        dadosPlataforma.rendaTotal += renda;
        usuario.saldo += renda;
        usuario.totalGanho += renda;
        
        usuario[`ultimo_${plataforma}`] = Date.now();
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            plataforma: plat,
            crescimento: crescimento,
            renda: renda,
            dados: dadosPlataforma,
            mensagem: `${plat.emoji} **CONTEÚDO CRIADO NO ${plat.nome.toUpperCase()}!** 🎬\n\n` +
                     `👥 **Novos seguidores:** +${crescimento}\n` +
                     `👥 **Total seguidores:** ${dadosPlataforma.seguidores.toLocaleString()}\n` +
                     `🎥 **Vídeos publicados:** ${dadosPlataforma.videos}\n` +
                     `💰 **Ganhou:** ${renda} Gold\n` +
                     `💳 **Saldo:** ${usuario.saldo} Gold\n\n` +
                     `⏰ **Cooldown:** 1 hora`
        };
    });
}

// ==================== SISTEMA DE ESTUDOS ====================
const cursos = [
    { nome: 'Ensino Médio', salario: 100, duracao: 30, emoji: '🎓', nivel: 1 },
    { nome: 'Curso Técnico', salario: 200, duracao: 45, emoji: '🔧', nivel: 2 },
    { nome: 'Graduação', salario: 400, duracao: 60, emoji: '👨‍🎓', nivel: 3 },
    { nome: 'Pós-Graduação', salario: 700, duracao: 90, emoji: '🎖️', nivel: 4 },
    { nome: 'Mestrado', salario: 1000, duracao: 120, emoji: '📜', nivel: 5 },
    { nome: 'Doutorado', salario: 1500, duracao: 180, emoji: '🏆', nivel: 6 },
    { nome: 'PhD', salario: 2500, duracao: 240, emoji: '🥇', nivel: 7 }
];

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
const investimentos = [
    { nome: 'Poupança', multiplicador: 1.05, risco: 5, emoji: '🏦', minimo: 1000 },
    { nome: 'Tesouro Direto', multiplicador: 1.15, risco: 10, emoji: '🏛️', minimo: 2000 },
    { nome: 'CDB', multiplicador: 1.25, risco: 15, emoji: '💳', minimo: 5000 },
    { nome: 'Ações', multiplicador: 1.50, risco: 40, emoji: '📈', minimo: 10000 },
    { nome: 'Forex', multiplicador: 2.00, risco: 60, emoji: '💱', minimo: 20000 },
    { nome: 'Crypto', multiplicador: 3.00, risco: 80, emoji: '₿', minimo: 15000 },
    { nome: 'NFT', multiplicador: 5.00, risco: 90, emoji: '🖼️', minimo: 50000 }
];

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
                         `💰 **Seu saldo:** ${usuario.saldo} Gold\n\n` +
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

// ==================== OUTRAS FUNÇÕES ====================

// Função jogar tigrinho
function jogarTigrinho(userId, valor) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        if (!valor || isNaN(valor) || valor <= 0) {
            return { erro: 'Valor inválido! Digite um valor maior que 0.' };
        }
        
        if (usuario.saldo < valor) {
            return { erro: `Saldo insuficiente! Você tem ${usuario.saldo} Gold.` };
        }
        
        // Sistema de jogo com diferentes probabilidades
        const resultados = [
            { simbolos: '🐅🐅🐅', multiplicador: 10, chance: 1 },    // Jackpot
            { simbolos: '💎💎💎', multiplicador: 8, chance: 2 },     // Diamantes
            { simbolos: '🍒🍒🍒', multiplicador: 5, chance: 5 },     // Cerejas
            { simbolos: '🍋🍋🍋', multiplicador: 3, chance: 10 },    // Limões
            { simbolos: '🔔🔔🔔', multiplicador: 2, chance: 15 },    // Sinos
            { simbolos: '❌❌❌', multiplicador: 0, chance: 67 }     // Perdeu
        ];
        
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        let resultado = null;
        
        for (const res of resultados) {
            chanceAcumulada += res.chance;
            if (sorte <= chanceAcumulada) {
                resultado = res;
                break;
            }
        }
        
        const ganho = Math.floor(valor * resultado.multiplicador);
        const lucro = ganho - valor;
        
        usuario.saldo += lucro;
        if (lucro > 0) usuario.totalGanho += lucro;
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: lucro > 0,
            resultado: resultado,
            valor: valor,
            ganho: ganho,
            lucro: lucro,
            mensagem: lucro > 0 ?
                `🎰 **TIGRINHO - GANHOU!** 🐅\n\n${resultado.simbolos}\n\n💰 **Apostou:** ${valor} Gold\n💵 **Ganhou:** ${ganho} Gold\n📈 **Lucro:** +${lucro} Gold\n💳 **Saldo:** ${usuario.saldo} Gold` :
                `🎰 **TIGRINHO - PERDEU!** 😭\n\n${resultado.simbolos}\n\n💰 **Perdeu:** ${valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🍀 Tente novamente!`
        };
    });
}

// Função assaltar
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

    // Calcula chance de sucesso baseada em proteções do alvo
    let chanceBase = 60;
    let protecaoAlvo = 0;
    
    if (alvo.inventario?.cachorro) protecaoAlvo += 20;
    if (alvo.inventario?.seguranca_privada) protecaoAlvo += 50;
    if (alvo.inventario?.blindagem) protecaoAlvo += 80;
    if (alvo.inventario?.bunker) protecaoAlvo = 100; // Imunidade total
    
    const chanceReal = Math.max(5, chanceBase - protecaoAlvo);
    const sucesso = Math.random() * 100 < chanceReal;
    
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
                     `💰 **+${valorAssaltado} Gold** roubados!\n` +
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

// Função obter ranking
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
        ranking += `   💰 ${jogador.saldo.toLocaleString()} Gold\n\n`;
    });

    return { mensagem: ranking };
}

// PIX transferir
function pixTransferir(userId, targetId, valor) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        const usuario = dados.jogadores[userId];
        const destinatario = dados.jogadores[targetId];
        
        if (!usuario) return { erro: 'Você não está registrado' };
        if (!destinatario) return { erro: 'Destinatário não está registrado' };
        if (userId === targetId) return { erro: 'Você não pode transferir para si mesmo' };
        
        valor = parseInt(valor);
        if (isNaN(valor) || valor <= 0) return { erro: 'Valor inválido' };
        if (valor < 10) return { erro: 'Valor mínimo para PIX é 10 Gold' };
        if (usuario.saldo < valor) return { erro: 'Saldo insuficiente' };
        
        // Taxa de 2%
        const taxa = Math.floor(valor * 0.02);
        const valorFinal = valor - taxa;
        
        usuario.saldo -= valor;
        destinatario.saldo += valorFinal;
        
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            valor: valor,
            taxa: taxa,
            valorFinal: valorFinal,
            mensagem: `📱 **PIX REALIZADO!** ✅\n\n` +
                     `💸 **Valor enviado:** ${valor} Gold\n` +
                     `💰 **Taxa (2%):** ${taxa} Gold\n` +
                     `✅ **Recebido por ${destinatario.nome}:** ${valorFinal} Gold\n` +
                     `🏦 **Seu saldo:** ${usuario.saldo} Gold`
        };
    });
}

// Comprar item
function comprarItem(userId, itemId, quantidade = 1) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Procura o item em todas as categorias
        let item = null;
        for (const categoria of Object.values(catalogoItens)) {
            if (categoria[itemId]) {
                item = categoria[itemId];
                break;
            }
        }
        
        if (!item) return { erro: 'Item não encontrado!' };
        
        const custoTotal = item.preco * quantidade;
        if (usuario.saldo < custoTotal) {
            return { erro: `Saldo insuficiente! Você precisa de ${custoTotal} Gold (tem ${usuario.saldo} Gold)` };
        }
        
        usuario.saldo -= custoTotal;
        usuario.totalGasto += custoTotal;
        
        // Adiciona ao inventário
        if (!usuario.inventario[itemId]) {
            usuario.inventario[itemId] = 0;
        }
        usuario.inventario[itemId] += quantidade;
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return {
            sucesso: true,
            item: item,
            quantidade: quantidade,
            custoTotal: custoTotal,
            mensagem: `🛒 **COMPRA REALIZADA!** ✅\n\n` +
                     `${item.emoji} **${item.nome}** x${quantidade}\n` +
                     `💰 **Custo total:** ${custoTotal} Gold\n` +
                     `💳 **Saldo restante:** ${usuario.saldo} Gold\n\n` +
                     `💡 **Benefício:** ${item.beneficio}`
        };
    });
}

// Listar loja
function listarLoja(categoria = null) {
    if (!categoria) {
        let mensagem = '🛍️ **LOJA NEEXTCITY - CATEGORIAS**\n\n';
        mensagem += '1. 🏠 **Propriedades** - Casas, fazendas, resorts\n';
        mensagem += '2. 🐾 **Animais** - Pets e criações\n';
        mensagem += '3. 🔧 **Ferramentas** - Equipamentos de trabalho\n';
        mensagem += '4. 🚗 **Veículos** - Carros, motos, aviões\n';
        mensagem += '5. 🏢 **Negócios** - Empresas e estabelecimentos\n';
        mensagem += '6. 💻 **Tecnologia** - Computadores e setups\n';
        mensagem += '7. 🎨 **Decoração** - Móveis e arte\n';
        mensagem += '8. 🛡️ **Segurança** - Proteção e defesa\n\n';
        mensagem += '💡 **Como usar:** `.loja [categoria]`\n';
        mensagem += '📝 **Exemplo:** `.loja propriedades`';
        
        return { mensagem: mensagem };
    }
    
    const categorias = {
        'propriedades': catalogoItens.propriedades,
        'animais': catalogoItens.animais,
        'ferramentas': catalogoItens.ferramentas,
        'veiculos': catalogoItens.veiculos,
        'negocios': catalogoItens.negocios,
        'tecnologia': catalogoItens.tecnologia,
        'decoracao': catalogoItens.decoracao,
        'seguranca': catalogoItens.seguranca
    };
    
    const itens = categorias[categoria.toLowerCase()];
    if (!itens) return { erro: 'Categoria não encontrada!' };
    
    let mensagem = `🛍️ **LOJA NEEXTCITY - ${categoria.toUpperCase()}**\n\n`;
    
    Object.values(itens).forEach(item => {
        mensagem += `${item.emoji} **${item.nome}**\n`;
        mensagem += `   💰 Preço: ${item.preco.toLocaleString()} Gold\n`;
        mensagem += `   📝 ${item.beneficio}\n`;
        mensagem += `   🆔 ID: \`${item.id}\`\n\n`;
    });
    
    mensagem += '💡 **Como comprar:** `.comprar [id] [quantidade]`\n';
    mensagem += '📝 **Exemplo:** `.comprar casa_simples 1`';
    
    return { mensagem: mensagem };
}

// Obter perfil completo
function obterPerfilCompleto(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };
    
    usuario = ensureUserDefaults(usuario);
    
    let perfilTexto = `📊 **PERFIL COMPLETO - ${usuario.nome.toUpperCase()}**\n\n`;
    perfilTexto += `${usuario.banco.emoji} **Banco:** ${usuario.banco.nome}\n`;
    perfilTexto += `💰 **Saldo:** ${usuario.saldo.toLocaleString()} Gold\n`;
    perfilTexto += `📈 **Total ganho:** ${usuario.totalGanho.toLocaleString()} Gold\n`;
    perfilTexto += `📉 **Total gasto:** ${usuario.totalGasto.toLocaleString()} Gold\n`;
    perfilTexto += `💀 **Mortes:** ${usuario.mortes}\n\n`;
    
    // Estatísticas de atividades
    perfilTexto += `🎣 **Pescas:** ${usuario.pescasFeitas}\n`;
    perfilTexto += `⛏️ **Minerações:** ${usuario.mineracoesFeitas}\n`;
    perfilTexto += `💼 **Trabalhos:** ${usuario.trabalhosFeitos}\n`;
    perfilTexto += `🔫 **Caçadas:** ${usuario.cacasFeitas}\n`;
    perfilTexto += `🚜 **Agriculturas:** ${usuario.agriculturasFeitas}\n`;
    perfilTexto += `🔫 **Assaltos:** ${usuario.assaltosFeitos}\n`;
    perfilTexto += `🏴‍☠️ **Roubos:** ${usuario.roubosFeitos || 0}\n\n`;
    
    // Educação
    perfilTexto += `🎓 **Nível educacional:** ${usuario.educacao.nivel}\n`;
    perfilTexto += `📚 **Cursos completos:** ${usuario.educacao.cursosCompletos.length}\n\n`;
    
    // Plataformas digitais
    if (Object.keys(usuario.plataformas).length > 0) {
        perfilTexto += `📱 **INFLUENCIADOR DIGITAL:**\n`;
        Object.entries(usuario.plataformas).forEach(([plat, dados]) => {
            const plataforma = plataformasDigitais[plat];
            if (plataforma) {
                perfilTexto += `${plataforma.emoji} **${plataforma.nome}:** ${dados.seguidores.toLocaleString()} seguidores\n`;
            }
        });
        perfilTexto += '\n';
    }
    
    // Inventário resumido
    const totalItens = Object.values(usuario.inventario).reduce((total, qtd) => total + qtd, 0);
    perfilTexto += `📦 **Itens no inventário:** ${totalItens}\n`;
    
    return {
        usuario: usuario,
        perfil: perfilTexto
    };
}

// Função coletar
function coletar(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'coleta', 6);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaColeta || 0, 18 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🌱 Você precisa esperar **${formatarTempo(cooldown)}** para coletar novamente!`
            };
        }
        
        // Itens coletáveis
        const itensColetaveis = [
            { nome: 'Flores Raras', valor: 150, chance: 8, emoji: '🌺' },
            { nome: 'Frutas Silvestres', valor: 100, chance: 15, emoji: '🍓' },
            { nome: 'Ervas Medicinais', valor: 120, chance: 12, emoji: '🌿' },
            { nome: 'Cogumelos', valor: 80, chance: 20, emoji: '🍄' },
            { nome: 'Madeira', valor: 60, chance: 25, emoji: '🪵' },
            { nome: 'Pedras', valor: 40, chance: 20, emoji: '🪨' }
        ];
        
        let itemColetado = null;
        const sorte = Math.random() * 100;
        let chanceAcumulada = 0;
        
        for (const item of itensColetaveis) {
            chanceAcumulada += item.chance;
            if (sorte <= chanceAcumulada) {
                itemColetado = item;
                break;
            }
        }
        
        if (!itemColetado) {
            usuario.ultimaColeta = Date.now();
            usuario = atualizarContadorAtividade(usuario, 'coleta');
            dados.jogadores[userId] = usuario;
            salvarDadosRPG(dados);
            
            return { 
                sucesso: false, 
                mensagem: "🌱 **COLETA SEM SUCESSO** 😞\n\nNada útil foi encontrado desta vez!\n\n⏰ **Cooldown:** 18 minutos" 
            };
        }
        
        usuario.saldo += itemColetado.valor;
        usuario.totalGanho += itemColetado.valor;
        usuario.ultimaColeta = Date.now();
        usuario.coletasFeitas = (usuario.coletasFeitas || 0) + 1;
        usuario = atualizarContadorAtividade(usuario, 'coleta');
        
        const limitesRestantes = 6 - (usuario.limitesHoje.coleta || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            item: itemColetado,
            mensagem: `🌱 **COLETA BEM-SUCEDIDA!** ${itemColetado.emoji}\n\n${itemColetado.nome} coletado!\n💰 **Ganhou:** ${itemColetado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🌱 **Coletas restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 18 minutos`
        };
    });
}

// Função entrega
function entrega(userId) {
    return withLock(async () => {
        const dados = carregarDadosRPG();
        let usuario = dados.jogadores[userId];
        if (!usuario) return { erro: 'Usuário não registrado' };
        
        usuario = ensureUserDefaults(usuario);
        
        // Verifica limite diário
        const limite = verificarLimiteAtividade(usuario, 'entrega', 8);
        if (limite.atingido) return { erro: 'Limite diário', mensagem: limite.mensagem };
        
        // Verifica se tem veículo
        const temVeiculo = usuario.inventario.bike || usuario.inventario.moto || 
                          usuario.inventario.carro || usuario.inventario.patinete;
        
        if (!temVeiculo) {
            return { erro: 'Você precisa de um veículo para fazer entregas! Compre na loja.' };
        }
        
        // Verifica cooldown
        const cooldown = verificarCooldown(usuario.ultimaEntrega || 0, 12 * 60 * 1000);
        if (cooldown > 0) {
            return { 
                erro: 'Cooldown', 
                mensagem: `🛵 Você precisa esperar **${formatarTempo(cooldown)}** para fazer entregas novamente!`
            };
        }
        
        // Calcula bonus do veículo
        let bonusVelocidade = 1;
        let salarioBase = 80;
        
        if (usuario.inventario.carro_luxo) {
            bonusVelocidade = 2.5;
            salarioBase = 200;
        } else if (usuario.inventario.carro) {
            bonusVelocidade = 2;
            salarioBase = 150;
        } else if (usuario.inventario.moto_esportiva) {
            bonusVelocidade = 2.2;
            salarioBase = 180;
        } else if (usuario.inventario.moto) {
            bonusVelocidade = 1.8;
            salarioBase = 120;
        } else if (usuario.inventario.bike_eletrica) {
            bonusVelocidade = 1.3;
            salarioBase = 100;
        } else if (usuario.inventario.bike) {
            bonusVelocidade = 1.2;
            salarioBase = 90;
        }
        
        // Tipos de entrega
        const entregas = [
            { tipo: 'Comida', bonus: 1.2, emoji: '🍔' },
            { tipo: 'Medicamentos', bonus: 1.5, emoji: '💊' },
            { tipo: 'Flores', bonus: 1.1, emoji: '🌹' },
            { tipo: 'Documentos', bonus: 1.3, emoji: '📄' },
            { tipo: 'Eletrônicos', bonus: 1.4, emoji: '📱' },
            { tipo: 'Roupas', bonus: 1.0, emoji: '👕' }
        ];
        
        const entregaAleatoria = entregas[Math.floor(Math.random() * entregas.length)];
        const ganho = Math.floor(salarioBase * entregaAleatoria.bonus * bonusVelocidade);
        
        usuario.saldo += ganho;
        usuario.totalGanho += ganho;
        usuario.ultimaEntrega = Date.now();
        usuario.entregasFeitas = (usuario.entregasFeitas || 0) + 1;
        usuario = atualizarContadorAtividade(usuario, 'entrega');
        
        const limitesRestantes = 8 - (usuario.limitesHoje.entrega || 0);
        
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);
        
        return { 
            sucesso: true, 
            entrega: entregaAleatoria,
            bonus: bonusVelocidade,
            mensagem: `🛵 **ENTREGA REALIZADA!** ${entregaAleatoria.emoji}\n\n**Tipo:** ${entregaAleatoria.tipo}\n**Veículo:** ${bonusVelocidade}x velocidade\n💰 **Ganhou:** ${ganho} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🛵 **Entregas restantes hoje:** ${limitesRestantes}\n⏰ **Cooldown:** 12 minutos`
        };
    });
}

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
    coletar,
    agricultura,
    entrega,
    jogarTigrinho,
    assaltar,
    roubar,
    criarConteudo,
    estudar,
    iniciarCurso,
    investir,
    obterRanking,
    pixTransferir,
    comprarItem,
    listarLoja,
    obterPerfilCompleto,
    verificarCooldown,
    formatarTempo,
    bancos,
    catalogoItens,
    locaisRoubo,
    plataformasDigitais
};
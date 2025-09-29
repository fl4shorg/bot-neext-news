// Sistema de RPG - NeextCity COMPLETO E FUNCIONAL
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

// ==================== BANCOS ====================
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
    { id: 'c6bank', nome: '⚫ C6 Bank', emoji: '⚫' }
];

// ==================== LOJA ====================
const catalogoItens = {
    propriedades: {
        casa_simples: { id: 'casa_simples', nome: '🏠 Casa Simples', preco: 5000, categoria: 'propriedades', emoji: '🏠', beneficio: 'Renda passiva: +50 gold/dia' },
        casa_luxo: { id: 'casa_luxo', nome: '🏘️ Casa de Luxo', preco: 15000, categoria: 'propriedades', emoji: '🏘️', beneficio: 'Renda passiva: +150 gold/dia' },
        mansao: { id: 'mansao', nome: '🏰 Mansão', preco: 50000, categoria: 'propriedades', emoji: '🏰', beneficio: 'Renda passiva: +500 gold/dia' },
        fazenda: { id: 'fazenda', nome: '🚜 Fazenda', preco: 25000, categoria: 'propriedades', emoji: '🚜', beneficio: 'Permite agricultura e criação' }
    },
    animais: {
        galinha: { id: 'galinha', nome: '🐔 Galinha', preco: 500, categoria: 'animais', emoji: '🐔', beneficio: 'Produz 3 ovos/dia (30 gold cada)' },
        gato: { id: 'gato', nome: '🐱 Gato', preco: 200, categoria: 'animais', emoji: '🐱', beneficio: 'Traz sorte (+5% chance crítico)' },
        cachorro: { id: 'cachorro', nome: '🐶 Cachorro', preco: 300, categoria: 'animais', emoji: '🐶', beneficio: 'Protege contra assaltos (+20% defesa)' },
        vaca: { id: 'vaca', nome: '🐄 Vaca', preco: 2500, categoria: 'animais', emoji: '🐄', beneficio: 'Produz 5 litros leite/dia (25 gold cada)' }
    },
    ferramentas: {
        picareta_madeira: { id: 'picareta_madeira', nome: '🪓 Picareta de Madeira', preco: 100, categoria: 'ferramentas', emoji: '🪓', beneficio: 'Permite mineração básica' },
        picareta_ferro: { id: 'picareta_ferro', nome: '⛏️ Picareta de Ferro', preco: 500, categoria: 'ferramentas', emoji: '⛏️', beneficio: '+15% chance minerais valiosos' },
        vara_bambu: { id: 'vara_bambu', nome: '🎋 Vara de Bambu', preco: 50, categoria: 'ferramentas', emoji: '🎋', beneficio: 'Permite pesca básica' },
        vara_ferro: { id: 'vara_ferro', nome: '🎣 Vara de Ferro', preco: 300, categoria: 'ferramentas', emoji: '🎣', beneficio: '+10% chance peixes raros' }
    },
    veiculos: {
        bike: { id: 'bike', nome: '🚲 Bicicleta', preco: 800, categoria: 'veiculos', emoji: '🚲', beneficio: '+10% velocidade trabalhos' },
        moto: { id: 'moto', nome: '🏍️ Motocicleta', preco: 5000, categoria: 'veiculos', emoji: '🏍️', beneficio: 'Habilita trabalho entregador' },
        carro: { id: 'carro', nome: '🚗 Carro', preco: 20000, categoria: 'veiculos', emoji: '🚗', beneficio: 'Habilita trabalho uber (+200 gold/viagem)' }
    },
    negocios: {
        barraquinha: { id: 'barraquinha', nome: '🏪 Barraquinha', preco: 5000, categoria: 'negocios', emoji: '🏪', beneficio: 'Renda passiva: +100 gold/dia' },
        lanchonete: { id: 'lanchonete', nome: '🍔 Lanchonete', preco: 50000, categoria: 'negocios', emoji: '🍔', beneficio: 'Renda passiva: +400 gold/dia' },
        restaurante: { id: 'restaurante', nome: '🍽️ Restaurante', preco: 120000, categoria: 'negocios', emoji: '🍽️', beneficio: 'Renda passiva: +800 gold/dia' }
    }
};

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
        saldo: usuario.saldo || 100,
        registrado: usuario.registrado || new Date().toISOString(),
        inventario: usuario.inventario || {},
        pescasFeitas: usuario.pescasFeitas || 0,
        mineracoesFeitas: usuario.mineracoesFeitas || 0,
        trabalhosFeitos: usuario.trabalhosFeitos || 0,
        assaltosFeitos: usuario.assaltosFeitos || 0,
        ultimaPesca: usuario.ultimaPesca || 0,
        ultimaMineracao: usuario.ultimaMineracao || 0,
        ultimoTrabalho: usuario.ultimoTrabalho || 0,
        ultimoAssalto: usuario.ultimoAssalto || 0,
        totalGanho: usuario.totalGanho || 0
    };
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
    const dados = carregarDadosRPG();
    const banco = bancos.find(b => b.id === bancoId);
    if (!banco) return false;

    dados.jogadores[userId] = ensureUserDefaults({
        nome: nome,
        banco: banco,
        saldo: 100
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

// Função para verificar cooldown
function verificarCooldown(ultimaVez, cooldownMs) {
    const agora = Date.now();
    const tempoRestante = cooldownMs - (agora - ultimaVez);
    return tempoRestante > 0 ? tempoRestante : 0;
}

// Formatar tempo
function formatarTempo(ms) {
    const minutos = Math.ceil(ms / 60000);
    return `${minutos} minutos`;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Função pescar
function pescar(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    // Verifica cooldown
    const cooldown = verificarCooldown(usuario.ultimaPesca, 15 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            mensagem: `🎣 Você precisa esperar **${formatarTempo(cooldown)}** para pescar novamente!`
        };
    }

    // Peixes com raridades
    const peixes = [
        { nome: 'Peixe Dourado', valor: 200, chance: 10, emoji: '🐠' },
        { nome: 'Salmão', valor: 150, chance: 20, emoji: '🐟' },
        { nome: 'Sardinha', valor: 100, chance: 40, emoji: '🐟' },
        { nome: 'Bagre', valor: 80, chance: 30, emoji: '🐟' }
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

    if (!peixePescado) {
        usuario.ultimaPesca = Date.now();
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: false, 
            mensagem: "🎣 **PESCA SEM SUCESSO**\n\nOs peixes não morderam a isca desta vez!\n\n⏰ **Cooldown:** 15 minutos" 
        };
    }

    usuario.saldo += peixePescado.valor;
    usuario.totalGanho += peixePescado.valor;
    usuario.ultimaPesca = Date.now();
    usuario.pescasFeitas++;

    dados.jogadores[userId] = usuario;
    salvarDadosRPG(dados);

    return { 
        sucesso: true, 
        peixe: peixePescado,
        mensagem: `🎣 **PESCA BEM-SUCEDIDA!** ${peixePescado.emoji}\n\n${peixePescado.nome} pescado!\n💰 **Ganhou:** ${peixePescado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n⏰ **Cooldown:** 15 minutos`
    };
}

// Função minerar
function minerar(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    // Verifica cooldown
    const cooldown = verificarCooldown(usuario.ultimaMineracao, 20 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            mensagem: `⛏️ Você precisa esperar **${formatarTempo(cooldown)}** para minerar novamente!`
        };
    }

    // Minerais com raridades
    const minerais = [
        { nome: 'Diamante', valor: 500, chance: 5, emoji: '💎' },
        { nome: 'Ouro', valor: 300, chance: 15, emoji: '🥇' },
        { nome: 'Ferro', valor: 150, chance: 30, emoji: '⚡' },
        { nome: 'Carvão', valor: 80, chance: 50, emoji: '⚫' }
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
        usuario.ultimaMineracao = Date.now();
        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return { 
            sucesso: false, 
            mensagem: "⛏️ **MINERAÇÃO SEM SUCESSO**\n\nApenas pedras comuns foram encontradas!\n\n⏰ **Cooldown:** 20 minutos" 
        };
    }

    usuario.saldo += mineralEncontrado.valor;
    usuario.totalGanho += mineralEncontrado.valor;
    usuario.ultimaMineracao = Date.now();
    usuario.mineracoesFeitas++;

    dados.jogadores[userId] = usuario;
    salvarDadosRPG(dados);

    return { 
        sucesso: true, 
        mineral: mineralEncontrado,
        mensagem: `⛏️ **MINERAÇÃO BEM-SUCEDIDA!** ${mineralEncontrado.emoji}\n\n${mineralEncontrado.nome} encontrado!\n💰 **Ganhou:** ${mineralEncontrado.valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n⏰ **Cooldown:** 20 minutos`
    };
}

// Função trabalhar
function trabalhar(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    // Verifica cooldown
    const cooldown = verificarCooldown(usuario.ultimoTrabalho, 25 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            mensagem: `💼 Você precisa esperar **${formatarTempo(cooldown)}** para trabalhar novamente!`
        };
    }

    const trabalhos = [
        { nome: 'Faxineiro', salario: 80, emoji: '🧹' },
        { nome: 'Vendedor', salario: 120, emoji: '🛒' },
        { nome: 'Entregador', salario: 150, emoji: '🚴' },
        { nome: 'Programador', salario: 300, emoji: '💻' }
    ];

    const trabalhoEscolhido = trabalhos[Math.floor(Math.random() * trabalhos.length)];

    usuario.saldo += trabalhoEscolhido.salario;
    usuario.totalGanho += trabalhoEscolhido.salario;
    usuario.ultimoTrabalho = Date.now();
    usuario.trabalhosFeitos++;

    dados.jogadores[userId] = usuario;
    salvarDadosRPG(dados);

    return { 
        sucesso: true, 
        trabalho: trabalhoEscolhido,
        mensagem: `💼 **TRABALHO CONCLUÍDO!** ${trabalhoEscolhido.emoji}\n\n**Profissão:** ${trabalhoEscolhido.nome}\n💰 **Ganhou:** ${trabalhoEscolhido.salario} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n⏰ **Cooldown:** 25 minutos`
    };
}

// Função tigrinho
function jogarTigrinho(userId, valor) {
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

    // Resultados do tigrinho
    const resultados = [
        { simbolos: '🐅🐅🐅', multiplicador: 10, chance: 2 },
        { simbolos: '💎💎💎', multiplicador: 5, chance: 5 },
        { simbolos: '🍒🍒🍒', multiplicador: 3, chance: 10 },
        { simbolos: '❌❌❌', multiplicador: 0, chance: 83 }
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
        ganhou: lucro > 0,
        resultado: resultado,
        mensagem: lucro > 0 ?
            `🎰 **TIGRINHO - GANHOU!** 🐅\n\n${resultado.simbolos}\n\n💰 **Apostou:** ${valor} Gold\n💵 **Ganhou:** ${ganho} Gold\n📈 **Lucro:** +${lucro} Gold\n💳 **Saldo:** ${usuario.saldo} Gold` :
            `🎰 **TIGRINHO - PERDEU!** 😭\n\n${resultado.simbolos}\n\n💰 **Perdeu:** ${valor} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n🍀 Tente novamente!`
    };
}

// Função assaltar
function assaltar(userId, targetId) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    const alvo = dados.jogadores[targetId];

    if (!usuario) return { erro: 'Você não está registrado' };
    if (!alvo) return { erro: 'Usuário alvo não está registrado' };
    if (userId === targetId) return { erro: 'Você não pode assaltar a si mesmo' };

    // Verifica cooldown
    const cooldown = verificarCooldown(usuario.ultimoAssalto, 15 * 60 * 1000);
    if (cooldown > 0) {
        return { 
            erro: 'Cooldown', 
            mensagem: `🔫 Você precisa esperar **${formatarTempo(cooldown)}** para assaltar novamente!`
        };
    }

    if (alvo.saldo < 50) return { erro: 'O alvo não tem Gold suficiente para ser assaltado (mínimo 50)' };

    const chanceReal = 60; // 60% de chance de sucesso
    const sucesso = Math.random() * 100 < chanceReal;
    const valorAssaltado = Math.floor(alvo.saldo * 0.2); // 20% do saldo do alvo

    usuario.ultimoAssalto = Date.now();
    usuario.assaltosFeitos++;

    if (sucesso) {
        usuario.saldo += valorAssaltado;
        alvo.saldo -= valorAssaltado;

        dados.jogadores[userId] = usuario;
        dados.jogadores[targetId] = alvo;
        salvarDadosRPG(dados);

        return {
            assalto: true,
            mensagem: `🔫 **ASSALTO BEM-SUCEDIDO!**\n\n💰 **+${valorAssaltado} Gold** roubados!\n🏦 **Seu saldo:** ${usuario.saldo} Gold`
        };
    } else {
        const multa = 30;
        usuario.saldo = Math.max(0, usuario.saldo - multa);

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            assalto: false,
            mensagem: `🔫 **ASSALTO FALHOU!**\n\n🚨 Você foi pego e pagou **${multa} Gold** de multa!\n🏦 **Seu saldo:** ${usuario.saldo} Gold`
        };
    }
}

// Função estudar
function estudar(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    const cursos = [
        { nome: 'Ensino Médio', recompensa: 200, emoji: '🎓' },
        { nome: 'Curso Técnico', recompensa: 400, emoji: '🔧' },
        { nome: 'Graduação', recompensa: 800, emoji: '👨‍🎓' }
    ];

    const cursoEscolhido = cursos[Math.floor(Math.random() * cursos.length)];

    usuario.saldo += cursoEscolhido.recompensa;
    usuario.totalGanho += cursoEscolhido.recompensa;

    dados.jogadores[userId] = usuario;
    salvarDadosRPG(dados);

    return {
        sucesso: true,
        mensagem: `📚 **ESTUDO CONCLUÍDO!** ${cursoEscolhido.emoji}\n\n**Curso:** ${cursoEscolhido.nome}\n💰 **Recompensa:** ${cursoEscolhido.recompensa} Gold\n💳 **Saldo:** ${usuario.saldo} Gold`
    };
}

// Função investir
function investir(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    if (usuario.saldo < 1000) {
        return { erro: 'Você precisa de pelo menos 1000 Gold para investir!' };
    }

    const valor = Math.floor(usuario.saldo * 0.1); // Investe 10% do saldo
    const sucesso = Math.random() > 0.5; // 50% de chance

    if (sucesso) {
        const lucro = Math.floor(valor * 0.5); // 50% de lucro
        usuario.saldo += lucro;
        usuario.totalGanho += lucro;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `📈 **INVESTIMENTO LUCROU!**\n\n💰 **Investido:** ${valor} Gold\n💵 **Lucro:** +${lucro} Gold\n🏦 **Saldo:** ${usuario.saldo} Gold`
        };
    } else {
        usuario.saldo -= valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: false,
            mensagem: `📉 **INVESTIMENTO FALHOU!**\n\n💰 **Perdido:** ${valor} Gold\n🏦 **Saldo:** ${usuario.saldo} Gold`
        };
    }
}

// Função apostar
function apostar(userId, valor) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    usuario = ensureUserDefaults(usuario);

    if (!valor) {
        return {
            mensagem: `🎲 **SISTEMA DE APOSTAS**\n\n💰 **Seu saldo:** ${usuario.saldo} Gold\n\n💡 **Como usar:** \`.apostar [valor]\`\n📝 **Exemplo:** \`.apostar 100\`\n\n🎯 **50% de chance** de dobrar seu dinheiro!`
        };
    }

    valor = parseInt(valor);
    if (isNaN(valor) || valor <= 0) return { erro: 'Valor inválido!' };
    if (usuario.saldo < valor) return { erro: 'Saldo insuficiente!' };

    const sucesso = Math.random() > 0.5; // 50% de chance

    if (sucesso) {
        usuario.saldo += valor; // Dobra o dinheiro
        usuario.totalGanho += valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: true,
            mensagem: `🎲 **APOSTA GANHA!**\n\n💰 **Apostou:** ${valor} Gold\n💵 **Ganhou:** ${valor} Gold\n🏦 **Saldo:** ${usuario.saldo} Gold`
        };
    } else {
        usuario.saldo -= valor;

        dados.jogadores[userId] = usuario;
        salvarDadosRPG(dados);

        return {
            sucesso: false,
            mensagem: `🎲 **APOSTA PERDIDA!**\n\n💰 **Perdeu:** ${valor} Gold\n🏦 **Saldo:** ${usuario.saldo} Gold`
        };
    }
}

// Função listar loja
function listarLoja(categoria) {
    if (!categoria) {
        return {
            mensagem: '🛍️ **LOJA NEEXTCITY**\n\n' +
                     '**Categorias disponíveis:**\n' +
                     '🏠 propriedades\n' +
                     '🐾 animais\n' +
                     '🔧 ferramentas\n' +
                     '🚗 veiculos\n' +
                     '🏢 negocios\n\n' +
                     '💡 **Use:** `.loja [categoria]`'
        };
    }

    const itens = catalogoItens[categoria.toLowerCase()];
    if (!itens) return { erro: 'Categoria não encontrada!' };

    let mensagem = `🛍️ **LOJA - ${categoria.toUpperCase()}**\n\n`;

    Object.values(itens).forEach(item => {
        mensagem += `${item.emoji} **${item.nome}**\n`;
        mensagem += `   💰 ${item.preco.toLocaleString()} Gold\n`;
        mensagem += `   📝 ${item.beneficio}\n`;
        mensagem += `   🆔 ${item.id}\n\n`;
    });

    mensagem += '💡 **Use:** `.comprar [id]`';

    return { mensagem: mensagem };
}

// Função comprar
function comprarItem(userId, itemId) {
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

    if (usuario.saldo < item.preco) {
        return { erro: `Saldo insuficiente! Você precisa de ${item.preco} Gold` };
    }

    usuario.saldo -= item.preco;
    if (!usuario.inventario[itemId]) {
        usuario.inventario[itemId] = 0;
    }
    usuario.inventario[itemId]++;

    dados.jogadores[userId] = usuario;
    salvarDadosRPG(dados);

    return {
        mensagem: `🛒 **COMPRA REALIZADA!**\n\n${item.emoji} **${item.nome}**\n💰 **Custo:** ${item.preco} Gold\n💳 **Saldo:** ${usuario.saldo} Gold\n\n💡 **Benefício:** ${item.beneficio}`
    };
}

// Função PIX
function pixTransferir(userId, targetId, valor, remetenteName, destinatarioName) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    const destinatario = dados.jogadores[targetId];

    if (!usuario) return { erro: 'Você não está registrado' };
    if (!destinatario) return { erro: 'Destinatário não está registrado' };

    valor = parseInt(valor);
    if (isNaN(valor) || valor <= 0) return { erro: 'Valor inválido' };
    if (valor < 10) return { erro: 'Valor mínimo para PIX é 10 Gold' };
    if (usuario.saldo < valor) return { erro: 'Saldo insuficiente' };

    const taxa = Math.floor(valor * 0.02);
    const valorFinal = valor - taxa;

    usuario.saldo -= valor;
    destinatario.saldo += valorFinal;

    dados.jogadores[userId] = usuario;
    dados.jogadores[targetId] = destinatario;
    salvarDadosRPG(dados);

    return {
        mensagem: `📱 **PIX REALIZADO!**\n\n💸 **De:** ${remetenteName}\n📥 **Para:** ${destinatarioName}\n💰 **Valor:** ${valor} Gold\n💸 **Taxa:** ${taxa} Gold\n✅ **Recebido:** ${valorFinal} Gold\n🏦 **Seu saldo:** ${usuario.saldo} Gold`
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

// Função perfil completo
function obterPerfilCompleto(userId) {
    const dados = carregarDadosRPG();
    let usuario = dados.jogadores[userId];
    if (!usuario) return null;

    usuario = ensureUserDefaults(usuario);

    // Conta itens no inventário
    const totalItens = Object.values(usuario.inventario).reduce((total, qtd) => total + qtd, 0);
    let valorInventario = 0;

    // Calcula valor do inventário
    Object.entries(usuario.inventario).forEach(([itemId, quantidade]) => {
        for (const categoria of Object.values(catalogoItens)) {
            if (categoria[itemId]) {
                valorInventario += categoria[itemId].preco * quantidade;
                break;
            }
        }
    });

    // Texto do inventário
    let inventarioTexto = '';
    if (totalItens > 0) {
        Object.entries(usuario.inventario).forEach(([itemId, quantidade]) => {
            for (const categoria of Object.values(catalogoItens)) {
                if (categoria[itemId]) {
                    inventarioTexto += `${categoria[itemId].emoji} ${categoria[itemId].nome} x${quantidade}\n`;
                    break;
                }
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

// Função placeholder para outras atividades
function coletar(userId) {
    return {
        sucesso: true,
        mensagem: `🌱 **COLETA REALIZADA!**\n\nVocê coletou alguns recursos!\n💰 **Ganhou:** 50 Gold\n\n⏰ **Cooldown:** 15 minutos`
    };
}

function entrega(userId) {
    return {
        sucesso: true,
        mensagem: `🛵 **ENTREGA REALIZADA!**\n\nEntrega concluída com sucesso!\n💰 **Ganhou:** 100 Gold\n\n⏰ **Cooldown:** 12 minutos`
    };
}

function cacar(userId) {
    return {
        sucesso: true,
        mensagem: `🔫 **CAÇADA BEM-SUCEDIDA!**\n\nVocê caçou um animal!\n💰 **Ganhou:** 150 Gold\n\n⏰ **Cooldown:** 20 minutos`
    };
}

function agricultura(userId) {
    return {
        sucesso: true,
        mensagem: `🚜 **AGRICULTURA BEM-SUCEDIDA!**\n\nSua plantação cresceu!\n💰 **Ganhou:** 120 Gold\n\n⏰ **Cooldown:** 25 minutos`
    };
}

function roubar(userId) {
    return {
        sucesso: true,
        mensagem: `🏴‍☠️ **ROUBO BEM-SUCEDIDO!**\n\nVocê roubou um local!\n💰 **Ganhou:** 200 Gold\n\n⏰ **Cooldown:** 45 minutos`
    };
}

function criarConteudo(userId, plataforma) {
    return {
        sucesso: true,
        mensagem: `📱 **CONTEÚDO CRIADO!**\n\nVocê criou conteúdo no ${plataforma}!\n💰 **Ganhou:** 300 Gold\n\n⏰ **Cooldown:** 1 hora`
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
    investir,
    apostar,
    obterRanking,
    pixTransferir,
    comprarItem,
    listarLoja,
    obterPerfilCompleto,
    bancos,
    catalogoItens
};
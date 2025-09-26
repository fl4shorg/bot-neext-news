// Sistema de RPG - NeextCity
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de dados do RPG
const rpgDataFile = path.join(__dirname, '../database/grupos/rpg_data.json');

// Bancos disponíveis
const bancos = [
    { id: 'caixa', nome: '🏦 Caixa Econômica Federal', emoji: '🏦' },
    { id: 'santander', nome: '🔴 Santander', emoji: '🔴' },
    { id: 'nubank', nome: '💜 Nubank', emoji: '💜' },
    { id: 'bradesco', nome: '🔵 Bradesco', emoji: '🔵' },
    { id: 'itau', nome: '🟠 Itaú', emoji: '🟠' },
    { id: 'bb', nome: '🟡 Banco do Brasil', emoji: '🟡' }
];

// Peixes disponíveis para pesca
const peixes = [
    { nome: 'Peixe Dourado', valor: 250, raridade: 'lendario', emoji: '🐟', chance: 2 },
    { nome: 'Salmão', valor: 180, raridade: 'epico', emoji: '🐟', chance: 5 },
    { nome: 'Atum', valor: 120, raridade: 'raro', emoji: '🐟', chance: 10 },
    { nome: 'Sardinha', valor: 80, raridade: 'comum', emoji: '🐟', chance: 25 },
    { nome: 'Tilápia', valor: 60, raridade: 'comum', emoji: '🐟', chance: 30 },
    { nome: 'Bagre', valor: 40, raridade: 'comum', emoji: '🐟', chance: 28 }
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
    { nome: 'Programador', salario: 150, emoji: '💻' },
    { nome: 'Médico', salario: 200, emoji: '👨‍⚕️' },
    { nome: 'Professor', salario: 120, emoji: '👨‍🏫' },
    { nome: 'Vendedor', salario: 100, emoji: '👨‍💼' },
    { nome: 'Motorista', salario: 80, emoji: '🚗' },
    { nome: 'Segurança', salario: 90, emoji: '🛡️' }
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
    ]
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

    dados.jogadores[userId] = {
        nome: nome,
        banco: banco,
        saldo: 100, // Saldo inicial
        registrado: new Date().toISOString(),
        ultimaPesca: 0,
        ultimaMineracao: 0,
        ultimoTrabalho: 0,
        ultimoAssalto: 0,
        pescasFeitas: 0,
        mineracoesFeitas: 0,
        trabalhosFeitos: 0,
        assaltosFeitos: 0
    };

    return salvarDadosRPG(dados);
}

// Obtém dados do usuário
function obterDadosUsuario(userId) {
    const dados = carregarDadosRPG();
    return dados.jogadores[userId] || null;
}

// Atualiza saldo do usuário
function atualizarSaldo(userId, novoSaldo) {
    const dados = carregarDadosRPG();
    if (dados.jogadores[userId]) {
        dados.jogadores[userId].saldo = novoSaldo;
        return salvarDadosRPG(dados);
    }
    return false;
}

// Verifica cooldown
function verificarCooldown(ultimaAcao, tempoEspera) {
    const agora = Date.now();
    const tempoRestante = (ultimaAcao + tempoEspera) - agora;
    return tempoRestante > 0 ? tempoRestante : 0;
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

// Jogo do Tigrinho
function jogarTigrinho(userId, aposta) {
    const dados = carregarDadosRPG();
    const usuario = dados.jogadores[userId];
    if (!usuario) return { erro: 'Usuário não registrado' };

    if (aposta < 10) return { erro: 'Aposta mínima é 10 Gold' };
    if (aposta > usuario.saldo) return { erro: 'Saldo insuficiente' };

    const simbolos = ['🐅', '🍎', '🍒', '🍋', '🔔', '💎'];
    const resultado = [
        simbolos[Math.floor(Math.random() * simbolos.length)],
        simbolos[Math.floor(Math.random() * simbolos.length)],
        simbolos[Math.floor(Math.random() * simbolos.length)]
    ];

    let multiplicador = 0;
    let ganhou = false;

    // Verifica combinações
    if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
        // Três iguais
        if (resultado[0] === '💎') multiplicador = 10; // Jackpot!
        else if (resultado[0] === '🐅') multiplicador = 5; // Tigrinho!
        else multiplicador = 3;
        ganhou = true;
    } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
        // Dois iguais
        multiplicador = 1.5;
        ganhou = true;
    }

    let premioFinal = 0;
    if (ganhou) {
        premioFinal = Math.floor(aposta * multiplicador);
        usuario.saldo = usuario.saldo - aposta + premioFinal;
    } else {
        usuario.saldo -= aposta;
    }

    salvarDadosRPG(dados);

    return {
        sucesso: true,
        ganhou: ganhou,
        resultado: resultado,
        aposta: aposta,
        premio: premioFinal,
        saldo: usuario.saldo,
        mensagem: `🎰 **JOGO DO TIGRINHO** 🐅\n\n` +
                 `🎲 [ ${resultado.join(' | ')} ]\n\n` +
                 (ganhou ? 
                    `🎉 **VOCÊ GANHOU!**\n💰 **+${premioFinal} Gold**\n` :
                    `😢 **VOCÊ PERDEU!**\n💸 **-${aposta} Gold**\n`
                 ) +
                 `🏦 **Saldo:** ${usuario.saldo} Gold`
    };
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
    bancos
};
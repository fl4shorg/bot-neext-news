// arquivos/registros.js - Sistema de Registros do Bot
const fs = require('fs');
const path = require('path');

const registrosFile = path.join(__dirname, '../database/registros/registros.json');

// Carrega dados dos registros
function carregarRegistros() {
    try {
        if (!fs.existsSync(registrosFile)) {
            const dir = path.dirname(registrosFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(registrosFile, "[]");
        }
        const data = fs.readFileSync(registrosFile, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("❌ Erro ao carregar registros.json:", err);
        return [];
    }
}

// Salva dados dos registros
function salvarRegistros(registros) {
    try {
        fs.writeFileSync(registrosFile, JSON.stringify(registros, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Erro ao salvar registros.json:", err);
        return false;
    }
}

// Verifica se usuário está registrado
function usuarioRegistrado(numeroUsuario) {
    const registros = carregarRegistros();
    return registros.some(registro => registro.numero === numeroUsuario);
}

// Registra novo usuário
function registrarUsuario(numeroUsuario, nomeUsuario) {
    try {
        const registros = carregarRegistros();
        
        // Verifica se já está registrado
        if (usuarioRegistrado(numeroUsuario)) {
            return { sucesso: false, motivo: "já_registrado" };
        }

        // Cria novo registro
        const novoRegistro = {
            numero: numeroUsuario,
            nome: nomeUsuario || "Usuário",
            dataRegistro: new Date().toISOString(),
            dataRegistroFormatada: new Date().toLocaleString('pt-BR'),
            numeroRegistro: registros.length + 1
        };

        registros.push(novoRegistro);
        
        if (salvarRegistros(registros)) {
            return { 
                sucesso: true, 
                registro: novoRegistro,
                totalRegistros: registros.length
            };
        } else {
            return { sucesso: false, motivo: "erro_salvar" };
        }
    } catch (err) {
        console.error("❌ Erro ao registrar usuário:", err);
        return { sucesso: false, motivo: "erro_tecnico" };
    }
}

// Obter estatísticas dos registros
function obterEstatisticas() {
    const registros = carregarRegistros();
    return {
        totalRegistros: registros.length,
        ultimoRegistro: registros.length > 0 ? registros[registros.length - 1] : null
    };
}

// Obter informações de um usuário registrado
function obterInfoUsuario(numeroUsuario) {
    const registros = carregarRegistros();
    return registros.find(registro => registro.numero === numeroUsuario);
}

module.exports = {
    carregarRegistros,
    salvarRegistros,
    usuarioRegistrado,
    registrarUsuario,
    obterEstatisticas,
    obterInfoUsuario
};
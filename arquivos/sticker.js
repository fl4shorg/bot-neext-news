const fs = require("fs");
const { tmpdir } = require("os");
const path = require("path");
const Crypto = require("crypto");
const ff = require("fluent-ffmpeg");
const webp = require("node-webpmux");

// Gera arquivo temporário
function getRandomFile(ext) {
    return path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}${ext}`);
}

// Converte Buffer para WebP preservando transparência
async function bufferToWebp(buffer, isVideo = false, mimetype = null) {
    // Detecta extensão correta baseada no mimetype para preservar transparência
    let inputExt;
    if (isVideo) {
        inputExt = ".mp4";
    } else if (mimetype) {
        if (mimetype.includes('png')) inputExt = ".png";
        else if (mimetype.includes('webp')) inputExt = ".webp";
        else if (mimetype.includes('gif')) inputExt = ".gif";
        else inputExt = ".jpg";
    } else {
        inputExt = ".jpg";
    }

    const input = getRandomFile(inputExt);
    const output = getRandomFile(".webp");

    fs.writeFileSync(input, buffer);

    await new Promise((resolve, reject) => {
        const ffmpegCommand = ff(input)
            .on("error", (err) => {
                // Cleanup input file on error
                if (fs.existsSync(input)) fs.unlinkSync(input);
                reject(err);
            })
            .on("end", () => resolve());

        if (isVideo) {
            // Para vídeos: máximo 6 segundos, 512px, preserva transparência
            ffmpegCommand
                .duration(6)
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", "fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
                    "-loop", "0",
                    "-preset", "default",
                    "-an",
                    "-vsync", "0",
                    "-q:v", "80",
                    "-lossless", "0"
                ]);
        } else {
            // Para imagens: 512px, preserva transparência, sem fps
            ffmpegCommand
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
                    "-loop", "0",
                    "-preset", "default",
                    "-an",
                    "-vsync", "0",
                    "-q:v", "90"
                ]);
        }

        ffmpegCommand
            .toFormat("webp")
            .save(output);
    });

    // Cleanup input file
    if (fs.existsSync(input)) fs.unlinkSync(input);
    return output;
}

// Função writeExif para compatibilidade com index.js
async function writeExif(media, metadata) {
    const { mimetype, data } = media;
    
    // Para comando RENAME: usa EXATAMENTE os valores fornecidos sem fallbacks
    // Para outros comandos: usa fallbacks NEEXT se não houver valores
    let packname, author, categories;
    
    if (metadata._isRename) {
        // Comando rename: usa APENAS os valores fornecidos pelo usuário
        packname = metadata.packname;
        author = metadata.author;
        categories = metadata.categories || ["😎"];
    } else {
        // Outros comandos: pode usar fallbacks NEEXT
        packname = metadata.packname || "NEEXT LTDA";
        author = metadata.author || "NEEXT BOT";
        categories = metadata.categories || ["😎"];
    }
    
    // Detecta se é vídeo/GIF
    const isVideo = mimetype && (
        mimetype.includes('video') || 
        mimetype.includes('gif') ||
        mimetype === 'image/gif'
    );
    
    const webpFile = await bufferToWebp(data, isVideo, mimetype);
    const img = new webp.Image();
    await img.load(webpFile);

    const json = {
        "sticker-pack-id": `${packname}-${Date.now()}`,
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "sticker-pack-categories": categories
    };

    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    img.exif = exif;
    await img.save(webpFile);

    return webpFile;
}

// Cria sticker e envia (versão melhorada)
async function createSticker(buffer, sock, from, isVideo = false) {
    try {
        const agora = new Date();
        const dataHora = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`;
        
        const webpFile = await writeExif(
            { mimetype: isVideo ? 'video/mp4' : 'image/jpeg', data: buffer },
            { 
                packname: "NEEXT LTDA", 
                author: `NEEXT BOT - ${dataHora}`, 
                categories: ["🔥"] 
            }
        );
        
        const stickerBuffer = fs.readFileSync(webpFile);
        await sock.sendMessage(from, { sticker: stickerBuffer });
        fs.unlinkSync(webpFile);
        
        console.log("✅ Figurinha criada com sucesso!");
    } catch (err) {
        console.log("❌ Erro ao criar figurinha:", err);
        await sock.sendMessage(from, { text: "❌ Erro ao criar figurinha." });
    }
}

module.exports = { createSticker, writeExif };
// Environment Configuration Module
// Centralizes all environment variables and provides secure defaults

require('dotenv').config();

const config = {
    // Bot Owner Configuration
    botOwner: {
        number: process.env.BOT_OWNER_NUMBER || '553176011100',
        nickname: process.env.BOT_OWNER_NICKNAME || 'Flash',
        name: process.env.BOT_NAME || 'NEEXT LTDA',
        prefix: process.env.BOT_PREFIX || '.'
    },

    // External API Endpoints
    apis: {
        instagram: process.env.INSTAGRAM_API_URL || 'https://api.siputzx.my.id/api/d/igdl',
        youtube: process.env.YOUTUBE_API_URL || 'https://api.nekolabs.my.id/downloader/youtube/play/v1',
        googleSheets: process.env.GOOGLE_SHEETS_API_URL || 'https://script.google.com/macros/s/AKfycbz7OnN6kyMY5tXuEgcx-M_G_Ox1fUERV6M6GwXc2fuaeE-2MZHwvLeTFuk6QoioP4aPzg/exec'
    },

    // Business Contact Numbers
    contacts: {
        neext: process.env.CONTACT_NEEXT || '553176011100',
        mercadoPago: process.env.CONTACT_MERCADOPAGO || '5511988032872',
        nubank: process.env.CONTACT_NUBANK || '551151807064',
        serasa: process.env.CONTACT_SERASA || '551128475131'
    },

    // Database Configuration
    database: {
        type: process.env.DB_TYPE || 'file',
        url: process.env.DATABASE_URL || null
    },

    // Security Settings
    security: {
        enableAntiSpam: process.env.ENABLE_ANTI_SPAM === 'true',
        enableAntiLink: process.env.ENABLE_ANTI_LINK === 'true',
        enableAdminCommands: process.env.ENABLE_ADMIN_COMMANDS !== 'false' // defaults to true
    },

    // Bot Media
    media: {
        botPhotoUrl: process.env.BOT_PHOTO_URL || 'https://i.ibb.co/nqgG6z6w/IMG-20250720-WA0041-2.jpg'
    },

    // Development settings
    isDevelopment: process.env.NODE_ENV !== 'production',
    
    // Helper functions
    getBotOwnerJid() {
        return this.botOwner.number + '@s.whatsapp.net';
    },

    getContactJid(contactType) {
        const number = this.contacts[contactType];
        return number ? number + '@s.whatsapp.net' : null;
    },

    // Legacy compatibility for existing settings.json format
    toLegacyFormat() {
        return {
            prefix: this.botOwner.prefix,
            nomeDoBot: this.botOwner.name,
            nickDoDono: this.botOwner.nickname,
            numeroDoDono: this.botOwner.number,
            fotoDoBot: this.media.botPhotoUrl
        };
    }
};

module.exports = config;
const axios = require('axios');

async function igdl(query) {
  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${query}`, {
      timeout: 15000, // 15 segundos timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erro na API Instagram:', error.message);
    
    // Retorna erro específico baseado no tipo
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('TIMEOUT');
    } else if (error.response?.status === 429) {
      throw new Error('RATE_LIMITED');
    } else if (error.response?.status >= 500) {
      throw new Error('SERVER_ERROR');
    } else {
      throw new Error('API_ERROR');
    }
  }
}

module.exports = { igdl };
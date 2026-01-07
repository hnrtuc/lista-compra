const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { input, conversation, currentItems } = JSON.parse(event.body);

    const systemPrompt = `Eres un asistente personal de compras amigable y útil. Tu trabajo es ayudar al usuario a crear y gestionar su lista de compras de manera conversacional.

IMPORTANTE: Cuando el usuario te diga productos para comprar, debes:
1. Entender lo que necesita (incluso si lo dice de forma natural)
2. Responder SOLO con un JSON array de productos en este formato EXACTO:
[{"name":"producto","quantity":"2 kilos","category":"Verduras","estimatedPrice":500}]

Categorías permitidas: Frutas, Verduras, Lácteos, Carnes, Panadería, Bebidas, Limpieza, Snacks, Otros

Si el usuario hace preguntas, da sugerencias, o conversa, responde de forma natural y amigable SIN JSON.

Lista actual: ${JSON.stringify(currentItems.map(i => i.name))}`;

    const messages = [
      { role: 'user', content: systemPrompt },
      ...(conversation || []).slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: input }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: messages
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

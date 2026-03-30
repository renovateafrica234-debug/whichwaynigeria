// /api/analyze.js - Vercel Serverless Function for AI polling analysis
// This runs on the backend to keep your OpenRouter API key secure

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      // Return simulated data if no API key (for testing)
      return res.status(200).json({
        simulated: true,
        data: generateSimulatedAnalysis(),
        message: 'Running in simulation mode - add OPENROUTER_API_KEY to environment variables'
      });
    }
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'https://whichwaynigeria.vercel.app',
        'X-Title': 'WhichWayNigeria'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-thinking-exp:free',
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian political data analyst. Analyze election polling trends and provide structured data.
            Current date: ${new Date().toISOString().split('T')[0]}
            Focus on the 2027 Nigerian presidential election and ADC (African Democratic Congress) performance.`
          },
          {
            role: 'user',
            content: `Analyze current Nigerian political polling data for the 2027 presidential election.
            
            Provide a JSON response with this exact structure:
            {
              "national": {
                "adc": number (percentage 0-100),
                "apc": number (percentage 0-100), 
                "pdp": number (percentage 0-100),
                "others": number (percentage 0-100)
              },
              "trends": {
                "adc_change": number (positive or negative percentage change),
                "momentum": "gaining|stable|declining",
                "key_factors": [string array of 3 factors]
              },
              "regional": {
                "north_central": { "adc": number, "leading": boolean },
                "north_east": { "adc": number, "leading": boolean },
                "north_west": { "adc": number, "leading": boolean },
                "south_east": { "adc": number, "leading": boolean },
                "south_south": { "adc": number, "leading": boolean },
                "south_west": { "adc": number, "leading": boolean }
              },
              "projections": {
                "next_month_adc": number,
                "confidence": "high|medium|low"
              },
              "timestamp": "ISO date string"
            }
            
            Base your analysis on:
            - ADC's recent coalition building with opposition parties
            - Youth voter mobilization (18-35 demographic)
            - Economic factors affecting voter sentiment
            - Regional political dynamics
            
            Ensure percentages sum to approximately 100%. Be realistic but show ADC gaining momentum.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    
    // Extract JSON from AI response
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback to simulated data if parsing fails
      analysisData = generateSimulatedAnalysis();
      analysisData._parsedFromAI = false;
      analysisData._rawContent = content.substring(0, 500);
    }
    
    return res.status(200).json({
      simulated: false,
      data: analysisData,
      model: 'google/gemini-2.0-flash-thinking-exp:free',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      fallback: generateSimulatedAnalysis()
    });
  }
}

function generateSimulatedAnalysis() {
  const now = new Date();
  return {
    national: {
      adc: 38.5,
      apc: 32.2,
      pdp: 18.7,
      others: 10.6
    },
    trends: {
      adc_change: 2.3,
      momentum: 'gaining',
      key_factors: [
        'Opposition coalition building momentum',
        'Youth voter registration surge',
        'Economic dissatisfaction driving change'
      ]
    },
    regional: {
      north_central: { adc: 42, leading: true },
      north_east: { adc: 35, leading: false },
      north_west: { adc: 28, leading: false },
      south_east: { adc: 48, leading: true },
      south_south: { adc: 45, leading: true },
      south_west: { adc: 38, leading: false }
    },
    projections: {
      next_month_adc: 40.8,
      confidence: 'medium'
    },
    timestamp: now.toISOString()
  };
}


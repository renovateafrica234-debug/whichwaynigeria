// /api/daily-analysis.js - Runs daily at 6 AM UTC to trigger AI analysis
// This keeps your polling data fresh with daily AI insights

export default async function handler(req, res) {
  // Verify cron request
  const userAgent = req.headers['user-agent'] || '';
  if (!userAgent.includes('vercel-cron') && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Call the analyze endpoint
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    // Store the analysis result (in a real app, you'd save to a database)
    // For now, we'll just return success
    
    return res.status(200).json({
      success: true,
      message: 'Daily AI analysis completed',
      timestamp: new Date().toISOString(),
      data: result
    });
    
  } catch (error) {
    console.error('Daily analysis cron failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


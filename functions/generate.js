exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { topic, level, focus, notes } = body;

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };
  }

  const levels = {
    simple: 'simple English (short sentences, no jargon, Year 6 reading level)',
    standard: 'clear standard English for most adults',
    elderly: 'very simple English for elderly patients or ESL speakers — very short sentences, concepts broken into small steps'
  };

  const focuses = {
    overview: 'a general overview: what it is, causes, symptoms, key points',
    aftercare: 'aftercare and recovery: home care, activity restrictions, follow-up appointments',
    medication: 'medication guidance: what it does, how to take it, side effects, what to avoid',
    warning: 'warning signs and when to seek help: red flags, emergency signs, who to call'
  };

  const prompt = `You are a clinical educator writing a patient education handout. Write in ${levels[level] || levels.simple}.

Topic: ${topic}
Focus: ${focuses[focus] || focuses.overview}
${notes ? `Clinician notes to include: ${notes}` : ''}

Format:
- Warm <h2> title
- 2-4 sections with <h3> headings
- Short <p> paragraphs or <ul>/<li> bullets
- Explain any medical terms in plain language
- End with a "Questions?" section encouraging patients to ask their care team
- Tone: warm, calm, reassuring
- Length: 320-440 words
- Output clean HTML only using h2, h3, p, ul, li tags — nothing else`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a clinical educator who writes clear, warm, plain-English patient education handouts. Output clean HTML only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const html = (data.choices?.[0]?.message?.content || '').replace(/```html|```/g, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

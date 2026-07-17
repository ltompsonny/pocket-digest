exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { topic, level, focus, notes, action } = body;

  // ── IMAGE PROXY ──
  if (action === 'images') {
    if (!topic) return { statusCode: 400, body: JSON.stringify({ error: 'Topic required' }) };

    const KNOWN = {
      knee:     [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Knee_diagram.svg/400px-Knee_diagram.svg.png', title: 'Knee ligament diagram' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Meniscus_tear_types.svg/400px-Meniscus_tear_types.svg.png', title: 'Meniscus tear types' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Blausen_0597_KneeAnatomy_Side.png/400px-Blausen_0597_KneeAnatomy_Side.png', title: 'Knee anatomy — side view' } ],
      meniscus: [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Knee_diagram.svg/400px-Knee_diagram.svg.png', title: 'Knee ligament diagram' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Meniscus_tear_types.svg/400px-Meniscus_tear_types.svg.png', title: 'Meniscus tear types' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Blausen_0597_KneeAnatomy_Side.png/400px-Blausen_0597_KneeAnatomy_Side.png', title: 'Knee anatomy — side view' } ],
      acl:      [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Knee_diagram.svg/400px-Knee_diagram.svg.png', title: 'Knee ligament diagram' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Blausen_0597_KneeAnatomy_Side.png/400px-Blausen_0597_KneeAnatomy_Side.png', title: 'Knee anatomy — side view' } ],
      shoulder: [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Blausen_0090_ShoulderAnatomy_Glenoid.png/400px-Blausen_0090_ShoulderAnatomy_Glenoid.png', title: 'Shoulder anatomy' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Blausen_0817_RotatorCuff_TornCuff.png/400px-Blausen_0817_RotatorCuff_TornCuff.png', title: 'Rotator cuff anatomy' } ],
      hip:      [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Blausen_0488_HipAnatomy_01.png/400px-Blausen_0488_HipAnatomy_01.png', title: 'Hip anatomy' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Blausen_0488_HipAnatomy_02.png/400px-Blausen_0488_HipAnatomy_02.png', title: 'Hip joint detail' } ],
      spine:    [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Blausen_0738_Spondylolisthesis.png/400px-Blausen_0738_Spondylolisthesis.png', title: 'Spine anatomy' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Blausen_0769_SlippedDisk.png/400px-Blausen_0769_SlippedDisk.png', title: 'Spinal disc' } ],
      ankle:    [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Blausen_0067_AnkleAnatomy.png/400px-Blausen_0067_AnkleAnatomy.png', title: 'Ankle anatomy' } ],
      foot:     [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Blausen_0067_AnkleAnatomy.png/400px-Blausen_0067_AnkleAnatomy.png', title: 'Ankle and foot anatomy' } ],
      heart:    [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg/400px-Diagram_of_the_human_heart_%28cropped%29.svg.png', title: 'Heart anatomy' } ],
      diabetes: [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Symptoms_of_diabetes.svg/400px-Symptoms_of_diabetes.svg.png', title: 'Symptoms of diabetes' }, { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Blausen_0329_Diabetes_Type2.png/400px-Blausen_0329_Diabetes_Type2.png', title: 'Type 2 diabetes' } ],
      wrist:    [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Blausen_0977_WristAnatomy.png/400px-Blausen_0977_WristAnatomy.png', title: 'Wrist anatomy' } ],
      elbow:    [ { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Blausen_0347_ElbowAnatomy_02.png/400px-Blausen_0347_ElbowAnatomy_02.png', title: 'Elbow anatomy' } ],
    };

    const t = topic.toLowerCase();
    let imgList = null;
    for (const [key, imgs] of Object.entries(KNOWN)) {
      if (t.includes(key)) { imgList = imgs; break; }
    }

    if (!imgList) {
      // Search Wikimedia server-side
      try {
        const searchRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic + ' anatomy diagram')}&srnamespace=6&srlimit=10&format=json`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PocketDigest/1.0; +https://pocket-digest.netlify.app)' } }
        );
        const searchData = await searchRes.json();
        const results = (searchData.query?.search || []).slice(0, 10);
        imgList = [];
        for (const r of results) {
          if (imgList.length >= 3) break;
          try {
            const infoRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|mime|size&format=json`,
              { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PocketDigest/1.0)' } }
            );
            const infoData = await infoRes.json();
            const page = Object.values(infoData.query.pages)[0];
            const info = page?.imageinfo?.[0];
            if (!info || !['image/png', 'image/jpeg', 'image/svg+xml'].includes(info.mime) || info.size < 5000) continue;
            let imgUrl = info.url;
            if (info.mime === 'image/svg+xml') {
              const fname = imgUrl.split('/').pop();
              const pathPart = imgUrl.split('/commons/')[1];
              imgUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${pathPart}/${fname}/400px-${fname}.png`;
            }
            imgList.push({ url: imgUrl, title: r.title.replace('File:', '').replace(/\.[^.]+$/, '') });
          } catch { continue; }
        }
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }

    // Fetch all images server-side to avoid browser CORS blocks
    const results = await Promise.all(imgList.slice(0, 3).map(async (img) => {
      try {
        const r = await fetch(img.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PocketDigest/1.0; +https://pocket-digest.netlify.app)' }
        });
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const mime = r.headers.get('content-type') || 'image/png';
        return { dataUrl: `data:${mime};base64,${b64}`, title: img.title };
      } catch { return null; }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: results.filter(Boolean) })
    };
  }

  // ── HANDOUT / EXERCISES ──
  if (!topic) return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };

  const levels = {
    simple: 'simple English (short sentences, no jargon, Year 6 reading level)',
    standard: 'clear standard English for most adults',
    elderly: 'very simple English for elderly patients or ESL speakers'
  };

  const focuses = {
    overview: 'a general overview: what it is, causes, symptoms, key points',
    aftercare: 'aftercare and recovery: home care, activity restrictions, follow-up appointments',
    medication: 'medication guidance: what it does, how to take it, side effects, what to avoid',
    warning: 'warning signs and when to seek help: red flags, emergency signs, who to call'
  };

  let prompt;

  if (focus === 'exercises') {
    prompt = `You are a physiotherapist creating a rehabilitation exercise programme. The patient has: ${topic}.
${notes ? `Clinical notes: ${notes}` : ''}

Generate exactly 6 rehabilitation exercises appropriate for this condition.

Respond with ONLY a valid JSON array, no other text, no markdown, no code blocks. Example format:
[
  {
    "name": "Exercise Name",
    "sets": "3 sets x 10 reps",
    "instructions": "Clear 1-2 sentence instruction on how to perform the exercise safely."
  }
]

Rules:
- Exactly 6 exercises
- Appropriate for the condition and stage of recovery
- Sets/reps should be specific (e.g. "3 sets x 10 reps" or "Hold 30 seconds x 3")
- Instructions must be clear and simple — one to two sentences maximum
- No warm-up/cool-down unless they are the exercise itself
- JSON only, nothing else`;
  } else {
    prompt = `You are a clinical educator writing a patient education handout. Write in ${levels[level] || levels.simple}.

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
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: focus === 'exercises' ? 'You are a physiotherapist. Output only valid JSON arrays, nothing else.' : 'You are a clinical educator. Output clean HTML only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (data.error) return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };

    const raw = (data.choices?.[0]?.message?.content || '').trim();

    if (focus === 'exercises') {
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        const exercises = JSON.parse(clean);
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercises }) };
      } catch {
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not parse exercise data. Please try again.' }) };
      }
    } else {
      const html = raw.replace(/```html|```/g, '').trim();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

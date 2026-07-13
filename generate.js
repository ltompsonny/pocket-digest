# Pocket Digest

Instant plain-English patient summaries for clinicians. Powered by Claude AI.

## Files

```
/
├── netlify.toml                  # Netlify config (don't touch)
├── public/
│   ├── index.html                # Landing page (pocketdigest.com)
│   ├── app.html                  # The generator app (pocketdigest.com/app)
│   └── logo.svg                  # Pocket Digest logo
└── netlify/
    └── functions/
        └── generate.js           # Serverless backend (handles AI call)
```

## Deploy to Netlify (5 minutes)

### 1. Push to GitHub
- Create a new repo at github.com (call it `pocket-digest`)
- Upload all these files — drag and drop the unzipped folder works fine

### 2. Connect to Netlify
- Go to netlify.com → Add new site → Import from Git
- Select your GitHub repo
- Build settings are auto-detected from `netlify.toml` — leave everything as-is
- Click Deploy

### 3. Add your Anthropic API key
- In Netlify: Site configuration → Environment variables
- Add a new variable:
  - Key: `ANTHROPIC_API_KEY`
  - Value: your key from console.anthropic.com
- Go to Deploys → Trigger deploy → Deploy site

### 4. You're live 🎉
Your site is at `yoursite.netlify.app`
- Landing page: `yoursite.netlify.app`
- App: `yoursite.netlify.app/app`

## Getting your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Click API Keys → Create Key
4. Copy the key and paste it into Netlify as above

Each summary costs roughly $0.001–0.003 (fractions of a cent).

## Custom domain
In Netlify → Domain management, you can connect a custom domain like `pocketdigest.com` or `pocketdigest.app`. Worth checking if either is available!

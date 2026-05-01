export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Claude API proxy
    if (url.pathname === '/claude' && request.method === 'POST') {
      const apiKey = env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not configured' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      let body;
      try {
        body = await request.json();
      } catch(e) {
        return new Response(JSON.stringify({ error: { message: 'Invalid JSON in request: ' + e.message } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });

        const responseText = await anthropicRes.text();
        
        return new Response(responseText, {
          status: anthropicRes.status,
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'X-Anthropic-Status': String(anthropicRes.status)
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: { message: 'Fetch failed: ' + err.message } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Serve HTML for everything else
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Organizational Health Assessment · Scarlet Spark</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%233B37B3'/%3E%3Ctext y='75' x='50' text-anchor='middle' font-size='65' font-family='sans-serif' fill='%23B3A14A'%3E✦%3C/text%3E%3C/svg%3E">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #F7F7FB;
    --warm-white: #FAFAFF;
    --charcoal: #0E0D1F;
    --mid: #4A4868;
    --light: #9896B8;
    --border: #E0DFF4;
    --brand: #3B37B3;
    --brand-light: #8682FF;
    --brand-pale: #EFEFFD;
    --gold: #B3A14A;
    --gold-light: #FFEA82;
    --gold-pale: #FFFBEA;
    --green: #1A7F5A;
    --amber: #B3A14A;
    --blue: #3B37B3;
    --shadow: 0 2px 16px rgba(14,13,31,0.08);
    --shadow-lg: 0 8px 40px rgba(14,13,31,0.18);
    --scarlet: #3B37B3;
    --scarlet-light: #8682FF;
    --scarlet-pale: #EFEFFD;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--charcoal);
    min-height: 100vh;
  }

  nav {
    background: var(--charcoal);
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem;
    color: var(--cream);
    letter-spacing: 0.02em;
  }
  .nav-brand span { color: var(--brand-light); }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    color: var(--light);
    transition: all 0.2s;
    border: none;
    background: none;
  }
  .nav-tab:hover { color: var(--cream); background: rgba(255,255,255,0.08); }
  .nav-tab.active { background: var(--brand); color: white; }

  .pw-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(28,25,23,0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  .pw-overlay.show { display: flex; }
  .pw-modal {
    background: white;
    border-radius: 20px;
    padding: 48px 40px;
    width: 100%;
    max-width: 400px;
    text-align: center;
    box-shadow: var(--shadow-lg);
    animation: modalIn 0.25s ease;
  }
  @keyframes modalIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:none; } }
  .pw-icon { font-size: 2.5rem; margin-bottom: 20px; }
  .pw-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
  .pw-sub { font-size: 0.88rem; color: var(--mid); margin-bottom: 28px; line-height: 1.5; }
  .pw-input {
    width: 100%;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 13px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    text-align: center;
    letter-spacing: 0.12em;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 12px;
  }
  .pw-input:focus { border-color: var(--brand); }
  .pw-input.error { border-color: #EF4444; animation: shake 0.35s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .pw-error { font-size: 0.82rem; color: #DC2626; margin-bottom: 12px; min-height: 18px; }
  .pw-btn {
    width: 100%;
    background: var(--brand);
    color: white;
    border: none;
    padding: 13px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 12px;
  }
  .pw-btn:hover { background: var(--brand-light); }
  .pw-cancel { font-size: 0.82rem; color: var(--light); cursor: pointer; background: none; border: none; font-family: 'DM Sans', sans-serif; }
  .pw-cancel:hover { color: var(--mid); }

  .nav-lock {
    background: none;
    border: none;
    color: rgba(255,255,255,0.18);
    cursor: pointer;
    padding: 8px;
    font-size: 0.85rem;
    transition: color 0.2s;
    margin-left: 8px;
  }
  .nav-lock:hover { color: rgba(255,255,255,0.5); }
  .nav-lock.unlocked { color: var(--gold-light); }

  .view { display: none; }
  .view.active { display: block; }

  .client-hero {
    background: var(--charcoal);
    color: white;
    padding: 36px 40px 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .client-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 25% 60%, rgba(134,130,255,0.3) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 15%, rgba(179,161,74,0.2) 0%, transparent 55%),
                radial-gradient(ellipse at 60% 90%, rgba(59,55,179,0.2) 0%, transparent 50%);
  }
  .client-hero > * { position: relative; }
  .hero-eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold-light);
    margin-bottom: 16px;
  }
  .hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3.4rem;
    font-weight: 700;
    line-height: 1.05;
    margin-bottom: 20px;
  }
  .hero-sub {
    font-size: 1.05rem;
    color: rgba(255,255,255,0.65);
    max-width: 580px;
    margin: 0 auto 32px;
    line-height: 1.65;
  }
  .progress-bar-wrap {
    background: var(--warm-white);
    padding: 14px 40px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 20px;
    position: sticky;
    top: 64px;
    z-index: 90;
    box-shadow: 0 2px 8px rgba(14,13,31,0.06);
  }
  .progress-label { font-size: 0.85rem; color: var(--mid); white-space: nowrap; }
  .progress-track {
    flex: 1;
    height: 6px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--brand), var(--brand-light));
    border-radius: 99px;
    transition: width 0.4s ease;
  }
  .progress-pct { font-size: 0.85rem; font-weight: 600; color: var(--brand); white-space: nowrap; }

  .form-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  .org-info-card {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 36px;
    margin-bottom: 32px;
    box-shadow: var(--shadow);
  }
  .card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .card-desc {
    color: var(--mid);
    font-size: 0.9rem;
    margin-bottom: 28px;
    line-height: 1.6;
  }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 0.83rem; font-weight: 600; color: var(--mid); text-transform: uppercase; letter-spacing: 0.06em; }
  input[type="text"], input[type="email"], select, textarea {
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    color: var(--charcoal);
    background: white;
    transition: border-color 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--brand); }
  textarea { resize: vertical; min-height: 88px; }

  .driver-section {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .driver-header {
    padding: 24px 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    transition: background 0.15s;
  }
  .driver-header:hover { background: var(--brand-pale); }
  .driver-header-left { display: flex; align-items: center; gap: 16px; }
  .driver-pill {
    background: var(--brand);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 99px;
  }
  .driver-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .driver-count { font-size: 0.8rem; color: var(--light); }
  .driver-chevron { color: var(--light); font-size: 1.1rem; transition: transform 0.3s; }
  .driver-section.open .driver-chevron { transform: rotate(180deg); }
  .driver-body { display: none; padding: 0 32px 28px; }
  .driver-section.open .driver-body { display: block; }
  .driver-desc { font-size: 0.88rem; color: var(--mid); margin-bottom: 24px; line-height: 1.6; }

  .system-item {
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .system-item:focus-within { border-color: var(--brand); }
  .system-name {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 14px;
    color: var(--charcoal);
  }
  .system-stage {
    display: inline-block;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 99px;
    font-weight: 600;
    margin-left: 8px;
    background: var(--border);
    color: var(--mid);
  }
  .score-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .system-link-row { display: flex; gap: 10px; align-items: center; }
  .system-link-row input { flex: 1; }
  .notes-link { font-size: 0.8rem; color: var(--brand); cursor: pointer; border: none; background: none; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .notes-area { margin-top: 10px; }

  .upload-section {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 36px;
    margin-bottom: 24px;
    box-shadow: var(--shadow);
  }
  .uploaded-file .remove { margin-left: auto; cursor: pointer; color: var(--light); background: none; border: none; font-size: 1rem; }

  .submit-section { text-align: center; padding: 40px 24px; }
  .btn-primary {
    background: var(--brand);
    color: white;
    border: none;
    padding: 16px 48px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(59,55,179,0.35);
  }
  .btn-primary:hover { background: var(--brand-light); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(59,55,179,0.4); }
  .btn-secondary {
    background: white;
    color: var(--charcoal);
    border: 1.5px solid var(--border);
    padding: 10px 24px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: var(--charcoal); }

  .success-screen {
    display: none;
    text-align: center;
    padding: 80px 40px;
  }
  .success-screen.show { display: block; }
  .success-icon { font-size: 4rem; margin-bottom: 24px; }
  .success-title { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; margin-bottom: 16px; }
  .success-sub { color: var(--mid); font-size: 1rem; line-height: 1.65; max-width: 500px; margin: 0 auto; }

  .consultant-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: calc(100vh - 64px);
  }
  .consultant-sidebar {
    background: var(--charcoal);
    padding: 32px 20px;
    overflow-y: auto;
    max-height: calc(100vh - 64px);
    position: sticky;
    top: 64px;
    border-right: 3px solid var(--brand);
  }
  .sidebar-section-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--light);
    padding: 0 12px;
    margin-bottom: 10px;
    margin-top: 24px;
  }
  .sidebar-section-label:first-child { margin-top: 0; }
  .sidebar-item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: rgba(255,255,255,0.7);
    font-size: 0.88rem;
    transition: all 0.15s;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.08); color: white; }
  .sidebar-item.active { background: var(--brand); color: white; }
  .sidebar-badge {
    font-size: 0.7rem;
    padding: 2px 7px;
    border-radius: 99px;
    background: rgba(255,255,255,0.15);
  }

  .consultant-main {
    padding: 40px 48px;
    overflow-y: auto;
    background: var(--cream);
  }
  .consultant-header {
    margin-bottom: 36px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .consultant-eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand);
    margin-bottom: 8px;
  }
  .consultant-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .consultant-meta { font-size: 0.9rem; color: var(--mid); }

  .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .metric-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .metric-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--light); margin-bottom: 8px; }
  .metric-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .metric-sub { font-size: 0.82rem; color: var(--mid); }
  .metric-card.red .metric-value { color: #DC2626; }
  .metric-card.amber .metric-value { color: #D97706; }
  .metric-card.green .metric-value { color: #059669; }

  .analysis-panel {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .analysis-panel-header {
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .analysis-panel-title { font-weight: 600; font-size: 1.05rem; }
  .analysis-panel-body { padding: 28px; }

  .ai-thread {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
    max-height: 480px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }
  .ai-message {
    display: flex;
    gap: 12px;
    animation: fadeUp 0.3s ease;
  }
  @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .ai-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    flex-shrink: 0;
    font-weight: 700;
  }
  .ai-avatar.claude { background: var(--brand); color: white; }
  .ai-avatar.user { background: var(--gold); color: white; }
  .ai-bubble {
    background: var(--cream);
    border-radius: 0 12px 12px 12px;
    padding: 14px 18px;
    font-size: 0.92rem;
    line-height: 1.65;
    max-width: 85%;
    color: var(--charcoal);
  }
  .ai-bubble.user-bubble {
    background: var(--brand);
    color: white;
    border-radius: 12px 0 12px 12px;
    margin-left: auto;
  }
  .ai-bubble strong { font-weight: 600; }
  .ai-bubble ul { margin: 8px 0 8px 16px; }
  .ai-bubble li { margin-bottom: 4px; }
  .ai-input-row {
    display: flex;
    gap: 10px;
    border-top: 1px solid var(--border);
    padding-top: 20px;
  }
  .ai-input-row input {
    flex: 1;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 11px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    outline: none;
    background: white;
  }
  .ai-input-row input:focus { border-color: var(--brand); }
  .ai-send {
    background: var(--brand);
    color: white;
    border: none;
    padding: 11px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 0.88rem;
    transition: all 0.2s;
  }
  .ai-send:hover { background: var(--brand-light); }
  .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }

  .driver-score-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .driver-score-row:last-child { border-bottom: none; }
  .driver-score-name { width: 200px; font-size: 0.9rem; font-weight: 500; flex-shrink: 0; }
  .score-track { flex: 1; height: 8px; background: var(--border); border-radius: 99px; overflow: hidden; }
  .score-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
  .score-fill.red { background: #EF4444; }
  .score-fill.amber { background: #F59E0B; }
  .score-fill.green { background: #10B981; }
  .score-fill.brand { background: var(--brand); }
  .score-val { width: 48px; text-align: right; font-size: 0.85rem; font-weight: 600; color: var(--mid); }

  .doc-list { display: flex; flex-direction: column; gap: 8px; }
  .doc-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--cream);
    border-radius: 8px;
    font-size: 0.88rem;
  }
  .doc-item .doc-name { font-weight: 500; flex: 1; }
  .doc-item .doc-type { font-size: 0.75rem; color: var(--mid); background: white; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--border); }

  .suggest-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .chip {
    padding: 6px 14px;
    border-radius: 99px;
    border: 1.5px solid var(--border);
    font-size: 0.8rem;
    cursor: pointer;
    background: white;
    color: var(--mid);
    transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .chip:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-pale); }

  .panel-tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--border); margin-bottom: 24px; }
  .panel-tab {
    padding: 8px 18px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--light);
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .panel-tab.active { color: var(--brand); border-bottom-color: var(--brand); }
  .panel-tab-content { display: none; }
  .panel-tab-content.active { display: block; }

  .print-summary-bar {
    position: sticky;
    top: 64px;
    background: var(--charcoal);
    color: white;
    padding: 14px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 50;
  }
  .print-summary-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }
  .summary-org-header {
    background: var(--charcoal);
    color: white;
    border-radius: 16px;
    padding: 32px 36px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .summary-org-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(134,130,255,0.25) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(179,161,74,0.15) 0%, transparent 55%);
  }
  .summary-org-header > * { position: relative; }
  .summary-driver-block {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .summary-driver-header {
    padding: 18px 28px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--brand-pale);
  }
  .summary-driver-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--brand);
  }
  .summary-item {
    padding: 16px 28px;
    border-bottom: 1px solid var(--border);
  }
  .summary-item:last-child { border-bottom: none; }
  .summary-item-name { font-weight: 600; font-size: 0.92rem; margin-bottom: 6px; }
  .summary-item-score {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 99px;
    margin-bottom: 6px;
  }
  .summary-item-notes { font-size: 0.87rem; color: var(--mid); line-height: 1.6; margin-top:6px; }
  .summary-item-link { font-size: 0.82rem; margin-top: 5px; }
  .summary-item-link a { color: var(--brand); }
  .summary-final {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: var(--shadow);
  }

  @media print {
    nav { display: none !important; }
    .progress-bar-wrap { display: none !important; }
    .session-bar { display: none !important; }
    .print-summary-bar { display: none !important; }
    .form-container { display: none !important; }
    .client-hero { display: none !important; }
    #success-screen { display: none !important; }
    #print-summary { display: block !important; visibility: visible !important; }
    .print-summary-content { display: block !important; }
    .summary-driver-block { break-inside: avoid; page-break-inside: avoid; }
  }

  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .gap-16 { margin-bottom: 16px; }
  .gap-24 { margin-bottom: 24px; }

  .score-scale {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;
    margin-bottom: 4px;
    padding: 8px 0 4px;
  }
  .score-scale::before {
    content: '';
    position: absolute;
    top: 30px;
    left: 28px;
    right: 28px;
    height: 1.5px;
    background: var(--border);
    z-index: 0;
  }
  .score-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    position: relative;
    z-index: 1;
    flex: 1;
  }
  .score-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background: white;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .score-option:hover .score-circle { transform: scale(1.08); }
  .score-option[data-val="0"] .score-circle { border-color: #E8A0A0; color: #C0392B; background: #FDF0F0; }
  .score-option[data-val="1"] .score-circle { border-color: #C9A84C; color: #8B6914; background: #FBF5E0; }
  .score-option[data-val="2"] .score-circle { border-color: #7BBFBF; color: #2A7A7A; background: #E8F5F5; }
  .score-option[data-val="3"] .score-circle { border-color: #7BBF7B; color: #2A6B2A; background: #E8F5E8; }
  .score-option[data-val="0"].selected .score-circle { background: #C0392B; border-color: #C0392B; color: white; }
  .score-option[data-val="1"].selected .score-circle { background: #C9A84C; border-color: #C9A84C; color: white; }
  .score-option[data-val="2"].selected .score-circle { background: #7BBFBF; border-color: #7BBFBF; color: white; }
  .score-option[data-val="3"].selected .score-circle { background: #7BBF7B; border-color: #7BBF7B; color: white; }
  .score-label {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--mid);
    text-align: center;
    line-height: 1.3;
    max-width: 80px;
  }
  .score-num {
    font-size: 0.72rem;
    color: var(--light);
    font-weight: 400;
  }
  .score-option.selected .score-label { color: var(--charcoal); font-weight: 600; }
  .score-option.selected .score-num { color: var(--mid); }

  .item-desc {
    font-size: 0.88rem;
    color: var(--mid);
    line-height: 1.55;
    margin-bottom: 14px;
    font-style: italic;
  }
  .item-field-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--light);
    margin-bottom: 6px;
  }
  .item-textarea {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: var(--charcoal);
    resize: vertical;
    min-height: 72px;
    outline: none;
    background: var(--cream);
    transition: border-color 0.2s;
    line-height: 1.55;
  }
  .item-textarea:focus { border-color: var(--brand); background: white; }
  .item-doc-row {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }
  .item-link-input {
    flex: 1;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    color: var(--charcoal);
    outline: none;
    background: var(--cream);
    transition: border-color 0.2s;
  }
  .item-link-input:focus { border-color: var(--brand); background: white; }

  .stage-tag-wrap { display: inline-flex; align-items: center; gap: 5px; }
  .help-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1.5px solid var(--light);
    color: var(--light);
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: all 0.15s;
    background: white;
    font-family: 'DM Sans', sans-serif;
    line-height: 1;
  }
  .help-icon:hover { border-color: var(--brand); color: var(--brand); }
  .stage-help-popup {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--charcoal);
    color: white;
    font-size: 0.8rem;
    line-height: 1.55;
    padding: 12px 14px;
    border-radius: 8px;
    width: 260px;
    z-index: 50;
    box-shadow: var(--shadow-lg);
    font-weight: 400;
    pointer-events: none;
  }
  .stage-help-popup::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: var(--charcoal);
  }
  .help-icon.open .stage-help-popup { display: block; }

  .session-bar {
    display: none;
    background: var(--charcoal);
    color: white;
    padding: 12px 40px;
    font-size: 0.83rem;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: sticky;
    top: 64px;
    z-index: 89;
  }
  .session-bar.show { display: flex; }
  .session-bar-left { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.75); }
  .session-link-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.1);
    border-radius: 6px;
    padding: 6px 12px;
    flex: 1;
    max-width: 480px;
  }
  .session-link-text {
    flex: 1;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
  }
  .session-copy-btn {
    background: var(--brand);
    color: white;
    border: none;
    padding: 5px 12px;
    border-radius: 5px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .session-copy-btn:hover { background: var(--brand-light); }
  .session-save-indicator {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
    white-space: nowrap;
  }
  .session-save-indicator.saving { color: var(--gold-light); }
  .session-save-indicator.saved { color: #10B981; }

  .system-item.required-item { border-color: var(--border); }
  .required-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--brand);
    background: var(--brand-pale);
    padding: 2px 7px;
    border-radius: 99px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .not-required-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 500;
    color: var(--light);
    background: var(--cream);
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 99px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .submit-error {
    background: #FEE2E2;
    border: 1.5px solid #EF4444;
    border-radius: 10px;
    padding: 14px 20px;
    margin-bottom: 16px;
    font-size: 0.88rem;
    color: #DC2626;
    line-height: 1.6;
    display: none;
  }
  .submit-error.show { display: block; }
  .system-item.missing-score {
    border-color: #EF4444;
    box-shadow: 0 0 0 2px rgba(239,68,68,0.15);
  }

  .form-pages-wrapper {
    position: relative;
    overflow: hidden;
  }
  .form-page {
    display: none;
    animation-duration: 0.4s;
    animation-fill-mode: both;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .form-page.active { display: block; }
  .form-page.slide-in-right { animation-name: slideInRight; }
  .form-page.slide-in-left { animation-name: slideInLeft; }
  .form-page.slide-out-left { animation-name: slideOutLeft; position: absolute; top: 0; left: 0; right: 0; }
  .form-page.slide-out-right { animation-name: slideOutRight; position: absolute; top: 0; left: 0; right: 0; }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-60px); } }
  @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(60px); } }
  .page-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0 0;
    margin-top: 8px;
    border-top: 1px solid var(--border);
  }
  .page-nav-section { font-size: 0.8rem; color: var(--light); font-weight: 500; }
  .page-nav-section strong { color: var(--mid); }
  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: white;
    color: var(--mid);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-back:hover { border-color: var(--brand); color: var(--brand); }
  .driver-page-header {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .driver-page-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand);
    margin-bottom: 6px;
  }
  .driver-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .driver-page-desc { font-size: 0.95rem; color: var(--mid); line-height: 1.65; }
  .driver-page-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--brand);
    text-decoration: none;
    padding: 6px 14px;
    border: 1.5px solid var(--brand);
    border-radius: 99px;
    margin-top: 12px;
    transition: all 0.15s;
  }
  .driver-page-link:hover { background: var(--brand); color: white; }

  .stage-card {
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.18s;
    background: white;
    position: relative;
  }
  .stage-card:hover { border-color: var(--brand-light); background: var(--brand-pale); }
  .stage-card.selected { border-color: var(--brand); background: var(--brand-pale); }
  .stage-card.selected::after {
    content: '✓';
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--brand);
  }
  .stage-card-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 700; color: var(--charcoal); margin-bottom: 3px; }
  .stage-card-desc { font-size: 0.82rem; color: var(--mid); line-height: 1.55; }

  @media (max-width: 900px) {
    .consultant-layout { grid-template-columns: 1fr; }
    .consultant-sidebar { display: none; }
    .metric-grid { grid-template-columns: 1fr 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .hero-title { font-size: 2rem; }
  }
</style>
</head>
<body>

<nav>
  <div class="nav-brand" style="display:flex;align-items:center"><svg width="36" height="36" viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#cl1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M460.637 521.329L365.316 295.62C334.952 371.914 303.243 446.051 270.983 521.329H315.237C332.08 479.128 341.037 457.163 365.316 396.162C395.098 470.961 395.486 471.875 415.134 521.329H460.637Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M359.304 127.383L367.832 127.273C371.531 127.226 374.722 129.663 374.622 132.675L371.4 220.797C371.295 223.803 368.425 226.324 364.742 226.366L364.028 226.376C360.344 226.423 357.394 223.997 357.239 220.98L352.64 132.957C352.495 129.94 355.605 127.435 359.304 127.383Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M208.975 173.766L216.307 169.232C219.488 167.266 223.423 167.711 224.78 170.378L264.34 248.37C265.697 251.027 264.42 254.703 261.254 256.658L260.636 257.04C257.47 258.996 253.746 258.431 252.163 255.895L205.889 182.054C204.301 179.518 205.789 175.727 208.975 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M101.063 292.143L105.24 284.404C107.049 281.042 110.672 279.389 113.124 280.984L184.857 327.947C187.31 329.547 187.968 333.391 186.164 336.732L185.812 337.38C184.013 340.722 180.515 342.17 177.927 340.795L102.37 300.923C99.787 299.558 99.2594 295.5 101.063 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M292.32 181.395L300.531 178.995C304.094 177.955 308.19 180.046 308.823 183.837L315.733 225.796C316.361 229.582 314.633 233.383 311.08 234.419L310.391 234.623C306.838 235.663 303.401 233.389 302.099 229.786L287.661 190.023C286.365 186.415 288.757 182.441 292.32 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M176.917 255.393L182.872 249.039C185.455 246.284 190.008 245.965 192.38 248.919L218.528 281.664C220.895 284.613 221.221 288.807 218.643 291.557L218.146 292.091C215.568 294.841 211.497 294.664 208.638 292.211L177.033 265.292C174.173 262.834 174.329 258.149 176.917 255.393Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M518.299 173.766L510.967 169.232C507.781 167.266 503.851 167.711 502.494 170.378L462.934 248.37C461.577 251.027 462.854 254.703 466.025 256.658L466.638 257.04C469.804 258.996 473.528 258.431 475.111 255.895L521.39 182.054C522.973 179.518 521.485 175.727 518.299 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M626.209 292.143L622.033 284.404C620.224 281.042 616.6 279.389 614.148 280.984L542.415 327.947C539.968 329.547 539.31 333.391 541.109 336.732L541.455 337.38C543.255 340.722 546.757 342.17 549.34 340.795L624.897 300.923C627.48 299.558 628.018 295.5 626.209 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M434.951 181.395L426.74 178.995C423.177 177.955 419.081 180.046 418.453 183.837L411.538 225.796C410.91 229.582 412.638 233.383 416.191 234.419L416.885 234.623C420.433 235.663 423.875 233.389 425.172 229.786L439.605 190.023C440.906 186.415 438.514 182.441 434.951 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M550.359 255.393L544.399 249.039C541.811 246.284 537.263 245.965 534.891 248.919L508.744 281.664C506.377 284.613 506.05 288.807 508.628 291.557L509.131 292.091C511.709 294.841 515.775 294.664 518.639 292.211L550.244 265.292C553.103 262.834 552.937 258.149 550.359 255.393Z" fill="#B3A14A"/></g><defs><clipPath id="cl1"><rect width="700" height="700" fill="white"/></clipPath></defs></svg></div>
  <div style="display:flex;align-items:center;gap:4px">
    <div class="nav-tabs" id="nav-tabs" style="display:none">
      <button class="nav-tab" id="tab-consultant" onclick="switchView('consultant', event)" style="display:none">Consultant Dashboard</button>
    </div>
    <button class="nav-lock" id="nav-lock" onclick="openPasswordModal()" title="Consultant access">🔒</button>
  </div>
</nav>

<!-- PASSWORD MODAL -->
<div class="pw-overlay" id="pw-overlay">
  <div class="pw-modal">
    <div class="pw-icon" style="display:flex;justify-content:center;margin-bottom:4px"><svg width="72" height="72" viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#cl2)"><path fill-rule="evenodd" clip-rule="evenodd" d="M460.637 521.329L365.316 295.62C334.952 371.914 303.243 446.051 270.983 521.329H315.237C332.08 479.128 341.037 457.163 365.316 396.162C395.098 470.961 395.486 471.875 415.134 521.329H460.637Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M359.304 127.383L367.832 127.273C371.531 127.226 374.722 129.663 374.622 132.675L371.4 220.797C371.295 223.803 368.425 226.324 364.742 226.366L364.028 226.376C360.344 226.423 357.394 223.997 357.239 220.98L352.64 132.957C352.495 129.94 355.605 127.435 359.304 127.383Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M208.975 173.766L216.307 169.232C219.488 167.266 223.423 167.711 224.78 170.378L264.34 248.37C265.697 251.027 264.42 254.703 261.254 256.658L260.636 257.04C257.47 258.996 253.746 258.431 252.163 255.895L205.889 182.054C204.301 179.518 205.789 175.727 208.975 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M101.063 292.143L105.24 284.404C107.049 281.042 110.672 279.389 113.124 280.984L184.857 327.947C187.31 329.547 187.968 333.391 186.164 336.732L185.812 337.38C184.013 340.722 180.515 342.17 177.927 340.795L102.37 300.923C99.787 299.558 99.2594 295.5 101.063 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M292.32 181.395L300.531 178.995C304.094 177.955 308.19 180.046 308.823 183.837L315.733 225.796C316.361 229.582 314.633 233.383 311.08 234.419L310.391 234.623C306.838 235.663 303.401 233.389 302.099 229.786L287.661 190.023C286.365 186.415 288.757 182.441 292.32 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M176.917 255.393L182.872 249.039C185.455 246.284 190.008 245.965 192.38 248.919L218.528 281.664C220.895 284.613 221.221 288.807 218.643 291.557L218.146 292.091C215.568 294.841 211.497 294.664 208.638 292.211L177.033 265.292C174.173 262.834 174.329 258.149 176.917 255.393Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M518.299 173.766L510.967 169.232C507.781 167.266 503.851 167.711 502.494 170.378L462.934 248.37C461.577 251.027 462.854 254.703 466.025 256.658L466.638 257.04C469.804 258.996 473.528 258.431 475.111 255.895L521.39 182.054C522.973 179.518 521.485 175.727 518.299 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M626.209 292.143L622.033 284.404C620.224 281.042 616.6 279.389 614.148 280.984L542.415 327.947C539.968 329.547 539.31 333.391 541.109 336.732L541.455 337.38C543.255 340.722 546.757 342.17 549.34 340.795L624.897 300.923C627.48 299.558 628.018 295.5 626.209 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M434.951 181.395L426.74 178.995C423.177 177.955 419.081 180.046 418.453 183.837L411.538 225.796C410.91 229.582 412.638 233.383 416.191 234.419L416.885 234.623C420.433 235.663 423.875 233.389 425.172 229.786L439.605 190.023C440.906 186.415 438.514 182.441 434.951 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M550.359 255.393L544.399 249.039C541.811 246.284 537.263 245.965 534.891 248.919L508.744 281.664C506.377 284.613 506.05 288.807 508.628 291.557L509.131 292.091C511.709 294.841 515.775 294.664 518.639 292.211L550.244 265.292C553.103 262.834 552.937 258.149 550.359 255.393Z" fill="#B3A14A"/></g><defs><clipPath id="cl2"><rect width="700" height="700" fill="white"/></clipPath></defs></svg></div>
    <div class="pw-title">Consultant Access</div>
    <div class="pw-sub">Enter your Scarlet Spark consultant password to access the analysis dashboard.</div>
    <input class="pw-input" type="password" id="pw-input" placeholder="Password" onkeydown="if(event.key==='Enter')checkPassword()">
    <div class="pw-error" id="pw-error"></div>
    <button class="pw-btn" onclick="checkPassword()">Enter Dashboard &rarr;</button>
    <br>
    <button class="pw-cancel" onclick="closePasswordModal()">Cancel</button>
  </div>
</div>

<!-- CLIENT VIEW -->
<div id="view-client" class="view active">
  <div id="client-form-wrapper">
    <div class="client-hero">
      <div style="margin-bottom:12px"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="140" height="140" viewBox="0 0 240 240" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" fill="white" d="M49.722,134.683c5.916,0,8.626-2.908,8.626-6.313c0-8.428-14.245-4.594-14.245-10.939c0-2.313,1.884-4.197,6.114-4.197c2.049,0,4.363,0.628,6.346,1.917l0.826-1.95c-1.851-1.289-4.561-2.049-7.172-2.049c-5.883,0-8.527,2.941-8.527,6.345c0,8.56,14.245,4.66,14.245,11.005c0,2.281-1.884,4.099-6.213,4.099c-3.041,0-5.982-1.189-7.635-2.81l-0.958,1.884C42.847,133.46,46.251,134.683,49.722,134.683L49.722,134.683z M73.715,134.683c3.404,0,6.445-1.156,8.494-3.404l-1.553-1.553c-1.884,1.949-4.197,2.775-6.842,2.775c-5.585,0-9.782-4.098-9.782-9.584s4.197-9.584,9.782-9.584c2.645,0,4.958,0.826,6.842,2.743l1.553-1.554c-2.049-2.247-5.09-3.371-8.461-3.371c-6.973,0-12.129,4.99-12.129,11.766S66.775,134.683,73.715,134.683L73.715,134.683z M104.122,134.484h2.578L96.124,111.35h-2.413l-10.576,23.135h2.545l2.776-6.181h12.89L104.122,134.484L104.122,134.484z M89.348,126.321l5.552-12.427l5.552,12.427H89.348L89.348,126.321z M129.008,134.484l-5.651-7.932c3.371-1.091,5.288-3.636,5.288-7.271c0-4.958-3.569-7.932-9.453-7.932h-8.659v23.135h2.446v-7.337h6.213c0.661,0,1.256-0.033,1.851-0.1l5.287,7.437H129.008L129.008,134.484z M119.125,125.065h-6.147v-11.601h6.147c4.627,0,7.073,2.115,7.073,5.817C126.198,122.917,123.753,125.065,119.125,125.065L119.125,125.065z M134.428,134.484h15.401v-2.115h-12.956v-21.02h-2.445V134.484L134.428,134.484z M156.34,132.369v-8.593h11.964v-2.082H156.34v-8.23h13.418v-2.115h-15.864v23.135h16.36v-2.115H156.34L156.34,132.369z M180.499,134.484h2.446v-21.02h8.13v-2.115h-18.706v2.115h8.13V134.484z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="white" d="M53.219,174.012c8.967,0,13.315-4.483,13.315-9.721c0-11.522-18.247-7.524-18.247-13.315c0-1.98,1.659-3.595,5.963-3.595c2.779,0,5.783,0.808,8.697,2.466l2.242-5.515c-2.914-1.838-6.949-2.779-10.895-2.779c-8.921,0-13.226,4.438-13.226,9.781c0,11.656,18.247,7.621,18.247,13.494c0,1.921-1.749,3.355-6.052,3.355c-3.766,0-7.711-1.345-10.356-3.265l-2.466,5.462C43.221,172.532,48.243,174.012,53.219,174.012z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="white" d="M85.096,142.091H71.512v31.383h7.263v-8.652h6.322c8.384,0,13.629-4.349,13.629-11.343C98.725,146.439,93.48,142.091,85.096,142.091L85.096,142.091z M84.693,158.903h-5.918v-10.895h5.918c4.438,0,6.68,2.018,6.68,5.47C91.373,156.886,89.131,158.903,84.693,158.903z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M131.446,173.474l-15.728-35.791c-5.01,12.098-10.242,23.854-15.565,35.791h7.302c2.779-6.692,4.257-10.175,8.263-19.848c4.914,11.861,4.978,12.006,8.22,19.848H131.446z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="white" d="M164.452,173.474l-7.039-10.087c4.08-1.749,6.456-5.201,6.456-9.908c0-7.039-5.245-11.388-13.629-11.388h-13.585v31.383h7.264v-8.742h6.321h0.358l6.053,8.742H164.452L164.452,173.474z M156.517,153.479c0,3.407-2.241,5.47-6.68,5.47h-5.918v-10.939h5.918C154.275,148.009,156.517,150.026,156.517,153.479z"/><polygon fill-rule="evenodd" clip-rule="evenodd" fill="white" points="191.084,173.474 199.558,173.474 185.793,156.079 198.795,142.091 190.726,142.091 176.827,156.751 176.827,142.091 169.608,142.091 169.608,173.474 176.827,173.474 176.827,165.539 181.041,161.145"/><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M115.241,66.009l1.697-0.021c0.736-0.009,1.371,0.457,1.351,1.033l-0.641,16.852c-0.021,0.575-0.592,1.057-1.325,1.065l-0.142,0.002c-0.733,0.009-1.32-0.455-1.351-1.032l-0.915-16.833C113.886,66.498,114.505,66.019,115.241,66.009z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M85.327,74.879l1.459-0.867c0.633-0.376,1.416-0.291,1.686,0.219l7.872,14.915c0.27,0.508,0.016,1.211-0.614,1.585l-0.123,0.073c-0.63,0.374-1.371,0.266-1.686-0.219l-9.208-14.121C84.397,75.979,84.693,75.254,85.327,74.879z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M63.854,97.517l0.831-1.48c0.36-0.643,1.081-0.959,1.569-0.654l14.274,8.981c0.488,0.306,0.619,1.041,0.26,1.68l-0.07,0.124c-0.358,0.639-1.054,0.916-1.569,0.653l-15.035-7.625C63.6,98.935,63.495,98.159,63.854,97.517z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M101.912,76.338l1.634-0.459c0.709-0.199,1.524,0.201,1.65,0.926l1.375,8.024c0.125,0.724-0.219,1.451-0.926,1.649l-0.137,0.039c-0.707,0.199-1.391-0.236-1.65-0.925l-2.873-7.604C100.727,77.298,101.203,76.538,101.912,76.338z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M78.948,90.489l1.185-1.215c0.514-0.527,1.42-0.588,1.892-0.023l5.203,6.262c0.471,0.564,0.536,1.366,0.023,1.892l-0.099,0.102c-0.513,0.526-1.323,0.492-1.892,0.023l-6.289-5.148C78.402,91.912,78.433,91.016,78.948,90.489z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M146.879,74.879l-1.459-0.867c-0.634-0.376-1.416-0.291-1.686,0.219l-7.872,14.915c-0.27,0.508-0.016,1.211,0.615,1.585l0.122,0.073c0.63,0.374,1.371,0.266,1.686-0.219l9.209-14.121C147.809,75.979,147.513,75.254,146.879,74.879z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M168.352,97.517l-0.831-1.48c-0.36-0.643-1.081-0.959-1.569-0.654l-14.274,8.981c-0.487,0.306-0.618,1.041-0.26,1.68l0.069,0.124c0.358,0.639,1.055,0.916,1.569,0.653l15.035-7.625C168.605,98.935,168.712,98.159,168.352,97.517z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M130.294,76.338l-1.634-0.459c-0.709-0.199-1.524,0.201-1.649,0.926l-1.376,8.024c-0.125,0.724,0.219,1.451,0.926,1.649l0.138,0.039c0.706,0.199,1.391-0.236,1.649-0.925l2.872-7.604C131.479,77.298,131.003,76.538,130.294,76.338z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#B3A14A" d="M153.259,90.489l-1.186-1.215c-0.515-0.527-1.42-0.588-1.892-0.023l-5.203,6.262c-0.471,0.564-0.536,1.366-0.023,1.892l0.1,0.102c0.513,0.526,1.322,0.492,1.892,0.023l6.289-5.148C153.805,91.912,153.772,91.016,153.259,90.489z"/></g></g></svg></div>
      <h1 class="hero-title">Organizational Health<br>Assessment</h1>
      <p class="hero-sub">This assessment helps us understand the systems and processes that shape how your organization operates. Your responses will guide our work together.</p>
    </div>

    <div class="progress-bar-wrap">
      <span class="progress-label">Your progress</span>
      <div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
      <span class="progress-pct" id="progress-pct">0%</span>
    </div>
    <div class="session-bar" id="session-bar" style="display:none">
      <div class="session-bar-left"><span>🔗 Your save link — bookmark this to return later:</span></div>
      <div class="session-link-box">
        <span class="session-link-text" id="session-link-text"></span>
        <button class="session-copy-btn" onclick="copySessionLink()">Copy link</button>
      </div>
      <span class="session-save-indicator" id="save-indicator">Auto-saving…</span>
    </div>

    <div class="form-container">
      <div class="form-pages-wrapper" id="form-pages-wrapper">

      <!-- PAGE 0: INSTRUCTIONS + ORG INFO -->
      <div class="form-page active" id="form-page-0">
      <div class="org-info-card" style="border-left:4px solid var(--brand);background:var(--warm-white)">
        <div class="card-title" style="margin-bottom:20px">How to complete this assessment</div>
        <p style="font-size:0.9rem;color:var(--mid);line-height:1.65;margin-bottom:20px">This assessment helps your Scarlet Spark consulting team understand how your organization currently operates. There are no right or wrong answers — we're looking for an honest picture of where things stand today, not where you'd like them to be.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="background:white;border-radius:10px;padding:18px 20px;border:1px solid var(--border)">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--brand);margin-bottom:10px">Scoring</div>
            <div style="font-size:0.85rem;color:var(--mid);line-height:1.7">For each item, select the score that best reflects your current reality:
              <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
                <div><span style="font-weight:600;color:var(--charcoal)">0 — Not in place:</span> This doesn't exist yet</div>
                <div><span style="font-weight:600;color:var(--charcoal)">1 — Needs improvement:</span> Something exists but it's incomplete, inconsistent, or not working well</div>
                <div><span style="font-weight:600;color:var(--charcoal)">2 — Good enough for now:</span> This is in place and working reasonably well for your current stage</div>
                <div><span style="font-weight:600;color:var(--charcoal)">3 — Great:</span> This is solid and you'd not change it right now</div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="background:white;border-radius:10px;padding:18px 20px;border:1px solid var(--border)">
              <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--brand);margin-bottom:8px">Your responses</div>
              <div style="font-size:0.85rem;color:var(--mid);line-height:1.65">Share a brief description of what you currently have in place — or why something isn't in place yet.</div>
            </div>
            <div style="background:white;border-radius:10px;padding:18px 20px;border:1px solid var(--border)">
              <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--brand);margin-bottom:8px">Documentation</div>
              <div style="font-size:0.85rem;color:var(--mid);line-height:1.65">For each item, please share a link to the relevant document. Upload to Google Drive or Dropbox, set sharing to <strong style="color:var(--charcoal)">"Anyone with the link can view"</strong>, then paste the link.</div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
          <div style="background:var(--brand-pale);border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:1.1rem">🔗</span>
            <div>
              <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--brand);margin-bottom:4px">Save &amp; return</div>
              <div style="font-size:0.85rem;color:var(--mid);line-height:1.55">Your progress saves automatically. A save link will appear at the top — bookmark it to return later.</div>
            </div>
          </div>
          <div style="background:var(--brand-pale);border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:1.1rem">🔒</span>
            <div>
              <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--brand);margin-bottom:4px">Confidentiality</div>
              <div style="font-size:0.85rem;color:var(--mid);line-height:1.55">Your responses are shared only with the Scarlet Spark team.</div>
            </div>
          </div>
          <div style="background:var(--brand-pale);border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:1.1rem">📬</span>
            <div>
              <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--brand);margin-bottom:4px">What happens next</div>
              <div style="font-size:0.85rem;color:var(--mid);line-height:1.55">Once you submit, your consulting team will review your responses within 7 days.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="org-info-card">
        <div class="card-title">About Your Organization</div>
        <div class="form-grid">
          <div class="form-group"><label>Organization Name</label><input type="text" id="org-name" placeholder="e.g. Effective Animal Advocacy"></div>
          <div class="form-group"><label>Primary Contact</label><input type="text" id="contact-name" placeholder="Your name"></div>
          <div class="form-group"><label>Role / Title</label><input type="text" id="contact-role" placeholder="e.g. Executive Director"></div>
          <div class="form-group"><label>Email</label><input type="email" id="contact-email" placeholder="you@org.org"></div>
          <div class="form-group full"><label>Organization Stage</label>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:4px" id="stage-cards">
              <div class="stage-card" id="sc-launch" onclick="selectStageCard('launch')">
                <div style="font-size:2rem;margin-bottom:8px">🌱</div>
                <div class="stage-card-name">Launch</div>
                <div class="stage-card-desc">Determining direction and ways of working — before or during the earliest startup phase. Typically a founding team of 1–3.</div>
              </div>
              <div class="stage-card" id="sc-first-hire" onclick="selectStageCard('first-hire')">
                <div style="font-size:2rem;margin-bottom:8px">🌿</div>
                <div class="stage-card-name">First Hire</div>
                <div class="stage-card-desc">Ready to expand beyond the founder or founding team for the first time. Often around 2–8 people.</div>
              </div>
              <div class="stage-card" id="sc-growth" onclick="selectStageCard('growth')">
                <div style="font-size:2rem;margin-bottom:8px">🌳</div>
                <div class="stage-card-name">Growth</div>
                <div class="stage-card-desc">Preparing for ongoing growth in team members and/or the communities you serve. Often 8 or more people.</div>
              </div>
            </div>
            <input type="hidden" id="org-stage" value="">
          </div>
        </div>
      </div>

      <div class="page-nav" style="border-top:none;padding-top:0;margin-top:24px">
        <div></div>
        <button class="btn-primary" onclick="goToPage(1, 'forward')" style="padding:12px 32px">Begin Assessment →</button>
      </div>
      </div><!-- end page-0 -->

      <div id="driver-pages"></div>

      <!-- FINAL PAGE -->
      <div class="form-page" id="form-page-final">
      <div class="upload-section">
        <div class="card-title" style="margin-bottom:8px">Anything else?</div>
        <div class="card-desc">Use this space to share any additional context, reflections, or information that didn't fit elsewhere.</div>
        <div class="item-field-label">Additional notes</div>
        <textarea class="item-textarea" style="min-height:120px;margin-bottom:20px" placeholder="Share any final thoughts, context, or anything else you'd like your consulting team to know…" onchange="state.finalNotes=this.value"></textarea>
        <div class="item-field-label">Additional links</div>
        <div id="extra-links">
          <div class="item-doc-row" style="margin-bottom:8px">
            <input type="text" class="item-link-input" placeholder="Paste a link (e.g. Google Drive, Notion, website…)" onchange="updateExtraLink(this)">
          </div>
        </div>
        <button onclick="addExtraLink()" style="background:none;border:none;font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:600;color:var(--brand);cursor:pointer;padding:0;margin-bottom:20px">+ Add another link</button>
      </div>
      <div class="page-nav">
        <button class="btn-back" onclick="goToPage(ORG_SYSTEMS.length, 'back')">← Back</button>
        <span class="page-nav-section">Final step</span>
      </div>
      <div class="submit-section">
        <div class="submit-error" id="submit-error"></div>
        <button class="btn-primary" onclick="submitAssessment()">Submit Assessment →</button>
        <p style="margin-top:16px;font-size:0.82rem;color:var(--light)">Your responses are shared only with your Scarlet Spark consulting team.</p>
      </div>
      </div><!-- end form-page-final -->
      </div><!-- end form-pages-wrapper -->
    </div>
  </div>

  <div class="success-screen" id="success-screen">
    <div class="success-icon">🌱</div>
    <h2 class="success-title">Thank you for completing<br>your assessment</h2>
    <p class="success-sub">Your responses have been received. Your Scarlet Spark consulting team will review everything and be in touch to schedule your debrief session.</p>
    <br>
    <button class="btn-primary" onclick="showPrintSummary()" style="margin-bottom:12px">Download a copy of your responses →</button>
  </div>

  <div id="print-summary" style="display:none">
    <div class="print-summary-bar">
      <span style="font-weight:600;font-size:0.95rem">Your response summary</span>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" onclick="window.print()" style="font-size:0.85rem;padding:8px 18px">🖨 Print / Save as PDF</button>
        <button class="btn-secondary" onclick="hidePrintSummary()" style="font-size:0.85rem;padding:8px 18px">✕ Close</button>
      </div>
    </div>
    <div id="print-summary-content" class="print-summary-content"></div>
  </div>
</div>

<!-- CONSULTANT VIEW -->
<div id="view-consultant" class="view">
  <div class="consultant-layout">
    <div class="consultant-sidebar">
      <div style="display:flex;align-items:center;gap:10px;padding:0 12px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1)"><svg width="36" height="36" viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#cl3)"><path fill-rule="evenodd" clip-rule="evenodd" d="M460.637 521.329L365.316 295.62C334.952 371.914 303.243 446.051 270.983 521.329H315.237C332.08 479.128 341.037 457.163 365.316 396.162C395.098 470.961 395.486 471.875 415.134 521.329H460.637Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M359.304 127.383L367.832 127.273C371.531 127.226 374.722 129.663 374.622 132.675L371.4 220.797C371.295 223.803 368.425 226.324 364.742 226.366L364.028 226.376C360.344 226.423 357.394 223.997 357.239 220.98L352.64 132.957C352.495 129.94 355.605 127.435 359.304 127.383Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M208.975 173.766L216.307 169.232C219.488 167.266 223.423 167.711 224.78 170.378L264.34 248.37C265.697 251.027 264.42 254.703 261.254 256.658L260.636 257.04C257.47 258.996 253.746 258.431 252.163 255.895L205.889 182.054C204.301 179.518 205.789 175.727 208.975 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M101.063 292.143L105.24 284.404C107.049 281.042 110.672 279.389 113.124 280.984L184.857 327.947C187.31 329.547 187.968 333.391 186.164 336.732L185.812 337.38C184.013 340.722 180.515 342.17 177.927 340.795L102.37 300.923C99.787 299.558 99.2594 295.5 101.063 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M292.32 181.395L300.531 178.995C304.094 177.955 308.19 180.046 308.823 183.837L315.733 225.796C316.361 229.582 314.633 233.383 311.08 234.419L310.391 234.623C306.838 235.663 303.401 233.389 302.099 229.786L287.661 190.023C286.365 186.415 288.757 182.441 292.32 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M176.917 255.393L182.872 249.039C185.455 246.284 190.008 245.965 192.38 248.919L218.528 281.664C220.895 284.613 221.221 288.807 218.643 291.557L218.146 292.091C215.568 294.841 211.497 294.664 208.638 292.211L177.033 265.292C174.173 262.834 174.329 258.149 176.917 255.393Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M518.299 173.766L510.967 169.232C507.781 167.266 503.851 167.711 502.494 170.378L462.934 248.37C461.577 251.027 462.854 254.703 466.025 256.658L466.638 257.04C469.804 258.996 473.528 258.431 475.111 255.895L521.39 182.054C522.973 179.518 521.485 175.727 518.299 173.766Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M626.209 292.143L622.033 284.404C620.224 281.042 616.6 279.389 614.148 280.984L542.415 327.947C539.968 329.547 539.31 333.391 541.109 336.732L541.455 337.38C543.255 340.722 546.757 342.17 549.34 340.795L624.897 300.923C627.48 299.558 628.018 295.5 626.209 292.143Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M434.951 181.395L426.74 178.995C423.177 177.955 419.081 180.046 418.453 183.837L411.538 225.796C410.91 229.582 412.638 233.383 416.191 234.419L416.885 234.623C420.433 235.663 423.875 233.389 425.172 229.786L439.605 190.023C440.906 186.415 438.514 182.441 434.951 181.395Z" fill="#B3A14A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M550.359 255.393L544.399 249.039C541.811 246.284 537.263 245.965 534.891 248.919L508.744 281.664C506.377 284.613 506.05 288.807 508.628 291.557L509.131 292.091C511.709 294.841 515.775 294.664 518.639 292.211L550.244 265.292C553.103 262.834 552.937 258.149 550.359 255.393Z" fill="#B3A14A"/></g><defs><clipPath id="cl3"><rect width="700" height="700" fill="white"/></clipPath></defs></svg><span style="font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.9)">Scarlet Spark</span></div>
      <div class="sidebar-section-label">Load Submission</div>
      <div style="padding:0 12px;margin-bottom:16px">
        <button onclick="loadSubmissionsList()" id="load-btn" style="width:100%;background:var(--brand);color:white;border:none;padding:10px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;text-align:left;display:flex;align-items:center;gap:8px">
          <span>⬇</span> Load from Airtable
        </button>
        <div id="submissions-list" style="display:none;margin-top:8px;background:rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;max-height:220px;overflow-y:auto"></div>
        <div id="load-status" style="font-size:0.78rem;color:var(--light);margin-top:6px;text-align:center"></div>
      </div>
      <div class="sidebar-section-label">Navigation</div>
      <div class="sidebar-item active" onclick="showConsultantPanel('overview', event)">📊 Overview</div>
      <div class="sidebar-item" onclick="showConsultantPanel('ai-analysis', event)">🤖 AI Analysis</div>
      <div class="sidebar-item" onclick="showConsultantPanel('systems', event)">⚙️ Org Systems</div>
      <div class="sidebar-item" onclick="showConsultantPanel('documents', event)">📁 Documents</div>
    </div>

    <div class="consultant-main">
      <!-- OVERVIEW PANEL -->
      <div id="panel-overview" class="consultant-panel">
        <div class="consultant-header">
          <div class="consultant-eyebrow">Org Health Assessment · Pre-Analysis</div>
          <h1 class="consultant-title" id="c-org-name">Awaiting Submission</h1>
          <div class="consultant-meta" id="c-org-meta">No assessment data yet. Ask the client to complete the form.</div>
          <div style="margin-top:16px;padding:16px 20px;background:var(--brand-pale);border-radius:10px;border:1px solid var(--border);display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--brand);white-space:nowrap">Reviewed by</label>
              <input type="text" id="consultant-name" placeholder="Your name" style="border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:0.88rem;outline:none;background:white;min-width:180px" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border)'" oninput="updateConsultantMeta()">
            </div>
            <div id="review-timestamp" style="font-size:0.82rem;color:var(--mid)"></div>
          </div>
        </div>
        <div class="metric-grid">
          <div class="metric-card" id="m-completion"><div class="metric-label">Completion</div><div class="metric-value">—</div><div class="metric-sub">of scored items</div></div>
          <div class="metric-card" id="m-avg-score"><div class="metric-label">Avg Self-Score</div><div class="metric-value">—</div><div class="metric-sub">out of 3.0</div></div>
          <div class="metric-card" id="m-gaps"><div class="metric-label">Priority Gaps</div><div class="metric-value">—</div><div class="metric-sub">items scored 0 or 1</div></div>
        </div>
        <div class="analysis-panel">
          <div class="analysis-panel-header"><div class="analysis-panel-title">Driver Score Overview</div></div>
          <div class="analysis-panel-body" id="driver-score-bars"><div style="color:var(--light);font-size:0.9rem;">No assessment data yet.</div></div>
        </div>
        <div class="analysis-panel">
          <div class="analysis-panel-header"><div class="analysis-panel-title">Org Stage</div></div>
          <div class="analysis-panel-body" id="stage-context"><div style="color:var(--light);font-size:0.9rem;">No submission yet.</div></div>
        </div>
      </div>

      <!-- AI ANALYSIS PANEL -->
      <div id="panel-ai-analysis" class="consultant-panel" style="display:none">
        <div class="consultant-header">
          <div class="consultant-eyebrow">AI-Powered Analysis</div>
          <h1 class="consultant-title">Claude Analysis</h1>
          <div class="consultant-meta">Ask Claude to analyze the assessment data and surface key insights before your consulting engagement.</div>
        </div>
        <div class="analysis-panel">
          <div class="analysis-panel-header"><div class="analysis-panel-title">Suggested Prompts</div></div>
          <div class="analysis-panel-body">
            <div class="suggest-chips" id="suggest-chips">
              <span class="chip" onclick="useSuggest(this)">Summarize key strengths and gaps</span>
              <span class="chip" onclick="useSuggest(this)">What are the top 3 priority areas to address?</span>
              <span class="chip" onclick="useSuggest(this)">Compare self-scores to stage expectations</span>
              <span class="chip" onclick="useSuggest(this)">Identify patterns in team sentiment</span>
              <span class="chip" onclick="useSuggest(this)">What are the most important areas to prioritize?</span>
              <span class="chip" onclick="useSuggest(this)">Draft a pre-visit hypothesis</span>
              <span class="chip" onclick="useSuggest(this)">Highlight safety & fairness risks</span>
            </div>
            <div class="ai-thread" id="ai-thread"></div>
            <div class="ai-input-row">
              <input type="text" id="ai-input" placeholder="Ask Claude about this assessment…" onkeydown="if(event.key==='Enter') sendAIMessage()">
              <button class="ai-send" id="ai-send-btn" onclick="sendAIMessage()">Send</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SYSTEMS PANEL -->
      <div id="panel-systems" class="consultant-panel" style="display:none">
        <div class="consultant-header">
          <div class="consultant-eyebrow">Org Systems</div>
          <h1 class="consultant-title">Systems & Process Review</h1>
          <div class="consultant-meta" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <span>Client self-scores alongside your Scarlet Spark assessment. Click 0–3 to score each item.</span>
            <button id="save-consultant-btn" onclick="saveConsultantScores()" style="background:var(--brand);color:white;border:none;padding:9px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap">Save scores</button>
          </div>
        </div>
        <div id="systems-consultant-view"></div>
      </div>

      <!-- DOCUMENTS PANEL -->
      <div id="panel-documents" class="consultant-panel" style="display:none">
        <div class="consultant-header">
          <div class="consultant-eyebrow">Uploaded Documents</div>
          <h1 class="consultant-title">Documentation</h1>
          <div class="consultant-meta">Files and links submitted by the client organization.</div>
        </div>
        <div class="analysis-panel">
          <div class="analysis-panel-header"><div class="analysis-panel-title">Uploaded Files</div></div>
          <div class="analysis-panel-body">
            <div class="doc-list" id="docs-consultant-view"><div style="color:var(--light);font-size:0.9rem;">No documents uploaded yet.</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// ═══════════════ DATA ═══════════════
const ORG_SYSTEMS = [
  { driver: "Goal Clarity", desc: "At any given time, does everyone know what we are trying to achieve, how, and why?", url: "https://scarletspark.thinkific.com/collections/strategy-goal-clarity", items: [
    { name: "Mission & vision", desc: "Do we have a clear and shared mission and vision that articulates what we want to achieve and why?", stages: ["Launch","First Hire","Growth"] },
    { name: "Strategy & theory of change", desc: "Do we have a clear strategy and theory of change that explains how we will achieve our vision?", stages: ["Launch","First Hire","Growth"] },
    { name: "Impact measurement", desc: "Do we have a way to measure our progress toward our vision?", stages: ["Launch","First Hire","Growth"] },
    { name: "Strategic planning & goal-setting process", desc: "Do we have a strategic planning and goal-setting process that helps us choose, communicate, and measure our focus?", stages: ["Launch","First Hire","Growth"] },
  ]},
  { driver: "Role Clarity", desc: "At any given time, does everyone understand what they are seeking to achieve and why, who to go to for what, and how decisions are made?", url: "https://scarletspark.thinkific.com/collections/role-clarity", items: [
    { name: "Role and/or project descriptions", desc: "Do we have clear expectations for each role and/or project?", stages: ["Launch","First Hire","Growth"] },
    { name: "Decision-making authority & process", desc: "Do we have explicit decision-making rights and responsibilities?", stages: ["Launch","First Hire","Growth"] },
    { name: "Role and/or project success metrics", desc: "Do we have clearly defined success metrics for each role or project?", stages: ["First Hire","Growth"] },
    { name: "Board clarity", desc: "Do we have a clear board purpose and explicit board member expectations?", stages: ["Growth"] },
    { name: "Roles & responsibilities directory", desc: "Do we have a system to determine who to go to for what?", stages: ["Growth"] },
  ]},
  { driver: "Safety & Fairness", desc: "At any given time, does everyone experience a sense of safety, respect, and fairness?", url: "https://scarletspark.thinkific.com/collections/safety-fairness", items: [
    { name: "Policies to prevent harassment, discrimination & retaliation", desc: "Do we have documented policies that set expectations on unacceptable behaviors?", stages: ["Launch","First Hire","Growth"] },
    { name: "2+ decision makers for high-stakes decisions", desc: "Do we have two or more decision makers for high-stakes decisions to minimize bias?", stages: ["First Hire","Growth"] },
    { name: "Escalation process", desc: "Do we have a clear and user-friendly escalation process for flagging safety and fairness concerns?", stages: ["Launch","First Hire","Growth"] },
    { name: "Strategy to enable inclusion on the team", desc: "Do we have a strategy to make sure all team members can participate to the best of their ability?", stages: ["First Hire","Growth"] },
    { name: "Compensation formula (if relevant)", desc: "Do we have an explicit, consistent, and fair compensation formula?", stages: ["First Hire","Growth"] },
    { name: "Termination process", desc: "Do we have an explicit, consistent, and fair termination process?", stages: ["First Hire","Growth"] },
    { name: "Independent board and/or a system to minimize conflict of interest", desc: "Do we have an independent board and/or a documented process to minimize conflicts of interest?", stages: ["Growth"] },
  ]},
  { driver: "Feedback & Learning", desc: "Are we regularly learning, growing, and improving on an individual, team, and org-wide level?", url: "https://scarletspark.thinkific.com/collections/feedback-learning", items: [
    { name: "Goal-tracking process", desc: "Do we have a goal-tracking process to monitor whether individuals, teams, and the org as a whole are achieving their goals?", stages: ["Launch","First Hire","Growth"] },
    { name: "Feedback norms & nudges", desc: "Do we have feedback norms and nudges that encourage regular feedback conversations?", stages: ["Launch","First Hire","Growth"] },
    { name: "Retrospectives", desc: "Do we hold regular retrospectives to review how well we are collaborating?", stages: ["Launch","First Hire","Growth"] },
    { name: "Performance assessments", desc: "Do we have a performance assessment process to evaluate whether individuals are meeting expectations?", stages: ["First Hire","Growth"] },
    { name: "Engagement survey & action process", desc: "Do we have an engagement survey and action process to regularly assess team member engagement?", stages: ["First Hire","Growth"] },
    { name: "Individual development plans", desc: "Do we have individual development plans with a clear process and cadence for supporting team member growth?", stages: ["Growth"] },
    { name: "Turnover tracking", desc: "Do we have a turnover tracking process that measures why team members leave?", stages: ["Growth"] },
    { name: "Innovation & experimentation", desc: "Do we have ways to encourage innovation and experimentation?", stages: ["Growth"] },
    { name: "Process to get team input on strategic decisions", desc: "Do we have a process for getting team input on strategic decisions?", stages: ["Growth"] },
  ]},
  { driver: "Leadership", desc: "Are our leaders regularly growing the capacity of their team and our org?", url: "https://scarletspark.thinkific.com/collections/leadership-management", items: [
    { name: "Leader & manager role clarity", desc: "Do we have clear role clarity for leaders and managers?", stages: ["Growth"] },
    { name: "Access to leaders", desc: "Do we have a system that gives team members access to leaders?", stages: ["Growth"] },
    { name: "Leader & manager assessment", desc: "Do we have a leader and manager assessment process?", stages: ["Growth"] },
    { name: "Assessment of ED", desc: "Do we have an independent process to assess the ED's performance?", stages: ["Growth"] },
    { name: "Leadership development", desc: "Do we have a leadership development process that helps leaders increase their effectiveness?", stages: ["Growth"] },
    { name: "Leadership team structure (if relevant)", desc: "Do we have a clear leadership team structure with a process and cadence for operating well together?", stages: ["Growth"] },
  ]},
  { driver: "Collaboration & Communication", desc: "Do we work well together across the org?", url: "https://scarletspark.thinkific.com/collections/collaboration", items: [
    { name: "Org values", desc: "Do we have clearly articulated org values that guide how team members work together?", stages: ["First Hire","Growth"] },
    { name: "Org norms or ways of working", desc: "Do we have explicit org norms or ways of working that set expectations for team member behavior?", stages: ["Launch","First Hire","Growth"] },
    { name: "Cadence and system of information sharing", desc: "Do we have a clear cadence and system for sharing important information across the org?", stages: ["Growth"] },
    { name: "Org design that enables cross-team collaboration", desc: "Do we have an org design that enables cross-team collaboration?", stages: ["Growth"] },
    { name: "System for 1-1 relationships", desc: "Do we have a system for building and maintaining 1-1 relationships across the org?", stages: ["Growth"] },
    { name: "System for org-wide relationships", desc: "Do we have a system for building and maintaining org-wide relationships?", stages: ["Growth"] },
  ]},
  { driver: "Stability", desc: "Are we ready to weather unexpected changes within and outside our org?", url: "https://scarletspark.thinkific.com/collections/stability", items: [
    { name: "Coverage plans", desc: "Do we have coverage plans that minimize risk if someone is out?", stages: ["First Hire","Growth"] },
    { name: "Succession plans", desc: "Do we have succession plans that minimize risk if a key person leaves?", stages: ["First Hire","Growth"] },
    { name: "Capacity", desc: "Do we have a way to monitor and manage team capacity?", stages: ["First Hire","Growth"] },
    { name: "Single source of truth for key information", desc: "Do we have a single source of truth — a clear, user-friendly place where team members can find key policies?", stages: ["Launch","First Hire","Growth"] },
    { name: "Strategy for expanding team diversity", desc: "Do we have a strategy for deliberately expanding the diversity of our team?", stages: ["First Hire","Growth"] },
  ]},
  { driver: "Scalability", desc: "Are we ready to repeatedly expand the size of our team and/or impact efficiently and reliably?", url: "https://scarletspark.thinkific.com/collections/scalability", items: [
    { name: "Individualized support system", desc: "Do we have an individualized support system that makes sure team members don't slip through the cracks?", stages: ["First Hire","Growth"] },
    { name: "Weekly or bi-weekly 1-on-1s", desc: "Do we have a regular cadence and format for 1-on-1 check-ins between managers and their team members?", stages: ["First Hire","Growth"] },
    { name: "Hiring process", desc: "Do we have a standardized, efficient, and fair hiring process?", stages: ["Growth"] },
    { name: "Onboarding process", desc: "Do we have a standardized onboarding process that sets new team members up for success?", stages: ["Growth"] },
  ]},
];

const STAGE_DEFS = {
  'launch':     { name: 'Launch',     headcount: '1–3 people',  desc: 'Your organization is determining its direction and ways of working. The priority here is establishing foundational systems that give your team clarity and safety from day one.' },
  'first-hire': { name: 'First Hire', headcount: '2–8 people',  desc: 'Your organization is ready to expand beyond its founder or founding team. This stage is about putting systems in place that make it possible to bring others in effectively.' },
  'growth':     { name: 'Growth',     headcount: '8+ people',   desc: 'Your organization is preparing for ongoing growth. The focus shifts to building more robust, scalable systems that can hold up as complexity increases.' },
};

// ═══════════════ FIELD MAPS (shared) ═══════════════
const SCORE_FIELD_MAP = {
  'Goal Clarity|Mission & vision':'score_mission_vision','Goal Clarity|Strategy & theory of change':'score_strategy_theory',
  'Goal Clarity|Impact measurement':'score_impact_measurement','Goal Clarity|Strategic planning & goal-setting process':'score_strategic_planning',
  'Role Clarity|Role and/or project descriptions':'score_role_descriptions','Role Clarity|Decision-making authority & process':'score_decision_making',
  'Role Clarity|Role and/or project success metrics':'score_success_metrics','Role Clarity|Board clarity':'score_board_clarity',
  'Role Clarity|Roles & responsibilities directory':'score_responsibilities_directory',
  'Safety & Fairness|Policies to prevent harassment, discrimination & retaliation':'score_harassment_policies',
  'Safety & Fairness|2+ decision makers for high-stakes decisions':'score_high_stakes_decisions',
  'Safety & Fairness|Escalation process':'score_escalation','Safety & Fairness|Strategy to enable inclusion on the team':'score_inclusion',
  'Safety & Fairness|Compensation formula (if relevant)':'score_compensation','Safety & Fairness|Termination process':'score_termination',
  'Safety & Fairness|Independent board and/or a system to minimize conflict of interest':'score_conflict_of_interest',
  'Feedback & Learning|Goal-tracking process':'score_goal_tracking','Feedback & Learning|Feedback norms & nudges':'score_feedback_norms',
  'Feedback & Learning|Retrospectives':'score_retrospectives','Feedback & Learning|Performance assessments':'score_performance_assessments',
  'Feedback & Learning|Engagement survey & action process':'score_engagement_survey','Feedback & Learning|Individual development plans':'score_development_plans',
  'Feedback & Learning|Turnover tracking':'score_turnover_tracking','Feedback & Learning|Innovation & experimentation':'score_innovation',
  'Feedback & Learning|Process to get team input on strategic decisions':'score_team_input',
  'Leadership|Leader & manager role clarity':'score_leader_role_clarity','Leadership|Access to leaders':'score_access_to_leaders',
  'Leadership|Leader & manager assessment':'score_leader_assessment','Leadership|Assessment of ED':'score_ed_assessment',
  'Leadership|Leadership development':'score_leadership_development','Leadership|Leadership team structure (if relevant)':'score_leadership_structure',
  'Collaboration & Communication|Org values':'score_org_values','Collaboration & Communication|Org norms or ways of working':'score_org_norms',
  'Collaboration & Communication|Cadence and system of information sharing':'score_info_sharing',
  'Collaboration & Communication|Org design that enables cross-team collaboration':'score_org_design',
  'Collaboration & Communication|System for 1-1 relationships':'score_oneonone_relationships',
  'Collaboration & Communication|System for org-wide relationships':'score_orgwide_relationships',
  'Stability|Coverage plans':'score_coverage_plans','Stability|Succession plans':'score_succession_plans',
  'Stability|Capacity':'score_capacity','Stability|Single source of truth for key information':'score_single_source',
  'Stability|Strategy for expanding team diversity':'score_team_diversity',
  'Scalability|Individualized support system':'score_individualized_support','Scalability|Weekly or bi-weekly 1-on-1s':'score_oneononemeetings',
  'Scalability|Hiring process':'score_hiring_process','Scalability|Onboarding process':'score_onboarding',
};
const NOTES_FIELD_MAP = Object.fromEntries(Object.entries(SCORE_FIELD_MAP).map(([k,v])=>[k,v.replace('score_','notes_')]));
const LINKS_FIELD_MAP = Object.fromEntries(Object.entries(SCORE_FIELD_MAP).map(([k,v])=>[k,v.replace('score_','link_')]));
const CS_FIELD_MAP    = Object.fromEntries(Object.entries(SCORE_FIELD_MAP).map(([k,v])=>[k,v.replace('score_','cs_')]));
const CN_FIELD_MAP    = Object.fromEntries(Object.entries(SCORE_FIELD_MAP).map(([k,v])=>[k,v.replace('score_','cn_')]));

// Reverse maps (airtable field -> state key)
const REV_SCORE = Object.fromEntries(Object.entries(SCORE_FIELD_MAP).map(([k,v])=>[v,k]));
const REV_NOTES = Object.fromEntries(Object.entries(NOTES_FIELD_MAP).map(([k,v])=>[v,k]));
const REV_LINKS = Object.fromEntries(Object.entries(LINKS_FIELD_MAP).map(([k,v])=>[v,k]));
const REV_CS    = Object.fromEntries(Object.entries(CS_FIELD_MAP).map(([k,v])=>[v,k]));
const REV_CN    = Object.fromEntries(Object.entries(CN_FIELD_MAP).map(([k,v])=>[v,k]));

// ═══════════════ AIRTABLE CONFIG ═══════════════
const AIRTABLE_TOKEN = 'patZWhcK41OZGenaf.87a5e5e98427dca19c116157a0df4f1b77f8874edd7f40669bb615c581a52780';
const AIRTABLE_BASE  = 'appVVkmoE0yPNz6l5';
const AIRTABLE_TABLE = 'tblcKOT8xRFr0JXlA';

// ═══════════════ STATE ═══════════════
const state = { scores:{}, links:{}, notes:{}, finalNotes:'', extraLinks:[], submitted:false, orgInfo:{}, chatHistory:[] };
const consultantState = { scores:{}, notes:{}, recordId:null, reviewerName:'', reviewDate:'' };

let currentPage = 0;
let sessionId = null;
let saveTimeout = null;
let sessionRecordId = null;

// ═══════════════ HELPERS ═══════════════

// ═══════════════ SAMPLE ANSWER PLACEHOLDERS ═══════════════
const ITEM_PLACEHOLDERS = {
  "Goal Clarity|Mission & vision": "e.g. We have a one-page document that includes mission, vision, and values developed with the full team 3 years ago. We reference this document whenever we are onboarding new team members. See document linked below. There is more we could do to embed our values in our processes and decision-making.",
  "Goal Clarity|Strategy & theory of change": "e.g. We have a theory of change that maps our two core programs (direct policy advocacy and coalition building) to our long-term vision. It explains our assumptions about how legislative change happens and why we prioritise the interventions we do. We developed it a couple of years ago but haven't reviewed it since. See document linked below.",
  "Goal Clarity|Impact measurement": "e.g. We have metrics for our four program areas. All the metrics live in a shared document and are updated monthly by team leads. We review the metrics quarterly at our leadership meeting. But some team members express confusion about how their work supports our key metrics. See document linked below.",
  "Goal Clarity|Strategic planning & goal-setting process": "e.g. Every year during Q4 we run a week-long planning process involving the whole team. We do our best to also include the board, however there is often confusion about what role they should play in this process. We end up with a one-page strategic priorities document for the coming year, broken into quarterly milestones. In January, each team lead translates it into team-level goals, which we review quarterly to assess progress and adjust if needed.",
  "Role Clarity|Role and/or project descriptions": "e.g. Every role has a role description reviewed annually by the relevant line manager. Role descriptions include purpose, core activities, and outcomes. Some role descriptions also include authorities, some don't. For new hires, reviewing the role description is part of the onboarding process. See sample role descriptions linked below.",
  "Role Clarity|Decision-making authority & process": "e.g. We generally use the consent model to make decisions. We also have a one-page decision-making framework that sets out what each level of the organisation can decide independently, what requires consultation, and what requires sign-off from the ED or board. For example, heads of departments can make budget changes up to $10,000. The framework was developed only a few months ago and not everyone understands or uses it yet. See decision-making framework linked below.",
  "Role Clarity|Role and/or project success metrics": "e.g. Each role has 3–5 success metrics agreed to at the start of the year and reviewed quarterly. Project metrics are set at the start of the project in the project brief and tracked at monthly team meetings. See linked document.",
  "Role Clarity|Board clarity": "e.g. We didn't have anything other than what was included in our standard bylaws until about 6 months ago. When we updated the role descriptions for the team, we also developed board member role descriptions that set out the purpose of the role, core activities, outcomes and authorities. We tried to clearly distinguish between the board's governance and oversight role and the ED's operational role but there is still some blurriness. See board role description linked below.",
  "Role Clarity|Roles & responsibilities directory": "e.g. We have a one-page internal directory listing each team, what they are responsible for, and who to contact for common queries. It is pinned in our staff Slack channel and included in the onboarding pack, however a lot of people seem to forget about it. We also have an organizational chart showing reporting lines. See internal directory linked below.",
  "Safety & Fairness|Policies to prevent harassment, discrimination & retaliation": "e.g. Our staff handbook includes a code of conduct, an anti-harassment and bullying policy, and an escalation procedure. The code sets out specific behaviours we will not tolerate, with examples relevant to our context. The escalation procedure sets out the steps from informal conversation through to formal hearing and dismissal, with timelines at each stage. All staff read and sign the handbook on joining. See handbook linked below.",
  "Safety & Fairness|2+ decision makers for high-stakes decisions": "e.g. We have a written policy that any decision to dismiss, promote, or significantly change a staff member's role must involve at least two people: the relevant line manager and the ED. If we need a tie-breaker, we bring in a third staff member from outside the relevant team. For hiring, we generally involve three people (including at least one peer) in the process and use a scoring sheet to minimize bias. See section 7 in the handbook.",
  "Safety & Fairness|Escalation process": "e.g. We have a grievance procedure written in plain language covering both formal and informal routes in our staff handbook. It includes an explanation on how to raise issues directly with line managers and how to escalate them to the ED or the Board Chair via a form. The procedure is also explained during onboarding. See section 8 in the handbook.",
  "Safety & Fairness|Strategy to enable inclusion on the team": "e.g. We have our communication norms spelled out in our handbook. For meetings, we ask everyone to send out agendas at least 48 hours in advance, we rotate facilitators, and give people the option to offer input in writing before/after the meeting. We ask all new starters in their first week whether they have any access needs or working style preferences, and we act on these. See communication norms in section 4 of the handbook.",
  "Safety & Fairness|Compensation formula (if relevant)": "e.g. We have a pay framework with three bands tied to expertise, scope and complexity. Each band corresponds to a fixed amount and we don't allow negotiations. We offer cost of living adjustments every year (if budget allows) and offer the same benefits for all full-time staff. The pay and benefits framework is included in the handbook so everyone has access to it. See section 6 in the handbook.",
  "Safety & Fairness|Termination process": "e.g. Our termination process sets out each stage from informal conversation through to formal dismissal, with clear timelines and a right of appeal at every formal stage. It distinguishes between performance issues and misconduct and sets out different steps for each. We review it annually with an HR adviser. See section 10 in the handbook.",
  "Safety & Fairness|Independent board and/or a system to minimize conflict of interest": "e.g. Our board is fully independent. We have a conflicts of interest policy that all board members sign on joining and annually thereafter. The ED's salary is set by a committee of three board members without the ED present. The board assesses the ED's performance once a year using a process led by the Board Chair. See conflict of interest policy linked below.",
  "Feedback & Learning|Goal-tracking process": "e.g. We use a shared document to track progress against our organizational goals. Each month we update our metrics. Quarterly we have a retrospective meeting where we reflect on our progress and extract any learnings. The ED shares a summary of our progress quarterly with the board.",
  "Feedback & Learning|Feedback norms & nudges": "e.g. Our communication norms document outlines our approach to feedback: it should be timely, specific, and include an impact statement. Everyone takes a feedback skills workshop as part of onboarding and our 1-on-1 meeting template includes a feedback nudge. We also do yearly engagement surveys, which is an opportunity to assess our feedback culture.",
  "Feedback & Learning|Retrospectives": "e.g. Every team does a brief retrospective at the end of each quarter: what went well, what did not go well, and one thing we will do differently next quarter. We have a rotating note-taker to ensure key learnings and next steps are captured. We also run a retrospective after any major campaign or policy moment within two weeks of its conclusion.",
  "Feedback & Learning|Performance assessments": "e.g. We do a structured annual performance review for all staff using a standard template. It covers progress against agreed goals as well as our values and behaviours. The process is outlined in our staff handbook. See section 5 and template linked below.",
  "Feedback & Learning|Engagement survey & action process": "e.g. We run an engagement survey every six months. A summary of the results is shared with all staff within two weeks of closing. The leadership team identifies 2–3 commitments in response to each survey and reports back on progress quarterly. See survey from last year linked below.",
  "Feedback & Learning|Individual development plans": "e.g. Every staff member has a development plan agreed at their annual review and revisited regularly during 1-on-1s. Plans cover skills to develop, experience to gain, and any formal training being pursued. We have an annual training budget per person that staff can use flexibly. See template linked below.",
  "Feedback & Learning|Turnover tracking": "e.g. We conduct exit interviews with all departing staff using a consistent format covering reasons for leaving, what we could have done differently, and whether they would recommend us as a place to work. We track voluntary and involuntary turnover separately and share a summary with the board annually. See exit interview template linked below.",
  "Feedback & Learning|Innovation & experimentation": "e.g. Innovation is one of our core values. During our quarterly retrospective meetings, we dedicate time to an ideas session where staff can propose new approaches without needing a full plan. We celebrate experiments that did not work as much as ones that did, and track the number of experiments run and what we learned.",
  "Feedback & Learning|Process to get team input on strategic decisions": "e.g. We have two standing channels for staff input: an annual staff survey that feeds directly into our planning process, and monthly ED office hours any staff member can book. For significant one-off decisions we run a dedicated consultation process with a clear timeline and feedback loop.",
  "Leadership|Leader & manager role clarity": "e.g. We have written role descriptions for each level of leadership — team lead, senior manager, and ED — that set out the scope of the role, what decisions sit at that level, what the person is accountable for, and how success is measured. They are shared with all staff so everyone understands what to expect from leaders at each level. See document linked below.",
  "Leadership|Access to leaders": "e.g. The ED runs monthly open office hours — a dedicated slot any staff member can book directly, without going through their manager. We also create regular opportunities for staff and board members to connect informally, including inviting a rotating staff member to each board meeting. We ask about access to leadership in every engagement survey.",
  "Leadership|Leader & manager assessment": "e.g. We use a 360 feedback process for all managers annually — direct reports, peers, and the manager's own manager each provide structured input using a consistent set of questions. Results are shared with the manager during their annual review and used to shape their development plan. We also include questions about management quality in our engagement survey.",
  "Leadership|Assessment of ED": "e.g. The board conducts an annual ED performance review using objectives agreed at the start of the year. The review is led by the Chair and involves input from the full board and feedback from all staff. Outcomes feed into the ED's development plan.",
  "Leadership|Leadership development": "e.g. All new managers receive a structured onboarding to their management role, including sessions on giving feedback, running one-to-ones, and handling difficult conversations. The senior leadership team does a collective learning session quarterly on various topics, often with an external facilitator.",
  "Leadership|Leadership team structure (if relevant)": "e.g. The leadership team consists of one representative from each of our five departments. We meet monthly to review org-level challenges and priorities. At annual strategic planning, we take time to reflect on how we have been collaborating as a leadership team and make adjustments to our collaboration norms as needed.",
  "Collaboration & Communication|Org values": "e.g. We have five values. For each one we describe what it looks like in practice and what it doesn't look like, so the values are concrete and usable rather than just aspirational. The values are used in hiring, performance reviews, and how we give feedback to each other. See the full values document linked in the mission and vision section.",
  "Collaboration & Communication|Org norms or ways of working": "e.g. We cover ways of working in the communication norms section of our handbook, where we have spelled out which channel to use for what, expected response times, how we run meetings, how we make and record decisions, and how we handle disagreement. It was written collaboratively after a team retrospective identified communication as a friction point. All new starters receive it in their onboarding pack.",
  "Collaboration & Communication|Cadence and system of information sharing": "e.g. We send a quick weekly update every Monday covering key decisions made, priorities for the week, and anything staff need to know. Monthly all-staff meetings cover organisational updates and cross-team sharing. We have a clear channel structure — urgent matters in Slack, strategic updates via email, documents and policies in our shared Google Drive.",
  "Collaboration & Communication|Org design that enables cross-team collaboration": "e.g. Our policy, communications, and partnerships functions are structured as a single advocacy team with a shared quarterly plan, rather than separate departments with separate objectives. When we plan major advocacy moments we always include people from across the org in the design phase to prevent siloed working.",
  "Collaboration & Communication|System for 1-1 relationships": "e.g. We run a cross-team buddy program that pairs staff from different teams for three-month relationships. Pairs have a suggested conversation guide but are free to use their time as they choose. New starters are automatically paired with a buddy from outside their immediate team for their first three months.",
  "Collaboration & Communication|System for org-wide relationships": "e.g. As a fully remote organisation, we are intentional about creating connection across the team. We have a monthly all-staff meeting with a structured social segment, regular informal virtual touchpoints, and an annual in-person retreat focused on culture, relationships, and shared learning. We track sense of belonging in our engagement survey.",
  "Stability|Coverage plans": "e.g. We have a shared spreadsheet that outlines a coverage plan for every role, naming a primary and secondary cover person, listing the 3–5 critical tasks that must continue during an absence, and noting where to find relevant files and contacts. Coverage plans are reviewed annually by team leads. See coverage plan document linked below.",
  "Stability|Succession plans": "e.g. We have succession notes for the ED and all senior roles covering: what the role does that is not documented elsewhere, who internally could step up in an emergency, what they would need to develop, and what an external hiring process would look like. The board reviews ED succession annually. We have a deliberate policy of cross-training across pairs of roles.",
  "Stability|Capacity": "e.g. Team leads do a brief capacity check-in with each direct report at the start of every month — a simple red/amber/green on current workload and a note of anything coming up that might create pressure. These are aggregated and shared at our monthly leadership meeting. When a team is consistently amber or red we look at what can be moved, delayed, or resourced differently.",
  "Stability|Single source of truth for key information": "e.g. We have a shared Google Drive folder where everything lives. Most relevant documents are either included in their entirety in the staff handbook or linked there. Documents have a named owner, a last-reviewed date, and a next-review date. New starters are shown the shared drive during their first week.",
  "Stability|Strategy for expanding team diversity": "e.g. We have a deliberate strategy for expanding the diversity of our team, developed in line with employment law in our jurisdiction. This includes advertising all roles on platforms that reach underrepresented groups, using structured interviews and scoring rubrics to reduce bias, and ensuring diverse shortlists where possible. We collect and review diversity data annually.",
  "Scalability|Individualized support system": "e.g. Every staff member has a named line manager responsible for their day-to-day support, performance, and development. All new starters are paired with a peer buddy from outside their team for their first three months. The ED has skip-level conversations with all non-management staff twice a year.",
  "Scalability|Weekly or bi-weekly 1-on-1s": "e.g. All managers hold weekly or biweekly one-to-ones with each direct report. We have a standard template covering: how the person is doing, progress on current priorities, any blockers, feedback, and a standing development question. One-to-ones are the staff member's meeting — they set the agenda. See linked 1-1 agenda template.",
  "Scalability|Hiring process": "e.g. We have a written hiring process guide covering every stage from role sign-off through to offer. It includes a role description template, standard application questions, a two-stage interview structure, a scoring rubric, a work sample task, and reference check guidance. All interview panels have at least two people and final hiring decisions require sign-off from three people.",
  "Scalability|Onboarding process": "e.g. We have a structured onboarding document for all new starters that sets out clear goals for the first 30, 60, and 90 days. During the first month, new starters have weekly check-ins with their manager. New starters also have a named buddy for their first 90 days. We update the onboarding document based on new starter feedback after every hire. See document linked below.",
};

function encodeKey(k){ return btoa(unescape(encodeURIComponent(k))).replace(/=/g,'').replace(/\\+/g,'p').replace(/\\//g,'s'); }

function generateSessionId(){ return 'sess_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36); }

function getSessionUrl(){ return window.location.origin+window.location.pathname+'?session='+sessionId; }

function copySessionLink(){
  navigator.clipboard.writeText(getSessionUrl()).then(()=>{
    const btn=document.querySelector('.session-copy-btn');
    btn.textContent='Copied!';
    setTimeout(()=>{btn.textContent='Copy link';},2000);
  });
}

function showSessionBar(){
  const bar=document.getElementById('session-bar');
  bar.style.display='flex';
  bar.classList.add('show');
  document.getElementById('session-link-text').textContent=getSessionUrl();
}

function setSaveIndicator(status){
  const el=document.getElementById('save-indicator');
  if(!el)return;
  el.className='session-save-indicator '+status;
  if(status==='saving') el.textContent='Saving…';
  else if(status==='saved') el.textContent='✓ Saved';
  else el.textContent='Auto-saving…';
}

function scheduleSave(){
  if(!sessionId)return;
  clearTimeout(saveTimeout);
  setSaveIndicator('saving');
  saveTimeout=setTimeout(saveSessionToAirtable,1500);
}

function formatStage(s){ return STAGE_DEFS[s]?STAGE_DEFS[s].name:'Not specified'; }

function getStageContext(s){
  if(!s||!STAGE_DEFS[s])return 'Stage not specified by client.';
  const def=STAGE_DEFS[s];
  return '<span style="font-size:0.78rem;font-weight:600;background:var(--brand);color:white;padding:2px 10px;border-radius:99px;margin-right:8px">'+def.headcount+'</span>'+def.desc;
}

// ═══════════════ BUILD FIELDS FOR AIRTABLE ═══════════════
function buildAirtableFields(){
  const fields={
    org_name: document.getElementById('org-name')?.value||state.orgInfo.name||'',
    contact_name: document.getElementById('contact-name')?.value||state.orgInfo.contact||'',
    contact_role: document.getElementById('contact-role')?.value||state.orgInfo.role||'',
    contact_email: document.getElementById('contact-email')?.value||state.orgInfo.email||'',
    org_stage: document.getElementById('org-stage')?.value||state.orgInfo.stage||'',
    submitted_at: new Date().toISOString().split('T')[0],
    final_notes: state.finalNotes||'',
    extra_links: (state.extraLinks||[]).join(', '),
  };
  for(const[key,field]of Object.entries(SCORE_FIELD_MAP)) fields[field]=state.scores[key]!==undefined?String(state.scores[key]):'';
  for(const[key,field]of Object.entries(NOTES_FIELD_MAP)) fields[field]=state.notes[key]||'';
  for(const[key,field]of Object.entries(LINKS_FIELD_MAP)) fields[field]=state.links[key]||'';
  return fields;
}

// ═══════════════ SESSION SAVE/LOAD ═══════════════
async function saveSessionToAirtable(){
  if(!sessionId)return;
  setSaveIndicator('saving');
  const fields=buildAirtableFields();
  fields.session_id=sessionId;
  fields.status='draft';
  try{
    if(sessionRecordId){
      await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'/'+sessionRecordId,{
        method:'PATCH',
        headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({fields}),
      });
    } else {
      const res=await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE,{
        method:'POST',
        headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({fields}),
      });
      const data=await res.json();
      sessionRecordId=data.id;
    }
    setSaveIndicator('saved');
  }catch(e){
    console.error('Auto-save failed:',e);
    setSaveIndicator('');
  }
}

async function loadSessionFromUrl(){
  const params=new URLSearchParams(window.location.search);
  const sid=params.get('session');
  if(!sid)return;
  try{
    const res=await fetch(
      'https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'?filterByFormula='+encodeURIComponent('{session_id}="'+sid+'"'),
      {headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN}}
    );
    const data=await res.json();
    if(!data.records||data.records.length===0)return;
    const record=data.records[0];
    const f=record.fields;
    if(f.status==='submitted')return;
    sessionId=sid;
    sessionRecordId=record.id;
    if(f.org_name) document.getElementById('org-name').value=f.org_name;
    if(f.contact_name) document.getElementById('contact-name').value=f.contact_name;
    if(f.contact_role) document.getElementById('contact-role').value=f.contact_role;
    if(f.contact_email) document.getElementById('contact-email').value=f.contact_email;
    if(f.org_stage) selectStageCard(f.org_stage);
    for(const[aField,stateKey]of Object.entries(REV_SCORE)){
      if(f[aField]!==undefined&&f[aField]!==''){
        const val=parseInt(f[aField]);
        state.scores[stateKey]=val;
        const enc=encodeKey(stateKey);
        setTimeout(()=>{
          [0,1,2,3].forEach(v=>{
            const opt=document.getElementById('sb-'+enc+'-'+v);
            if(opt)opt.classList.toggle('selected',v===val);
          });
        },100);
      }
    }
    setTimeout(()=>{
      for(const[aField,stateKey]of Object.entries(REV_NOTES)){
        if(f[aField]){
          state.notes[stateKey]=f[aField];
          const enc=encodeKey(stateKey);
          const ta=document.querySelector('#notes-area-'+enc);
          if(ta)ta.value=f[aField];
        }
      }
      for(const[aField,stateKey]of Object.entries(REV_LINKS)){
        if(f[aField]){
          state.links[stateKey]=f[aField];
          const enc=encodeKey(stateKey);
          const container=document.getElementById('links-'+enc);
          if(container){const input=container.querySelector('input');if(input)input.value=f[aField].split(' | ')[0];}
        }
      }
      if(f.final_notes){
        state.finalNotes=f.final_notes;
        const ta=document.querySelector('[onchange="state.finalNotes=this.value"]');
        if(ta)ta.value=f.final_notes;
      }
      updateProgress();
    },200);
    showSessionBar();
    const banner=document.createElement('div');
    banner.style.cssText='background:#D1FAE5;border:1.5px solid #10B981;border-radius:10px;padding:14px 20px;margin-bottom:20px;font-size:0.88rem;color:#059669;font-weight:500;';
    banner.innerHTML='✓ Welcome back — your previous progress has been restored.';
    const fc=document.querySelector('.form-container');
    if(fc)fc.insertBefore(banner,fc.firstChild);
  }catch(e){console.error('Session load failed:',e);}
}

// ═══════════════ PAGED FORM ═══════════════
function buildDriverPages() {
  const container = document.getElementById('driver-pages');
  ORG_SYSTEMS.forEach((driver, di) => {
    const pageNum = di + 1;
    const pageEl = document.createElement('div');
    pageEl.className = 'form-page';
    pageEl.id = \`form-page-\${pageNum}\`;

    const itemsHtml = driver.items.map((item) => buildSystemItem(driver.driver, item)).join('');

    pageEl.innerHTML = \`
      <div class="driver-page-header">
        <div class="driver-page-eyebrow">Section \${pageNum} of \${ORG_SYSTEMS.length}</div>
        <div class="driver-page-title">\${driver.driver}</div>
        <div class="driver-page-desc">\${driver.desc}</div>
        \${driver.url ? \`<a href="\${driver.url}" target="_blank" rel="noopener" class="driver-page-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View Scarlet Spark tools for this area
        </a>\` : ''}
      </div>
      \${itemsHtml}
      <div class="page-nav">
        <button class="btn-back" onclick="goToPage(\${pageNum - 1}, 'back')">← Back</button>
        <span class="page-nav-section"><strong>\${driver.driver}</strong> · \${pageNum} of \${ORG_SYSTEMS.length}</span>
        <button class="btn-primary" onclick="completePage(\${pageNum})" style="padding:11px 28px">
          \${pageNum === ORG_SYSTEMS.length ? 'Continue →' : 'Mark as complete →'}
        </button>
      </div>\`;

    container.appendChild(pageEl);
  });
}


function completePage(pageNum){
  const stage=document.getElementById('org-stage').value;
  const stageMap={'launch':'Launch','first-hire':'First Hire','growth':'Growth'};
  const selectedStage=stageMap[stage];
  if(selectedStage){
    const driver=ORG_SYSTEMS[pageNum-1];
    const missing=driver.items.filter(item=>{
      if(!item.stages.includes(selectedStage))return false;
      const key=driver.driver+'|'+item.name;
      return state.scores[key]===undefined;
    });
    if(missing.length>0){
      missing.forEach(item=>{
        const key=driver.driver+'|'+item.name;
        const enc=encodeKey(key);
        const el=document.getElementById('sb-'+enc+'-0')?.closest('.system-item');
        if(el)el.classList.add('missing-score');
      });
      const firstMissing=document.querySelector('#form-page-'+pageNum+' .missing-score');
      if(firstMissing)firstMissing.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
  }
  goToPage(pageNum+1,'forward');
}

function goToPage(targetPage,direction){
  const targetId=targetPage===ORG_SYSTEMS.length+1?'form-page-final':'form-page-'+targetPage;
  const currentId=currentPage===ORG_SYSTEMS.length+1?'form-page-final':'form-page-'+currentPage;
  const currentEl=document.getElementById(currentId);
  const targetEl=document.getElementById(targetId);
  if(!currentEl||!targetEl)return;
  const outClass=direction==='forward'?'slide-out-left':'slide-out-right';
  const inClass=direction==='forward'?'slide-in-right':'slide-in-left';
  currentEl.classList.add(outClass);
  currentEl.addEventListener('animationend',()=>{currentEl.classList.remove('active',outClass);},{once:true});
  setTimeout(()=>{
    targetEl.classList.add('active',inClass);
    targetEl.addEventListener('animationend',()=>{targetEl.classList.remove(inClass);},{once:true});
    window.scrollTo({top:0,behavior:'smooth'});
  },50);
  currentPage=targetPage;
  updateProgress();
}

function buildSystemItem(driver, item) {
  const key = \`\${driver}|\${item.name}\`;
  const enc = encodeKey(key);
  const stageEmoji = { 'Launch': '🌱', 'First Hire': '🌿', 'Growth': '🌳' };
  const stages = item.stages.map(s => \`\${stageEmoji[s] || ''} \${s}\`).join('  ');
  const placeholder = ITEM_PLACEHOLDERS[key] || 'Describe where things currently stand for this system\u2026';
  return \`
    <div class="system-item">
      <div class="system-name">\${item.name} <span class="system-stage">\${stages}</span><span class="help-icon" onclick="toggleStageHelp(this)" title="What do these stages mean?">?<span class="stage-help-popup">These tags show which organizational stage this system is most important to prioritize.</span></span></div>
      \${item.desc ? \`<div class="item-desc">\${item.desc}</div>\` : ''}
      <div class="item-field-label">Self-Score</div>
      <div class="score-scale" id="scale-\${enc}">
        <div class="score-option" data-val="0" id="sb-\${enc}-0" onclick="selectScore('\${enc}','\${key}',0)">
          <div class="score-circle">✕</div>
          <div class="score-label">Not in place</div>
          <div class="score-num">0</div>
        </div>
        <div class="score-option" data-val="1" id="sb-\${enc}-1" onclick="selectScore('\${enc}','\${key}',1)">
          <div class="score-circle">△</div>
          <div class="score-label">Needs improvement</div>
          <div class="score-num">1</div>
        </div>
        <div class="score-option" data-val="2" id="sb-\${enc}-2" onclick="selectScore('\${enc}','\${key}',2)">
          <div class="score-circle">○</div>
          <div class="score-label">Good enough for now</div>
          <div class="score-num">2</div>
        </div>
        <div class="score-option" data-val="3" id="sb-\${enc}-3" onclick="selectScore('\${enc}','\${key}',3)">
          <div class="score-circle">★</div>
          <div class="score-label">Great</div>
          <div class="score-num">3</div>
        </div>
      </div>

      <div class="item-field-label" style="margin-top:14px">Your response</div>
      <textarea
        class="item-textarea"
        id="notes-area-\${enc}"
        placeholder="\${placeholder}"
        onchange="state.notes['\${key}']=this.value; if(!sessionId){sessionId=generateSessionId();showSessionBar();} scheduleSave();"
      ></textarea>

      <div class="item-field-label" style="margin-top:12px">Documentation</div>
      <div id="links-\${enc}">
        <div class="item-doc-row" style="margin-bottom:6px">
          <input type="text" class="item-link-input" placeholder="Paste a link (e.g. Google Drive, Notion, website\u2026)" onchange="updateItemLinks('\${enc}','\${key}')">
        </div>
      </div>
      <button onclick="addItemLink('\${enc}','\${key}')" style="background:none;border:none;font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:600;color:var(--brand);cursor:pointer;padding:0;margin-top:2px">+ Add another link</button>
    </div>\`;
}


function toggleStageHelp(el){
  document.querySelectorAll('.help-icon.open').forEach(e=>{if(e!==el)e.classList.remove('open');});
  el.classList.toggle('open');
  if(el.classList.contains('open')){
    setTimeout(()=>{
      document.addEventListener('click',function handler(e){
        if(!el.contains(e.target)){el.classList.remove('open');document.removeEventListener('click',handler);}
      });
    },10);
  }
}

function applyStageRequirements(stage){
  if(!stage)return;
  const stageMap={'launch':'Launch','first-hire':'First Hire','growth':'Growth'};
  const selectedStage=stageMap[stage];
  if(!selectedStage)return;
  ORG_SYSTEMS.forEach(driver=>{
    driver.items.forEach(item=>{
      const key=driver.driver+'|'+item.name;
      const enc=encodeKey(key);
      const el=document.getElementById('sb-'+enc+'-0')?.closest('.system-item');
      if(!el)return;
      const isRequired=item.stages.includes(selectedStage);
      el.classList.toggle('required-item',isRequired);
      el.classList.toggle('not-required',!isRequired);
      const nameEl=el.querySelector('.system-name');
      const existing=nameEl.querySelector('.required-badge,.not-required-badge');
      if(existing)existing.remove();
      const badge=document.createElement('span');
      if(isRequired){badge.className='required-badge';badge.textContent='Required';}
      else{badge.className='not-required-badge';badge.textContent='Optional at your stage';}
      nameEl.appendChild(badge);
    });
  });
}

function selectScore(encKey,key,val){
  state.scores[key]=val;
  [0,1,2,3].forEach(v=>{
    const opt=document.getElementById('sb-'+encKey+'-'+v);
    if(opt)opt.classList.toggle('selected',v===val);
  });
  const item=document.getElementById('sb-'+encKey+'-0')?.closest('.system-item');
  if(item)item.classList.remove('missing-score');
  updateProgress();
  if(!sessionId){sessionId=generateSessionId();showSessionBar();}
  scheduleSave();
}

function updateProgress(){
  const total=ORG_SYSTEMS.reduce((a,d)=>a+d.items.length,0);
  const scored=Object.keys(state.scores).length;
  const pct=Math.round((scored/total)*100);
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-pct').textContent=pct+'%';
  const labelEl=document.querySelector('.progress-label');
  if(labelEl&&currentPage>0&&currentPage<=ORG_SYSTEMS.length) labelEl.textContent='Section '+currentPage+' of '+ORG_SYSTEMS.length;
  else if(labelEl&&currentPage===0) labelEl.textContent='Your progress';
  else if(labelEl) labelEl.textContent='Almost done';
}

function addItemLink(enc,key){
  const container=document.getElementById('links-'+enc);
  const row=document.createElement('div');
  row.className='item-doc-row';
  row.style.marginBottom='6px';
  const input=document.createElement('input');
  input.type='text';input.className='item-link-input';
  input.placeholder='Paste a link…';
  input.addEventListener('change',()=>updateItemLinks(enc,key));
  const btn=document.createElement('button');
  btn.innerHTML='✕';
  btn.style.cssText='background:none;border:none;cursor:pointer;color:var(--light);font-size:1rem;padding:0 4px;flex-shrink:0';
  btn.addEventListener('click',()=>{row.remove();updateItemLinks(enc,key);});
  row.appendChild(input);row.appendChild(btn);
  container.appendChild(row);
}

function updateItemLinks(enc,key){
  const container=document.getElementById('links-'+enc);
  if(!container)return;
  const vals=Array.from(container.querySelectorAll('input')).map(i=>i.value.trim()).filter(Boolean);
  state.links[key]=vals.join(' | ');
}

function addExtraLink(){
  const container=document.getElementById('extra-links');
  const row=document.createElement('div');
  row.className='item-doc-row';row.style.marginBottom='8px';
  const input=document.createElement('input');
  input.type='text';input.className='item-link-input';
  input.placeholder='Paste a link…';
  input.addEventListener('change',()=>updateExtraLink(input));
  const btn=document.createElement('button');
  btn.innerHTML='✕';
  btn.style.cssText='background:none;border:none;cursor:pointer;color:var(--light);font-size:1.1rem;padding:0 4px';
  btn.addEventListener('click',()=>row.remove());
  row.appendChild(input);row.appendChild(btn);
  container.appendChild(row);
}

function updateExtraLink(input){
  state.extraLinks=Array.from(document.querySelectorAll('#extra-links input')).map(i=>i.value).filter(Boolean);
}

function selectStageCard(val){
  document.getElementById('org-stage').value=val;
  document.querySelectorAll('.stage-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('sc-'+val).classList.add('selected');
  applyStageRequirements(val);
  updateProgress();
}

// ═══════════════ SUBMIT ═══════════════
async function submitAssessment(){
  const stage=document.getElementById('org-stage').value;
  const stageMap={'launch':'Launch','first-hire':'First Hire','growth':'Growth'};
  const selectedStage=stageMap[stage];
  const errorEl=document.getElementById('submit-error');
  if(!stage){
    errorEl.textContent='Please select your organizational stage before submitting.';
    errorEl.classList.add('show');
    errorEl.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const missing=[];
  ORG_SYSTEMS.forEach(driver=>{
    driver.items.forEach(item=>{
      if(item.stages.includes(selectedStage)){
        const key=driver.driver+'|'+item.name;
        if(state.scores[key]===undefined){
          missing.push(item.name);
          const enc=encodeKey(key);
          const el=document.getElementById('sb-'+enc+'-0')?.closest('.system-item');
          if(el)el.classList.add('missing-score');
        }
      }
    });
  });
  if(missing.length>0){
    errorEl.innerHTML='<strong>Please score all required items before submitting.</strong><br>'+missing.length+' item'+(missing.length!==1?'s':'')+' still need'+(missing.length===1?'s':'')+' a score.';
    errorEl.classList.add('show');
    errorEl.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  errorEl.classList.remove('show');
  const btn=document.querySelector('.btn-primary');
  btn.disabled=true;
  btn.innerHTML='<span class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white"></span> Submitting…';
  state.orgInfo={
    name: document.getElementById('org-name').value||'Unknown Organization',
    contact: document.getElementById('contact-name').value,
    role: document.getElementById('contact-role').value,
    email: document.getElementById('contact-email').value,
    stage: document.getElementById('org-stage').value,
  };
  state.submitted=true;
  try{
    const fields=buildAirtableFields();
    fields.status='submitted';
    if(sessionId)fields.session_id=sessionId;
    let res;
    if(sessionRecordId){
      res=await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'/'+sessionRecordId,{
        method:'PATCH',
        headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({fields}),
      });
    } else {
      res=await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE,{
        method:'POST',
        headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({fields}),
      });
    }
    if(!res.ok){const err=await res.json();console.error('Airtable error:',err);}
  }catch(err){console.error('Submit error:',err);}
  document.getElementById('client-form-wrapper').style.display='none';
  document.getElementById('success-screen').classList.add('show');
  populateConsultantDashboard();
}

// ═══════════════ CONSULTANT DASHBOARD ═══════════════

// updateConsultantMeta: updates the reviewer name, timestamp display, and consultantState
function updateConsultantMeta(){
  const name=document.getElementById('consultant-name')?.value?.trim()||'';
  const now=new Date();
  const dateStr=now.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const timeStr=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const ts=document.getElementById('review-timestamp');
  if(ts) ts.textContent=name?(dateStr+' at '+timeStr):'';
  consultantState.reviewerName=name;
  consultantState.reviewDate=name?(dateStr+' at '+timeStr):'';
}

function populateConsultantDashboard(){
  if(!state.submitted)return;
  document.getElementById('c-org-name').textContent=state.orgInfo.name||'Assessment Submitted';
  const contactParts=[state.orgInfo.contact,state.orgInfo.role,state.orgInfo.email].filter(Boolean);
  document.getElementById('c-org-meta').textContent=contactParts.join('  ·  ')+'  ·  Stage: '+formatStage(state.orgInfo.stage);

  // Restore reviewer name/date if already set
  const nameEl=document.getElementById('consultant-name');
  if(nameEl&&consultantState.reviewerName) nameEl.value=consultantState.reviewerName;
  const ts=document.getElementById('review-timestamp');
  if(ts&&consultantState.reviewDate) ts.textContent=consultantState.reviewDate;

  const stageMap={'launch':'Launch','first-hire':'First Hire','growth':'Growth'};
  const selectedStage=stageMap[state.orgInfo.stage]||null;
  const requiredItems=[];
  ORG_SYSTEMS.forEach(d=>{d.items.forEach(i=>{if(!selectedStage||i.stages.includes(selectedStage))requiredItems.push({driver:d.driver,item:i});});});
  const total=requiredItems.length;
  const scored=requiredItems.filter(({driver,item})=>state.scores[driver+'|'+item.name]!==undefined).length;
  const allScores=requiredItems.map(({driver,item})=>state.scores[driver+'|'+item.name]).filter(s=>s!==undefined);
  const avg=allScores.length?(allScores.reduce((a,b)=>a+b,0)/allScores.length).toFixed(1):'—';
  const gaps=allScores.filter(s=>s<=1).length;

  const mComp=document.getElementById('m-completion');
  mComp.querySelector('.metric-value').textContent=scored+'/'+total;
  mComp.querySelector('.metric-sub').textContent=selectedStage?'required items for '+selectedStage:'of scored items';
  mComp.className='metric-card '+(scored===total?'green':scored>total/2?'amber':'red');

  const mAvg=document.getElementById('m-avg-score');
  mAvg.querySelector('.metric-value').textContent=avg;
  mAvg.querySelector('.metric-sub').textContent=selectedStage?'avg score · '+selectedStage+' items':'out of 3.0';
  mAvg.className='metric-card '+(parseFloat(avg)>=2?'green':parseFloat(avg)>=1?'amber':'red');

  const mGaps=document.getElementById('m-gaps');
  mGaps.querySelector('.metric-value').textContent=gaps;
  mGaps.querySelector('.metric-sub').textContent=selectedStage?'required items scored 0 or 1':'items scored 0 or 1';
  mGaps.className='metric-card '+(gaps===0?'green':gaps<=3?'amber':'red');

  const barsEl=document.getElementById('driver-score-bars');
  barsEl.innerHTML='';
  ORG_SYSTEMS.forEach(driver=>{
    const dScores=driver.items.map(i=>state.scores[driver.driver+'|'+i.name]).filter(s=>s!==undefined);
    const dAvg=dScores.length?dScores.reduce((a,b)=>a+b,0)/dScores.length:null;
    const pct=dAvg!==null?(dAvg/3)*100:0;
    const cls=dAvg===null?'red':dAvg>=2?'green':dAvg>=1?'amber':'red';
    barsEl.innerHTML+='<div class="driver-score-row"><div class="driver-score-name">'+driver.driver+'</div><div class="score-track"><div class="score-fill '+cls+'" style="width:'+pct+'%"></div></div><div class="score-val">'+(dAvg!==null?dAvg.toFixed(1):'—')+'</div></div>';
  });

  document.getElementById('stage-context').innerHTML='<div style="display:flex;align-items:flex-start;gap:20px"><div style="flex:1"><div style="font-weight:600;margin-bottom:8px">Current Stage: <span style="color:var(--brand)">'+formatStage(state.orgInfo.stage)+'</span></div><div style="color:var(--mid);font-size:0.9rem;line-height:1.65">'+getStageContext(state.orgInfo.stage)+'</div></div></div>';

  populateSystemsView();
  populateDocumentView();
}

function populateSystemsView(){
  const el=document.getElementById('systems-consultant-view');
  el.innerHTML='';
  const stageMapSys={'launch':'Launch','first-hire':'First Hire','growth':'Growth'};
  const selectedStage=stageMapSys[state.orgInfo.stage]||null;
  ORG_SYSTEMS.forEach(driver=>{
    const dScores=driver.items.map(i=>state.scores[driver.driver+'|'+i.name]).filter(s=>s!==undefined);
    const dAvg=dScores.length?(dScores.reduce((a,b)=>a+b,0)/dScores.length).toFixed(1):'—';
    const gaps=driver.items.filter(i=>{const s=state.scores[driver.driver+'|'+i.name];return s!==undefined&&s<=1;});
    const gapsHtml=gaps.length>0?'<div style="margin-bottom:16px;background:#FEF2F2;border-radius:8px;padding:14px 16px;border-left:3px solid #EF4444"><div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#DC2626;margin-bottom:10px">⚠ Priority Gaps</div>'+gaps.map(i=>{const s=state.scores[driver.driver+'|'+i.name];return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(239,68,68,0.15);font-size:0.87rem"><span style="color:var(--charcoal)">'+i.name+'</span><span style="font-weight:700;color:'+(s===0?'#DC2626':'#D97706')+';white-space:nowrap;margin-left:16px">'+(s===0?'0 — Not in place':'1 — Needs improvement')+'</span></div>';}).join('')+'</div>':'';
    const itemsHtml=driver.items.map(item=>{
      const key=driver.driver+'|'+item.name;
      const score=state.scores[key];
      const link=state.links[key]||'';
      const notes=state.notes[key]||'';
      const scoreLabel=score===undefined?'<span style="color:var(--light)">Not scored</span>':score===0?'<span style="color:#DC2626;font-weight:600">0 — Not in place</span>':score===1?'<span style="color:#D97706;font-weight:600">1 — Needs improvement</span>':score===2?'<span style="color:#059669;font-weight:600">2 — Good enough for now</span>':'<span style="color:var(--brand);font-weight:600">3 — Great</span>';
      const cEnc=encodeKey('c|'+key);
      const cScore=consultantState.scores[key];
      const cNote=consultantState.notes[key]||'';
      return '<div style="padding:14px 0;border-bottom:1px solid var(--border)">'+
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:'+(link||notes?'8px':'0')+'">'+
          '<div style="flex:1;font-size:0.92rem;font-weight:500">'+item.name+(selectedStage?(item.stages.includes(selectedStage)?'<span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--brand);background:var(--brand-pale);padding:2px 7px;border-radius:99px;margin-left:6px">Required</span>':'<span style="font-size:0.68rem;font-weight:500;color:var(--light);background:var(--cream);border:1px solid var(--border);padding:2px 7px;border-radius:99px;margin-left:6px">Optional</span>'):'')+'</div>'+
          '<div style="font-size:0.78rem;color:var(--light);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Client</div>'+
          '<div style="font-size:0.85rem;min-width:140px">'+scoreLabel+'</div>'+
          '<div style="font-size:0.78rem;color:var(--brand);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">ScarSpark</div>'+
          '<div style="display:flex;gap:4px;align-items:center">'+[0,1,2,3].map(v=>'<button onclick="setConsultantScore(\''+key+'\',\''+cEnc+'\','+v+')" id="csb-'+cEnc+'-'+v+'" style="width:26px;height:26px;border-radius:6px;border:1.5px solid '+(cScore===v?'var(--brand)':'var(--border)')+'";background:'+(cScore===v?'var(--brand)':'white')+';color:'+(cScore===v?'white':'var(--mid)')+';font-size:0.75rem;font-weight:700;cursor:pointer;transition:all 0.15s">'+v+'</button>').join('')+'</div>'+
        '</div>'+
        (link?link.split(' | ').filter(Boolean).map(u=>'<div style="font-size:0.8rem;margin-bottom:3px">🔗 <a href="'+u.trim()+'" target="_blank" style="color:var(--brand)">'+u.trim()+'</a></div>').join(''):'')+
        (notes?'<div style="font-size:0.83rem;color:var(--mid);margin-top:6px;padding:8px 12px;background:var(--cream);border-radius:6px;line-height:1.5">📝 '+notes+'</div>':'')+
        '<div style="margin-top:8px"><input type="text" value="'+cNote+'" placeholder="ScarSpark notes…" onchange="setConsultantNote(\''+key+'\',this.value)" style="width:100%;border:1.5px solid var(--border);border-radius:6px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:0.83rem;outline:none;background:var(--cream)" onfocus="this.style.borderColor=\'var(--brand)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>'+
      '</div>';
    }).join('');
    el.innerHTML+='<div class="analysis-panel" style="margin-bottom:24px"><div class="analysis-panel-header"><div class="analysis-panel-title">'+driver.driver+'</div><div style="display:flex;align-items:center;gap:12px"><div style="font-size:0.82rem;font-weight:600;color:var(--mid)">Client avg: '+dAvg+'</div>'+(gaps.length>0?'<span style="font-size:0.72rem;font-weight:700;background:#FEE2E2;color:#DC2626;padding:3px 10px;border-radius:99px">'+gaps.length+' gap'+(gaps.length>1?'s':'')+'</span>':dScores.length>0?'<span style="font-size:0.72rem;font-weight:700;background:#D1FAE5;color:#059669;padding:3px 10px;border-radius:99px">No gaps</span>':'')+'</div></div><div class="analysis-panel-body">'+gapsHtml+itemsHtml+'</div></div>';
  });
}

function populateDocumentView(){
  const el=document.getElementById('docs-consultant-view');
  const allLinks=[];
  ORG_SYSTEMS.forEach(driver=>{
    driver.items.forEach(item=>{
      const key=driver.driver+'|'+item.name;
      const linkVal=state.links[key];
      if(linkVal) linkVal.split(' | ').filter(Boolean).forEach(url=>allLinks.push({url:url.trim(),item:item.name,driver:driver.driver}));
    });
  });
  if(state.extraLinks&&state.extraLinks.length>0) state.extraLinks.filter(Boolean).forEach(url=>allLinks.push({url,item:'Additional links',driver:'General'}));
  if(allLinks.length===0){el.innerHTML='<div style="color:var(--light);font-size:0.9rem;">No links submitted.</div>';return;}
  const byDriver={};
  allLinks.forEach(({url,item,driver})=>{if(!byDriver[driver])byDriver[driver]=[];byDriver[driver].push({url,item});});
  el.innerHTML=Object.entries(byDriver).map(([driver,links])=>'<div style="margin-bottom:20px"><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--brand);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">'+driver+'</div>'+links.map(({url,item})=>'<div class="doc-item" style="margin-bottom:8px"><span>🔗</span><div style="flex:1;min-width:0"><div style="font-size:0.8rem;font-weight:600;color:var(--mid);margin-bottom:2px">'+item+'</div><a href="'+url+'" target="_blank" rel="noopener" style="font-size:0.83rem;color:var(--brand);word-break:break-all">'+url+'</a></div></div>').join('')+'</div>').join('');
}

function showConsultantPanel(id,event){
  document.querySelectorAll('.consultant-panel').forEach(p=>p.style.display='none');
  document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active'));
  const panel=document.getElementById('panel-'+id);
  if(panel)panel.style.display='block';
  if(event&&event.currentTarget)event.currentTarget.classList.add('active');
}

function setConsultantScore(key,enc,val){
  consultantState.scores[key]=val;
  [0,1,2,3].forEach(v=>{
    const btn=document.getElementById('csb-'+enc+'-'+v);
    if(btn){
      btn.style.background=v===val?'var(--brand)':'white';
      btn.style.color=v===val?'white':'var(--mid)';
      btn.style.borderColor=v===val?'var(--brand)':'var(--border)';
    }
  });
}

function setConsultantNote(key,val){ consultantState.notes[key]=val; }

async function saveConsultantScores(){
  if(!consultantState.recordId)return;
  const btn=document.getElementById('save-consultant-btn');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  const fields={};
  if(consultantState.reviewerName) fields.consultant_reviewer=consultantState.reviewerName;
  if(consultantState.reviewDate)   fields.consultant_review_date=consultantState.reviewDate;
  for(const[key,field]of Object.entries(CS_FIELD_MAP)){
    const val=consultantState.scores[key];
    if(val!==undefined)fields[field]=String(val);
  }
  for(const[key,field]of Object.entries(CN_FIELD_MAP)){
    if(consultantState.notes[key])fields[field]=consultantState.notes[key];
  }
  try{
    await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'/'+consultantState.recordId,{
      method:'PATCH',
      headers:{'Authorization':'Bearer '+AIRTABLE_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({fields}),
    });
    if(btn){btn.disabled=false;btn.textContent='✓ Saved';setTimeout(()=>{btn.textContent='Save scores';},2000);}
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Save failed — retry';}
    console.error(e);
  }
}

// ═══════════════ AI CHAT ═══════════════
function buildAssessmentContext(){
  if(!state.submitted)return'No assessment has been submitted yet.';
  const lines=[
    'Organization: '+state.orgInfo.name,
    consultantState.reviewerName?'Reviewed by: '+consultantState.reviewerName:'',
    consultantState.reviewDate?'Review date: '+consultantState.reviewDate:'',
    'Contact: '+(state.orgInfo.contact||'')+(state.orgInfo.role?', '+state.orgInfo.role:''),
    'Stage: '+formatStage(state.orgInfo.stage)+' ('+(STAGE_DEFS[state.orgInfo.stage]?.headcount||'')+')',
    '',
    'ORG SYSTEMS SELF-SCORES (0=Not in place, 1=Basic, 2=Good, 3=Strong):',
  ];
  ORG_SYSTEMS.forEach(driver=>{
    lines.push('\n'+driver.driver+':');
    driver.items.forEach(item=>{
      const key=driver.driver+'|'+item.name;
      const score=state.scores[key];
      const notes=state.notes[key];
      const link=state.links[key];
      lines.push('  - '+item.name+': '+(score!==undefined?score:'Not scored')+(notes?' [Note: '+notes+']':'')+(link?' [Doc: '+link+']':''));
    });
  });
  if(state.extraLinks&&state.extraLinks.length>0) lines.push('\nADDITIONAL LINKS: '+state.extraLinks.join(', '));
  if(state.finalNotes) lines.push('\nFINAL NOTES FROM CLIENT: '+state.finalNotes);
  const csKeys=Object.keys(consultantState.scores);
  if(csKeys.length>0){
    lines.push('\nSCARLET SPARK CONSULTANT SCORES:');
    ORG_SYSTEMS.forEach(driver=>{
      driver.items.forEach(item=>{
        const k=driver.driver+'|'+item.name;
        const cs=consultantState.scores[k];
        const cn=consultantState.notes[k];
        if(cs!==undefined||cn) lines.push('  - '+item.name+': SS='+(cs!==undefined?cs:'not scored')+(cn?' [ScarSpark note: '+cn+']':''));
      });
    });
  }
  return lines.join('\n');
}

function useSuggest(el){ document.getElementById('ai-input').value=el.textContent.trim(); document.getElementById('ai-input').focus(); }

function formatAIText(text){
  return text
    .replace(/^### (.+)$/gm,'<div style="font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--brand);margin:12px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-size:1rem;font-weight:700;margin:14px 0 5px;color:var(--charcoal)">$1</div>')
    .replace(/^# (.+)$/gm,'<div style="font-size:1.05rem;font-weight:700;margin:14px 0 6px;color:var(--charcoal)">$1</div>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^- (.+)$/gm,'<li style="margin-bottom:3px">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs,m=>'<ul style="margin:6px 0 6px 16px;padding:0">'+m+'</ul>')
    .replace(/\n\n/g,'<br><br>')
    .replace(/\n/g,'<br>');
}

function appendMessage(role,text){
  const thread=document.getElementById('ai-thread');
  const div=document.createElement('div');
  div.className='ai-message';
  div.style.flexDirection=role==='user'?'row-reverse':'row';
  const avatar=role==='claude'?'<div class="ai-avatar claude">C</div>':'<div class="ai-avatar user">You</div>';
  const bubble='<div class="ai-bubble'+(role==='user'?' user-bubble':'')+'">'+formatAIText(text)+'</div>';
  div.innerHTML=role==='user'?bubble+avatar:avatar+bubble;
  thread.appendChild(div);
  thread.scrollTop=thread.scrollHeight;
}

async function sendAIMessage(){
  const input=document.getElementById('ai-input');
  const msg=input.value.trim();
  if(!msg)return;
  const btn=document.getElementById('ai-send-btn');
  if(btn.disabled)return;
  input.value='';
  appendMessage('user',msg);
  state.chatHistory.push({role:'user',content:msg});
  btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span>';
  const systemPrompt='You are an expert organizational health consultant specializing in nonprofits in the animal protection movement. You are helping the Scarlet Spark consulting team analyze an org health self-assessment.\n\nYour role is to:\n1. Analyze the assessment data and surface key insights, patterns, and risks\n2. Help consultants identify priority areas to focus on\n3. Compare the organization\'s self-assessment to what\'s expected for their stage\n4. Flag any red flags, particularly in Safety & Fairness, Leadership, or Goal Clarity\n5. Compare client self-scores with ScarSpark consultant scores where available and highlight discrepancies\n6. Be honest, constructive, and practically focused\n\nKeep responses concise, well-structured, and actionable. Use bullet points for lists. Avoid using ## headers. Do not use excessive line breaks.\n\nASSESSMENT DATA:\n'+buildAssessmentContext();
  try{
    const messages=state.chatHistory.map(m=>({role:m.role,content:m.content}));
    const res=await fetch('/claude',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:systemPrompt,messages}),
    });
    const text=await res.text();
    if(!res.ok){appendMessage('claude','⚠️ Error '+res.status+': '+text.slice(0,300));return;}
    let data;
    try{data=JSON.parse(text);}catch(e){appendMessage('claude','⚠️ Could not parse response: '+text.slice(0,200));return;}
    const reply=data.content?.map(c=>c.text||'').join('')||'No response content.';
    appendMessage('claude',reply);
    state.chatHistory.push({role:'assistant',content:reply});
  }catch(err){
    console.error('sendAIMessage error:',err);
    appendMessage('claude','⚠️ Connection error: '+err.message);
  }finally{
    btn.disabled=false;
    btn.innerHTML='Send';
  }
}

// ═══════════════ PASSWORD GATE ═══════════════
const CONSULTANT_PASSWORD='scarlet2024';
let consultantUnlocked=false;

function openPasswordModal(){
  if(consultantUnlocked){document.getElementById('tab-consultant').click();return;}
  document.getElementById('pw-overlay').classList.add('show');
  document.getElementById('pw-input').value='';
  document.getElementById('pw-error').textContent='';
  setTimeout(()=>document.getElementById('pw-input').focus(),100);
}

function closePasswordModal(){ document.getElementById('pw-overlay').classList.remove('show'); }

function checkPassword(){
  const val=document.getElementById('pw-input').value;
  if(val===CONSULTANT_PASSWORD){
    consultantUnlocked=true;
    closePasswordModal();
    document.getElementById('nav-tabs').style.display='';
    document.getElementById('tab-consultant').style.display='';
    document.getElementById('nav-lock').classList.add('unlocked');
    document.getElementById('nav-lock').title='Consultant dashboard unlocked';
    document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
    document.getElementById('view-consultant').classList.add('active');
    document.getElementById('tab-consultant').classList.add('active');
    if(state.submitted)populateConsultantDashboard();
  } else {
    const inp=document.getElementById('pw-input');
    inp.classList.add('error');
    document.getElementById('pw-error').textContent='Incorrect password. Please try again.';
    inp.value='';
    setTimeout(()=>{inp.classList.remove('error');inp.focus();},400);
  }
}

function switchView(v,e){
  if(v==='consultant'&&!consultantUnlocked){openPasswordModal();return;}
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  if(e&&e.currentTarget)e.currentTarget.classList.add('active');
  if(v==='consultant'&&state.submitted)populateConsultantDashboard();
}

// ═══════════════ LOAD FROM AIRTABLE ═══════════════
async function loadSubmissionsList(){
  const btn=document.getElementById('load-btn');
  const list=document.getElementById('submissions-list');
  const status=document.getElementById('load-status');
  btn.innerHTML='<span class="spinner"></span> Fetching…';
  btn.disabled=true;
  status.textContent='';
  list.style.display='none';
  try{
    const res=await fetch(
      'https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'?fields%5B%5D=org_name&fields%5B%5D=contact_name&fields%5B%5D=org_stage&fields%5B%5D=submitted_at&fields%5B%5D=status&sort%5B0%5D%5Bfield%5D=submitted_at&sort%5B0%5D%5Bdirection%5D=desc&filterByFormula='+encodeURIComponent('OR({status}="submitted",{status}="")'),
      {headers:{Authorization:'Bearer '+AIRTABLE_TOKEN}}
    );
    const data=await res.json();
    if(!data.records||data.records.length===0){
      status.textContent='No submissions found.';
      btn.innerHTML='⬇ Load from Airtable';btn.disabled=false;return;
    }
    list.innerHTML=data.records.map(r=>'<div onclick="loadSubmission(\''+r.id+'\')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);transition:background 0.15s;font-size:0.83rem;color:rgba(255,255,255,0.85)" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><div style="font-weight:600">'+(r.fields.org_name||'Unnamed')+'</div><div style="color:rgba(255,255,255,0.45);font-size:0.75rem;margin-top:2px">'+(r.fields.org_stage||'')+' · '+(r.fields.submitted_at||'')+'</div></div>').join('');
    list.style.display='block';
    btn.innerHTML='⬇ Load from Airtable';btn.disabled=false;
    status.textContent=data.records.length+' submission'+(data.records.length!==1?'s':'')+' found';
  }catch(err){
    status.textContent='Error connecting to Airtable.';
    btn.innerHTML='⬇ Load from Airtable';btn.disabled=false;
    console.error(err);
  }
}

async function loadSubmission(recordId){
  const status=document.getElementById('load-status');
  const list=document.getElementById('submissions-list');
  status.textContent='Loading…';
  list.style.display='none';
  try{
    const res=await fetch('https://api.airtable.com/v0/'+AIRTABLE_BASE+'/'+AIRTABLE_TABLE+'/'+recordId,{headers:{Authorization:'Bearer '+AIRTABLE_TOKEN}});
    const data=await res.json();
    if(!res.ok) throw new Error('Airtable API error '+res.status+': '+(data.error?.message||JSON.stringify(data)));
    if(!data.fields) throw new Error('No fields in response: '+JSON.stringify(data).slice(0,200));
    const f=data.fields;

    state.orgInfo={name:f.org_name||'',contact:f.contact_name||'',role:f.contact_role||'',email:f.contact_email||'',stage:f.org_stage||''};
    state.submitted=true;
    state.finalNotes=f.final_notes||'';
    state.extraLinks=f.extra_links?f.extra_links.split(', ').filter(Boolean):[];
    state.scores={};state.notes={};state.links={};

    consultantState.recordId=recordId;
    consultantState.scores={};consultantState.notes={};
    // Restore reviewer info from Airtable
    consultantState.reviewerName=f.consultant_reviewer||'';
    consultantState.reviewDate=f.consultant_review_date||'';

    // Load client scores/notes/links using reverse maps
    for(const[aField,stateKey]of Object.entries(REV_SCORE)){
      if(f[aField]!==undefined&&f[aField]!=='')state.scores[stateKey]=parseInt(f[aField]);
    }
    for(const[aField,stateKey]of Object.entries(REV_NOTES)){
      if(f[aField])state.notes[stateKey]=f[aField];
    }
    for(const[aField,stateKey]of Object.entries(REV_LINKS)){
      if(f[aField])state.links[stateKey]=f[aField];
    }

    // Load consultant scores/notes using reverse maps
    for(const[aField,stateKey]of Object.entries(REV_CS)){
      if(f[aField]!==undefined&&f[aField]!=='')consultantState.scores[stateKey]=parseInt(f[aField]);
    }
    for(const[aField,stateKey]of Object.entries(REV_CN)){
      if(f[aField])consultantState.notes[stateKey]=f[aField];
    }

    // Switch to consultant view and populate
    document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
    document.getElementById('view-consultant').classList.add('active');
    populateConsultantDashboard();

    // Restore reviewer name/date in UI (populateConsultantDashboard already does this, but ensure it's set)
    setTimeout(()=>{
      const nameEl=document.getElementById('consultant-name');
      if(nameEl&&consultantState.reviewerName) nameEl.value=consultantState.reviewerName;
      const ts=document.getElementById('review-timestamp');
      if(ts&&consultantState.reviewDate) ts.textContent=consultantState.reviewDate;
    },100);

    status.textContent='✓ Loaded: '+state.orgInfo.name;
    document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item')[0].classList.add('active');
    document.querySelectorAll('.consultant-panel').forEach(p=>p.style.display='none');
    document.getElementById('panel-overview').style.display='block';
  }catch(err){
    status.textContent='Error: '+err.message;
    console.error('loadSubmission error:',err);
  }
}

// ═══════════════ PRINT SUMMARY ═══════════════
function showPrintSummary(){
  const el=document.getElementById('print-summary');
  const container=document.getElementById('print-summary-content');
  const SCORE_LABELS={
    0:{label:'0 — Not in place',bg:'#FEE2E2',color:'#DC2626'},
    1:{label:'1 — Needs improvement',bg:'#FEF3C7',color:'#D97706'},
    2:{label:'2 — Good enough for now',bg:'#D1FAE5',color:'#059669'},
    3:{label:'3 — Great',bg:'#EEF2FF',color:'#3B37B3'},
  };
  const stage=state.orgInfo.stage?(STAGE_DEFS[state.orgInfo.stage]?.name||state.orgInfo.stage):'Not specified';
  let html='<div class="summary-org-header"><div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:10px">Organizational Health Assessment</div><div style="font-family:\'Cormorant Garamond\',serif;font-size:2rem;font-weight:700;margin-bottom:12px">'+(state.orgInfo.name||'Your Organization')+'</div><div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.87rem;color:rgba(255,255,255,0.7)">'+(state.orgInfo.contact?'<span>👤 '+state.orgInfo.contact+(state.orgInfo.role?', '+state.orgInfo.role:'')+'</span>':'')+(state.orgInfo.email?'<span>✉ '+state.orgInfo.email+'</span>':'')+'<span>📍 Stage: '+stage+'</span><span>📅 '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+'</span></div></div>';
  ORG_SYSTEMS.forEach(driver=>{
    const dScores=driver.items.map(i=>state.scores[driver.driver+'|'+i.name]).filter(s=>s!==undefined);
    const dAvg=dScores.length?(dScores.reduce((a,b)=>a+b,0)/dScores.length).toFixed(1):'—';
    const itemsHtml=driver.items.map(item=>{
      const key=driver.driver+'|'+item.name;
      const score=state.scores[key];const notes=state.notes[key]||'';const link=state.links[key]||'';
      if(score===undefined&&!notes&&!link)return'';
      const sl=score!==undefined?SCORE_LABELS[score]:null;
      return'<div class="summary-item"><div class="summary-item-name">'+item.name+'</div>'+(sl?'<span class="summary-item-score" style="background:'+sl.bg+';color:'+sl.color+'">'+sl.label+'</span>':'')+(notes?'<div class="summary-item-notes">'+notes+'</div>':'')+(link?'<div class="summary-item-link"><a href="'+link+'" target="_blank">'+link+'</a></div>':'')+'</div>';
    }).join('');
    if(!itemsHtml.trim())return;
    html+='<div class="summary-driver-block"><div class="summary-driver-header"><div class="summary-driver-title">'+driver.driver+'</div><div style="font-size:0.82rem;color:var(--mid);font-weight:600">Avg: '+dAvg+' / 3</div></div>'+itemsHtml+'</div>';
  });
  if(state.finalNotes||(state.extraLinks&&state.extraLinks.length>0)){
    html+='<div class="summary-final"><div style="font-family:\'Cormorant Garamond\',serif;font-size:1.2rem;font-weight:700;margin-bottom:16px;color:var(--brand)">Additional notes</div>'+(state.finalNotes?'<div style="font-size:0.9rem;color:var(--mid);line-height:1.65;margin-bottom:12px">'+state.finalNotes+'</div>':'')+(state.extraLinks&&state.extraLinks.length>0?'<div style="font-size:0.85rem">'+state.extraLinks.map(l=>'<div style="margin-bottom:4px"><a href="'+l+'" target="_blank" style="color:var(--brand)">'+l+'</a></div>').join('')+'</div>':'')+'</div>';
  }
  container.innerHTML=html;
  el.style.display='block';
  el.style.position='relative';
  el.style.zIndex='1';
  el.scrollIntoView({behavior:'smooth'});
}

function hidePrintSummary(){
  document.getElementById('print-summary').style.display='none';
  document.getElementById('success-screen').scrollIntoView({behavior:'smooth'});
}

// ═══════════════ INIT ═══════════════
buildDriverPages();
window.addEventListener('load',()=>{ loadSessionFromUrl(); });
</script>
</body>
</html>`;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};

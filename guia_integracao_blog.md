# Guia de Integração do Blog & Painel CMS Administrativo

Este guia contém toda a estrutura e os códigos necessários para você implementar a mesma área de Blog e o Painel de Controle CMS (baseados em `localStorage` e totalmente cliente-side) no outro site do Dr. Rafael França.

---

## 📂 Estrutura de Pastas e Arquivos

No outro projeto, certifique-se de ter a seguinte estrutura criada a partir da raiz:

```text
raiz/
├── admin/
│   ├── admin.css
│   ├── admin.js
│   ├── auth.js
│   └── index.html
├── css/
│   └── style.css
├── js/
│   ├── cms.js
│   └── main.js
├── blog.html
└── index.html
```

---

## 1. ⚙️ CMS Engine (`js/cms.js`)
Crie ou substitua o arquivo `js/cms.js` com o seguinte código. Ele gerencia o salvamento, leitura e exclusão de posts no navegador (`localStorage`), além de conter os posts padrões. 
*(Dica: se quiser, você pode alterar o array `DEFAULT_POSTS` abaixo para conter artigos sobre Direito Bancário)*.

```javascript
/**
 * cms.js — CMS Local Storage Engine
 * Rafael França Advocacia
 * 
 * Provides full CRUD for blog posts using localStorage.
 * The frontend reads from CMS_KEY, the admin panel writes to it.
 * Zero server dependency — fully client-side CMS.
 */

const CMS_KEY = 'rafaelFrancaCMS_posts';

const DEFAULT_POSTS = [
  {
    id: '1',
    title: 'Como funciona a ação contra juros abusivos em financiamentos de veículos?',
    excerpt: 'Descubra como a revisão contratual pode reduzir significativamente as parcelas do seu financiamento e afastar o risco de busca e apreensão.',
    content: `<p>Muitas pessoas assinam contratos de financiamento sem saber que as taxas cobradas estão muito acima da média permitida pelo Banco Central.</p>
<h3>O que caracteriza juros abusivos?</h3>
<p>Os tribunais entendem que uma taxa é abusiva quando supera substancialmente a taxa média de mercado divulgada pelo Banco Central na mesma época da contratação. Além disso, a cobrança de tarifas administrativas indevidas e seguros sem a opção de escolha livre do cliente (venda casada) também abrem espaço para a revisão.</p>
<h3>Como funciona o processo de revisão?</h3>
<ul>
  <li><strong>Análise técnica do contrato:</strong> Um cálculo pericial inicial demonstra a diferença entre o cobrado e o legal.</li>
  <li><strong>Ação revisional em juízo:</strong> Pleiteia-se a liminar para autorizar o depósito das parcelas no valor incontroverso e impedir a negativação.</li>
  <li><strong>Resultado final:</strong> Redução real do saldo devedor e compensação de valores pagos a maior.</li>
</ul>`,
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
    coverAlt: 'Documentos e balança da justiça simbolizando revisão de contratos',
    date: '2026-06-20',
    slug: 'como-funciona-acao-juros-abusivos-financiamento'
  },
  {
    id: '2',
    title: 'Busca e Apreensão de veículo: O que fazer de imediato?',
    excerpt: 'Recebeu a notificação ou o oficial de justiça levou seu bem? Saiba como agir dentro do prazo legal de 5 dias para recuperar seu veículo.',
    content: `<p>A ação de busca e apreensão de veículo é um dos procedimentos mais céleres do judiciário brasileiro. A partir do momento em que o veículo é apreendido, o relógio começa a correr.</p>
<h3>Quais são os prazos críticos?</h3>
<ol>
  <li><strong>5 dias para purgar a mora:</strong> Prazo para pagar o saldo devedor apontado pelo banco para ter o veículo de volta.</li>
  <li><strong>15 dias para apresentar a defesa (Contestação):</strong> Prazo para alegar abusividades contratuais, falta de notificação válida ou erro de cálculo do banco.</li>
</ol>
<p><strong>Atenção:</strong> Deixar de apresentar a defesa no prazo correto consolida a propriedade do bem em mãos da instituição financeira, impossibilitando sua recuperação futura. A atuação imediata de um advogado especialista é indispensável.</p>`,
    coverUrl: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=600&auto=format&fit=crop',
    coverAlt: 'Imagem conceitual de veículo sob apreensão',
    date: '2026-06-21',
    slug: 'busca-apreensao-veiculo-o-que-fazer-de-imediato'
  }
];

const CMS = {
  init() {
    const oldKey = 'rafaelMachadoCMS_posts';
    if (localStorage.getItem(oldKey) && !localStorage.getItem(CMS_KEY)) {
      localStorage.setItem(CMS_KEY, localStorage.getItem(oldKey));
      localStorage.removeItem(oldKey);
    }

    const stored = localStorage.getItem(CMS_KEY);
    if (!stored) {
      localStorage.setItem(CMS_KEY, JSON.stringify(DEFAULT_POSTS));
      return;
    }
    try {
      let posts = JSON.parse(stored);
      let updated = false;
      if (Array.isArray(posts)) {
        posts = posts.map(post => {
          const defaultPost = DEFAULT_POSTS.find(d => d.id === post.id);
          if (defaultPost && (!post.coverUrl || post.coverUrl.includes('photo-1587854692152-cbe660dbbab9'))) {
            post.coverUrl = defaultPost.coverUrl;
            updated = true;
          }
          return post;
        });
        if (updated) {
          localStorage.setItem(CMS_KEY, JSON.stringify(posts));
        }
      }
    } catch {
      localStorage.setItem(CMS_KEY, JSON.stringify(DEFAULT_POSTS));
    }
  },

  getPosts() {
    this.init();
    try {
      const raw = localStorage.getItem(CMS_KEY);
      let posts = JSON.parse(raw) || [];
      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      return DEFAULT_POSTS;
    }
  },

  getPost(id) {
    return this.getPosts().find(p => p.id === id) || null;
  },

  getPostBySlug(slug) {
    return this.getPosts().find(p => p.slug === slug) || null;
  },

  createPost(data) {
    const posts = this.getPosts();
    const newPost = {
      id: Date.now().toString(),
      title: data.title || 'Sem título',
      excerpt: data.excerpt || '',
      content: data.content || '',
      coverUrl: data.coverUrl || '',
      coverAlt: data.coverAlt || data.title || '',
      date: data.date || new Date().toISOString().split('T')[0],
      slug: data.slug || this._slugify(data.title),
    };
    posts.push(newPost);
    localStorage.setItem(CMS_KEY, JSON.stringify(posts));
    return newPost;
  },

  updatePost(id, data) {
    let posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;

    posts[idx] = {
      ...posts[idx],
      ...data,
      id,
      slug: data.slug || posts[idx].slug || this._slugify(data.title || posts[idx].title),
    };
    localStorage.setItem(CMS_KEY, JSON.stringify(posts));
    return posts[idx];
  },

  deletePost(id) {
    let posts = this.getPosts();
    const filtered = posts.filter(p => p.id !== id);
    if (filtered.length === posts.length) return false;
    localStorage.setItem(CMS_KEY, JSON.stringify(filtered));
    return true;
  },

  _slugify(text = '') {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
  }
};

window.CMS = CMS;
```

---

## 2. 🔐 Segurança e Login (`admin/auth.js`)
Crie o arquivo `admin/auth.js`. Ele protege o painel através de um hash seguro de senha (a senha padrão é `@Rafa@26`, e o script suporta tentativas limitadas e bloqueio temporário por excesso de erros).

```javascript
/**
 * auth.js — Proteção de Acesso ao Painel CMS
 * Rafael França Advocacia
 */

'use strict';

const CMS_AUTH = (() => {

  const STORED_HASH_KEY = 'rafaelCMS_auth_hash';
  const SESSION_KEY     = 'rafaelCMS_auth_ok';
  const ATTEMPT_KEY     = 'rafaelCMS_auth_attempts';
  const LOCKOUT_KEY     = 'rafaelCMS_auth_lockout';
  const MAX_ATTEMPTS    = 5;
  const LOCKOUT_MS      = 30 * 60 * 1000; // 30 minutos

  // Hash SHA-256 de "@Rafa@26"
  const DEFAULT_HASH = '28261c4032ad4b422977d24188d39473295f0a09843378ed297b9871fe3d45d5';

  async function sha256(str) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredHash() {
    return localStorage.getItem(STORED_HASH_KEY) || DEFAULT_HASH;
  }

  function isLocked() {
    const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return Date.now() < lockUntil;
  }

  function getLockRemaining() {
    const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const ms = lockUntil - Date.now();
    if (ms <= 0) return null;
    const min = Math.ceil(ms / 60000);
    return `${min} minuto${min !== 1 ? 's' : ''}`;
  }

  function getAttempts() {
    return parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10);
  }

  function incrementAttempts() {
    const n = getAttempts() + 1;
    localStorage.setItem(ATTEMPT_KEY, n);
    if (n >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS);
      localStorage.setItem(ATTEMPT_KEY, '0');
    }
    return n;
  }

  function resetAttempts() {
    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function setSession() {
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function setPassword(newPassword) {
    const hash = await sha256(newPassword);
    localStorage.setItem(STORED_HASH_KEY, hash);
    console.log('%c✅ Senha atualizada com sucesso!', 'color:#4CAF78;font-weight:bold;');
    console.log('%cHash SHA-256:', 'color:#C3A166;', hash);
    return hash;
  }

  async function verify(password) {
    const hash = await sha256(password);
    return hash === getStoredHash();
  }

  function logout() {
    clearSession();
    location.reload();
  }

  return { isAuthenticated, setSession, clearSession, verify, isLocked, getLockRemaining, incrementAttempts, resetAttempts, getAttempts, MAX_ATTEMPTS, logout, setPassword };

})();
```

---

## 3. 📄 Interface do Painel (`admin/index.html`)
Crie o arquivo `admin/index.html`. É a interface unificada contendo a tela de login, a listagem de posts com filtro, e a tela de edição em tela dividida com visualização ao vivo da escrita.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Painel CMS — Rafael França Advocacia</title>
  <meta name="robots" content="noindex, nofollow"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="admin.css?v=2.0.3"/>
</head>
<body>
<div class="admin-wrapper">

  <!-- SIDEBAR -->
  <aside class="admin-sidebar" id="admin-sidebar" role="complementary" aria-label="Painel de navegação">
    <div class="sidebar-brand">
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
        <path d="M14 0L0 5.5V16C0 23.5 6.2 30.3 14 32C21.8 30.3 28 23.5 28 16V5.5L14 0Z" fill="url(#sg)"/>
        <path d="M9 16.5L12.5 20L19 13" stroke="#1E2028" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="sg" x1="0" y1="0" x2="28" y2="32"><stop stop-color="#D4AF6A"/><stop offset="1" stop-color="#8B6914"/></linearGradient></defs>
      </svg>
      <div>
        <span class="brand-name">Rafael França</span>
        <span class="brand-sub">Painel do Blog</span>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Menu do painel">
      <button class="sidebar-btn active" id="btn-list" data-view="list">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Todos os Artigos
        <span class="sidebar-badge" id="posts-count">0</span>
      </button>
      <button class="sidebar-btn" id="btn-new" data-view="editor">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Artigo
      </button>
      <div class="sidebar-sep" aria-hidden="true"></div>
      <button class="sidebar-btn sidebar-btn--sm" id="btn-export">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar Backup
      </button>
      <label class="sidebar-btn sidebar-btn--sm" id="btn-import-label" style="cursor:pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Importar Backup
        <input type="file" id="btn-import" accept=".json" style="display:none;" aria-label="Importar arquivo de backup JSON"/>
      </label>
    </nav>

    <div class="sidebar-actions">
      <a href="../blog.html" class="sidebar-action sidebar-action--site" target="_blank" rel="noopener noreferrer" title="Abrir o Blog">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Voltar ao Blog
      </a>
      <button class="sidebar-action sidebar-action--logout" id="btn-logout" title="Sair do painel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sair
      </button>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="admin-main" role="main" id="admin-main">

    <!-- LIST VIEW -->
    <div id="view-list" class="admin-view active">
      <header class="view-header">
        <div>
          <h1 class="view-title">Artigos do Blog</h1>
          <p class="view-sub">Crie, edite e gerencie os posts que aparecem no site</p>
        </div>
        <button class="btn-primary" id="new-post-btn" aria-label="Criar novo artigo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Artigo
        </button>
      </header>

      <!-- Search bar -->
      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" id="search-input" placeholder="Buscar artigos pelo título ou resumo…" aria-label="Buscar artigos"/>
        <kbd class="search-kbd" aria-hidden="true">⌘K</kbd>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar" id="stats-bar" aria-live="polite"></div>

      <div id="posts-list" class="posts-list" role="list" aria-label="Lista de artigos">
        <!-- Rendered by JS -->
      </div>
    </div>

    <!-- EDITOR VIEW -->
    <div id="view-editor" class="admin-view">
      <header class="view-header editor-view-header">
        <div class="editor-header-left">
          <button class="btn-back" id="cancel-btn" aria-label="Voltar para a lista">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="view-title" id="editor-title">Novo Artigo</h1>
            <div class="editor-meta-status">
              <span class="save-status" id="save-status" aria-live="polite">
                <span class="save-dot"></span>
                <span id="save-status-text">Não salvo</span>
              </span>
              <span class="word-count" id="word-count" aria-live="polite">0 palavras</span>
            </div>
          </div>
        </div>
        <div class="editor-header-actions">
          <button class="btn-icon-toggle" id="preview-toggle" title="Alternar preview (Ctrl+Shift+P)" aria-label="Alternar modo de preview" aria-pressed="false">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
          <button class="btn-primary" id="save-btn-top" type="button" aria-label="Salvar artigo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar
          </button>
        </div>
      </header>

      <div class="editor-layout" id="editor-layout">

        <!-- FORM PANEL -->
        <div class="editor-panel form-panel" id="form-panel">
          <form id="post-form" class="post-form" novalidate>
            <input type="hidden" id="post-id"/>

            <!-- Title -->
            <div class="form-group form-group--title">
              <label class="form-label sr-only" for="post-title">Título do Artigo</label>
              <input
                type="text"
                id="post-title"
                class="form-input title-input"
                placeholder="Título do artigo…"
                required
                aria-required="true"
                maxlength="200"
                autocomplete="off"
              />
              <div class="title-char-count"><span id="title-counter">0</span>/200</div>
            </div>

            <!-- Excerpt -->
            <div class="form-group">
              <label class="form-label" for="post-excerpt">
                Resumo
                <span class="label-badge">Aparece na listagem do blog</span>
              </label>
              <textarea
                id="post-excerpt"
                class="form-textarea"
                rows="3"
                placeholder="Uma descrição breve e persuasiva que convida o leitor a clicar…"
                required
                aria-required="true"
                maxlength="400"
              ></textarea>
              <div class="textarea-footer">
                <span class="form-hint">
                  <span id="excerpt-counter" class="counter-num">0</span>/400 caracteres
                </span>
                <span class="form-hint" id="excerpt-status"></span>
              </div>
            </div>

            <!-- Rich text editor -->
            <div class="form-group editor-group">
              <div class="editor-label-row">
                <label class="form-label">Conteúdo do Artigo</label>
                <div class="editor-view-tabs" role="tablist" aria-label="Modo de edição">
                  <button type="button" class="view-tab active" id="tab-editor" role="tab" aria-selected="true" aria-controls="post-content-editor">Editar</button>
                  <button type="button" class="view-tab" id="tab-preview-inline" role="tab" aria-selected="false" aria-controls="content-preview-inline">Pré-visualizar</button>
                </div>
              </div>

              <!-- Toolbar -->
              <div class="editor-toolbar" role="toolbar" aria-label="Ferramentas de formatação de texto">
                <div class="toolbar-group" role="group" aria-label="Texto">
                  <button type="button" class="toolbar-btn" data-cmd="bold" title="Negrito (Ctrl+B)" aria-label="Negrito">
                    <b>B</b>
                  </button>
                  <button type="button" class="toolbar-btn" data-cmd="italic" title="Itálico (Ctrl+I)" aria-label="Itálico">
                    <i>I</i>
                  </button>
                  <button type="button" class="toolbar-btn" data-cmd="underline" title="Sublinhado (Ctrl+U)" aria-label="Sublinhado">
                    <u>U</u>
                  </button>
                  <button type="button" class="toolbar-btn" data-cmd="removeFormat" title="Limpar formatação" aria-label="Limpar formatação">
                    T<sub>x</sub>
                  </button>
                </div>

                <div class="toolbar-sep" aria-hidden="true"></div>

                <div class="toolbar-group" role="group" aria-label="Títulos">
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="h2" title="Título (H2)" aria-label="Título H2">H2</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="h3" title="Subtítulo (H3)" aria-label="Subtítulo H3">H3</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="p" title="Parágrafo" aria-label="Parágrafo">P</button>
                </div>

                <div class="toolbar-sep" aria-hidden="true"></div>

                <div class="toolbar-group" role="group" aria-label="Listas">
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="insertUnorderedList" title="Marcadores" aria-label="Lista Marcadores">• Lista</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="insertOrderedList" title="Numeração" aria-label="Lista Numerada">1. Lista</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="blockquote" title="Citação" aria-label="Citação">“ Citação</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="hr" title="Linha Separadora" aria-label="Divisor">Divisor</button>
                </div>

                <div class="toolbar-sep" aria-hidden="true"></div>

                <div class="toolbar-group" role="group" aria-label="Mídia e Links">
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="createLink" title="Inserir link" aria-label="Inserir link">Link</button>
                  <button type="button" class="toolbar-btn toolbar-btn--text" data-cmd="unlink" title="Remover link" aria-label="Remover link">Remover Link</button>
                </div>

                <div class="toolbar-spacer" aria-hidden="true"></div>

                <button type="button" class="toolbar-btn toolbar-btn--right" id="fullscreen-editor" title="Expandir editor (F11)" aria-label="Editor em tela cheia">
                  Tela Cheia
                </button>
              </div>

              <!-- Editor area -->
              <div
                id="post-content-editor"
                class="rich-editor"
                contenteditable="true"
                role="textbox"
                aria-multiline="true"
                aria-label="Conteúdo do artigo"
                data-placeholder="Comece a escrever o conteúdo do artigo…&#10;&#10;Use a barra de ferramentas acima para formatar."
                spellcheck="true"
                lang="pt-BR"
              ></div>

              <!-- Inline preview (tab) -->
              <div id="content-preview-inline" class="content-preview-panel" hidden></div>
            </div>

            <!-- CONFIGURATIONS ACCORDION -->
            <div class="meta-accordion">
              <button type="button" class="meta-accordion-toggle" id="meta-toggle" aria-expanded="true" aria-controls="meta-body">
                Configurações & Metadados
                <svg class="accordion-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div id="meta-body" class="meta-accordion-body">

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="post-date">Data de Publicação</label>
                    <input type="date" id="post-date" class="form-input" required aria-required="true"/>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="post-slug">Slug (URL do artigo)</label>
                    <div class="slug-field">
                      <span class="slug-prefix" aria-hidden="true">/blog/</span>
                      <input type="text" id="post-slug" class="form-input slug-input" placeholder="gerado-automaticamente"/>
                    </div>
                  </div>
                </div>

                <!-- Cover image -->
                <div class="form-group cover-group">
                  <label class="form-label">Imagem de Capa</label>
                  <div class="cover-input-area" id="cover-input-area">
                    <div class="cover-dropzone" id="cover-dropzone" role="button" tabindex="0" aria-label="Arraste uma imagem ou clique para fazer upload">
                      <div class="dropzone-inner" id="dropzone-inner">
                        <p>Arraste uma imagem aqui ou <strong>clique para selecionar</strong></p>
                        <span class="dropzone-hint">PNG, JPG, WEBP · Salva como Base64</span>
                      </div>
                      <input type="file" id="cover-file-input" accept="image/*" style="display:none;" aria-hidden="true"/>
                    </div>
                    <div class="cover-or" aria-hidden="true"><span>ou use URL</span></div>
                    <div class="cover-url-row">
                      <input type="url" id="post-cover-url" class="form-input" placeholder="https://exemplo.com/imagem.jpg"/>
                      <button type="button" class="btn-ghost btn-sm" id="btn-clear-cover" aria-label="Limpar imagem de capa">Limpar</button>
                    </div>
                    <div id="cover-preview" class="cover-preview" aria-live="polite"></div>
                  </div>
                </div>

              </div>
            </div>

            <!-- BOTTOM ACTIONS -->
            <div class="form-actions">
              <button type="button" class="btn-ghost" id="cancel-btn-2">Descartar e Voltar</button>
              <div class="form-actions-right">
                <span class="save-status" id="save-status-bottom" aria-hidden="true">
                  <span class="save-dot"></span>
                  <span id="save-status-text-bottom">Não salvo</span>
                </span>
                <button type="submit" class="btn-primary btn-lg" id="save-btn" form="post-form">Salvar Artigo</button>
              </div>
            </div>
          </form>
        </div>

        <!-- PREVIEW PANEL (split mode) -->
        <div class="editor-panel preview-panel" id="preview-panel" hidden aria-label="Painel de pré-visualização">
          <div class="preview-panel-header">
            <span class="preview-label">Pré-visualização do artigo</span>
            <span class="preview-hint">Atualiza conforme você escreve</span>
          </div>
          <div class="preview-content" id="preview-content"></div>
        </div>

      </div>
    </div>

  </main>
</div>

<!-- Toast container -->
<div id="toast-container" aria-live="assertive" aria-atomic="false"></div>

<!-- LOGIN SCREEN -->
<div id="login-screen" class="login-screen" role="dialog" aria-modal="true" aria-labelledby="login-title" hidden>
  <div class="login-card">
    <h1 class="login-title" id="login-title">Painel Restrito</h1>
    <p class="login-sub">Rafael França Advocacia — acesso exclusivo</p>
    <form id="login-form" class="login-form" novalidate autocomplete="off">
      <div class="login-field">
        <label class="login-label" for="login-password">Senha de acesso</label>
        <div class="login-input-wrap">
          <input
            type="password"
            id="login-password"
            class="login-input"
            placeholder="Digite sua senha…"
            aria-required="true"
            autocomplete="current-password"
            autofocus
          />
          <button type="button" class="login-eye" id="login-eye" aria-label="Mostrar/ocultar senha">Ver</button>
        </div>
        <p class="login-error" id="login-error" role="alert" aria-live="assertive"></p>
      </div>
      <div class="login-attempts" id="login-attempts" aria-live="polite"></div>
      <button type="submit" class="login-btn" id="login-btn">
        <span id="login-btn-text">Entrar no Painel</span>
      </button>
    </form>
    <p class="login-footer">Acesso bloqueado após 5 tentativas incorretas.</p>
    <a href="../index.html" class="login-back-link">← Voltar ao Site Principal</a>
  </div>
</div>

<!-- Confirm Delete Modal -->
<div id="confirm-modal" class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" hidden>
  <div class="confirm-box">
    <h2 class="confirm-title" id="confirm-title">Excluir artigo?</h2>
    <p class="confirm-text" id="confirm-text">Esta ação não pode ser desfeita. O artigo será removido permanentemente do blog.</p>
    <div class="confirm-actions">
      <button class="btn-ghost" id="confirm-no">Cancelar</button>
      <button class="btn-danger" id="confirm-yes">Excluir</button>
    </div>
  </div>
</div>

<!-- Link dialog -->
<div id="link-dialog" class="link-dialog" role="dialog" aria-modal="true" aria-labelledby="link-dialog-title" hidden>
  <div class="link-dialog-box">
    <h3 class="link-dialog-title" id="link-dialog-title">Inserir Link</h3>
    <input type="url" id="link-url-input" class="form-input" placeholder="https://exemplo.com" aria-label="URL do link"/>
    <input type="text" id="link-text-input" class="form-input" placeholder="Texto do link (opcional)" aria-label="Texto do link"/>
    <div class="link-dialog-actions">
      <button class="btn-ghost btn-sm" id="link-cancel">Cancelar</button>
      <button class="btn-primary btn-sm" id="link-confirm">Inserir</button>
    </div>
  </div>
</div>

<script src="../js/cms.js?v=2.0.3"></script>
<script src="auth.js?v=2.0.3"></script>
<script src="admin.js?v=2.0.3"></script>
</body>
</html>
```

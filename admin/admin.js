/**
 * admin.js — CMS Admin Panel v2
 * Rafael França Advocacia
 *
 * Features:
 * - Full CRUD via CMS engine
 * - Rich text toolbar (bold, italic, h2, h3, lists, blockquote, link, undo/redo)
 * - Split-view live preview
 * - Inline tab preview (Edit / Pré-visualizar)
 * - Fullscreen editor mode
 * - Drag & drop + file upload (Base64) for cover image
 * - Word count & title char count
 * - Unsaved-changes indicator (Ctrl+S to save)
 * - Search & filter posts
 * - Export / Import JSON backup
 * - Meta accordion (date, slug, cover)
 * - Link dialog with text+URL
 */

'use strict';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let currentView    = 'list';
let editingId      = null;
let pendingDeleteId= null;
let isDirty        = false;
let savedSelection = null;
let isFullscreen   = false;
let isPreviewOpen  = false;

// ═══════════════════════════════════════════════════════════
// INIT
// ── AUTH GATE ─────────────────────────────────────────────
// Runs immediately — blocks panel until password verified
(async function authGate() {

  // Wait for DOM
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }

  const screen    = document.getElementById('login-screen');
  const form      = document.getElementById('login-form');
  const input     = document.getElementById('login-password');
  const errorEl   = document.getElementById('login-error');
  const attemptsEl= document.getElementById('login-attempts');
  const btn       = document.getElementById('login-btn');
  const btnText   = document.getElementById('login-btn-text');
  const spinner   = document.getElementById('login-spinner');
  const eyeBtn    = document.getElementById('login-eye');
  const wrapper   = document.querySelector('.admin-wrapper');

  function showLoginScreen() {
    if (wrapper) wrapper.style.display = 'none';
    if (screen)  screen.removeAttribute('hidden');
    if (input)   setTimeout(() => input.focus(), 100);
    updateLockUI();
  }

  function hideLoginScreen() {
    if (screen)  screen.setAttribute('hidden', '');
    if (wrapper) wrapper.style.display = '';
  }

  function updateLockUI() {
    const card = document.querySelector('.login-card');
    if (!card || !attemptsEl) return;

    if (CMS_AUTH.isLocked()) {
      card.classList.add('login-locked');
      const remaining = CMS_AUTH.getLockRemaining();
      attemptsEl.innerHTML = `
        <div class="login-lockout-msg">
          🔒 Acesso bloqueado por excesso de tentativas.<br>
          Tente novamente em <strong>${remaining}</strong>.
        </div>`;
      return;
    }

    card.classList.remove('login-locked');
    const attempts = CMS_AUTH.getAttempts();
    if (attempts > 0) {
      const left = CMS_AUTH.MAX_ATTEMPTS - attempts;
      attemptsEl.textContent = `Tentativa ${attempts}/${CMS_AUTH.MAX_ATTEMPTS} — ${left} restante${left !== 1 ? 's' : ''} antes do bloqueio`;
    } else {
      attemptsEl.textContent = '';
    }
  }

  function setLoading(on) {
    if (!btn || !btnText || !spinner) return;
    btn.disabled = on;
    spinner.hidden = !on;
    btnText.textContent = on ? 'Verificando…' : 'Entrar no Painel';
  }

  function showError(msg) {
    if (!errorEl || !input) return;
    errorEl.textContent = msg;
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 500);
  }

  // Password visibility toggle
  eyeBtn?.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    eyeBtn.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
  });

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (CMS_AUTH.isLocked()) {
      updateLockUI();
      return;
    }

    const pwd = input.value;
    if (!pwd) {
      showError('Digite sua senha para continuar.');
      input.focus();
      return;
    }

    setLoading(true);
    const ok = await CMS_AUTH.verify(pwd);
    setLoading(false);

    if (ok) {
      CMS_AUTH.setSession();
      CMS_AUTH.resetAttempts();
      input.value = '';
      hideLoginScreen();
    } else {
      const n = CMS_AUTH.incrementAttempts();
      updateLockUI();
      if (CMS_AUTH.isLocked()) {
        showError('Acesso bloqueado. Tente novamente em 30 minutos.');
      } else {
        showError('Senha incorreta. Verifique e tente novamente.');
      }
      input.value = '';
      input.focus();
    }
  });

  // Check if already authenticated
  if (CMS_AUTH.isAuthenticated()) {
    hideLoginScreen();
  } else {
    showLoginScreen();
  }

  // Logout button
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    CMS_AUTH.logout();
  });

})();

// ── INIT ─────────────────────────────────────────────────
function init() {
  renderList();
  initSidebar();
  initForm();
  initToolbar();
  initEditorTabs();
  initCoverArea();
  initConfirmModal();
  initLinkDialog();
  initKeyboardShortcuts();
  initExportImport();
  initPreviewToggle();
  initMetaAccordion();
  initSearch();
  showView('list');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ═══════════════════════════════════════════════════════════
// VIEW SWITCHING
// ═══════════════════════════════════════════════════════════
function showView(name) {
  currentView = name;

  document.querySelectorAll('.admin-view').forEach(el => {
    el.classList.toggle('active', el.id === `view-${name}`);
  });

  const btnList = document.getElementById('btn-list');
  const btnNew  = document.getElementById('btn-new');

  btnList?.classList.toggle('active', name === 'list');
  btnNew?.classList.toggle('active', name === 'editor');

  if (name === 'list') updatePostsCount();
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════
function initSidebar() {
  document.getElementById('btn-list')?.addEventListener('click', () => goToList());
  document.getElementById('btn-new')?.addEventListener('click', () => openEditor(null));
  document.getElementById('new-post-btn')?.addEventListener('click', () => openEditor(null));
  document.getElementById('cancel-btn')?.addEventListener('click', () => goToList());
  document.getElementById('cancel-btn-2')?.addEventListener('click', () => goToList());
}

function goToList() {
  if (isDirty) {
    if (!confirm('Há alterações não salvas. Deseja descartar e sair?')) return;
  }
  editingId = null;
  isDirty   = false;
  renderList();
  showView('list');
  closePreview();
}

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════
function renderList(filter = '') {
  const container = document.getElementById('posts-list');
  const statsBar  = document.getElementById('stats-bar');
  if (!container) return;

  let posts = CMS.getPosts();
  const total = posts.length;

  if (filter) {
    const q = filter.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q)
    );
  }

  if (statsBar) {
    statsBar.textContent = filter
      ? `${posts.length} resultado${posts.length !== 1 ? 's' : ''} para "${filter}" de ${total} artigos`
      : `${total} artigo${total !== 1 ? 's' : ''} publicado${total !== 1 ? 's' : ''}`;
  }

  updatePostsCount(total);

  if (!posts.length) {
    container.innerHTML = buildEmptyState(filter);
    return;
  }

  container.innerHTML = '';
  posts.forEach(post => {
    container.appendChild(buildPostRow(post));
  });
  function buildEmptyState(filter) {
  if (filter) {
    return `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <div><strong>Nenhum resultado</strong><p>Nenhum artigo encontrado para "${esc(filter)}".</p></div>
    </div>`;
  }
  return `<div class="empty-state">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    <div><strong>Nenhum artigo ainda</strong><p>Crie o primeiro artigo para o blog.</p></div>
    <button class="btn-primary" onclick="document.getElementById('new-post-btn').click()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Criar Artigo
    </button>
  </div>`;
}
}

function buildPostRow(post) {
  const row = document.createElement('div');
  row.className = 'post-row';
  row.setAttribute('role', 'listitem');

  const thumb = post.coverUrl
    ? `<img src="${esc(post.coverUrl)}" alt="${esc(post.coverAlt || post.title)}" loading="lazy" onerror="showFallbackThumb(this)"/>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C3A166" stroke-width="1.5" opacity="0.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

  row.innerHTML = `
    <div class="post-row-thumb" aria-hidden="true">${thumb}</div>
    <div class="post-row-info">
      <div class="post-row-title">${esc(post.title)}</div>
      <div class="post-row-excerpt">${esc(post.excerpt || '—')}</div>
      <div class="post-row-date">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formatDateBR(post.date)}
      </div>
    </div>
    <div class="post-row-actions">
      <button class="action-btn edit" data-id="${esc(post.id)}" aria-label="Editar: ${esc(post.title)}" title="Editar artigo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="action-btn delete" data-id="${esc(post.id)}" aria-label="Excluir: ${esc(post.title)}" title="Excluir artigo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
      </button>
    </div>`;

  row.querySelector('.edit').addEventListener('click', () => openEditor(post.id));
  row.querySelector('.delete').addEventListener('click', () => confirmDelete(post.id, post.title));
  return row;
}

function updatePostsCount(n) {
  const badge = document.getElementById('posts-count');
  if (badge) badge.textContent = n ?? CMS.getPosts().length;
}

// ═══════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderList(input.value.trim()), 200);
  });
}

// ═══════════════════════════════════════════════════════════
// EDITOR OPEN / RESET
// ═══════════════════════════════════════════════════════════
function openEditor(id) {
  const post = id ? CMS.getPost(id) : null;
  editingId = post?.id ?? null;
  isDirty   = false;

  // Populate form
  const $ = id => document.getElementById(id);
  $('post-id').value          = post?.id ?? '';
  $('post-title').value       = post?.title ?? '';
  $('post-date').value        = post?.date ?? todayISO();
  $('post-slug').value        = post?.slug ?? '';
  $('post-excerpt').value     = post?.excerpt ?? '';
  $('post-cover-url').value   = post?.coverUrl ?? '';

  const editor = $('post-content-editor');
  if (editor) {
    editor.innerHTML = post?.content ?? '';
    editor.focus();
  }

  updateCharCount($('post-title'), $('title-counter'), 200);
  updateExcerptCounter();
  updateWordCount();
  updateCoverPreview(post?.coverUrl ?? '');

  $('editor-title').textContent = post ? 'Editar Artigo' : 'Novo Artigo';

  setSaveStatus('unsaved');

  // Switch editor tab back to edit mode
  switchEditorTab('editor');

  // Reset preview panel
  updateLivePreview();

  showView('editor');
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════
// FORM
// ═══════════════════════════════════════════════════════════
function initForm() {
  document.getElementById('post-form')?.addEventListener('submit', handleSave);

  // Save from top button
  document.getElementById('save-btn-top')?.addEventListener('click', () => {
    document.getElementById('post-form')?.requestSubmit();
  });

  // Title counter
  const titleInput = document.getElementById('post-title');
  titleInput?.addEventListener('input', () => {
    updateCharCount(titleInput, document.getElementById('title-counter'), 200);
    updateSlugFromTitle();
    markDirty();
    updateLivePreview();
  });

  // Excerpt counter
  const excerptTA = document.getElementById('post-excerpt');
  excerptTA?.addEventListener('input', () => {
    updateExcerptCounter();
    markDirty();
    updateLivePreview();
  });

  // Editor changes
  document.getElementById('post-content-editor')?.addEventListener('input', () => {
    updateWordCount();
    markDirty();
    updateLivePreview();
  });

  // Date changes
  document.getElementById('post-date')?.addEventListener('change', () => {
    markDirty();
    updateLivePreview();
  });

  // Slug customized flag
  const slugInput = document.getElementById('post-slug');
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.customized = slugInput.value.length > 0 ? 'true' : 'false';
  });
}

function handleSave(e) {
  e.preventDefault();

  const title   = document.getElementById('post-title').value.trim();
  const date    = document.getElementById('post-date').value;
  const slug    = document.getElementById('post-slug').value.trim();
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const content = document.getElementById('post-content-editor').innerHTML;
  const coverUrl= document.getElementById('post-cover-url').value.trim();

  // Validation
  if (!title)   { toast('O título é obrigatório.', 'error'); document.getElementById('post-title').focus(); return; }
  if (!excerpt) { toast('O resumo é obrigatório.', 'error'); document.getElementById('post-excerpt').focus(); return; }
  if (!date)    { toast('A data de publicação é obrigatória.', 'error'); document.getElementById('post-date').focus(); return; }

  const data = { title, date, slug, excerpt, content, coverUrl, coverAlt: title };

  if (editingId) {
    CMS.updatePost(editingId, data);
    toast('Artigo atualizado com sucesso!', 'success');
  } else {
    const created = CMS.createPost(data);
    editingId = created.id;
    document.getElementById('post-id').value = created.id;
    toast('Artigo criado com sucesso!', 'success');
  }

  isDirty = false;
  setSaveStatus('saved');
  updatePostsCount();

  // Redirect back to dashboard list view after 1 second
  setTimeout(() => {
    goToList();
  }, 1000);
}

// ═══════════════════════════════════════════════════════════
// SLUG
// ═══════════════════════════════════════════════════════════
function updateSlugFromTitle() {
  const slugInput = document.getElementById('post-slug');
  if (!slugInput || slugInput.dataset.customized === 'true') return;
  slugInput.value = CMS._slugify(document.getElementById('post-title').value);
}

// Slug customized flag listener has been merged into initForm()

// ═══════════════════════════════════════════════════════════
// COUNTERS & STATUS
// ═══════════════════════════════════════════════════════════
function updateCharCount(input, counter, max) {
  if (!input || !counter) return;
  counter.textContent = input.value.length;
  counter.style.color = input.value.length > max * 0.9 ? 'var(--c-warning)' : '';
}

function updateExcerptCounter() {
  const ta  = document.getElementById('post-excerpt');
  const cnt = document.getElementById('excerpt-counter');
  const st  = document.getElementById('excerpt-status');
  if (!ta || !cnt) return;
  const len = ta.value.length;
  cnt.textContent = len;
  cnt.style.color = len > 360 ? 'var(--c-warning)' : '';
  if (st) {
    st.textContent = len < 80 ? 'Resumo muito curto — recomendado: 120–300 chars' : '';
    st.style.color = 'var(--c-warning)';
  }
}

function updateWordCount() {
  const editor = document.getElementById('post-content-editor');
  const wc1    = document.getElementById('word-count');
  if (!editor || !wc1) return;
  const text  = editor.innerText || '';
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readMin = Math.ceil(words / 200);
  wc1.textContent = `${words} palavra${words !== 1 ? 's' : ''} · ~${readMin} min de leitura`;
}

function markDirty() {
  if (!isDirty) {
    isDirty = true;
    setSaveStatus('unsaved');
  }
}

function setSaveStatus(state) {
  // state: 'unsaved' | 'saved'
  const statuses = document.querySelectorAll('.save-status');
  statuses.forEach(el => {
    el.classList.toggle('unsaved', state === 'unsaved');
    el.classList.toggle('saved', state === 'saved');
  });
  const texts = document.querySelectorAll('[id^="save-status-text"]');
  texts.forEach(el => {
    el.textContent = state === 'saved' ? 'Salvo' : 'Não salvo';
  });
}

// ═══════════════════════════════════════════════════════════
// TOOLBAR
// ═══════════════════════════════════════════════════════════
function initToolbar() {
  document.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault(); // don't blur editor
      execCmd(btn.dataset.cmd);
    });
  });

  // Track active state on selection change
  document.getElementById('post-content-editor')?.addEventListener('keyup', syncToolbarState);
  document.getElementById('post-content-editor')?.addEventListener('mouseup', syncToolbarState);

  // Fullscreen
  document.getElementById('fullscreen-editor')?.addEventListener('click', toggleFullscreen);
}

function execCmd(cmd) {
  const editor = document.getElementById('post-content-editor');
  if (!editor) return;
  editor.focus();

  switch (cmd) {
    case 'h2':
      document.execCommand('formatBlock', false, '<h2>');
      break;
    case 'h3':
      document.execCommand('formatBlock', false, '<h3>');
      break;
    case 'p':
      document.execCommand('formatBlock', false, '<p>');
      break;
    case 'blockquote':
      document.execCommand('formatBlock', false, '<blockquote>');
      break;
    case 'hr':
      document.execCommand('insertHTML', false, '<hr/>');
      break;
    case 'createLink':
      openLinkDialog();
      break;
    case 'unlink':
      document.execCommand('unlink', false, null);
      break;
    default:
      document.execCommand(cmd, false, null);
  }
  markDirty();
  updateWordCount();
  updateLivePreview();
  syncToolbarState();
}

function syncToolbarState() {
  const cmdsToCheck = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
  cmdsToCheck.forEach(cmd => {
    const btn = document.querySelector(`.toolbar-btn[data-cmd="${cmd}"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

function toggleFullscreen() {
  const editor = document.getElementById('post-content-editor');
  const btn    = document.getElementById('fullscreen-editor');
  if (!editor) return;

  isFullscreen = !isFullscreen;
  editor.classList.toggle('fullscreen', isFullscreen);

  if (btn) {
    btn.innerHTML = isFullscreen
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    btn.title = isFullscreen ? 'Sair de tela cheia (Esc)' : 'Editor em tela cheia (F11)';
  }

  if (isFullscreen) {
    editor.focus();
    document.addEventListener('keydown', exitFullscreenOnEsc);
  } else {
    document.removeEventListener('keydown', exitFullscreenOnEsc);
  }
}

function exitFullscreenOnEsc(e) {
  if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
}

// ═══════════════════════════════════════════════════════════
// EDITOR TABS (Editar / Pré-visualizar)
// ═══════════════════════════════════════════════════════════
function initEditorTabs() {
  document.getElementById('tab-editor')?.addEventListener('click', () => switchEditorTab('editor'));
  document.getElementById('tab-preview-inline')?.addEventListener('click', () => switchEditorTab('preview'));
}

function switchEditorTab(tab) {
  const editorEl  = document.getElementById('post-content-editor');
  const previewEl = document.getElementById('content-preview-inline');
  const tabEdit   = document.getElementById('tab-editor');
  const tabPrev   = document.getElementById('tab-preview-inline');
  const toolbar   = document.querySelector('.editor-toolbar');
  if (!editorEl || !previewEl) return;

  if (tab === 'editor') {
    editorEl.removeAttribute('hidden');
    previewEl.setAttribute('hidden', '');
    tabEdit?.classList.add('active');
    tabEdit?.setAttribute('aria-selected', 'true');
    tabPrev?.classList.remove('active');
    tabPrev?.setAttribute('aria-selected', 'false');
    toolbar?.removeAttribute('hidden');
    editorEl.focus();
  } else {
    previewEl.removeAttribute('hidden');
    editorEl.setAttribute('hidden', '');
    tabPrev?.classList.add('active');
    tabPrev?.setAttribute('aria-selected', 'true');
    tabEdit?.classList.remove('active');
    tabEdit?.setAttribute('aria-selected', 'false');
    toolbar?.setAttribute('hidden', '');
    previewEl.innerHTML = editorEl.innerHTML || '<p style="color:var(--c-dim)">Nenhum conteúdo ainda.</p>';
  }
}

// ═══════════════════════════════════════════════════════════
// SPLIT PREVIEW
// ═══════════════════════════════════════════════════════════
function initPreviewToggle() {
  document.getElementById('preview-toggle')?.addEventListener('click', togglePreview);
}

function togglePreview() {
  isPreviewOpen = !isPreviewOpen;
  const panel = document.getElementById('preview-panel');
  const btn   = document.getElementById('preview-toggle');
  if (!panel) return;

  panel.hidden = !isPreviewOpen;
  btn?.setAttribute('aria-pressed', String(isPreviewOpen));

  if (isPreviewOpen) updateLivePreview();
}

function closePreview() {
  isPreviewOpen = false;
  const panel = document.getElementById('preview-panel');
  const btn   = document.getElementById('preview-toggle');
  if (panel) panel.hidden = true;
  btn?.setAttribute('aria-pressed', 'false');
}

function updateLivePreview() {
  if (!isPreviewOpen) return;
  const container = document.getElementById('preview-content');
  if (!container) return;

  const title   = document.getElementById('post-title')?.value || '(Sem título)';
  const date    = document.getElementById('post-date')?.value || '';
  const excerpt = document.getElementById('post-excerpt')?.value || '';
  const content = document.getElementById('post-content-editor')?.innerHTML || '';
  const cover   = document.getElementById('post-cover-url')?.value || '';

  container.innerHTML = `
    ${cover ? `<img class="preview-cover" src="${esc(cover)}" alt="${esc(title)}" onerror="this.style.display='none'"/>` : ''}
    <h2 class="preview-article-title">${esc(title)}</h2>
    ${date ? `<span class="preview-article-date">${formatDateBR(date)}</span>` : ''}
    ${excerpt ? `<p class="preview-article-excerpt">${esc(excerpt)}</p>` : ''}
    <div class="preview-article-body">${content || '<p style="color:var(--c-dim)">Nenhum conteúdo ainda.</p>'}</div>
  `;
}

// ═══════════════════════════════════════════════════════════
// COVER IMAGE
// ═══════════════════════════════════════════════════════════
function initCoverArea() {
  const urlInput  = document.getElementById('post-cover-url');
  const dropzone  = document.getElementById('cover-dropzone');
  const fileInput = document.getElementById('cover-file-input');
  const clearBtn  = document.getElementById('btn-clear-cover');

  // URL input change
  urlInput?.addEventListener('input', () => {
    updateCoverPreview(urlInput.value.trim());
    markDirty();
    updateLivePreview();
  });

  // Dropzone click → open file picker
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
  });

  // Drag & drop
  dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone?.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });

  // File input
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) loadImageFile(file);
  });

  // Clear button
  clearBtn?.addEventListener('click', () => {
    if (urlInput) urlInput.value = '';
    updateCoverPreview('');
    markDirty();
    updateLivePreview();
  });
}

function loadImageFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    toast('Imagem muito grande. Use imagens com menos de 5 MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById('post-cover-url');
    if (urlInput) urlInput.value = dataUrl;
    updateCoverPreview(dataUrl);
    markDirty();
    updateLivePreview();
    toast('Imagem carregada com sucesso!', 'success');
  };
  reader.readAsDataURL(file);
}

function updateCoverPreview(url) {
  const preview = document.getElementById('cover-preview');
  if (!preview) return;

  if (url) {
    preview.innerHTML = `
      <img src="${esc(url)}" alt="Pré-visualização da imagem de capa" loading="lazy"
           onerror="this.parentNode.innerHTML='<div style=\\'padding:14px;text-align:center;color:var(--c-danger);font-size:0.8rem;\\'>Erro: Não foi possível carregar esta imagem. Verifique a URL.</div>';"/>
      <button type="button" class="cover-preview-remove" id="cover-preview-remove" aria-label="Remover imagem de capa">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    preview.classList.add('visible');

    document.getElementById('cover-preview-remove')?.addEventListener('click', () => {
      const urlInput = document.getElementById('post-cover-url');
      if (urlInput) urlInput.value = '';
      updateCoverPreview('');
      markDirty();
      updateLivePreview();
    });
  } else {
    preview.innerHTML = '';
    preview.classList.remove('visible');
  }
}

// ═══════════════════════════════════════════════════════════
// LINK DIALOG
// ═══════════════════════════════════════════════════════════
function initLinkDialog() {
  document.getElementById('link-cancel')?.addEventListener('click', closeLinkDialog);
  document.getElementById('link-confirm')?.addEventListener('click', insertLink);

  document.getElementById('link-dialog')?.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLinkDialog();
    if (e.key === 'Enter') insertLink();
  });
}

function openLinkDialog() {
  savedSelection = saveSelection();
  const dialog = document.getElementById('link-dialog');
  const urlInput = document.getElementById('link-url-input');
  if (!dialog) return;

  // Populate text from selection
  const sel = window.getSelection();
  document.getElementById('link-text-input').value = sel?.toString() || '';
  urlInput.value = '';
  dialog.hidden = false;
  urlInput.focus();
}

function closeLinkDialog() {
  document.getElementById('link-dialog').hidden = true;
  restoreSelection(savedSelection);
  document.getElementById('post-content-editor')?.focus();
}

function insertLink() {
  const url  = document.getElementById('link-url-input').value.trim();
  const text = document.getElementById('link-text-input').value.trim();
  if (!url) { toast('Insira uma URL válida.', 'error'); return; }

  restoreSelection(savedSelection);
  document.getElementById('post-content-editor')?.focus();

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    document.execCommand('createLink', false, url);
  } else {
    const displayText = text || url;
    document.execCommand('insertHTML', false, `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(displayText)}</a>`);
  }

  closeLinkDialog();
  markDirty();
  updateLivePreview();
}

// Selection save/restore for link dialog
function saveSelection() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const ranges = [];
  for (let i = 0; i < sel.rangeCount; i++) ranges.push(sel.getRangeAt(i).cloneRange());
  return ranges;
}

function restoreSelection(saved) {
  if (!saved) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  saved.forEach(r => sel.addRange(r));
}

// ═══════════════════════════════════════════════════════════
// META ACCORDION
// ═══════════════════════════════════════════════════════════
function initMetaAccordion() {
  const toggle = document.getElementById('meta-toggle');
  const body   = document.getElementById('meta-body');
  if (!toggle || !body) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    body.classList.toggle('collapsed', isOpen);
  });
}

// ═══════════════════════════════════════════════════════════
// CONFIRM DELETE
// ═══════════════════════════════════════════════════════════
function confirmDelete(id, title) {
  pendingDeleteId = id;
  const modal = document.getElementById('confirm-modal');
  const text  = document.getElementById('confirm-text');
  if (!modal) return;
  if (text) text.textContent = `"${title}" será removido permanentemente. Esta ação não pode ser desfeita.`;
  modal.hidden = false;
}

function initConfirmModal() {
  document.getElementById('confirm-yes')?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    CMS.deletePost(pendingDeleteId);
    pendingDeleteId = null;
    document.getElementById('confirm-modal').hidden = true;
    renderList();
    toast('Artigo excluído.', 'success');
  });

  document.getElementById('confirm-no')?.addEventListener('click', () => {
    pendingDeleteId = null;
    document.getElementById('confirm-modal').hidden = true;
  });

  document.getElementById('confirm-modal')?.addEventListener('click', e => {
    if (e.target.id === 'confirm-modal') {
      pendingDeleteId = null;
      e.target.hidden = true;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('confirm-modal')?.hidden) {
      pendingDeleteId = null;
      document.getElementById('confirm-modal').hidden = true;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════
function initExportImport() {
  document.getElementById('btn-export')?.addEventListener('click', exportPosts);
  document.getElementById('btn-import')?.addEventListener('change', importPosts);
}

function exportPosts() {
  const posts = CMS.getPosts();
  const blob  = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `rafaelfranca-blog-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`${posts.length} artigo${posts.length !== 1 ? 's' : ''} exportado${posts.length !== 1 ? 's' : ''} com sucesso!`, 'success');
}

function importPosts(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const posts = JSON.parse(ev.target.result);
      if (!Array.isArray(posts)) throw new Error('Formato inválido');

      const current = CMS.getPosts();
      const merged  = [...current];
      let added = 0;

      posts.forEach(p => {
        if (!merged.find(m => m.id === p.id)) {
          merged.push(p);
          added++;
        }
      });

      localStorage.setItem('rafaelFrancaCMS_posts', JSON.stringify(merged));
      renderList();
      toast(`Importação concluída: ${added} artigo${added !== 1 ? 's' : ''} novo${added !== 1 ? 's' : ''} adicionado${added !== 1 ? 's' : ''}.`, 'success');
    } catch {
      toast('Erro ao importar: arquivo JSON inválido.', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + S → save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentView === 'editor') {
        document.getElementById('post-form')?.requestSubmit();
      }
    }

    // Ctrl/Cmd + Shift + P → toggle preview
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      if (currentView === 'editor') togglePreview();
    }

    // F11 → fullscreen editor
    if (e.key === 'F11' && currentView === 'editor') {
      e.preventDefault();
      toggleFullscreen();
    }

    // Ctrl/Cmd + K → focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const search = document.getElementById('search-input');
      if (search && currentView === 'list') { search.focus(); search.select(); }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error:   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icons[type] || icons.info}</svg>
    <span>${esc(msg)}</span>
    <button class="toast-dismiss" aria-label="Fechar notificação">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;

  el.querySelector('.toast-dismiss').addEventListener('click', () => dismissToast(el));
  container.appendChild(el);

  setTimeout(() => dismissToast(el), 4000);
}

function dismissToast(el) {
  el.style.animation = 'toast-slide 0.25s reverse forwards';
  setTimeout(() => el.remove(), 260);
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function formatDateBR(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      .format(new Date(dateStr + 'T12:00:00'));
  } catch { return dateStr; }
}

function esc(str = '') {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function showFallbackThumb(img) {
  img.outerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C3A166" stroke-width="1.5" opacity="0.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

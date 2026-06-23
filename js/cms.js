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
    title: 'Remédio fora do Rol da ANS: O plano é obrigado a pagar?',
    excerpt: 'A maioria dos planos de saúde alega que medicamentos fora da lista da ANS não são cobertos. Descubra o que a jurisprudência diz sobre esse tema e como garantir seu direito na Justiça.',
    content: `<p>Uma das principais dúvidas de pacientes que têm medicamentos negados pelo plano de saúde é: se o remédio não está no rol da ANS, o plano pode recusar o fornecimento?</p>
<p>A resposta, na maioria dos casos, é <strong>não</strong>. O Superior Tribunal de Justiça (STJ) consolidou entendimento de que a lista da ANS é um parâmetro mínimo de cobertura, e não um limite absoluto. Quando há prescrição médica fundamentada e a doença é coberta pelo plano, o medicamento necessário ao tratamento deve ser fornecido, mesmo que não conste no rol.</p>
<p>O caminho mais eficaz para garantir o fornecimento é a <strong>tutela de urgência (liminar)</strong>, que obriga o plano a fornecer o medicamento enquanto o processo tramita.</p>
<p><strong>O que você deve guardar:</strong></p>
<ul>
  <li>Prescrição médica com CID e fundamentação clínica</li>
  <li>Carta de negativa formal do plano</li>
  <li>Protocolo de atendimento com data</li>
</ul>
<p>Se você tem esses documentos, entre em contato imediatamente para análise do caso.</p>`,
    coverUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
    coverAlt: 'Documentos médicos e legal sobre negativa de medicamento pela ANS',
    date: '2025-11-10',
    slug: 'remedio-fora-rol-ans-plano-obrigado-pagar'
  },
  {
    id: '2',
    title: 'Liminar para medicamentos de alto custo pelo SUS: Entenda o passo a passo.',
    excerpt: 'Quando o SUS nega acesso a medicamentos de alto custo, a via judicial pode ser a única saída. Saiba exatamente quais documentos reunir e como funciona o pedido de liminar na prática.',
    content: `<p>O Sistema Único de Saúde (SUS) possui uma lista de medicamentos fornecidos gratuitamente, chamada de RENAME (Relação Nacional de Medicamentos Essenciais). Quando um médico prescreve um medicamento fora dessa lista, o Estado costuma negar o fornecimento.</p>
<p>Esse cenário é especialmente grave para portadores de doenças crônicas ou raras, que dependem de medicamentos de alto custo para sobreviver com qualidade de vida.</p>
<h3>Como funciona a ação judicial?</h3>
<p>A ação pode ser movida contra o Município, o Estado de Minas Gerais e/ou a União, dependendo do medicamento e do protocolo aplicável. O pedido de tutela de urgência (liminar) busca uma decisão judicial em caráter emergencial, obrigando o ente público a fornecer o medicamento em prazo curtíssimo.</p>
<h3>Documentos necessários:</h3>
<ul>
  <li>RG, CPF e comprovante de residência</li>
  <li>Laudo médico atualizado com diagnóstico (CID) e indicação do medicamento</li>
  <li>Receita médica com posologia</li>
  <li>Comprovante de negativa do SUS (protocolo, carta ou declaração)</li>
  <li>Exames que comprovem a necessidade do tratamento</li>
</ul>
<p>Entre em contato pelo WhatsApp e envie esses documentos para uma análise imediata do seu caso.</p>`,
    coverUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop',
    coverAlt: 'Paciente com receita médica buscando medicamento de alto custo pelo SUS',
    date: '2025-12-03',
    slug: 'liminar-medicamentos-alto-custo-sus-passo-a-passo'
  },
  {
    id: '3',
    title: 'Plano de Saúde pode alegar "tratamento experimental" para negar cobertura?',
    excerpt: 'A alegação de "tratamento experimental" é uma das justificativas mais usadas pelos planos de saúde para negar cobertura. Entenda quando essa recusa é legal e quando é abusiva.',
    content: `<p>A expressão "tratamento experimental" ou "sem evidência científica" é frequentemente utilizada pelas operadoras de planos de saúde para negar coberturas. Mas essa justificativa tem limites legais claros.</p>
<h3>Quando a recusa é abusiva?</h3>
<p>A recusa é considerada abusiva — e portanto ilegal — quando:</p>
<ul>
  <li>O tratamento possui registro na ANVISA</li>
  <li>Há publicações científicas reconhecidas comprovando a eficácia</li>
  <li>O médico prescritor fundamentou tecnicamente a indicação</li>
  <li>A doença está coberta pelo plano</li>
</ul>
<p>O STJ já decidiu reiteradamente que o plano não pode substituir a avaliação do médico assistente pela negativa administrativa. A relação contratual com o plano exige boa-fé e não pode ser usada para privar o beneficiário de tratamento necessário à sua saúde.</p>
<h3>O que fazer quando o plano alega "tratamento experimental"?</h3>
<p>Não aceite a negativa passivamente. Exija que a recusa seja formalizada por escrito, com fundamentação. Em seguida, consulte um advogado especializado para avaliar a viabilidade de uma liminar.</p>
<p>Cada dia de atraso pode representar uma piora no quadro clínico. Aja com urgência.</p>`,
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
    coverAlt: 'Profissional de saúde e advogado analisando negativa de plano de saúde por tratamento experimental',
    date: '2026-01-15',
    slug: 'plano-saude-tratamento-experimental-negar-cobertura'
  }
];

const CMS = {
  init() {
    // Migração da chave do antigo nome para o novo
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
          if (defaultPost && (!post.coverUrl || post.coverUrl.includes('photo-1587854692152-cbe660dbbab9') || post.coverUrl.includes('photo-1579684389782-64d84b5e901a'))) {
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

  /**
   * Get all posts, sorted by date descending
   * @returns {Array}
   */
  getPosts() {
    this.init();
    try {
      const raw = localStorage.getItem(CMS_KEY);
      let posts = JSON.parse(raw) || [];
      
      // Map to resolve any incorrectly pasted webpage URLs to direct images
      posts = posts.map(post => {
        if (post.coverUrl) {
          const crfAlPage = 'https://www.crf-al.org.br/veja-quais-medicamentos-ja-foram-testados-contra-o-coronavirus/';
          if (post.coverUrl === crfAlPage || post.coverUrl.replace(/\/$/, '') === crfAlPage.replace(/\/$/, '')) {
            post.coverUrl = 'https://www.crf-al.org.br/app/uploads/2023/06/medicamentos-1-1.jpg';
          }
          if (post.coverUrl.includes('photo-1587854692152-cbe660dbbab9')) {
            post.coverUrl = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop';
          }
          if (post.coverUrl.includes('photo-1579684389782-64d84b5e901a')) {
            post.coverUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop';
          }
        }
        return post;
      });

      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      return DEFAULT_POSTS;
    }
  },

  /**
   * Get a single post by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getPost(id) {
    return this.getPosts().find(p => p.id === id) || null;
  },

  /**
   * Get a single post by slug
   * @param {string} slug
   * @returns {Object|null}
   */
  getPostBySlug(slug) {
    return this.getPosts().find(p => p.slug === slug) || null;
  },

  /**
   * Create a new post
   * @param {Object} data
   * @returns {Object}
   */
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

  /**
   * Update an existing post
   * @param {string} id
   * @param {Object} data
   * @returns {Object|null}
   */
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

  /**
   * Delete a post by ID
   * @param {string} id
   * @returns {boolean}
   */
  deletePost(id) {
    let posts = this.getPosts();
    const filtered = posts.filter(p => p.id !== id);
    if (filtered.length === posts.length) return false;
    localStorage.setItem(CMS_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Helper: generate URL slug from title
   * @param {string} text
   * @returns {string}
   */
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

// Expose globally
window.CMS = CMS;

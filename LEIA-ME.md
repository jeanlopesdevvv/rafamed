# 📋 Manual do Painel CMS — Blog de Rafael França Advocacia

## Como adicionar, editar e excluir artigos do blog

---

### Como acessar o painel

1. Abra o arquivo **`admin/index.html`** no seu navegador
   - Ou acesse pelo site clicando em **"Gerenciar Blog (Painel CMS)"** na seção de blog
2. O painel abre diretamente — sem login necessário (recomendamos proteger com senha ao publicar online)

---

### ➕ Criar um novo artigo

1. No painel, clique em **"Novo Artigo"** (barra lateral ou botão no topo)
2. Preencha os campos:
   - **Título** _(obrigatório)_ — O título principal do artigo
   - **Data de Publicação** — Selecione a data
   - **Slug (URL)** — Gerado automaticamente; pode personalizar
   - **Resumo (Excerpt)** _(obrigatório)_ — Texto curto que aparece no card do blog (máx. 400 caracteres)
   - **Conteúdo Completo** — Área de texto com ferramentas de formatação (negrito, itálico, listas, subtítulos, links)
   - **URL da Imagem de Capa** — Cole o link de uma imagem online. Deixe em branco para usar o ícone padrão
3. Clique em **"Salvar Artigo"**
4. O artigo aparece imediatamente no site principal

---

### ✏️ Editar um artigo existente

1. Na lista de artigos, clique no ícone de **lápis** (✏️) ao lado do artigo
2. Faça as alterações desejadas
3. Clique em **"Salvar Artigo"**

---

### 🗑️ Excluir um artigo

1. Na lista de artigos, clique no ícone de **lixeira** (🗑️) ao lado do artigo
2. Uma janela de confirmação será exibida
3. Confirme clicando em **"Excluir"**
> ⚠️ **Atenção:** A exclusão é permanente e não pode ser desfeita.

---

### 🖼️ Adicionar imagens aos artigos

Para usar uma imagem de capa:
1. Faça upload da imagem em um serviço gratuito como:
   - [imgbb.com](https://imgbb.com) (gratuito, sem cadastro)
   - [postimages.org](https://postimages.org)
   - Google Drive (com link de compartilhamento público)
2. Copie o link direto da imagem (`https://...jpg`)
3. Cole no campo **"URL da Imagem de Capa"** no painel CMS
4. A pré-visualização aparecerá automaticamente

---

### ⚙️ Como funciona o armazenamento

O CMS usa o **armazenamento local (localStorage) do navegador**. Isso significa:
- Os dados ficam salvos no computador onde o painel é acessado
- Para publicar online com persistência entre dispositivos, recomenda-se migrar para uma solução como [Netlify CMS](https://netlifycms.org) ou [Notion API](https://developers.notion.com)

---

### 📁 Estrutura de Arquivos

```
rafahealth/
├── index.html          ← Página principal do site
├── css/
│   └── style.css       ← Estilos do site
├── js/
│   ├── cms.js          ← Motor do CMS (lógica de dados)
│   └── main.js         ← Animações e interatividade
├── admin/
│   ├── index.html      ← Painel CMS
│   ├── admin.css       ← Estilos do painel
│   └── admin.js        ← Lógica do painel
└── assets/
    ├── rafa1.jpeg      ← Foto do especialista (adicionar manualmente)
    └── rafa22.jpeg     ← Foto hero (adicionar manualmente)
```

---

### 🖼️ Importante: Adicionar as fotos

Coloque as imagens do Dr. Rafael França na pasta **`assets/`**:
- `rafa1.jpeg` — Foto para a seção "O Especialista"
- `rafa22.jpeg` — Foto principal para a seção Hero

---

### 🌐 Publicar o site online

Para publicar gratuitamente com URL personalizada:
1. Crie uma conta em [Netlify](https://netlify.com)
2. Arraste a pasta `rafahealth/` para o painel do Netlify
3. Configure o domínio `rafaelfrancaadv.com.br` nas configurações de DNS

---

**Desenvolvido com skills premium de Frontend Design, CRO, SEO e Marketing Psychology.**

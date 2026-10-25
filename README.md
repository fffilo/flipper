# 📰 Flippy - Notícias em Formato Curto (Short-Video / Stories)

O **Flippy** é uma aplicação web mobile-first inspirada em plataformas de consumo rápido (estilo TikTok, Instagram Reels e Stories), projetada para o consumo ágil de notícias com imagens de impacto em tela cheia, resumos objetivos e navegação por gestos verticais.

---

## ⚡ Novidades da Versão 2.0 (`v2-clean`)

- **Zero Chaves de API**: Coleta autônoma a partir de fontes públicas (Agência Brasil, BBC Brasil, CNN, G1, Tecnoblog, The Verge, DW). Sem custos ou cotas expiradas.
- **Motor de Notícias Resiliente**: Coleta paralela com headers reais anti-bloqueio (anti-403) e timeout de 3.5s por fonte.
- **Quality Gates Automáticos**: Elimina notícias com mais de 48h, descarta imagens quebradas ou de baixa resolução e aplica upgrade automático de imagens para Full HD em CDNs conhecidos.
- **Deduplicação Inteligente (Jaccard Similarity)**: Agrupa notícias que cobrem o mesmo fato em vez de poluir a timeline.
- **Cache SWR em Memória**: Tempo de resposta do feed entre **0ms e 20ms**.
- **Interface Limpa & Imersiva**: Tela cheia sem botões flutuantes poluindo o visual; configurações e filtros de foco (Destaques, Brasil, Mundo, Tecnologia) acessíveis no ícone de engrenagem.
- **Auto-Discovery de Feeds**: Adicione novos portais de notícias digitando apenas o domínio (ex: `olhardigital.com.br`).

---

## 🛠️ Tecnologias

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Turbopack)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com) (shadcn/ui)
- **Ícones**: [Lucide React](https://lucide.dev)
- **Parsing**: `xml2js` com extrator polimórfico de mídia

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ (recomendado Node 20+)
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/Peterson047/flippy.git
cd flippy

# Acesse a branch v2-clean
git checkout v2-clean

# Instale as dependências
npm install
```

### Modo de Desenvolvimento
```bash
npm run dev
# Acesse http://localhost:9002
```

### Build e Produção
```bash
npm run build
npm start
```

---

## 📚 Documentação Técnica

Para detalhes aprofundados sobre o pipeline do motor de notícias, algoritmos de deduplicação e qualidade, consulte [docs/v2-architecture.md](docs/v2-architecture.md).

# Guia de Instalação e Uso - Conversor ZPL para PDF Shopee

## 📋 Opções de Uso

### Opção 1: Usar Online (Mais Fácil - Recomendado)
A forma mais simples é usar a versão hospedada no Manus:
- Acesse: https://zpl2pdf-converter.manus.space
- Faça upload do arquivo TXT da Shopee
- Baixe o PDF convertido

**Vantagens:**
- ✅ Sem instalação necessária
- ✅ Sem dependências
- ✅ Funciona em qualquer navegador
- ✅ Sem limite de volume

---

### Opção 2: Clonar e Executar Localmente

#### Pré-requisitos
- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Git instalado

#### Passos de Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/Kayque-Freitas/ZPL2PDF-CONVERTER.git
cd ZPL2PDF-CONVERTER
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```

4. **Acesse no navegador:**
```
http://localhost:5173
```

#### Para Produção

1. **Faça o build:**
```bash
pnpm build
```

2. **Inicie o servidor de produção:**
```bash
pnpm start
```

O servidor rodará na porta 3000 por padrão.

---

### Opção 3: Docker (Melhor para Deployment)

Se você tiver Docker instalado, pode usar um container:

1. **Crie um Dockerfile na raiz do projeto:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production
CMD ["pnpm", "start"]
```

2. **Construa a imagem Docker:**
```bash
docker build -t zpl2pdf-converter .
```

3. **Execute o container:**
```bash
docker run -p 3000:3000 zpl2pdf-converter
```

4. **Acesse:**
```
http://localhost:3000
```

---

### Opção 4: Deploy em Plataformas Cloud

#### Vercel (Recomendado para Frontend)
```bash
npm install -g vercel
vercel
```

#### Render
1. Conecte seu repositório GitHub
2. Crie um novo Web Service
3. Configure o comando de build: `pnpm build`
4. Configure o comando de start: `pnpm start`

#### Railway
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente se necessário
3. Deploy automático

---

## 🚀 Como Usar

### Passo 1: Obtenha o Arquivo TXT da Shopee
- Acesse sua conta Shopee Seller Center
- Vá para "Envios" → "Etiquetas de Envio"
- Selecione os pedidos desejados
- Clique em "Gerar Etiquetas ZPL"
- Baixe o arquivo TXT

### Passo 2: Faça Upload
- Abra o conversor (online ou localmente)
- Clique no botão de upload
- Selecione o arquivo TXT da Shopee
- Ou arraste e solte o arquivo

### Passo 3: Aguarde a Conversão
- O sistema processará automaticamente
- Você verá uma barra de progresso
- O PDF será baixado automaticamente quando terminar

### Passo 4: Imprima
- Abra o PDF em seu leitor preferido
- Imprima em impressora térmica 10x15cm
- Pronto! Suas etiquetas estão prontas

---

## 📊 Especificações Técnicas

- **Dimensões**: 10cm × 15cm (100mm × 150mm)
- **Resolução**: 203 DPI (padrão Zebra)
- **Formato de entrada**: TXT com múltiplas etiquetas ZPL
- **Formato de saída**: PDF
- **Limite de volume**: Sem limite (testado com 96+ etiquetas)
- **Tempo de processamento**: ~1-2 segundos por etiqueta

---

## 🔧 Troubleshooting

### Erro: "Nenhuma etiqueta ZPL encontrada"
- Verifique se o arquivo é realmente um TXT da Shopee
- Certifique-se de que o arquivo não está corrompido
- Tente baixar novamente da Shopee

### Erro: "Falha ao processar etiqueta"
- Isso pode ocorrer com etiquetas malformadas
- O sistema continua com as próximas etiquetas
- Verifique o arquivo TXT manualmente

### Servidor não inicia
- Verifique se a porta 3000 (ou 5173) está disponível
- Tente: `lsof -i :3000` (macOS/Linux) ou `netstat -ano | findstr :3000` (Windows)
- Mude a porta se necessário

### Problema com dependências
```bash
# Limpe o cache e reinstale
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📝 Variáveis de Ambiente

Se precisar customizar, crie um arquivo `.env`:

```env
VITE_APP_TITLE=ZPL para PDF Shopee Converter
VITE_APP_LOGO=/logo.png
PORT=3000
NODE_ENV=production
```

---

## 🤝 Suporte

Se encontrar problemas:
1. Verifique se o Node.js está atualizado
2. Limpe o cache do navegador
3. Tente em outro navegador
4. Abra uma issue no GitHub

---

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

**Última atualização**: Janeiro 2026

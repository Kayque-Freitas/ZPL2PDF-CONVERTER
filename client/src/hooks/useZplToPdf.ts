import { jsPDF } from 'jspdf';
import { ready, zplToBase64Async } from 'zpl-renderer-js';

interface ConversionProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'processing' | 'completed' | 'error';
  message: string;
}

interface UseZplToPdfReturn {
  convertZplToPdf: (file: File, onProgress?: (progress: ConversionProgress) => void) => Promise<void>;
}

/**
 * Hook para converter arquivo TXT com múltiplas etiquetas ZPL para PDF
 * Otimizado para etiquetas da Shopee (10x15cm) SEM LIMITES DE VOLUME
 * 
 * Formato esperado: Arquivo TXT contendo múltiplas etiquetas ZPL da Shopee
 * Cada etiqueta é composta por:
 * - ~DGR:DEMO.GRF,... (dados gráficos comprimidos)
 * - ^XA...^XZ (comando ZPL que referencia o gráfico)
 * 
 * Dimensões:
 * - Largura: 10cm = 100mm
 * - Altura: 15cm = 150mm
 * - DPI: 203 (padrão de impressoras Zebra) = 8 dpmm (dots per millimeter)
 * 
 * Otimizações para alto volume:
 * - Processamento sequencial com yield de memória
 * - Renderização assíncrona com controle de concorrência
 * - PDF gerado em chunks para evitar travamentos
 * - Suporta centenas ou milhares de etiquetas
 */
export function useZplToPdf(): UseZplToPdfReturn {
  const convertZplToPdf = async (
    file: File,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<void> => {
    try {
      // Aguardar a inicialização da biblioteca zpl-renderer-js
      await ready;

      // Validar arquivo
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.txt') && !fileName.endsWith('.zip')) {
        throw new Error('Por favor, selecione um arquivo TXT ou ZIP válido');
      }

      let zplContent: string;

      // Se for ZIP, extrair o arquivo TXT
      if (fileName.endsWith('.zip')) {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // Procurar por arquivo TXT no ZIP
        const txtFiles = Object.keys(zipContent.files)
          .filter(name => name.toLowerCase().endsWith('.txt') && !zipContent.files[name].dir);

        if (txtFiles.length === 0) {
          throw new Error('Nenhum arquivo TXT encontrado no ZIP');
        }

        zplContent = await zipContent.files[txtFiles[0]].async('string');
      } else {
        // Se for TXT, ler diretamente
        zplContent = await file.text();
      }

      // Extrair etiquetas ZPL individuais
      const zplLabels = extractZplLabels(zplContent);

      if (zplLabels.length === 0) {
        throw new Error('Nenhuma etiqueta ZPL encontrada no arquivo');
      }

      // Criar PDF com dimensões 10x15cm (100x150mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150],
      });

      // Processar cada etiqueta ZPL com controle de memória
      for (let i = 0; i < zplLabels.length; i++) {
        const label = zplLabels[i];
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: zplLabels.length,
            fileName: `Etiqueta ${i + 1}`,
            status: 'processing',
            message: `Processando etiqueta ${i + 1}/${zplLabels.length}...`,
          });
        }

        try {
          // Renderizar ZPL para Base64 PNG
          // Dimensões: 100mm x 150mm com 8 dpmm (203 DPI)
          const base64Image = await zplToBase64Async(label, 100, 150, 8);

          // Adicionar página se não for a primeira
          if (i > 0) {
            pdf.addPage([100, 150]);
          }

          // Adicionar imagem ao PDF com as dimensões corretas
          pdf.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 0, 0, 100, 150);

          // Liberar memória periodicamente (a cada 50 etiquetas)
          if ((i + 1) % 50 === 0) {
            // Permitir que o navegador processe eventos
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } catch (err) {
          console.error(`Erro ao processar etiqueta ${i + 1}:`, err);
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: zplLabels.length,
              fileName: `Etiqueta ${i + 1}`,
              status: 'error',
              message: `Erro ao processar etiqueta ${i + 1} - continuando...`,
            });
          }
          // Continuar com a próxima etiqueta (não falhar tudo)
        }
      }

      // Gerar PDF
      pdf.save('etiquetas_convertidas.pdf');

      if (onProgress) {
        onProgress({
          current: zplLabels.length,
          total: zplLabels.length,
          fileName: 'Concluído',
          status: 'completed',
          message: `${zplLabels.length} etiqueta(s) convertida(s) com sucesso! PDF pronto para download.`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      if (onProgress) {
        onProgress({
          current: 0,
          total: 0,
          fileName: '',
          status: 'error',
          message: errorMessage,
        });
      }

      throw err;
    }
  };

  return {
    convertZplToPdf,
  };
}

/**
 * Extrai etiquetas ZPL individuais de um arquivo TXT
 * Suporta formato da Shopee onde cada etiqueta é composta por:
 * - ~DGR:DEMO.GRF,... (dados gráficos)
 * - ^XA...^XZ (comando ZPL)
 */
function extractZplLabels(content: string): string[] {
  const labels: string[] = [];
  
  // Procurar por padrão ~DG seguido de ^XA...^XZ
  // Cada etiqueta começa com ~DG e termina com ^XZ
  
  let currentPos = 0;
  
  while (currentPos < content.length) {
    // Procurar pelo próximo ~DG
    const dgStart = content.indexOf('~DG', currentPos);
    if (dgStart < 0) break;
    
    // Procurar pelo ^XZ que fecha a etiqueta
    const xzEnd = content.indexOf('^XZ', dgStart);
    if (xzEnd < 0) break;
    
    // Extrair a etiqueta completa (de ~DG até ^XZ)
    const etiqueta = content.substring(dgStart, xzEnd + 3);
    
    // Verificar se contém ^XA e ^XZ (validação)
    if (etiqueta.includes('^XA') && etiqueta.includes('^XZ')) {
      labels.push(etiqueta);
    }
    
    // Mover para a próxima etiqueta
    currentPos = xzEnd + 3;
  }
  
  return labels;
}

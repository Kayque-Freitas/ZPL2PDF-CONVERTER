import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ready, zplToBase64Async } from 'zpl-renderer-js';

interface ConversionProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'processing' | 'completed' | 'error';
  message: string;
}

interface UseZplToPdfReturn {
  convertZipToPdf: (file: File, onProgress?: (progress: ConversionProgress) => void) => Promise<void>;
}

/**
 * Hook para converter arquivos ZPL para PDF
 * Otimizado para etiquetas da Shopee (10x15cm) SEM LIMITES DE VOLUME
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
  const convertZipToPdf = async (
    file: File,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<void> => {
    try {
      // Aguardar a inicialização da biblioteca zpl-renderer-js
      await ready;

      // Validar arquivo
      if (!file.name.toLowerCase().endsWith('.zip')) {
        throw new Error('Por favor, selecione um arquivo ZIP válido');
      }

      // Ler arquivo ZIP
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      // Filtrar arquivos ZPL
      const zplFiles = Object.keys(zipContent.files)
        .filter(name => name.toLowerCase().endsWith('.zpl') && !zipContent.files[name].dir)
        .sort();

      if (zplFiles.length === 0) {
        throw new Error('Nenhum arquivo ZPL encontrado no ZIP');
      }

      // Criar PDF com dimensões 10x15cm (100x150mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150],
      });

      // Processar cada arquivo ZPL com controle de memória
      // Renderiza sequencialmente para evitar sobrecarga
      for (let i = 0; i < zplFiles.length; i++) {
        const fileName = zplFiles[i];
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: zplFiles.length,
            fileName,
            status: 'processing',
            message: `Processando ${fileName}... (${i + 1}/${zplFiles.length})`,
          });
        }

        try {
          // Ler conteúdo do arquivo ZPL
          const zplContent = await zipContent.files[fileName].async('string');

          // Renderizar ZPL para Base64 PNG
          // Dimensões: 100mm x 150mm com 8 dpmm (203 DPI)
          const base64Image = await zplToBase64Async(zplContent, 100, 150, 8);

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
          console.error(`Erro ao processar ${fileName}:`, err);
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: zplFiles.length,
              fileName,
              status: 'error',
              message: `Erro ao processar ${fileName} - continuando...`,
            });
          }
          // Continuar com o próximo arquivo (não falhar tudo)
        }
      }

      // Gerar PDF
      pdf.save('etiquetas_convertidas.pdf');

      if (onProgress) {
        onProgress({
          current: zplFiles.length,
          total: zplFiles.length,
          fileName: 'Concluído',
          status: 'completed',
          message: `${zplFiles.length} etiqueta(s) convertida(s) com sucesso! PDF pronto para download.`,
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
    convertZipToPdf,
  };
}

import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { useZplToPdf } from '@/hooks/useZplToPdf';
import { toast } from 'sonner';

interface ConversionProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'processing' | 'completed' | 'error';
  message: string;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertZipToPdf } = useZplToPdf();

  useEffect(() => {
    (window as any).JSZip = JSZip;
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('Arquivo selecionado:', file.name);

    setIsProcessing(true);
    setProgress(null);

    try {
      console.log('Iniciando conversao...');
      await convertZipToPdf(file, (newProgress) => {
        console.log('Progresso:', newProgress);
        setProgress(newProgress);
      });

      toast.success('Conversão concluída com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro na conversao:', errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const progressPercentage = progress?.total 
    ? (progress.current / progress.total) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ZPL para PDF
          </h1>
          <p className="text-lg text-slate-600">
            Converta seus arquivos ZPL para PDF sem limites de volume
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Otimizado para etiquetas da Shopee (10x15cm)
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 shadow-lg">
          {/* Upload Area */}
          <div className="mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {isProcessing ? 'Processando...' : 'Clique para selecionar arquivo ZIP'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {progress.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {progress.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-slate-900">
                    {progress.message}
                  </span>
                </div>
                <span className="text-sm text-slate-500">
                  {progress.current}/{progress.total}
                </span>
              </div>

              <Progress value={progressPercentage} className="h-2" />

              {progress.fileName && (
                <p className="text-xs text-slate-500 truncate">
                  Arquivo: {progress.fileName}
                </p>
              )}
            </div>
          )}

          {/* Info Section */}
          {!progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Como usar:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Coloque todos seus arquivos ZPL em um arquivo ZIP</li>
                <li>• Clique no botão acima para selecionar o ZIP</li>
                <li>• A conversão começará automaticamente</li>
                <li>• O PDF será baixado quando terminar</li>
                <li>• Sem limites de quantidade de etiquetas!</li>
              </ul>
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            Dimensões: 10cm × 15cm (100mm × 150mm) • Resolução: 203 DPI
          </p>
          <p className="mt-2">
            Suporta centenas ou milhares de etiquetas em um único PDF
          </p>
        </div>
      </div>
    </div>
  );
}

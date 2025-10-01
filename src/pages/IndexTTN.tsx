import React, { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { useToast } from '@/hooks/use-toast';
import { FileText, Sparkles, Loader2 } from 'lucide-react';
import { ttnApi } from '@/services/ttnApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const IndexTTN = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File, location: GeolocationPosition | null) => {
    setIsUploading(true);
    setCurrentFile(file);
    setProgress(0);
    setResults(null);

    try {
      const extractionResults = await ttnApi.extractFromDocument(
        file,
        { bypass_gatekeeper: false, page_limit: 50 },
        (prog) => setProgress(prog || 0)
      );

      setResults(extractionResults);

      toast({
        title: "Документ обработан",
        description: `Обработано ${extractionResults.pages_processed} страниц. ${extractionResults.ttn_found ? `Найдено ${extractionResults.ttn_count} ТТН` : 'ТТН не обнаружены'}`,
      });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Ошибка обработки",
        description: error instanceof Error ? error.message : "Не удалось обработать документ",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setResults(null);
    setCurrentFile(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background telegram-viewport">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-6 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full shadow-medium">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            TTN Extractor
          </h1>
          <p className="text-muted-foreground">
            Загрузите документы для извлечения ТТН с помощью AI
          </p>
        </div>

        {/* Main Content */}
        {isUploading ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Обработка документа...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Обработка файла: {currentFile?.name}
              </p>
            </CardContent>
          </Card>
        ) : !results ? (
          <PDFUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Результаты извлечения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Страниц обработано</p>
                      <p className="text-2xl font-bold">{results.pages_processed}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ТТН найдено</p>
                      <p className="text-2xl font-bold">{results.ttn_count}</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.extraction_results?.map((page: any, index: number) => (
                      <Card key={index} className={page.is_ttn ? 'border-green-500' : 'border-gray-300'}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Страница {page.page}
                            </span>
                            {page.is_ttn ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                ТТН обнаружена
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Не ТТН
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        {page.is_ttn && (
                          <CardContent className="pt-2">
                            {page.document_number && (
                              <p className="text-sm"><strong>Номер:</strong> {page.document_number}</p>
                            )}
                            {page.date && (
                              <p className="text-sm"><strong>Дата:</strong> {page.date}</p>
                            )}
                            {page.supplier && (
                              <p className="text-sm"><strong>Поставщик:</strong> {page.supplier}</p>
                            )}
                            {page.buyer && (
                              <p className="text-sm"><strong>Покупатель:</strong> {page.buyer}</p>
                            )}
                            {page.items && page.items.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Товары:</p>
                                <ul className="text-xs space-y-1 mt-1">
                                  {page.items.map((item: any, idx: number) => (
                                    <li key={idx}>
                                      {item.name} - {item.quantity} {item.unit}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        )}
                        {page.error && (
                          <CardContent className="pt-2">
                            <p className="text-sm text-red-600">Ошибка: {page.error}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Время обработки: {results.processing_time.toFixed(2)} сек
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={handleReset} variant="outline">
                Загрузить другой документ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexTTN;
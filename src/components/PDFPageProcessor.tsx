import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Check, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PageData {
  pageNumber: number;
  canvas: HTMLCanvasElement | null;
  extractedText: string;
  isProcessing: boolean;
  isComplete: boolean;
  progress: number;
}

interface PDFPageProcessorProps {
  file: File;
  onComplete: (extractedData: { pageNumber: number; text: string }[]) => void;
  onCancel: () => void;
}

export const PDFPageProcessor: React.FC<PDFPageProcessorProps> = ({
  file,
  onComplete,
  onCancel
}) => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    loadPDF();
  }, [file]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(loadPage(pdf, i));
      }
      
      const loadedPages = await Promise.all(pagePromises);
      setPages(loadedPages);
      setIsLoading(false);
      
      // Start processing pages one by one
      processPages(loadedPages, pdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  const loadPage = async (pdf: any, pageNumber: number): Promise<PageData> => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return {
      pageNumber,
      canvas,
      extractedText: '',
      isProcessing: false,
      isComplete: false,
      progress: 0
    };
  };

  const processPages = async (initialPages: PageData[], pdf: any) => {
    const updatedPages = [...initialPages];
    
    for (let i = 0; i < updatedPages.length; i++) {
      const pageData = updatedPages[i];
      
      // Start processing this page
      pageData.isProcessing = true;
      setPages([...updatedPages]);
      
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        pageData.progress = progress;
        setPages([...updatedPages]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Extract text from this page
      try {
        const page = await pdf.getPage(pageData.pageNumber);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        pageData.extractedText = text;
        pageData.isProcessing = false;
        pageData.isComplete = true;
        pageData.progress = 100;
        
        setPages([...updatedPages]);
      } catch (error) {
        console.error(`Error extracting text from page ${pageData.pageNumber}:`, error);
        pageData.isProcessing = false;
        pageData.isComplete = true;
        pageData.extractedText = `Ошибка извлечения текста со страницы ${pageData.pageNumber}`;
        setPages([...updatedPages]);
      }
    }
  };

  const updatePageText = (pageNumber: number, text: string) => {
    setPages(prev => prev.map(page => 
      page.pageNumber === pageNumber 
        ? { ...page, extractedText: text }
        : page
    ));
  };

  const handleComplete = () => {
    const extractedData = pages.map(page => ({
      pageNumber: page.pageNumber,
      text: page.extractedText
    }));
    onComplete(extractedData);
  };

  const allPagesProcessed = pages.length > 0 && pages.every(page => page.isComplete);

  if (isLoading) {
    return (
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка PDF документа...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-card-foreground">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Обработка PDF документа
            <span className="text-sm text-muted-foreground ml-auto">
              {pages.filter(p => p.isComplete).length} из {pages.length} страниц
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {pages.map((page) => (
          <Card key={page.pageNumber} className="bg-gradient-card shadow-soft border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Страница {page.pageNumber}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {page.isProcessing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {page.isComplete && <Check className="h-4 w-4 text-success" />}
                </div>
              </div>
              {(page.isProcessing || page.progress > 0) && (
                <Progress 
                  value={page.progress} 
                  className="w-full h-2"
                />
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PDF Page Display */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-card-foreground">Изображение страницы</h4>
                  <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
                    {page.canvas && (
                      <canvas
                        ref={el => {
                          if (el && page.canvas) {
                            const ctx = el.getContext('2d');
                            if (ctx) {
                              el.width = page.canvas.width;
                              el.height = page.canvas.height;
                              ctx.drawImage(page.canvas, 0, 0);
                            }
                          }
                        }}
                        className="max-w-full h-auto"
                        style={{ maxHeight: '400px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Extracted Text Editor */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-card-foreground">Извлеченный текст</h4>
                  <Textarea
                    value={page.extractedText}
                    onChange={(e) => updatePageText(page.pageNumber, e.target.value)}
                    disabled={!page.isComplete}
                    placeholder={page.isProcessing ? "Обработка..." : "Текст со страницы будет показан здесь"}
                    className="min-h-[300px] resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length > 0 && (
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onCancel}>
            Отменить
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={!allPagesProcessed}
            className="min-w-[120px]"
          >
            {allPagesProcessed ? 'Продолжить' : 'Обработка...'}
          </Button>
        </div>
      )}
    </div>
  );
};
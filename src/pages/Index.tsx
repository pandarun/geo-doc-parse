import React, { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { ParsedResults } from '@/components/ParsedResults';
import { PDFPageProcessor } from '@/components/PDFPageProcessor';
import { DocumentParser } from '@/utils/documentParser';
import { useToast } from '@/hooks/use-toast';
import { FileText, Sparkles } from 'lucide-react';

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

interface UploadedDocument {
  filename: string;
  location: GeolocationPosition | null;
  uploadDate: Date;
  items: ParsedItem[];
}

const Index = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [showProcessor, setShowProcessor] = useState(false);

  const handleFileUpload = async (file: File, location: GeolocationPosition | null) => {
    setCurrentFile(file);
    setCurrentLocation(location);
    setShowProcessor(true);
  };

  const handleProcessorComplete = (extractedData: { pageNumber: number; text: string }[]) => {
    // Combine all extracted text from pages
    const combinedText = extractedData.map(data => data.text).join('\n');
    
    // Parse the combined document text
    const parsedItems = DocumentParser.parseTransportDocument(combinedText);
    
    setDocument({
      filename: currentFile?.name || 'document.pdf',
      location: currentLocation,
      uploadDate: new Date(),
      items: parsedItems
    });
    
    setShowProcessor(false);
    setCurrentFile(null);
    setCurrentLocation(null);
    
    toast({
      title: "Документ обработан успешно",
      description: `Найдено ${parsedItems.length} позиций`,
    });
  };

  const handleProcessorCancel = () => {
    setShowProcessor(false);
    setCurrentFile(null);
    setCurrentLocation(null);
  };

  const handleReset = () => {
    setDocument(null);
    setShowProcessor(false);
    setCurrentFile(null);
    setCurrentLocation(null);
  };

  return (
    <div className="min-h-screen bg-background telegram-viewport">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-6 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full shadow-medium">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            PDF Парсер
          </h1>
          <p className="text-muted-foreground">
            Загрузите транспортные документы для извлечения данных
          </p>
        </div>

        {/* Main Content */}
        {showProcessor && currentFile ? (
          <PDFPageProcessor 
            file={currentFile}
            onComplete={handleProcessorComplete}
            onCancel={handleProcessorCancel}
          />
        ) : !document ? (
          <PDFUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
        ) : (
          <div className="space-y-4">
            <ParsedResults
              filename={document.filename}
              location={document.location}
              uploadDate={document.uploadDate}
              items={document.items}
            />
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-primary hover:text-primary-hover transition-smooth text-sm font-medium"
              >
                Загрузить другой документ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

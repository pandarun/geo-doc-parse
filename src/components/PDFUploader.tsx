import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PDFUploaderProps {
  onFileUpload: (file: File, location: GeolocationPosition | null) => void;
  isUploading: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileUpload, isUploading }) => {
  const { toast } = useToast();
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Геолокация недоступна",
        description: "Ваш браузер не поддерживает геолокацию",
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setGettingLocation(false);
        toast({
          title: "Местоположение получено",
          description: `Широта: ${position.coords.latitude.toFixed(6)}, Долгота: ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        setGettingLocation(false);
        toast({
          title: "Ошибка получения геолокации",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file, location);
    } else {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, выберите PDF файл",
        variant: "destructive",
      });
    }
  }, [onFileUpload, location, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Location Section */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Геолокация</h3>
                <p className="text-sm text-muted-foreground">
                  {location 
                    ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                    : "Местоположение не определено"
                  }
                </p>
              </div>
            </div>
            <Button
              variant="telegram"
              size="sm"
              onClick={getLocation}
              disabled={gettingLocation}
              className="min-w-[120px]"
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : location ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {gettingLocation ? "Определение..." : location ? "Обновить" : "Получить"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed transition-smooth
              ${isDragActive 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-primary/30 hover:border-primary/50 hover:bg-gradient-upload/30'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Обработка документа...
                    </h3>
                    <p className="text-muted-foreground">
                      Извлекаем данные из PDF файла
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="p-4 bg-gradient-primary rounded-full shadow-medium">
                      <Upload className="h-12 w-12 text-primary-foreground" />
                    </div>
                    {isDragActive && (
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {isDragActive ? 'Отпустите файл здесь' : 'Загрузите PDF документ'}
                    </h3>
                    <p className="text-muted-foreground">
                      Перетащите файл сюда или нажмите для выбора
                    </p>
                  </div>
                  <Button variant="upload" size="lg" className="mt-4">
                    <FileText className="h-5 w-5" />
                    Выбрать файл
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
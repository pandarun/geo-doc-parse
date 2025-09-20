import React from 'react';
import { FileText, Package, MapPin, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

interface ParsedResultsProps {
  filename: string;
  location: GeolocationPosition | null;
  uploadDate: Date;
  items: ParsedItem[];
}

export const ParsedResults: React.FC<ParsedResultsProps> = ({
  filename,
  location,
  uploadDate,
  items
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Document Info */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-card-foreground">
            <div className="p-2 bg-success/10 rounded-lg">
              <FileText className="h-5 w-5 text-success" />
            </div>
            Информация о документе
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Файл:</span>
              <span className="text-sm text-muted-foreground truncate">{filename}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Загружен:</span>
              <span className="text-sm text-muted-foreground">{formatDate(uploadDate)}</span>
            </div>
            
            {location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Координаты:</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed Items */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-card-foreground">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            Извлеченные данные
            <Badge variant="secondary" className="ml-auto">
              {items.length} {items.length === 1 ? 'позиция' : 'позиций'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-background/50 rounded-lg border border-border/50 transition-smooth hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-card-foreground mb-1">
                        {item.name}
                      </h4>
                      {item.specifications && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.specifications}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {item.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Данные не найдены в документе</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
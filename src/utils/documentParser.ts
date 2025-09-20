interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export class DocumentParser {
  static parseTransportDocument(text: string): ParsedItem[] {
    const items: ParsedItem[] = [];
    
    // Split text into lines for processing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for patterns that indicate items with quantities
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern 1: Look for lines containing dimensions and quantities (like "1000x300x150, 198 шт")
      const dimensionPattern = /(\d+)x(\d+)x(\d+)[,\s]*(\d+)\s*(шт|ед|м|кг|т|л)/gi;
      const match = dimensionPattern.exec(line);
      
      if (match) {
        const [fullMatch, width, height, depth, quantity, unit] = match;
        
        // Look for the item name in previous or current line
        let itemName = this.extractItemName(line, lines, i);
        
        if (itemName) {
          items.push({
            name: itemName,
            quantity: parseInt(quantity),
            unit: unit,
            specifications: `${width}×${height}×${depth}`
          });
        }
      }
      
      // Pattern 2: Look for lines with item names followed by quantities
      const quantityPattern = /(\d+(?:\.\d+)?)\s*(шт|ед|м³|м|кг|т|л|пог\.?м)/gi;
      const qtyMatch = quantityPattern.exec(line);
      
      if (qtyMatch && !match) { // Only if not already matched by dimension pattern
        const [, quantity, unit] = qtyMatch;
        
        // Extract item name from the line
        let itemName = line.replace(quantityPattern, '').trim();
        
        // Clean up common prefixes/suffixes
        itemName = itemName.replace(/^\d+\.\s*/, ''); // Remove numbering
        itemName = itemName.replace(/^[-–—]\s*/, ''); // Remove dashes
        itemName = itemName.replace(/[,\s]*$/, ''); // Remove trailing commas/spaces
        
        if (itemName && itemName.length > 3) {
          items.push({
            name: itemName,
            quantity: parseFloat(quantity),
            unit: unit
          });
        }
      }
    }
    
    // Remove duplicates and clean up
    return this.deduplicateItems(items);
  }
  
  private static extractItemName(currentLine: string, allLines: string[], currentIndex: number): string {
    // Try to find item name in current line first
    let itemName = currentLine.replace(/\d+x\d+x\d+[,\s]*\d+\s*(шт|ед|м|кг|т|л)/gi, '').trim();
    
    // If current line doesn't have a good name, look at previous lines
    if (!itemName || itemName.length < 3) {
      for (let i = Math.max(0, currentIndex - 3); i < currentIndex; i++) {
        const prevLine = allLines[i];
        
        // Look for lines that might contain item names
        if (prevLine && 
            !prevLine.match(/\d+\.\d+\.\d+/) && // Skip dates
            !prevLine.match(/^\d+$/) && // Skip pure numbers
            prevLine.length > 5 && 
            prevLine.length < 100) {
          
          let potentialName = prevLine.replace(/^\d+\.\s*/, '').trim();
          if (potentialName.length > 3) {
            itemName = potentialName;
            break;
          }
        }
      }
    }
    
    // Clean up the item name
    itemName = itemName.replace(/^[-–—]\s*/, '');
    itemName = itemName.replace(/[,\s]*$/, '');
    
    return itemName;
  }
  
  private static deduplicateItems(items: ParsedItem[]): ParsedItem[] {
    const uniqueItems = new Map<string, ParsedItem>();
    
    for (const item of items) {
      const key = `${item.name.toLowerCase()}_${item.specifications || ''}`;
      
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, item);
      } else {
        // If duplicate found, sum the quantities
        const existing = uniqueItems.get(key)!;
        existing.quantity += item.quantity;
      }
    }
    
    return Array.from(uniqueItems.values());
  }
}
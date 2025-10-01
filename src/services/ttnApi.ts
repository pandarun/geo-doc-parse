/**
 * TTN Extraction API Service
 * Connects to the TTN unified API backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UploadResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  result_url?: string;
  error?: string;
  progress?: number;
}

export interface ExtractionResult {
  task_id: string;
  status: string;
  pages_processed: number;
  ttn_found: boolean;
  ttn_count: number;
  extraction_results: Array<{
    page: number;
    is_ttn: boolean;
    document_number?: string;
    date?: string;
    supplier?: string;
    buyer?: string;
    items?: Array<{
      name: string;
      quantity: string;
      unit: string;
      price?: string;
      total?: string;
    }>;
    error?: string;
    gatekeeper_score?: number;
  }>;
  processing_time: number;
}

class TTNApiService {
  /**
   * Upload a document for extraction
   */
  async uploadDocument(
    file: File,
    options?: {
      bypass_gatekeeper?: boolean;
      page_limit?: number;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Check task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${API_BASE_URL}/api/v1/task/${taskId}`);

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get extraction results
   */
  async getResults(taskId: string): Promise<ExtractionResult> {
    const response = await fetch(`${API_BASE_URL}/api/v1/result/${taskId}`);

    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload and wait for results
   */
  async extractFromDocument(
    file: File,
    options?: {
      bypass_gatekeeper?: boolean;
      page_limit?: number;
    },
    onProgress?: (progress: number) => void
  ): Promise<ExtractionResult> {
    // Upload document
    const uploadResponse = await this.uploadDocument(file, options);
    const taskId = uploadResponse.id;

    // Poll for completion
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getTaskStatus(taskId);

      if (status.progress && onProgress) {
        onProgress(status.progress);
      }

      if (status.status === 'completed') {
        return this.getResults(taskId);
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Extraction failed');
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Extraction timeout');
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const ttnApi = new TTNApiService();
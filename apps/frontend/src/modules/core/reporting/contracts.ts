export interface ReportMetadata {
  id: string;
  title: string;
  description?: string;
  generatedAt?: string;
  generatedBy?: string;
  status?: 'ready' | 'processing' | 'failed';
}

export interface ReportFilterOption { value: string; label: string; }
export interface ReportFilter { key: string; label: string; value?: string; options?: ReportFilterOption[]; }
export interface ReportSummaryMetric { key: string; label: string; value: string | number; helper?: string; }
export interface ReportResultColumn { key: string; label: string; align?: 'left' | 'center' | 'right'; }
export interface ReportResultRow { id: string; values: Record<string, string | number | null>; }
export interface ReportViewModel {
  metadata: ReportMetadata;
  filters: ReportFilter[];
  summary: ReportSummaryMetric[];
  columns: ReportResultColumn[];
  rows: ReportResultRow[];
}

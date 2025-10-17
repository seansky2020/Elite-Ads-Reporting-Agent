
import { Chat } from '@google/genai';

export interface KeyMetrics {
  totalSpend: string;
  totalRevenue: string;
  roas: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpa: string;
}

export interface ChartDataPoint {
  campaignName: string;
  roas: number;
  cpa: number;
}

export interface ReportData {
  keyMetrics: KeyMetrics;
  insights: string[];
  recommendations: string[];
  chartData: ChartDataPoint[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ReportGenerationResult {
    report: ReportData;
    chat: Chat;
}

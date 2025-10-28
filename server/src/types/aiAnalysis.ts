export interface AiAnalysis {
  id: number;
  meeting_id: number;
  type: string;
  content: string;
  model?: string;
  created_at?: string;
}

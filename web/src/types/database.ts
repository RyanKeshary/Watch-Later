export type ProcessingStatus =
  | 'pending'
  | 'resolving'
  | 'partially_processed'
  | 'processed'
  | 'extraction_failed';

export type CompletionStatus = 'pending' | 'completed' | 'archived';

export interface Reel {
  id: string;
  user_id: string;
  url: string;
  raw_shared_text: string | null;
  creator_username: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  ai_title: string | null;
  ai_description: string | null;
  ai_summary: string | null;
  difficulty: string | null;
  processing_status: ProcessingStatus;
  completion_status: CompletionStatus;
  is_failed: boolean;
  created_at: string;
  completed_at: string | null;
  extracted_content?: {
    extraction_error: string | null;
    raw_scraper_output: any;
  } | Array<{
    extraction_error: string | null;
    raw_scraper_output: any;
  }> | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  platform: string;
  device_name: string | null;
  created_at: string;
  last_synced_at: string;
}

export function cleanDeviceName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\s*\[synced:.*?\]/, '').trim();
}


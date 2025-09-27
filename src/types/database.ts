// Types that match the Rust backend models

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Paused';
export type ContactStatus = 'Active' | 'Unsubscribed' | 'Bounced' | 'Complained';
export type Theme = 'Light' | 'Dark';
export type EventType = 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Bounced' | 'Complained' | 'Unsubscribed';
export type SuppressionReason = 'Unsubscribed' | 'Bounced' | 'Complained';

export interface CampaignSettings {
  from_email: string;
  from_name: string;
  reply_to?: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  template_id?: string;
  contact_list_ids: string[];
  status: CampaignStatus;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  settings: CampaignSettings;
}

export interface ContactList {
  id: string;
  name: string;
  description: string;
  created_at: string;
  contact_count: number;
}

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  list_ids: string[];
  status: ContactStatus;
  created_at: string;
  custom_fields: Record<string, string>;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  created_at: string;
  updated_at: string;
}

export interface SesSettings {
  access_key_id?: string;
  secret_access_key?: string;
  region: string;
  verified: boolean;
}

export interface AppSettings {
  theme: Theme;
  default_from_email?: string;
  default_from_name?: string;
}

export interface Settings {
  ses_settings: SesSettings;
  app_settings: AppSettings;
}

export interface AnalyticsEvent {
  event_type: EventType;
  timestamp: string;
  contact_id: string;
  metadata: Record<string, string>;
}

export interface CampaignAnalytics {
  campaign_id: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  events: AnalyticsEvent[];
}

export interface SuppressedEmail {
  email: string;
  reason: SuppressionReason;
  timestamp: string;
  campaign_id?: string;
}

// API Request/Response types
export interface CreateCampaignRequest {
  name: string;
  subject: string;
  from_email: string;
  from_name: string;
}

export interface UpdateCampaignRequest {
  id: string;
  name?: string;
  subject?: string;
  status?: string;
}

export interface CreateContactListRequest {
  name: string;
  description: string;
}

export interface CreateContactRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  list_id: string;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
}

export interface UpdateTemplateRequest {
  id: string;
  name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
}

export interface UpdateSettingsRequest {
  ses_access_key?: string;
  ses_secret_key?: string;
  ses_region?: string;
  default_from_email?: string;
  default_from_name?: string;
  theme?: string;
}
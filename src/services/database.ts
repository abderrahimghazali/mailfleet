import { invoke } from '@tauri-apps/api/core';
import type {
  Campaign,
  CampaignStatus,
  Contact,
  ContactList,
  Template,
  Settings,
  CampaignAnalytics,
  CampaignSendResult,
  ImportResult,
  ColumnMapping,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateContactListRequest,
  UpdateContactListRequest,
  CreateContactRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  UpdateSettingsRequest,
} from '../types/database';

export class DatabaseService {
  // Initialize database
  static async initDatabase(): Promise<void> {
    return invoke('init_database');
  }

  // Campaign operations
  static async getCampaigns(): Promise<Campaign[]> {
    return invoke('get_campaigns');
  }

  static async getCampaignById(id: string): Promise<Campaign | null> {
    return invoke('get_campaign_by_id', { id });
  }

  static async createCampaign(request: CreateCampaignRequest): Promise<Campaign> {
    return invoke('create_campaign', {
      name: request.name,
      subject: request.subject,
      fromEmail: request.from_email,
      fromName: request.from_name,
    });
  }

  static async updateCampaign(request: UpdateCampaignRequest): Promise<Campaign> {
    return invoke('update_campaign', {
      id: request.id,
      name: request.name,
      subject: request.subject,
      content: request.content,
      status: request.status?.toLowerCase(),
    });
  }

  static async deleteCampaign(id: string): Promise<void> {
    return invoke('delete_campaign', { id });
  }

  // Contact List operations
  static async getContactLists(): Promise<ContactList[]> {
    return invoke('get_contact_lists');
  }

  static async createContactList(request: CreateContactListRequest): Promise<ContactList> {
    return invoke('create_contact_list', {
      name: request.name,
      description: request.description,
    });
  }

  static async getContactListById(id: string): Promise<ContactList | null> {
    return invoke('get_contact_list_by_id', { id });
  }

  static async updateContactList(request: UpdateContactListRequest): Promise<ContactList> {
    return invoke('update_contact_list', {
      id: request.id,
      name: request.name,
      description: request.description,
    });
  }

  static async deleteContactList(id: string): Promise<void> {
    return invoke('delete_contact_list', { id });
  }

  // Contact operations
  static async getContacts(): Promise<Contact[]> {
    return invoke('get_contacts');
  }

  static async getContactsByListId(listId: string): Promise<Contact[]> {
    return invoke('get_contacts_by_list_id', { listId });
  }

  static async createContact(request: CreateContactRequest): Promise<Contact> {
    return invoke('create_contact', {
      email: request.email,
      firstName: request.first_name,
      lastName: request.last_name,
      listId: request.list_id,
    });
  }

  static async deleteContact(id: string): Promise<void> {
    return invoke('delete_contact', { id });
  }

  // Template operations
  static async getTemplates(): Promise<Template[]> {
    return invoke('get_templates');
  }

  static async createTemplate(request: CreateTemplateRequest): Promise<Template> {
    return invoke('create_template', {
      name: request.name,
      subject: request.subject,
      htmlContent: request.html_content,
      textContent: request.text_content,
    });
  }

  static async updateTemplate(request: UpdateTemplateRequest): Promise<Template> {
    return invoke('update_template', {
      id: request.id,
      name: request.name,
      subject: request.subject,
      htmlContent: request.html_content,
      textContent: request.text_content,
    });
  }

  static async getTemplateById(id: string): Promise<Template | null> {
    return invoke('get_template_by_id', { id });
  }

  static async deleteTemplate(id: string): Promise<void> {
    return invoke('delete_template', { id });
  }

  // Settings operations
  static async getSettings(): Promise<Settings> {
    return invoke('get_settings');
  }

  static async updateSettings(request: UpdateSettingsRequest): Promise<Settings> {
    return invoke('update_settings', {
      sesAccessKey: request.ses_access_key,
      sesSecretKey: request.ses_secret_key,
      sesRegion: request.ses_region,
      defaultFromEmail: request.default_from_email,
      defaultFromName: request.default_from_name,
      theme: request.theme,
      aiProvider: request.ai_provider,
      aiApiKey: request.ai_api_key,
      aiModel: request.ai_model,
      aiCustomEndpoint: request.ai_custom_endpoint,
    });
  }

  // Analytics operations
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    return invoke('get_campaign_analytics', { campaignId });
  }

  static async getAllAnalytics(): Promise<CampaignAnalytics[]> {
    return invoke('get_all_analytics');
  }

  // Campaign enhancements
  static async updateCampaignContactLists(id: string, listIds: string[]): Promise<Campaign> {
    return invoke('update_campaign_contact_lists', { id, listIds });
  }

  static async updateCampaignStatus(id: string, status: CampaignStatus, scheduledAt?: string): Promise<Campaign> {
    return invoke('update_campaign_status', { id, status: status.toLowerCase(), scheduledAt });
  }

  // SES operations
  static async verifySesCreds(accessKey: string, secretKey: string, region: string): Promise<boolean> {
    return invoke('verify_ses_credentials', { accessKey, secretKey, region });
  }

  static async sendCampaign(campaignId: string): Promise<CampaignSendResult> {
    return invoke('send_campaign', { campaignId });
  }

  static async sendTestEmail(to: string, subject: string, htmlContent: string, fromEmail: string, fromName: string): Promise<string> {
    return invoke('send_test_email', { to, subject, htmlContent, fromEmail, fromName });
  }

  // Agent
  static async getAgentSessions(): Promise<import('../types/database').AgentSession[]> {
    return invoke('get_agent_sessions');
  }

  static async createAgentSession(title: string): Promise<import('../types/database').AgentSession> {
    return invoke('create_agent_session', { title });
  }

  static async deleteAgentSession(id: string): Promise<void> {
    return invoke('delete_agent_session', { id });
  }

  static async renameAgentSession(id: string, title: string): Promise<import('../types/database').AgentSession> {
    return invoke('rename_agent_session', { id, title });
  }

  static async sendAgentMessage(sessionId: string, message: string): Promise<import('../types/database').AgentMessage> {
    return invoke('send_agent_message', { sessionId, message });
  }

  static async checkClaudeCodeStatus(): Promise<{ loggedIn: boolean; email?: string; orgName?: string; subscriptionType?: string }> {
    return invoke('check_claude_code_status');
  }

  static async getAiProviderModels(provider: string): Promise<string[]> {
    return invoke('get_ai_provider_models', { provider });
  }

  // Validation
  static async validateEmails(emails: string[]): Promise<import('../types/database').ValidationSummary> {
    return invoke('validate_emails', { emails });
  }

  static async validateContactList(listId: string): Promise<import('../types/database').ValidationSummary> {
    return invoke('validate_contact_list', { listId });
  }

  // Tracking
  static async setupTracking(): Promise<{ configuration_set_name: string; sns_topic_arn: string; sqs_queue_url: string }> {
    return invoke('setup_tracking');
  }

  static async pollTrackingEvents(): Promise<number> {
    return invoke('poll_tracking_events');
  }

  // Logs
  static async getLogPath(): Promise<string> {
    return invoke('get_log_path');
  }

  // CSV Import
  static async importContactsCsv(filePath: string, listId: string, columnMapping: ColumnMapping, hasHeader: boolean): Promise<ImportResult> {
    return invoke('import_contacts_csv', {
      filePath,
      listId,
      columnMapping: JSON.stringify(columnMapping),
      hasHeader,
    });
  }
}
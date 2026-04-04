use anyhow::Result;

use crate::database::storage::DatabaseStorage;

/// Sanitize user-controlled strings before inserting into system prompt
/// Strips characters that could be used for prompt injection
fn sanitize_for_prompt(s: &str) -> String {
    s.replace('[', "(")
        .replace(']', ")")
        .replace('\n', " ")
        .replace('\r', "")
        .chars()
        .take(200)
        .collect()
}

pub async fn build_system_prompt(storage: &DatabaseStorage) -> Result<String> {
    let campaigns = storage.get_campaigns().await?;
    let contacts = storage.get_contacts().await?;
    let templates = storage.get_templates().await?;
    let analytics = storage.get_analytics().await?;

    let mut context = String::new();

    // Campaigns summary
    context.push_str(&format!(
        "\n### Campaigns ({})\n",
        campaigns.campaigns.len()
    ));
    for c in &campaigns.campaigns {
        context.push_str(&format!(
            "- {} | Status: {:?} | Subject: {} | Lists: {}\n",
            sanitize_for_prompt(&c.name),
            c.status,
            sanitize_for_prompt(&c.subject),
            c.contact_list_ids.len()
        ));
    }

    // Contact lists summary
    context.push_str(&format!(
        "\n### Contact Lists ({})\n",
        contacts.contact_lists.len()
    ));
    for l in &contacts.contact_lists {
        context.push_str(&format!(
            "- {} | {} contacts\n",
            sanitize_for_prompt(&l.name),
            l.contact_count
        ));
    }

    let total_contacts = contacts
        .contact_lists
        .iter()
        .map(|l| l.contact_count)
        .sum::<usize>();
    context.push_str(&format!("Total contacts: {}\n", total_contacts));

    // Templates summary
    context.push_str(&format!(
        "\n### Templates ({})\n",
        templates.templates.len()
    ));
    for t in &templates.templates {
        context.push_str(&format!(
            "- {} | Subject: {}\n",
            sanitize_for_prompt(&t.name),
            sanitize_for_prompt(&t.subject)
        ));
    }

    // Analytics summary
    if !analytics.campaign_analytics.is_empty() {
        context.push_str("\n### Analytics\n");
        for a in &analytics.campaign_analytics {
            let campaign_name = campaigns
                .campaigns
                .iter()
                .find(|c| c.id == a.campaign_id)
                .map(|c| sanitize_for_prompt(&c.name))
                .unwrap_or_else(|| "Unknown".to_string());
            let open_rate = if a.sent > 0 {
                format!("{:.1}%", (a.opened as f64 / a.sent as f64) * 100.0)
            } else {
                "N/A".to_string()
            };
            context.push_str(&format!(
                "- {} | Sent: {} | Delivered: {} | Opened: {} ({})\n",
                campaign_name, a.sent, a.delivered, a.opened, open_rate
            ));
        }
    }

    let system_prompt = format!(
        r#"You are an expert email marketing assistant inside MailFleet, a desktop email campaign management app.

## Your Role
You help users with email marketing strategy, campaign optimization, and content creation. You are knowledgeable, direct, and actionable.

## Your Capabilities
- Analyze campaigns, templates, contacts, and analytics data
- Create new email templates through guided Q&A
- Create new email campaigns through guided Q&A
- Provide email marketing advice (subject lines, timing, segmentation, deliverability)

## Restrictions
- You CANNOT create or modify contacts
- You CANNOT delete anything
- You can ONLY create new templates and campaigns

## Current Database
{context}

## Creating Templates

When creating a template, ask up to 3 questions ONE AT A TIME:
1. What type of template (Welcome, Newsletter, Product Announcement, Promotional, Re-engagement, Custom)
2. What tone/style (Professional, Casual, Friendly, Urgent, Minimal)
3. Any specific details the user wants included

Use this format for questions:
[QUESTION]{{"question": "What type of email template?", "options": ["Welcome Email", "Newsletter", "Product Announcement", "Promotional", "Re-engagement", "Custom"]}}[/QUESTION]

Then create:
[ACTION]{{"action": "CreateTemplate", "name": "Template Name", "subject": "Subject Line", "html_content": "<h2>...</h2><p>...</p>", "text_content": "Plain text version"}}[/ACTION]

## Creating Campaigns

When creating a campaign, you MUST ask these questions ONE AT A TIME:
1. Which contact list to send to (show the available lists from the database above as options)
2. Which template to use OR what the email is about (show available templates as options, plus "Write from scratch")
3. Who is sending it — ask for sender name and email (suggest the default if available in settings)

After collecting answers, create the campaign with contact lists and email content:
[ACTION]{{"action": "CreateCampaign", "name": "Campaign Name", "subject": "Subject Line", "from_email": "the@email.com", "from_name": "The Name", "contact_list_names": ["List Name 1"], "html_content": "<h2>Title</h2><p>Email body...</p>"}}[/ACTION]

IMPORTANT:
- The from_email and from_name are set during campaign creation and cannot be changed later. Always ask the user to confirm.
- contact_list_names must match exact names from the database above
- html_content should be the full email body HTML based on the template choice or user description
- If the user chose a template, generate similar content. If writing from scratch, create professional email HTML.

Always explain what you created after the action block.

## Response Style
- Be concise and helpful
- Use markdown formatting
- When analyzing data, provide specific numbers and actionable recommendations
- For subject lines, always suggest 2-3 options"#,
        context = context
    );

    Ok(system_prompt)
}

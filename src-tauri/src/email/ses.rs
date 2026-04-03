use anyhow::{Context, Result};
use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_sesv2::types::{Body, Content, Destination, EmailContent, Message, MessageTag};
use aws_sdk_sesv2::Client;

pub async fn build_ses_client(access_key: &str, secret_key: &str, region: &str) -> Result<Client> {
    let creds = Credentials::new(access_key, secret_key, None, None, "mailfleet");

    let config = aws_config::from_env()
        .credentials_provider(creds)
        .region(Region::new(region.to_string()))
        .load()
        .await;

    Ok(Client::new(&config))
}

pub async fn verify_credentials(client: &Client) -> Result<()> {
    client
        .get_account()
        .send()
        .await
        .context("Failed to verify SES credentials")?;
    Ok(())
}

pub async fn send_email(
    client: &Client,
    from_address: &str,
    to_address: &str,
    subject: &str,
    html_body: &str,
    text_body: Option<&str>,
    config_set: Option<&str>,
    campaign_id: Option<&str>,
) -> Result<String> {
    let subject_content = Content::builder()
        .data(subject)
        .charset("UTF-8")
        .build()
        .context("Failed to build subject")?;

    let html_content = Content::builder()
        .data(html_body)
        .charset("UTF-8")
        .build()
        .context("Failed to build HTML body")?;

    let mut body_builder = Body::builder().html(html_content);

    if let Some(text) = text_body {
        let text_content = Content::builder()
            .data(text)
            .charset("UTF-8")
            .build()
            .context("Failed to build text body")?;
        body_builder = body_builder.text(text_content);
    }

    let body = body_builder.build();

    let message = Message::builder()
        .subject(subject_content)
        .body(body)
        .build();

    let email_content = EmailContent::builder().simple(message).build();

    let destination = Destination::builder().to_addresses(to_address).build();

    let mut request = client
        .send_email()
        .from_email_address(from_address)
        .destination(destination)
        .content(email_content);

    // Attach configuration set for tracking
    if let Some(cs) = config_set {
        request = request.configuration_set_name(cs);
    }

    // Tag with campaign ID so we can match events back
    if let Some(cid) = campaign_id {
        request = request.email_tags(
            MessageTag::builder()
                .name("mailfleet-campaign-id")
                .value(cid)
                .build()
                .unwrap(),
        );
    }

    let result = request
        .send()
        .await
        .map_err(|e| {
            let msg = format!("{:?}", e);
            anyhow::anyhow!("SES error: {}", msg)
        })?;

    Ok(result.message_id().unwrap_or("unknown").to_string())
}

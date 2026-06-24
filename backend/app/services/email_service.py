"""
Email service — all email sending logic lives here.
Uses Python's built-in smtplib. No external email packages required.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


def send_invite_email(to_email: str, invite_link: str, inviter_name: str) -> None:
    """
    Send a clinician invite email via Gmail SMTP.
    Falls back to console logging when SMTP credentials are not configured.
    """
    if not settings.smtp_user or not settings.smtp_password:
        _log_invite(to_email, invite_link)
        return

    subject = f"{inviter_name} invited you to MedVerify"
    from_addr = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    html_body = _build_invite_html(invite_link, inviter_name)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password.strip())
            server.sendmail(settings.smtp_user, to_email, msg.as_string())
        print(f"✓ Invite email sent to {to_email}")
    except Exception as e:
        # Don't crash the invite flow — invite_link is still returned in the API response
        print(f"✗ Failed to send invite email to {to_email}: {e}")


def _log_invite(to_email: str, invite_link: str) -> None:
    """Dev-mode fallback: print invite details to console."""
    print(f"\n{'='*60}")
    print(f"  INVITE EMAIL (SMTP not configured)")
    print(f"  To:   {to_email}")
    print(f"  Link: {invite_link}")
    print(f"{'='*60}\n")


def _build_invite_html(invite_link: str, inviter_name: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 480px; margin: 0 auto; padding: 32px; color: #0f172a;">

      <div style="margin-bottom: 28px;">
        <span style="font-size: 20px; font-weight: 700; color: #0f172a;">MedVerify</span>
      </div>

      <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">
        You have been invited to join MedVerify
      </h2>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 12px;">
        <strong>{inviter_name}</strong> has invited you to MedVerify — an AI-powered
        clinical evidence platform for healthcare professionals.
      </p>

      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Click the button below to set your password and activate your account.
        <strong>This link expires in 48 hours.</strong>
      </p>

      <div style="margin-bottom: 32px;">
        <a href="{invite_link}"
           style="display: inline-block; padding: 13px 28px; background-color: #0f172a;
                  color: #ffffff; text-decoration: none; border-radius: 8px;
                  font-size: 14px; font-weight: 600; letter-spacing: 0.01em;">
          Accept Invite &rarr;
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 20px;" />

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
        If the button above doesn't work, copy and paste this link into your browser:<br/>
        <a href="{invite_link}" style="color: #2563eb; word-break: break-all;">{invite_link}</a>
      </p>

    </div>
    """

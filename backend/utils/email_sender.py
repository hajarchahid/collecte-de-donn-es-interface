import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_email(to_email, subject, html_content):
    """
    Sends an HTML email using Gmail SMTP configurations.
    Attempts Port 587 (STARTTLS) first, then Port 465 (SSL) as fallback.
    """
    sender_email = current_app.config['MAIL_USERNAME']
    sender_password = current_app.config['MAIL_PASSWORD']
    smtp_server = current_app.config['MAIL_SERVER']
    
    # Default to 587 if not set, but we will try both
    
    if not sender_email or not sender_password:
        print("Warning: Email credentials not set in environment variables.")
        return False

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    try:
        # Standard connection to Gmail (Port 587 STARTTLS)
        # We assume DNS and Network are fine as verified by debug script
        print(f"Connecting to SMTP server: {smtp_server}:587")
        server = smtplib.SMTP(smtp_server, 587, timeout=10)
        # server.set_debuglevel(1) # Uncomment for verbose logs
        
        server.starttls()
        server.login(sender_email, sender_password)
        
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
            
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False
    finally:
        try:
            if server:
                server.quit()
        except:
            pass

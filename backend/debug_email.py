
import smtplib
import socket
import os

user = os.environ.get('GMAIL_USER')
password = os.environ.get('GMAIL_PASSWORD')
server = 'smtp.gmail.com'

print(f"Testing connectivity to {server} for user {user}...")

try:
    print("Resolving DNS...")
    ip = socket.gethostbyname(server)
    print(f"Resolved IP: {ip}")
    
    print("Connecting to port 587...")
    s = smtplib.SMTP(server, 587, timeout=10)
    s.set_debuglevel(1)
    
    print("Starting TLS...")
    s.starttls()
    
    print("Logging in...")
    s.login(user, password)
    
    print("Login successful!")
    s.quit()
except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")

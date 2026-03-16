def send_sms(phone_number, message):
    """
    Mock SMS sender. In production, integrate with Twilio/Vonage.
    """
    print(f"--- MOCK SMS to {phone_number} ---")
    print(message)
    print("----------------------------------")
    return True

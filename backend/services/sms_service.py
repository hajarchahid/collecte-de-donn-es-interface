import os
import logging
from datetime import datetime

class SmsService:
    def __init__(self):
        self.provider = os.environ.get('SMS_PROVIDER', 'mock')
        self.api_key = os.environ.get('SMS_API_KEY')
        self.api_secret = os.environ.get('SMS_API_SECRET')
        self.sender_id = os.environ.get('SMS_SENDER_ID', 'OrthoData')
        
        # Setup specific logger for SMS outbox
        self.logger = logging.getLogger('sms_outbox')
        self.logger.setLevel(logging.INFO)
        
        # File handler for sms_outbox.log
        if not self.logger.handlers:
            handler = logging.FileHandler('sms_outbox.log')
            formatter = logging.Formatter('%(asctime)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def send_sms(self, phone_number, message):
        """
        Sends an SMS using the configured provider.
        Returns check dict {success: bool, msg: str}
        """
        if not phone_number:
            return {"success": False, "msg": "No phone number provided"}

        if self.provider == 'mock':
            return self._send_mock(phone_number, message)
        elif self.provider == 'twilio':
            return self._send_twilio(phone_number, message)
        else:
            print(f"SMS Provider '{self.provider}' not implemented. Fallback to mock.")
            return self._send_mock(phone_number, message)

    def _send_mock(self, phone_number, message):
        log_msg = f"[MOCK SMS] To: {phone_number} | Body: {message}"
        print(log_msg) # Console for immediate feedback
        self.logger.info(log_msg) # File for persistence
        return {"success": True, "msg": "Mock SMS logged"}

    def _send_twilio(self, phone_number, message):
        # Placeholder for real implementation
        if not self.api_key or not self.api_secret:
            return {"success": False, "msg": "Twilio credentials missing"}
        
        # Implementation would go here
        print(f"[TWILIO] Sending to {phone_number}: {message}")
        return {"success": True, "msg": "Twilio SMS sent (simulated)"}

# Singleton instance
sms_service = SmsService()

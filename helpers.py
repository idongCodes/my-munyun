import os
import re
import requests
import streamlit as st

def get_config(key, default=""):
    # First check Streamlit Cloud Secrets, then fallback to local env
    try:
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    return os.getenv(key, default)

def clean_phone_number(phone_str):
    # Remove all non-digits
    digits = re.sub(r'\D', '', phone_str)
    if len(digits) == 10:
        return "+1" + digits
    elif len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    elif len(digits) > 10:
        return "+" + digits
    return "+" + digits  # fallback

def send_twilio_sms(to_number, code):
    account_sid = get_config("TWILIO_ACCOUNT_SID")
    auth_token = get_config("TWILIO_AUTH_TOKEN")
    from_number = get_config("TWILIO_PHONE_NUMBER")
    
    if not (account_sid and auth_token and from_number):
        return False
        
    try:
        from requests.auth import HTTPBasicAuth
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            "To": to_number,
            "From": from_number,
            "Body": f"Your Munyun Verification Code is: {code}"
        }
        r = requests.post(url, data=data, auth=HTTPBasicAuth(account_sid, auth_token), timeout=5)
        return r.status_code == 201
    except Exception:
        return False

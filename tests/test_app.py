import datetime
import pytest
import pyotp
import streamlit as st
from streamlit.testing.v1 import AppTest

# Import the helpers from helpers instead of app to prevent importing UI logic
import helpers
from helpers import clean_phone_number, send_twilio_sms

def test_clean_phone_number():
    assert clean_phone_number("+17743126471") == "+17743126471"
    assert clean_phone_number("+1 (774) 312 6471") == "+17743126471"
    assert clean_phone_number("17743126471") == "+17743126471"
    assert clean_phone_number("1 774-312-6471") == "+17743126471"
    assert clean_phone_number("774.312.6471") == "+17743126471"
    assert clean_phone_number("123") == "+123"

def test_send_twilio_sms_mock(monkeypatch):
    class MockResponse:
        status_code = 201
        
    monkeypatch.setattr("requests.post", lambda *args, **kwargs: MockResponse())
    monkeypatch.setattr(helpers, "get_config", lambda key, default="": {
        "TWILIO_ACCOUNT_SID": "AC123",
        "TWILIO_AUTH_TOKEN": "token",
        "TWILIO_PHONE_NUMBER": "+18444828809"
    }.get(key, default))
    
    assert send_twilio_sms("+17743126471", "123456") is True

def test_send_twilio_sms_missing_config(monkeypatch):
    monkeypatch.setattr(helpers, "get_config", lambda key, default="": "")
    assert send_twilio_sms("+17743126471", "123456") is False

def test_app_first_run_shows_splash_and_login():
    at = AppTest.from_file("app.py")
    at.run()
    # It should render the splash loader text
    assert not at.exception
    # Should render the login UI fields since st.session_state.logged_in is False
    assert len(at.selectbox) > 0
    assert at.selectbox[0].label == "Authentication Method"

def test_app_passcode_login_success(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    at = AppTest.from_file("app.py")
    monkeypatch.setenv("APP_PASSWORD", "secret123")
    monkeypatch.setenv("TOTP_SECRET", "") # Ensure passcode mode
    
    at.run()
    assert len(at.text_input) > 0
    assert at.text_input[0].label == "Passcode"
    
    # Enter correct password
    at.text_input[0].input("secret123")
    at.button[0].click()
    at.run()
    
    assert at.session_state.logged_in is True
    
    # Manually run again to simulate rerun rendering dashboard
    at.run()
    assert not at.exception

def test_app_passcode_login_failure(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    at = AppTest.from_file("app.py")
    monkeypatch.setenv("APP_PASSWORD", "secret123")
    monkeypatch.setenv("TOTP_SECRET", "")
    
    at.run()
    at.text_input[0].input("wrong_pass")
    at.button[0].click()
    at.run()
    
    assert at.session_state.logged_in is False
    assert len(at.error) > 0
    assert "Incorrect passcode" in at.error[0].value

def test_app_sms_login_flow(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    at = AppTest.from_file("app.py")
    monkeypatch.setenv("TOTP_SECRET", "")
    monkeypatch.setenv("ALLOWED_PHONE_NUMBERS", "+17743126471")
    
    at.run()
    # Switch to SMS Verification
    at.selectbox[0].select("SMS Verification")
    at.run()
    
    # Enter phone number and click Send Code
    assert at.text_input[0].label == "Phone Number"
    at.text_input[0].input("+17743126471")
    at.button[0].click()
    at.run()
    
    # Simulate rerun after sending SMS to render the code verification form
    at.run()
    
    # Verification code should be generated in state
    assert at.session_state.sms_sent is True
    assert at.session_state.sms_code is not None
    
    # Now that the verification form is rendered, input the verification code
    code = at.session_state.sms_code
    assert at.text_input[0].label == "Enter 6-digit SMS Code"
    at.text_input[0].input(code)
    at.button[0].click()
    at.run()
    
    # Simulate rerun after successful verification to transition login state
    at.run()
    
    assert at.session_state.logged_in is True
    
    # Manually run again to simulate final dashboard rendering
    at.run()
    assert not at.exception

def test_app_google_authenticator_setup_flow(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    at = AppTest.from_file("app.py")
    monkeypatch.setenv("TOTP_SECRET", "") # Ensure setup is possible
    monkeypatch.setenv("APP_PASSWORD", "secret123")
    
    at.run()
    # Click on "🛡️ Setup Google Authenticator 2FA" button
    assert len(at.button) > 1
    assert "Setup" in at.button[1].label
    at.button[1].click()
    at.run()
    
    # Simulate rerun after triggering MFA setup to render setup wizard
    at.run()
    
    assert at.session_state.setup_mfa is True
    
    # Enter dummy verification code and click Verify & Activate
    at.text_input[0].input("000000")
    at.button[0].click()
    at.run()
    
    # It should show error "Invalid verification code"
    assert len(at.error) > 0
    assert "Invalid verification" in at.error[0].value
    
    # Cancel setup
    assert "Cancel" in at.button[1].label
    at.button[1].click()
    at.run()
    
    # Simulate rerun to transition out of setup wizard
    at.run()
    
    assert at.session_state.setup_mfa is False

def test_app_google_authenticator_login(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    
    at = AppTest.from_file("app.py")
    monkeypatch.setenv("TOTP_SECRET", secret)
    
    at.run()
    assert at.selectbox[0].value == "Authenticator Code"
    
    # Enter code and click Unlock Portal
    code = totp.now()
    at.text_input[0].input(code)
    at.button[0].click()
    at.run()
    
    # Simulate rerun after login to transit to dashboard
    at.run()
    
    assert at.session_state.logged_in is True
    assert not at.exception

def test_app_dashboard_sidebar_actions(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    
    at = AppTest.from_file("app.py")
    at.session_state.logged_in = True
    at.session_state.login_time = datetime.datetime.now()
    
    at.run()
    assert len(at.sidebar.button) > 0
    assert "Sync" in at.sidebar.button[0].label
    
    monkeypatch.setattr("app.sync_all", lambda: True)
    at.sidebar.button[0].click()
    at.run()
    
    # Success message should be in sidebar
    assert len(at.sidebar.success) > 0
    assert "Sync completed" in at.sidebar.success[0].value
    
    # Click disconnect/clear
    assert "Clear" in at.sidebar.button[1].label
    monkeypatch.setattr("app.clear_all_data", lambda: True)
    at.sidebar.button[1].click()
    at.run()
    
    assert len(at.sidebar.success) > 0
    assert "All connections reset" in at.sidebar.success[0].value

def test_app_dashboard_budget_form(monkeypatch):
    monkeypatch.setattr(st, "rerun", lambda: None)
    
    import database
    database.save_budget("Groceries", 200.0)
    
    at = AppTest.from_file("app.py")
    at.session_state.logged_in = True
    at.session_state.login_time = datetime.datetime.now()
    
    at.run()
    assert len(at.selectbox) > 0
    
    # Check budget update
    at.number_input[0].set_value(350.0)
    
    save_btn = None
    for btn in at.button:
        if "Save Budget" in btn.label:
            save_btn = btn
            break
    assert save_btn is not None
    save_btn.click()
    at.run()
    
    # Budget should be updated in DB
    budgets = database.get_budgets()
    assert budgets.get("Groceries") == 350.0

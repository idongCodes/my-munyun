import os
import random
import datetime
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dotenv import load_dotenv

# Import Plaid SDK
import plaid
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

import database

# Load environment variables (locally)
load_dotenv()

# Page Configuration
st.set_page_config(
    page_title="Munyun - Personal Finance Dashboard",
    page_icon="💸",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize database
database.init_db()

# Load Custom CSS Styling
def load_css():
    css_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "style.css")
    if os.path.exists(css_file):
        with open(css_file) as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    else:
        st.markdown("<style>body { background-color: #000000; color: white; }</style>", unsafe_allow_html=True)

load_css()

# Render Splash Screen once per session load
just_shown_splash = False
if 'splash_shown' not in st.session_state:
    st.markdown("""
    <div id="splash-screen" style="text-align: center;">
        <div id="splash-logo"><span class="emoji">💸</span><span class="logo-text"> Munyun</span></div>
        <div id="splash-loader" style="margin: 0 auto;"></div>
        <div style="margin-top: 20px; color: #9ca3af; font-size: 0.9rem; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.05em; text-align: center; width: 100%;">SECURELY SYNCING WEALTH...</div>
    </div>
    """, unsafe_allow_html=True)
    st.session_state.splash_shown = True
    just_shown_splash = True

# --- Config and Plaid Client Initialization ---
def get_config(key, default=""):
    # First check Streamlit Cloud Secrets, then fallback to local env
    try:
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    return os.getenv(key, default)

PLAID_CLIENT_ID = get_config("PLAID_CLIENT_ID")
PLAID_SECRET = get_config("PLAID_SECRET")
PLAID_ENV = get_config("PLAID_ENV", "sandbox")
USE_MOCK_DATA = str(get_config("USE_MOCK_DATA", "True")).lower() == "true"

is_plaid_configured = bool(PLAID_CLIENT_ID and PLAID_SECRET)
if not is_plaid_configured:
    # If Plaid is not configured, force mock data mode
    USE_MOCK_DATA = True

import pyotp
import urllib.parse
import re
import requests

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
    except Exception as e:
        st.error(f"Failed to send SMS via Twilio: {e}")
        return False

APP_PASSWORD = get_config("APP_PASSWORD", "admin")
TOTP_SECRET = get_config("TOTP_SECRET", "")
ALLOWED_PHONE_NUMBERS = [
    clean_phone_number(n.strip())
    for n in get_config("ALLOWED_PHONE_NUMBERS", "+17743126471").split(",")
    if n.strip()
]

# --- Authentication & Multi-Factor System ---
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'setup_mfa' not in st.session_state:
    st.session_state.setup_mfa = False
if 'sms_sent' not in st.session_state:
    st.session_state.sms_sent = False
if 'sms_code' not in st.session_state:
    st.session_state.sms_code = None
if 'sms_phone' not in st.session_state:
    st.session_state.sms_phone = None

# Auto-logout after 72 hours
if st.session_state.logged_in and 'login_time' in st.session_state:
    elapsed = datetime.datetime.now() - st.session_state.login_time
    if elapsed.total_seconds() > 72 * 3600:
        st.session_state.logged_in = False
        st.session_state.login_time = None
        st.session_state.splash_shown = False
        st.rerun()

if not st.session_state.logged_in:
    fade_class = "delayed-fade" if just_shown_splash else "instant-fade"
    st.markdown(f'<div class="{fade_class}">', unsafe_allow_html=True)
    
    col_space1, col_login, col_space2 = st.columns([1, 1.3, 1])
    with col_login:
        st.markdown(f"""
        <div style="text-align: center; margin-top: 8vh; margin-bottom: 20px;">
            <div class="login-title"><span style="color: #4e80e4;">💸</span> Munyun</div>
            <div class="login-subtitle">Secure Wealth Portal</div>
        </div>
        """, unsafe_allow_html=True)
        
        # 1. Google Authenticator Setup Wizard
        if st.session_state.setup_mfa:
            st.markdown("### 🔒 Setup 2FA (Google Authenticator)")
            st.write("Scan the QR code below using your Google Authenticator app on your phone, then enter the verification code.")
            
            # Generate temporary base32 secret if not already set
            if 'temp_totp_secret' not in st.session_state:
                st.session_state.temp_totp_secret = pyotp.random_base32()
                
            temp_secret = st.session_state.temp_totp_secret
            
            # Create provisioning URI for Authenticator scan
            totp = pyotp.TOTP(temp_secret)
            # Use 'Munyun:idongcodes' as label
            provisioning_uri = totp.provisioning_uri(name="idongcodes", issuer_name="Munyun")
            
            # Use QR code generator API to display image
            qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={urllib.parse.quote(provisioning_uri)}&color=4e80e4&bgcolor=000000"
            
            # Display QR Code centered
            st.markdown(f'<div style="text-align: center; margin: 15px 0;"><img src="{qr_api_url}" style="border: 4px solid #111827; border-radius: 12px;" /></div>', unsafe_allow_html=True)
            
            st.code(f"Secret Key: {temp_secret}", language="text")
            
            with st.form("verify_totp_form", clear_on_submit=False):
                verify_code = st.text_input("Enter 6-digit Verification Code", placeholder="000 000")
                verify_submit = st.form_submit_button("Verify & Activate")
                
                if verify_submit:
                    # Clean whitespaces
                    clean_code = verify_code.replace(" ", "")
                    if totp.verify(clean_code):
                        st.success("🎉 Google Authenticator verification successful!")
                        st.markdown(f"""
                        > [!IMPORTANT]
                        > **Save this secret to complete setup:**
                        > Add this variable to your `.env` file (or your Streamlit Cloud secrets):
                        > ```env
                        > TOTP_SECRET={temp_secret}
                        > ```
                        """)
                        if st.form_submit_button("Proceed to Dashboard"):
                            st.session_state.logged_in = True
                            st.session_state.login_time = datetime.datetime.now()
                            st.session_state.setup_mfa = False
                            st.rerun()
                    else:
                        st.error("Invalid verification code. Please check your authenticator app and try again.")
            
            if st.button("Cancel & Go Back"):
                st.session_state.setup_mfa = False
                st.rerun()
                
        # 2. Login Flow Selection
        else:
            auth_methods = ["Authenticator Code", "SMS Verification"] if TOTP_SECRET else ["Passcode Login", "SMS Verification"]
            login_method = st.selectbox("Authentication Method", auth_methods)
            
            # --- SMS Verification Flow ---
            if login_method == "SMS Verification":
                if not st.session_state.sms_sent:
                    with st.form("sms_request_form", clear_on_submit=False):
                        phone_input = st.text_input("Phone Number", placeholder="+1 (774) 312 6471")
                        send_btn = st.form_submit_button("Send Code")
                        
                        if send_btn:
                            cleaned_num = clean_phone_number(phone_input)
                            if cleaned_num in ALLOWED_PHONE_NUMBERS:
                                code = str(random.randint(100000, 999999))
                                st.session_state.sms_code = code
                                st.session_state.sms_phone = cleaned_num
                                st.session_state.sms_sent = True
                                
                                sent = send_twilio_sms(cleaned_num, code)
                                if sent:
                                    st.success("Verification code sent successfully via SMS!")
                                else:
                                    st.success("Verification code generated!")
                                    st.info(f"🔑 [DEMO MODE] SMS Code: {code}")
                                st.rerun()
                            else:
                                st.error(f"Phone number {cleaned_num} not authorized. Allowed list: {ALLOWED_PHONE_NUMBERS}")
                else:
                    with st.form("sms_verify_form", clear_on_submit=False):
                        st.write(f"Code sent to **{st.session_state.sms_phone}**")
                        code_input = st.text_input("Enter 6-digit SMS Code", placeholder="000 000")
                        verify_btn = st.form_submit_button("Unlock Portal")
                        
                        if verify_btn:
                            clean_input = code_input.replace(" ", "")
                            if clean_input == st.session_state.sms_code:
                                st.session_state.logged_in = True
                                st.session_state.login_time = datetime.datetime.now()
                                st.session_state.sms_sent = False
                                st.session_state.sms_code = None
                                st.session_state.sms_phone = None
                                st.success("Access Granted!")
                                st.rerun()
                            else:
                                st.error("Invalid verification code. Please try again.")
                                
                    if st.button("Resend Code / Change Number"):
                        st.session_state.sms_sent = False
                        st.session_state.sms_code = None
                        st.session_state.sms_phone = None
                        st.rerun()
            
            # --- Google Authenticator Code Flow ---
            elif login_method == "Authenticator Code":
                with st.form("totp_login_form", clear_on_submit=False):
                    totp_code = st.text_input("Google Authenticator Code", placeholder="000 000")
                    totp_submit = st.form_submit_button("Unlock Portal")
                    
                    if totp_submit:
                        clean_code = totp_code.replace(" ", "")
                        totp = pyotp.TOTP(TOTP_SECRET)
                        if totp.verify(clean_code):
                            st.session_state.logged_in = True
                            st.session_state.login_time = datetime.datetime.now()
                            st.success("Access Granted!")
                            st.rerun()
                        else:
                            st.error("Invalid Authenticator code. Please check your app.")
            
            # --- Standard Passcode Flow ---
            else:
                with st.form("login_form", clear_on_submit=False):
                    password = st.text_input("Passcode", type="password", placeholder="••••")
                    submit = st.form_submit_button("Authenticate")
                    
                    if submit:
                        if password == APP_PASSWORD:
                            st.session_state.logged_in = True
                            st.session_state.login_time = datetime.datetime.now()
                            st.success("Authenticated!")
                            st.rerun()
                        else:
                            st.error("Incorrect passcode. Please try again.")
                
                st.markdown("<p style='text-align: center; margin-top: 10px;'>- or -</p>", unsafe_allow_html=True)
                if st.button("🛡️ Setup Google Authenticator 2FA"):
                    st.session_state.setup_mfa = True
                    st.rerun()
                
        st.markdown("""
        <p style="text-align: center; color: #4b5563; font-size: 0.8rem; margin-top: 15px; font-family: 'Plus Jakarta Sans', sans-serif;">
            Protected by AES-256 local database encryption.
        </p>
        """, unsafe_allow_html=True)
        
    st.markdown('</div>', unsafe_allow_html=True)
    st.stop()


plaid_client = None
if is_plaid_configured:
    try:
        host = f"https://{PLAID_ENV}.plaid.com"
        configuration = Configuration(
            host=host,
            api_key={
                'clientId': PLAID_CLIENT_ID,
                'secret': PLAID_SECRET,
            }
        )
        api_client = ApiClient(configuration)
        plaid_client = plaid_api.PlaidApi(api_client)
    except Exception as e:
        st.sidebar.error(f"Error initializing Plaid Client: {e}")
        USE_MOCK_DATA = True

# --- Mock Data Generator ---
def generate_mock_data():
    database.clear_accounts()
    database.clear_transactions()

    # Create Mock Accounts
    mock_accounts = [
        {
            "id": "mock_boa_checking",
            "name": "BoA Advantage Checking",
            "mask": "4829",
            "type": "depository",
            "subtype": "checking",
            "balance_available": 5240.23,
            "balance_current": 5240.23,
            "institution": "Bank of America"
        },
        {
            "id": "mock_boa_savings",
            "name": "BoA Preferred Savings",
            "mask": "8812",
            "type": "depository",
            "subtype": "savings",
            "balance_available": 18450.00,
            "balance_current": 18450.00,
            "institution": "Bank of America"
        },
        {
            "id": "mock_cashapp",
            "name": "Cash App Balance",
            "mask": "9931",
            "type": "depository",
            "subtype": "checking",
            "balance_available": 320.50,
            "balance_current": 320.50,
            "institution": "Cash App (Lincoln Savings)"
        }
    ]
    database.save_accounts(mock_accounts)

    # Create Mock Transactions for the last 30 days
    categories = ["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel"]
    merchants = {
        "Income": [("Direct Deposit / Payroll", 2500.00)],
        "Groceries": [("Trader Joe's", -124.50), ("Whole Foods", -89.20), ("Safeway", -54.30)],
        "Dining": [("Starbucks", -6.25), ("Chipotle", -14.50), ("Sweetgreen", -16.80), ("Uber Eats", -32.40)],
        "Subscriptions": [("Netflix", -15.49), ("Spotify", -10.99), ("ChatGPT Plus", -20.00)],
        "Transfers": [("Cash App Sent to Alice", -40.00), ("Cash App Received from Bob", 15.00), ("Cash App Cash Out", 200.00)],
        "Shopping": [("Amazon.com", -89.99), ("Target", -42.15), ("Apple Store", -129.00)],
        "Utilities": [("Comcast Internet", -79.99), ("ConEd Utility Bill", -112.40)],
        "Travel": [("Uber", -18.50), ("Lyft", -15.20), ("Chevron Gas Station", -45.00)]
    }

    mock_txs = []
    start_date = datetime.date.today() - datetime.timedelta(days=30)
    tx_id_counter = 1

    # Add regular direct deposit twice a month
    for d in [1, 15]:
        tx_date = start_date.replace(day=d)
        if tx_date <= datetime.date.today():
            mock_txs.append({
                "id": f"tx_mock_{tx_id_counter}",
                "date": tx_date.isoformat(),
                "amount": -2500.00,  # Plaid format: negative is credit/income
                "name": "Direct Deposit / Payroll",
                "category": "Income",
                "account_id": "mock_boa_checking",
                "account_name": "BoA Advantage Checking",
                "institution": "Bank of America",
                "pending": False
            })
            tx_id_counter += 1

    # Generate random daily transactions
    curr_date = start_date
    while curr_date <= datetime.date.today():
        if curr_date.day in [1, 15]:
            curr_date += datetime.timedelta(days=1)
            continue
        
        if random.random() < 0.7:
            cat = random.choice([c for c in categories if c != "Income"])
            merchant_name, base_amount = random.choice(merchants[cat])
            
            variance = random.uniform(0.8, 1.2)
            amount = round(base_amount * variance, 2)
            
            if cat == "Transfers" or merchant_name.startswith("Cash App"):
                acc_id = "mock_cashapp"
                acc_name = "Cash App Balance"
                inst = "Cash App (Lincoln Savings)"
                plaid_amount = -amount if "Received" in merchant_name else abs(amount)
            else:
                acc_id = random.choice(["mock_boa_checking", "mock_boa_savings"])
                acc_name = "BoA Advantage Checking" if acc_id == "mock_boa_checking" else "BoA Preferred Savings"
                inst = "Bank of America"
                plaid_amount = abs(amount)

            mock_txs.append({
                "id": f"tx_mock_{tx_id_counter}",
                "date": curr_date.isoformat(),
                "amount": plaid_amount,
                "name": merchant_name,
                "category": cat,
                "account_id": acc_id,
                "account_name": acc_name,
                "institution": inst,
                "pending": False
            })
            tx_id_counter += 1

        curr_date += datetime.timedelta(days=1)

    database.save_transactions(mock_txs)

# --- Plaid Serverless Logics ---

def exchange_public_token(public_token, institution):
    if USE_MOCK_DATA or not is_plaid_configured:
        # In mock mode, pretend we succeeded and create mock records
        database.set_credential(f"access_token_{institution}", f"mock_access_token_{institution}")
        generate_mock_data()
        return True

    try:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = plaid_client.item_public_token_exchange(request)
        access_token = response['access_token']
        item_id = response['item_id']
        
        database.set_credential(f"access_token_{institution}", access_token)
        database.set_credential(f"item_id_{institution}", item_id)
        
        # Pull initial balances and transactions
        sync_item_data(access_token, institution)
        return True
    except Exception as e:
        st.error(f"Error exchanging public token: {e}")
        return False

def sync_item_data(access_token, institution):
    if USE_MOCK_DATA or not is_plaid_configured:
        return
        
    try:
        # 1. Fetch Balances
        balance_request = AccountsBalanceGetRequest(access_token=access_token)
        balance_response = plaid_client.accounts_balance_get(balance_request)
        
        inst_name = "Bank of America" if institution == "boa" else "Cash App"
        
        accounts_to_save = []
        for acc in balance_response['accounts']:
            accounts_to_save.append({
                "id": acc['account_id'],
                "name": acc['name'],
                "mask": acc.get('mask'),
                "type": str(acc['type']),
                "subtype": str(acc['subtype']) if acc.get('subtype') else None,
                "balance_available": acc['balances'].get('available'),
                "balance_current": acc['balances'].get('current'),
                "institution": inst_name
            })
        database.save_accounts(accounts_to_save)
        
        # 2. Fetch Transactions (last 30 days)
        start_date = datetime.date.today() - datetime.timedelta(days=30)
        end_date = datetime.date.today()
        
        tx_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(count=100)
        )
        tx_response = plaid_client.transactions_get(tx_request)
        
        txs_to_save = []
        for tx in tx_response['transactions']:
            txs_to_save.append({
                "id": tx['transaction_id'],
                "date": str(tx['date']),
                "amount": float(tx['amount']),
                "name": tx['merchant_name'] or tx['name'],
                "category": tx['category'][0] if tx.get('category') else "Uncategorized",
                "account_id": tx['account_id'],
                "account_name": next((a['name'] for a in balance_response['accounts'] if a['account_id'] == tx['account_id']), None),
                "institution": inst_name,
                "pending": tx['pending']
            })
        database.save_transactions(txs_to_save)
        
    except Exception as e:
        st.error(f"Error syncing data for {institution}: {e}")

def sync_all():
    if USE_MOCK_DATA:
        generate_mock_data()
        return True
        
    boa_token = database.get_credential("access_token_boa")
    cashapp_token = database.get_credential("access_token_cashapp")
    
    if boa_token:
        sync_item_data(boa_token, "boa")
    if cashapp_token:
        sync_item_data(cashapp_token, "cashapp")
    return True

def clear_all_data():
    database.clear_accounts()
    database.clear_transactions()
    database.delete_credential("access_token_boa")
    database.delete_credential("access_token_cashapp")
    database.delete_credential("item_id_boa")
    database.delete_credential("item_id_cashapp")
    return True

def create_link_token(institution_code):
    if USE_MOCK_DATA or not is_plaid_configured:
        return "mock_link_token"
    try:
        request = LinkTokenCreateRequest(
            client_name="Munyun Finance",
            language="en",
            country_codes=[CountryCode('US')],
            user=LinkTokenCreateRequestUser(
                client_user_id="user_idongcodes"
            ),
            products=[Products('transactions')]
        )
        response = plaid_client.link_token_create(request)
        return response['link_token']
    except Exception as e:
        st.error(f"Error generating link token: {e}")
        return None

# --- Query Params Redirect Handler ---
query_params = st.query_params
if "public_token" in query_params and "institution" in query_params:
    pub_token = query_params["public_token"]
    inst = query_params["institution"]
    
    with st.spinner("Exchanging public token and syncing sandbox data..."):
        success = exchange_public_token(pub_token, inst)
        if success:
            st.success(f"{inst.upper()} successfully linked!")
            # Clear parameters from URL and rerun
            st.query_params.clear()
            st.rerun()

# --- Render Plaid Link Button ---
def render_plaid_link(institution_code, label):
    link_token = create_link_token(institution_code)
    if not link_token:
        return

    if link_token == "mock_link_token":
        if st.button(f"🔌 Connect {label} (Demo Link)", key=f"demo_btn_{institution_code}"):
            with st.spinner("Connecting bank account..."):
                exchange_public_token("mock_public_token", institution_code)
                st.success(f"{label} successfully linked (Demo)!")
                st.rerun()
        return

    # Real Plaid Link Iframe incorporating query parameter redirect
    plaid_html = f"""
    <div style="text-align: center; margin: 10px 0;">
        <button id="plaid-link-button" style="
            background: linear-gradient(135deg, #1d3b7a 0%, #4e80e4 100%);
            color: #ffffff;
            border: none;
            border-radius: 10px;
            padding: 12px 24px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 14px 0 rgba(78, 128, 228, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: 100%;
            max-width: 280px;
            transition: all 0.2s ease;
        ">🔌 Connect {label} via Plaid</button>
    </div>
    <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
    <script>
        const linkButton = document.getElementById('plaid-link-button');
        
        // Add hover effects
        linkButton.addEventListener('mouseover', () => {{
            linkButton.style.background = 'linear-gradient(135deg, #4e80e4 0%, #76a2f2 100%)';
            linkButton.style.boxShadow = '0 6px 20px 0 rgba(78, 128, 228, 0.4)';
            linkButton.style.transform = 'translateY(-1px)';
        }});
        linkButton.addEventListener('mouseout', () => {{
            linkButton.style.background = 'linear-gradient(135deg, #1d3b7a 0%, #4e80e4 100%)';
            linkButton.style.boxShadow = '0 4px 14px 0 rgba(78, 128, 228, 0.3)';
            linkButton.style.transform = 'translateY(0)';
        }});

        linkButton.addEventListener('click', () => {{
            const handler = Plaid.create({{
                token: '{link_token}',
                onSuccess: (public_token, metadata) => {{
                    // Redirect the parent window to the Streamlit app URL with query parameters
                    const targetUrl = window.parent.location.origin + window.parent.location.pathname + 
                                      '?public_token=' + public_token + 
                                      '&institution=' + '{institution_code}';
                    window.parent.location.href = targetUrl;
                }},
                onExit: (err, metadata) => {{
                    if (err != null) {{
                        console.error('Plaid Link exit error:', err);
                    }}
                }}
            }});
            handler.open();
        }});
    </script>
    """
    st.components.v1.html(plaid_html, height=80)

# --- Sidebar UI ---
st.sidebar.markdown("<h2 style='text-align: center; color: #4e80e4;'>💸 Munyun</h2>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='text-align: center; color: #9ca3af; font-size: 0.85rem;'>Personal Wealth Aggregator</p>", unsafe_allow_html=True)
st.sidebar.markdown("---")

# Setup default mock values on initial startup
accounts_check = database.get_accounts()
if not accounts_check and USE_MOCK_DATA:
    generate_mock_data()

# Status Display
st.sidebar.subheader("Connection Status")
boa_linked = database.get_credential("access_token_boa") is not None
cashapp_linked = database.get_credential("access_token_cashapp") is not None

if USE_MOCK_DATA:
    st.sidebar.markdown("Bank of America: <span class='badge-demo'>DEMO MODE</span>", unsafe_allow_html=True)
    st.sidebar.markdown("Cash App: <span class='badge-demo'>DEMO MODE</span>", unsafe_allow_html=True)
else:
    boa_status = "<span class='badge-linked'>✓ LINKED</span>" if boa_linked else "<span class='badge-unlinked'>✗ NOT LINKED</span>"
    cashapp_status = "<span class='badge-linked'>✓ LINKED</span>" if cashapp_linked else "<span class='badge-unlinked'>✗ NOT LINKED</span>"
    st.sidebar.markdown(f"Bank of America: {boa_status}", unsafe_allow_html=True)
    st.sidebar.markdown(f"Cash App: {cashapp_status}", unsafe_allow_html=True)

st.sidebar.markdown("---")

# Operations
st.sidebar.subheader("Actions")

if st.sidebar.button("🔄 Sync Account Data"):
    with st.spinner("Syncing..."):
        if sync_all():
            st.sidebar.success("Sync completed!")
            st.rerun()

st.sidebar.markdown("<div class='clear-btn'>", unsafe_allow_html=True)
if st.sidebar.button("⚠️ Disconnect & Clear All"):
    if clear_all_data():
        st.sidebar.success("All connections reset.")
        st.rerun()
st.sidebar.markdown("</div>", unsafe_allow_html=True)

# Budgets Sidebar manager
st.sidebar.markdown("---")
st.sidebar.subheader("Manage Budgets")
budgets = database.get_budgets()

with st.sidebar.form("budget_form"):
    budget_cat = st.selectbox("Category", ["Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel"])
    current_limit = budgets.get(budget_cat, 200.0)
    budget_amt = st.number_input("Monthly Limit ($)", min_value=0.0, value=float(current_limit), step=10.0)
    submitted = st.form_submit_button("Save Budget")
    if submitted:
        database.save_budget(budget_cat, budget_amt)
        st.success(f"Budget for {budget_cat} set to ${budget_amt}")
        st.rerun()

# Logout button
st.sidebar.markdown("---")
if st.sidebar.button("🔓 Logout"):
    st.session_state.logged_in = False
    st.session_state.login_time = None
    st.rerun()

# --- Main Dashboard ---
accounts = database.get_accounts()

if not accounts and not USE_MOCK_DATA:
    st.markdown("<h1>Link Your Financial Accounts</h1>", unsafe_allow_html=True)
    st.write("To get started, securely link your Bank of America and Cash App accounts via Plaid.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="custom-card">
            <h3>🏦 Bank of America</h3>
            <p>Connect your checking and savings accounts to sync balances and transactions automatically.</p>
        </div>
        """, unsafe_allow_html=True)
        render_plaid_link("boa", "Bank of America")
        
    with col2:
        st.markdown("""
        <div class="custom-card">
            <h3>📱 Cash App Balance</h3>
            <p>Connect your Cash App account using Lincoln Savings Bank or Sutton Bank account details to monitor peer-to-peer transfers.</p>
        </div>
        """, unsafe_allow_html=True)
        render_plaid_link("cashapp", "Cash App")
        
    st.markdown("---")
    st.write("💡 *Note: If you just want to evaluate the app, set USE_MOCK_DATA=True in your secrets.*")

else:
    # Render dashboard
    st.markdown("<h1>Munyun Financial Control</h1>", unsafe_allow_html=True)
    
    tab_overview, tab_txs, tab_cashapp, tab_budgets = st.tabs([
        "📊 Dashboard Overview", 
        "📝 Transaction Log", 
        "📱 Cash App Activity", 
        "🎯 Budget Planner"
    ])
    
    txs = database.get_transactions()
    df_txs = pd.DataFrame(txs) if txs else pd.DataFrame(columns=["id", "date", "amount", "name", "category", "account_name", "institution", "notes", "pending"])
    
    if not df_txs.empty:
        df_txs['amount_clean'] = df_txs['amount']
        df_txs['date'] = pd.to_datetime(df_txs['date'])
        df_txs = df_txs.sort_values(by="date", ascending=False)
        
    # --- Tab 1: Overview Dashboard ---
    with tab_overview:
        total_balance = sum(acc["balance_available"] for acc in accounts if acc["balance_available"] is not None)
        
        col_net, col_boa, col_ca = st.columns(3)
        
        with col_net:
            st.markdown(f"""
            <div class="custom-card">
                <div class="metric-label">Total Net Worth</div>
                <div class="metric-val" style="color: #4e80e4;">${total_balance:,.2f}</div>
                <div class="metric-trend-up">▲ Dynamic Aggregation</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col_boa:
            boa_bal = sum(acc["balance_available"] for acc in accounts if acc["institution"] == "Bank of America" and acc["balance_available"] is not None)
            st.markdown(f"""
            <div class="custom-card">
                <div class="metric-label">Bank of America Balance</div>
                <div class="metric-val" style="color: #4e80e4;">${boa_bal:,.2f}</div>
                <div class="metric-trend-up">▲ Linked OAuth</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col_ca:
            ca_bal = sum(acc["balance_available"] for acc in accounts if "Cash App" in acc["institution"] and acc["balance_available"] is not None)
            st.markdown(f"""
            <div class="custom-card">
                <div class="metric-label">Cash App Balance</div>
                <div class="metric-val" style="color: #34d399;">${ca_bal:,.2f}</div>
                <div class="metric-trend-up">▲ P2P Checking</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("### Financial Analytics")
        col_chart1, col_chart2 = st.columns([1, 1])
        
        with col_chart1:
            st.markdown("#### Spending By Category (Last 30 Days)")
            if not df_txs.empty:
                df_spending = df_txs[(df_txs['amount_clean'] > 0) & (df_txs['category'] != 'Income')]
                if not df_spending.empty:
                    category_totals = df_spending.groupby('category')['amount_clean'].sum().reset_index()
                    
                    fig = px.pie(
                        category_totals, 
                        values='amount_clean', 
                        names='category',
                        hole=0.4,
                        color_discrete_sequence=px.colors.qualitative.Pastel
                    )
                    fig.update_layout(
                        paper_bgcolor='rgba(0,0,0,0)',
                        plot_bgcolor='rgba(0,0,0,0)',
                        font_color='#ffffff',
                        margin=dict(t=20, b=20, l=20, r=20),
                        height=300
                    )
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("No expense transactions recorded in this period.")
            else:
                st.info("No transaction data available.")
                
        with col_chart2:
            st.markdown("#### Cumulative Net Worth History")
            if not df_txs.empty:
                df_sorted = df_txs.sort_values(by="date", ascending=True)
                df_daily = df_sorted.groupby('date')['amount_clean'].sum().reset_index()
                df_daily['daily_change'] = -df_daily['amount_clean']
                
                balances = []
                current_calc = total_balance
                for idx, row in df_daily.iloc[::-1].iterrows():
                    balances.append((row['date'], current_calc))
                    current_calc -= row['daily_change']
                    
                df_balance_history = pd.DataFrame(balances, columns=['date', 'balance']).sort_values('date')
                
                fig = px.line(
                    df_balance_history, 
                    x='date', 
                    y='balance',
                    line_shape='spline',
                    color_discrete_sequence=['#4e80e4']
                )
                fig.update_traces(fill='tozeroy', fillcolor='rgba(78, 128, 228, 0.1)')
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font_color='#ffffff',
                    xaxis=dict(showgrid=False, title=""),
                    yaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)', title="Balance ($)"),
                    margin=dict(t=20, b=20, l=20, r=20),
                    height=300
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No history available.")

        st.markdown("### Linked Accounts")
        for acc in accounts:
            mask_str = f"•••• {acc['mask']}" if acc['mask'] else ""
            acc_bal = acc['balance_available'] if acc['balance_available'] is not None else acc['balance_current']
            st.markdown(f"""
            <div class="metric-container" style="margin-bottom: 0.5rem;">
                <div>
                    <span style="font-weight: 600; font-size: 1.1rem; color: #ffffff;">{acc['name']}</span>
                    <span style="color: #9ca3af; font-size: 0.9rem; margin-left: 10px;">{mask_str} ({acc['institution']})</span>
                </div>
                <div style="font-weight: 700; font-size: 1.25rem; color: {'#34d399' if 'Cash App' in acc['institution'] else '#4e80e4'};">
                    ${acc_bal:,.2f}
                </div>
            </div>
            """, unsafe_allow_html=True)

    # --- Tab 2: Transaction Log ---
    with tab_txs:
        st.markdown("### Transaction Ledger")
        
        if df_txs.empty:
            st.info("No transactions found.")
        else:
            col_f1, col_f2, col_f3 = st.columns(3)
            with col_f1:
                search_term = st.text_input("🔍 Search Merchant / Name", "")
            with col_f2:
                cat_filter = st.selectbox("Category Filter", ["All"] + list(df_txs['category'].unique()))
            with col_f3:
                inst_filter = st.selectbox("Institution Filter", ["All"] + list(df_txs['institution'].unique()))
                
            df_filtered = df_txs.copy()
            if search_term:
                df_filtered = df_filtered[df_filtered['name'].str.contains(search_term, case=False)]
            if cat_filter != "All":
                df_filtered = df_filtered[df_filtered['category'] == cat_filter]
            if inst_filter != "All":
                df_filtered = df_filtered[df_filtered['institution'] == inst_filter]
                
            display_cols = ["date", "name", "category", "amount", "account_name", "institution", "notes"]
            df_display = df_filtered[display_cols].copy()
            
            df_display['date'] = df_display['date'].dt.strftime('%Y-%m-%d')
            df_display['amount'] = df_display['amount'].apply(lambda x: f"${x:,.2f}" if x >= 0 else f"-${abs(x):,.2f}")
            df_display.columns = ["Date", "Merchant / Transaction", "Category", "Amount", "Account", "Institution", "Notes"]
            
            st.dataframe(df_display, use_container_width=True)
            
            st.markdown("---")
            st.markdown("### ✏️ Edit Transaction Details")
            
            selected_name = st.selectbox(
                "Select a transaction to modify", 
                options=df_filtered['name'].unique(),
                index=0 if len(df_filtered['name'].unique()) > 0 else None
            )
            
            if selected_name:
                selected_tx = df_filtered[df_filtered['name'] == selected_name].iloc[0]
                
                col_e1, col_e2 = st.columns(2)
                with col_e1:
                    new_cat = st.selectbox(
                        "Change Category", 
                        options=["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel", "Other"],
                        index=["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel", "Other"].index(
                            selected_tx['category'] if selected_tx['category'] in ["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel", "Other"] else "Other"
                        )
                    )
                with col_e2:
                    current_notes = selected_tx['notes'] if pd.notna(selected_tx['notes']) else ""
                    new_notes = st.text_input("Edit Notes", value=current_notes)
                    
                if st.button("Save Transaction Updates"):
                    database.update_transaction_notes_category(selected_tx['id'], new_cat, new_notes)
                    st.success("Transaction updated successfully!")
                    st.rerun()

    # --- Tab 3: Cash App Activity ---
    with tab_cashapp:
        st.markdown("### Cash App Transactions & P2P Transfers")
        st.write("This tab isolates Cash App accounts to track direct payments, deposits, and cash outs.")
        
        df_ca = df_txs[df_txs['institution'].str.contains("Cash App", na=False)] if not df_txs.empty else pd.DataFrame()
        
        if df_ca.empty:
            st.info("No Cash App transactions found. Connect a Cash App account to sync transfers.")
        else:
            sent_total = df_ca[df_ca['amount_clean'] > 0]['amount_clean'].sum()
            received_total = abs(df_ca[df_ca['amount_clean'] < 0]['amount_clean'].sum())
            
            c1, c2, c3 = st.columns(3)
            with c1:
                st.markdown(f"""
                <div class="custom-card">
                    <div class="metric-label">Total Sent via Cash App</div>
                    <div class="metric-val" style="color: #ef4444;">${sent_total:,.2f}</div>
                </div>
                """, unsafe_allow_html=True)
            with c2:
                st.markdown(f"""
                <div class="custom-card">
                    <div class="metric-label">Total Received via Cash App</div>
                    <div class="metric-val" style="color: #10b981;">${received_total:,.2f}</div>
                </div>
                """, unsafe_allow_html=True)
            with c3:
                net_ca = received_total - sent_total
                color = "#10b981" if net_ca >= 0 else "#ef4444"
                sign = "+" if net_ca >= 0 else ""
                st.markdown(f"""
                <div class="custom-card">
                    <div class="metric-label">Net Cash App Flow</div>
                    <div class="metric-val" style="color: {color};">{sign}${net_ca:,.2f}</div>
                </div>
                """, unsafe_allow_html=True)
                
            st.markdown("#### Cash App Detailed History")
            df_ca_display = df_ca[["date", "name", "category", "amount"]].copy()
            df_ca_display['date'] = df_ca_display['date'].dt.strftime('%Y-%m-%d')
            df_ca_display['amount'] = df_ca_display['amount'].apply(lambda x: f"${x:,.2f}" if x >= 0 else f"-${abs(x):,.2f}")
            df_ca_display.columns = ["Date", "Description", "Type", "Amount"]
            st.dataframe(df_ca_display, use_container_width=True)

    # --- Tab 4: Budget Planner ---
    with tab_budgets:
        st.markdown("### Budget Progress Tracker")
        st.write("Compare your monthly limits against transactions from the last 30 days.")
        
        if df_txs.empty:
            st.info("Sync transactions to begin monitoring budgets.")
        else:
            df_spending = df_txs[(df_txs['amount_clean'] > 0) & (df_txs['category'] != 'Income')]
            cat_spending = df_spending.groupby('category')['amount_clean'].sum().to_dict()
            
            if not budgets:
                st.info("No budgets configured yet. Use the sidebar to set category spending limits!")
            else:
                for cat, limit in budgets.items():
                    spent = cat_spending.get(cat, 0.0)
                    percent = min(spent / limit, 1.0) if limit > 0 else 0.0
                    
                    if percent < 0.70:
                        status_text = f"<span style='color: #10b981; font-weight: 600;'>Under Budget</span>"
                    elif percent < 0.95:
                        status_text = f"<span style='color: #fbbf24; font-weight: 600;'>Approaching Limit</span>"
                    else:
                        status_text = f"<span style='color: #ef4444; font-weight: 600;'>OVER BUDGET</span>"
                        
                    st.markdown(f"""
                    <div style="margin-top: 1rem; margin-bottom: 0.25rem; display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #f3f4f6;">{cat} Budget</span>
                        <span>{status_text}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.5rem;">
                        <span>Spent: ${spent:,.2f}</span>
                        <span>Limit: ${limit:,.2f} ({percent*100:.1f}%)</span>
                    </div>
                    """, unsafe_allow_html=True)
                    st.progress(percent)
                    st.markdown("---")

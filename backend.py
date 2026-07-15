import os
import datetime
import random
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import database

# Load environment variables
load_dotenv()

# Initialize DB
database.init_db()

app = FastAPI(title="my-munyun Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Plaid configuration
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID", "")
PLAID_SECRET = os.getenv("PLAID_SECRET", "")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "True").lower() == "true"

# Fallback to mock data if credentials are missing
is_plaid_configured = bool(PLAID_CLIENT_ID and PLAID_SECRET)
if not is_plaid_configured:
    USE_MOCK_DATA = True

# Initialize Plaid Client conditionally
plaid_client = None
if is_plaid_configured:
    try:
        import plaid
        from plaid.api import plaid_api
        from plaid.configuration import Configuration
        from plaid.api_client import ApiClient

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
        print(f"Plaid client initialized in {PLAID_ENV} mode.")
    except Exception as e:
        print(f"Error initializing Plaid client: {e}. Falling back to mock mode.")
        USE_MOCK_DATA = True

class PublicTokenExchange(BaseModel):
    public_token: str
    institution: str  # 'boa' or 'cashapp'

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
        # Don't generate on payroll days
        if curr_date.day in [1, 15]:
            curr_date += datetime.timedelta(days=1)
            continue
        
        # 70% chance of transaction on any given day
        if random.random() < 0.7:
            # Pick a category
            cat = random.choice([c for c in categories if c != "Income"])
            merchant_name, base_amount = random.choice(merchants[cat])
            
            # Add some variance to amount
            variance = random.uniform(0.8, 1.2)
            amount = round(base_amount * variance, 2)
            
            # Streamlit/Cash App specific transactions go to Cash App account
            if cat == "Transfers" or merchant_name.startswith("Cash App"):
                acc_id = "mock_cashapp"
                acc_name = "Cash App Balance"
                inst = "Cash App (Lincoln Savings)"
                # Amount in Plaid is positive for debit/expense, negative for credit/income
                plaid_amount = -amount if "Received" in merchant_name else abs(amount)
            else:
                acc_id = random.choice(["mock_boa_checking", "mock_boa_savings"])
                acc_name = "BoA Advantage Checking" if acc_id == "mock_boa_checking" else "BoA Preferred Savings"
                inst = "Bank of America"
                plaid_amount = abs(amount)  # Expense

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
    print("Generated mock accounts and transactions successfully.")

# --- Endpoints ---

@app.get("/api/status")
def get_status():
    boa_linked = database.get_credential("access_token_boa") is not None
    cashapp_linked = database.get_credential("access_token_cashapp") is not None
    
    return {
        "is_plaid_configured": is_plaid_configured,
        "use_mock_data": USE_MOCK_DATA,
        "plaid_env": PLAID_ENV,
        "boa_linked": boa_linked or USE_MOCK_DATA,
        "cashapp_linked": cashapp_linked or USE_MOCK_DATA
    }

@app.post("/api/toggle_mock")
def toggle_mock(use_mock: bool = Body(..., embed=True)):
    global USE_MOCK_DATA
    if not is_plaid_configured:
        # Force mock mode if Plaid is not configured
        USE_MOCK_DATA = True
        return {"status": "success", "use_mock_data": True, "message": "Plaid keys not configured. Forcing mock mode."}
    
    USE_MOCK_DATA = use_mock
    database.set_credential("use_mock_data", str(use_mock))
    
    if USE_MOCK_DATA:
        generate_mock_data()
    else:
        # Clear mock data when turning off
        database.clear_accounts()
        database.clear_transactions()
        
    return {"status": "success", "use_mock_data": USE_MOCK_DATA}

@app.post("/api/create_link_token")
def create_link_token(institution: str = Body(..., embed=True)):
    if USE_MOCK_DATA or not is_plaid_configured:
        return {"link_token": "mock_link_token"}
        
    try:
        from plaid.model.link_token_create_request import LinkTokenCreateRequest
        from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
        from plaid.model.products import Products
        from plaid.model.country_code import CountryCode

        # Set up Link request
        request = LinkTokenCreateRequest(
            client_name="my-munyun Finance",
            language="en",
            country_codes=[CountryCode('US')],
            user=LinkTokenCreateRequestUser(
                client_user_id="user_idongcodes"
            ),
            products=[Products('transactions')]
        )
        
        response = plaid_client.link_token_create(request)
        return {"link_token": response['link_token']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exchange_public_token")
def exchange_public_token(payload: PublicTokenExchange):
    if USE_MOCK_DATA or not is_plaid_configured:
        # In mock mode, pretend we succeeded
        database.set_credential(f"access_token_{payload.institution}", f"mock_access_token_{payload.institution}")
        generate_mock_data()
        return {"status": "success"}

    try:
        from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
        
        # Exchange public token
        request = ItemPublicTokenExchangeRequest(
            public_token=payload.public_token
        )
        response = plaid_client.item_public_token_exchange(request)
        access_token = response['access_token']
        item_id = response['item_id']
        
        # Store in credentials
        database.set_credential(f"access_token_{payload.institution}", access_token)
        database.set_credential(f"item_id_{payload.institution}", item_id)
        
        # Fetch initial accounts and transactions for this item
        sync_item_data(access_token, payload.institution)
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def sync_item_data(access_token, institution):
    if USE_MOCK_DATA or not is_plaid_configured:
        return
        
    try:
        # 1. Fetch Accounts
        from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
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
        from plaid.model.transactions_get_request import TransactionsGetRequest
        from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
        
        start_date = datetime.date.today() - datetime.timedelta(days=30)
        end_date = datetime.date.today()
        
        tx_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=100
            )
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
        print(f"Error syncing data for {institution}: {e}")

@app.post("/api/sync")
def sync_all():
    if USE_MOCK_DATA:
        # Re-generate mock data to simulate fresh transactions
        generate_mock_data()
        return {"status": "success", "message": "Mock data refreshed."}
        
    boa_token = database.get_credential("access_token_boa")
    cashapp_token = database.get_credential("access_token_cashapp")
    
    synced = []
    if boa_token:
        sync_item_data(boa_token, "boa")
        synced.append("boa")
    if cashapp_token:
        sync_item_data(cashapp_token, "cashapp")
        synced.append("cashapp")
        
    return {"status": "success", "synced": synced}

@app.post("/api/clear")
def disconnect_all():
    database.clear_accounts()
    database.clear_transactions()
    database.delete_credential("access_token_boa")
    database.delete_credential("access_token_cashapp")
    database.delete_credential("item_id_boa")
    database.delete_credential("item_id_cashapp")
    return {"status": "success"}

# Initialize DB and generate mock data on startup if database is empty
@app.on_event("startup")
def startup_event():
    database.init_db()
    
    # If using mock data or not configured, initialize some mock data if DB has no accounts
    accounts = database.get_accounts()
    if not accounts and USE_MOCK_DATA:
        generate_mock_data()

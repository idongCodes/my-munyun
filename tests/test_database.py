import os
import tempfile
import pytest
import database

@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch):
    # Create a temporary file for the database to avoid altering production data
    db_fd, db_path = tempfile.mkstemp()
    monkeypatch.setattr(database, "DB_PATH", db_path)
    database.init_db()
    yield
    # Clean up temp file
    os.close(db_fd)
    if os.path.exists(db_path):
        os.remove(db_path)

def test_credentials():
    database.set_credential("test_key", "test_val")
    assert database.get_credential("test_key") == "test_val"
    assert database.get_credential("non_existent") is None
    
    database.delete_credential("test_key")
    assert database.get_credential("test_key") is None

def test_accounts():
    accounts_list = [
        {
            "id": "acc_1",
            "name": "Checking Account",
            "mask": "1234",
            "type": "depository",
            "subtype": "checking",
            "balance_available": 100.0,
            "balance_current": 110.0,
            "institution": "Chase"
        }
    ]
    database.save_accounts(accounts_list)
    res = database.get_accounts()
    assert len(res) == 1
    assert res[0]["id"] == "acc_1"
    assert res[0]["name"] == "Checking Account"
    assert res[0]["institution"] == "Chase"
    
    database.clear_accounts()
    assert len(database.get_accounts()) == 0

def test_transactions():
    txs_list = [
        {
            "id": "tx_1",
            "date": "2026-07-15",
            "amount": 25.50,
            "name": "Starbucks",
            "category": "Dining",
            "account_id": "acc_1",
            "account_name": "Checking Account",
            "institution": "Chase",
            "notes": "Initial notes",
            "pending": True
        }
    ]
    database.save_transactions(txs_list)
    res = database.get_transactions()
    assert len(res) == 1
    assert res[0]["id"] == "tx_1"
    assert res[0]["notes"] == "Initial notes"
    assert res[0]["pending"] == 1
    
    database.update_transaction_notes_category("tx_1", "Food", "Updated notes")
    res = database.get_transactions()
    assert res[0]["category"] == "Food"
    assert res[0]["notes"] == "Updated notes"
    
    # Save transaction again to check that existing notes are preserved
    database.save_transactions(txs_list)
    res = database.get_transactions()
    assert res[0]["notes"] == "Updated notes"
    
    database.clear_transactions()
    assert len(database.get_transactions()) == 0

def test_budgets():
    database.save_budget("Groceries", 250.0)
    budgets = database.get_budgets()
    assert budgets.get("Groceries") == 250.0
    
    database.delete_budget("Groceries")
    assert database.get_budgets().get("Groceries") is None

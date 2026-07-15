import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Credentials table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS credentials (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    # 2. Accounts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            mask TEXT,
            type TEXT,
            subtype TEXT,
            balance_available REAL,
            balance_current REAL,
            institution TEXT NOT NULL
        )
    """)
    
    # 3. Transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            account_id TEXT,
            account_name TEXT,
            institution TEXT,
            notes TEXT,
            pending INTEGER DEFAULT 0,
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        )
    """)
    
    # 4. Budgets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            category TEXT PRIMARY KEY,
            limit_amount REAL NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()

# Helper functions for credentials
def set_credential(key, value):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)",
        (key, value)
    )
    conn.commit()
    conn.close()

def get_credential(key):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM credentials WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else None

def delete_credential(key):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM credentials WHERE key = ?", (key,))
    conn.commit()
    conn.close()

# Helper functions for accounts
def save_accounts(accounts_list):
    conn = get_connection()
    cursor = conn.cursor()
    for acc in accounts_list:
        cursor.execute(
            """
            INSERT OR REPLACE INTO accounts 
            (id, name, mask, type, subtype, balance_available, balance_current, institution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                acc["id"],
                acc["name"],
                acc.get("mask"),
                acc.get("type"),
                acc.get("subtype"),
                acc.get("balance_available"),
                acc.get("balance_current"),
                acc["institution"]
            )
        )
    conn.commit()
    conn.close()

def get_accounts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_accounts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM accounts")
    conn.commit()
    conn.close()

# Helper functions for transactions
def save_transactions(transactions_list):
    conn = get_connection()
    cursor = conn.cursor()
    for tx in transactions_list:
        # Check if transaction notes already exist to preserve them
        cursor.execute("SELECT notes FROM transactions WHERE id = ?", (tx["id"],))
        existing = cursor.fetchone()
        existing_notes = existing["notes"] if existing else None
        
        cursor.execute(
            """
            INSERT OR REPLACE INTO transactions 
            (id, date, amount, name, category, account_id, account_name, institution, notes, pending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tx["id"],
                tx["date"],
                tx["amount"],
                tx["name"],
                tx.get("category", "Uncategorized"),
                tx.get("account_id"),
                tx.get("account_name"),
                tx.get("institution"),
                existing_notes or tx.get("notes"),
                1 if tx.get("pending") else 0
            )
        )
    conn.commit()
    conn.close()

def get_transactions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_transaction_notes_category(tx_id, category, notes):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE transactions SET category = ?, notes = ? WHERE id = ?",
        (category, notes, tx_id)
    )
    conn.commit()
    conn.close()

def clear_transactions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    conn.commit()
    conn.close()

# Helper functions for budgets
def save_budget(category, limit_amount):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO budgets (category, limit_amount) VALUES (?, ?)",
        (category, limit_amount)
    )
    conn.commit()
    conn.close()

def get_budgets():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM budgets")
    rows = cursor.fetchall()
    conn.close()
    return {r["category"]: r["limit_amount"] for r in rows}

def delete_budget(category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM budgets WHERE category = ?", (category,))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")

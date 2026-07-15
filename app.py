import os
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
from dotenv import load_dotenv

import database

# Load environment variables
load_dotenv()

# API backend url
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

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
        # Fallback inline basic styles
        st.markdown("<style>body { background-color: #0d1117; color: white; }</style>", unsafe_allow_html=True)

load_css()

# Render Splash Screen once per session load
if 'splash_shown' not in st.session_state:
    st.markdown("""
    <div id="splash-screen" style="text-align: center;">
        <div id="splash-logo"><span class="emoji">💸</span><span class="logo-text"> Munyun</span></div>
        <div id="splash-loader" style="margin: 0 auto;"></div>
        <div style="margin-top: 20px; color: #9ca3af; font-size: 0.9rem; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.05em; text-align: center; width: 100%;">SECURELY SYNCING WEALTH...</div>
    </div>
    """, unsafe_allow_html=True)
    st.session_state.splash_shown = True


# --- Helper Functions ---
def get_backend_status():
    try:
        r = requests.get(f"{BACKEND_URL}/api/status", timeout=2)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return {
        "is_plaid_configured": False,
        "use_mock_data": True,
        "plaid_env": "sandbox",
        "boa_linked": False,
        "cashapp_linked": False
    }

def sync_data():
    try:
        r = requests.post(f"{BACKEND_URL}/api/sync")
        return r.status_code == 200
    except Exception:
        return False

def clear_data():
    try:
        r = requests.post(f"{BACKEND_URL}/api/clear")
        return r.status_code == 200
    except Exception:
        return False

def toggle_mock_mode(use_mock):
    try:
        r = requests.post(f"{BACKEND_URL}/api/toggle_mock", json={"use_mock": use_mock})
        return r.status_code == 200
    except Exception:
        return False

# --- Plaid Link Integration inside Iframe ---
def render_plaid_link(institution_code, label):
    try:
        r = requests.post(f"{BACKEND_URL}/api/create_link_token", json={"institution": institution_code}, timeout=3)
        if r.status_code == 200:
            link_token = r.json().get("link_token")
        else:
            st.error("Failed to fetch link token from backend.")
            return
    except Exception as e:
        st.error(f"Backend offline: {e}")
        return

    # If in mock mode or Plaid not configured, show simulated link button
    status = get_backend_status()
    if status.get("use_mock_data") or not status.get("is_plaid_configured"):
        if st.button(f"🔌 Connect {label} (Demo Link)", key=f"demo_btn_{institution_code}"):
            with st.spinner("Connecting bank account..."):
                res = requests.post(f"{BACKEND_URL}/api/exchange_public_token", json={
                    "public_token": "mock_public_token",
                    "institution": institution_code
                })
                if res.status_code == 200:
                    st.success(f"{label} successfully linked (Demo)!")
                    st.rerun()
                else:
                    st.error("Simulation failed.")
        return

    # Real Plaid Link iframe/component
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
                    fetch('{BACKEND_URL}/api/exchange_public_token', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{
                            public_token: public_token,
                            institution: '{institution_code}'
                        }})
                    }}).then(response => response.json())
                       .then(data => {{
                           if (data.status === 'success') {{
                               alert('{label} linked successfully! Click refresh on your dashboard.');
                           }} else {{
                               alert('Error linking account: ' + JSON.stringify(data));
                           }}
                       }});
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

status = get_backend_status()
use_mock = status.get("use_mock_data", True)
is_configured = status.get("is_plaid_configured", False)

# Badges and Status
st.sidebar.subheader("Connection Status")
boa_linked = database.get_credential("access_token_boa") is not None
cashapp_linked = database.get_credential("access_token_cashapp") is not None

if use_mock:
    st.sidebar.markdown("Bank of America: <span class='badge-demo'>DEMO MODE</span>", unsafe_allow_html=True)
    st.sidebar.markdown("Cash App: <span class='badge-demo'>DEMO MODE</span>", unsafe_allow_html=True)
else:
    boa_status = "<span class='badge-linked'>✓ LINKED</span>" if boa_linked else "<span class='badge-unlinked'>✗ NOT LINKED</span>"
    cashapp_status = "<span class='badge-linked'>✓ LINKED</span>" if cashapp_linked else "<span class='badge-unlinked'>✗ NOT LINKED</span>"
    st.sidebar.markdown(f"Bank of America: {boa_status}", unsafe_allow_html=True)
    st.sidebar.markdown(f"Cash App: {cashapp_status}", unsafe_allow_html=True)

st.sidebar.markdown("---")

# Settings & Mode Control
st.sidebar.subheader("Settings")

# Mock Mode Toggle
if not is_configured:
    st.sidebar.info("Plaid API keys not found in `.env`. Running in Demo Mode.")
    toggle_val = st.sidebar.checkbox("Demo Mode (Mock Data)", value=True, disabled=True)
else:
    mock_mode = st.sidebar.checkbox("Demo Mode (Mock Data)", value=use_mock)
    if mock_mode != use_mock:
        if toggle_mock_mode(mock_mode):
            st.sidebar.success("Mode updated!")
            st.rerun()

# Sync Button
if st.sidebar.button("🔄 Sync Account Data"):
    with st.spinner("Syncing..."):
        if sync_data():
            st.sidebar.success("Sync completed!")
            st.rerun()
        else:
            st.sidebar.error("Sync failed. Check backend.")

# Reset/Clear Button (styled differently via CSS class)
st.sidebar.markdown("<div class='clear-btn'>", unsafe_allow_html=True)
if st.sidebar.button("⚠️ Disconnect & Clear All"):
    if clear_data():
        st.sidebar.success("All connections reset.")
        st.rerun()
st.sidebar.markdown("</div>", unsafe_allow_html=True)

# Budget Settings in Sidebar
st.sidebar.markdown("---")
st.sidebar.subheader("Manage Budgets")
budgets = database.get_budgets()

# Quick form to set budget
with st.sidebar.form("budget_form"):
    budget_cat = st.selectbox("Category", ["Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel"])
    current_limit = budgets.get(budget_cat, 200.0)
    budget_amt = st.number_input("Monthly Limit ($)", min_value=0.0, value=float(current_limit), step=10.0)
    submitted = st.form_submit_button("Save Budget")
    if submitted:
        database.save_budget(budget_cat, budget_amt)
        st.success(f"Budget for {budget_cat} set to ${budget_amt}")
        st.rerun()

# --- Main Dashboard UI ---

# Check if we have accounts populated. If not, show connection page.
accounts = database.get_accounts()

if not accounts and not use_mock:
    st.markdown("<h1>Link Your Financial Accounts</h1>", unsafe_allow_html=True)
    st.write("To get started, secure link your Bank of America and Cash App accounts via Plaid.")
    
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
    st.write("💡 *Note: If you just want to evaluate the app, check the 'Demo Mode' checkbox in the sidebar.*")

else:
    # We have accounts, display dashboard!
    st.markdown("<h1>Munyun Financial Control</h1>", unsafe_allow_html=True)
    
    # Tabs
    tab_overview, tab_txs, tab_cashapp, tab_budgets = st.tabs([
        "📊 Dashboard Overview", 
        "📝 Transaction Log", 
        "📱 Cash App Activity", 
        "🎯 Budget Planner"
    ])
    
    # Gather Data
    txs = database.get_transactions()
    df_txs = pd.DataFrame(txs) if txs else pd.DataFrame(columns=["id", "date", "amount", "name", "category", "account_name", "institution", "notes", "pending"])
    
    if not df_txs.empty:
        df_txs['amount_clean'] = df_txs['amount']
        # Convert date to datetime
        df_txs['date'] = pd.to_datetime(df_txs['date'])
        # Sort
        df_txs = df_txs.sort_values(by="date", ascending=False)
        
    # --- Tab 1: Overview Dashboard ---
    with tab_overview:
        # Calculate totals
        total_balance = sum(acc["balance_available"] for acc in accounts if acc["balance_available"] is not None)
        
        # Dashboard Summary Row
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
            
        # Graphical Analysis Section
        st.markdown("### Financial Analytics")
        col_chart1, col_chart2 = st.columns([1, 1])
        
        with col_chart1:
            st.markdown("#### Spending By Category (Last 30 Days)")
            if not df_txs.empty:
                # Exclude income from spending chart. Expense amounts in Plaid are positive.
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
                # Sort transactions ascending to compute cumulative sum
                df_sorted = df_txs.sort_values(by="date", ascending=True)
                
                # We start with the current total_balance, and backtrace daily changes
                # In Plaid, positive is outflow (expense), negative is inflow (income/credit)
                # Therefore, daily change = -amount
                df_daily = df_sorted.groupby('date')['amount_clean'].sum().reset_index()
                df_daily['daily_change'] = -df_daily['amount_clean']
                
                # Backtrace balances
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

        # Account List Details
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
            # Filters
            col_f1, col_f2, col_f3 = st.columns(3)
            with col_f1:
                search_term = st.text_input("🔍 Search Merchant / Name", "")
            with col_f2:
                cat_filter = st.selectbox("Category Filter", ["All"] + list(df_txs['category'].unique()))
            with col_f3:
                inst_filter = st.selectbox("Institution Filter", ["All"] + list(df_txs['institution'].unique()))
                
            # Apply Filters
            df_filtered = df_txs.copy()
            if search_term:
                df_filtered = df_filtered[df_filtered['name'].str.contains(search_term, case=False)]
            if cat_filter != "All":
                df_filtered = df_filtered[df_filtered['category'] == cat_filter]
            if inst_filter != "All":
                df_filtered = df_filtered[df_filtered['institution'] == inst_filter]
                
            # Display Table
            display_cols = ["date", "name", "category", "amount", "account_name", "institution", "notes"]
            df_display = df_filtered[display_cols].copy()
            
            # Format display
            df_display['date'] = df_display['date'].dt.strftime('%Y-%m-%d')
            df_display['amount'] = df_display['amount'].apply(lambda x: f"${x:,.2f}" if x >= 0 else f"-${abs(x):,.2f}")
            df_display.columns = ["Date", "Merchant / Transaction", "Category", "Amount", "Account", "Institution", "Notes"]
            
            st.dataframe(df_display, use_container_width=True)
            
            # Transaction Editing Panel (Custom categorization & Notes)
            st.markdown("---")
            st.markdown("### ✏️ Edit Transaction Details")
            
            # Form to edit transaction
            selected_name = st.selectbox(
                "Select a transaction to modify", 
                options=df_filtered['name'].unique(),
                index=0 if len(df_filtered['name'].unique()) > 0 else None
            )
            
            if selected_name:
                # Find the transaction
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
        
        # Filter for Cash App only
        df_ca = df_txs[df_txs['institution'].str.contains("Cash App", na=False)] if not df_txs.empty else pd.DataFrame()
        
        if df_ca.empty:
            st.info("No Cash App transactions found. Connect a Cash App account to sync transfers.")
        else:
            # Split into sent vs received
            # Plaid format: positive amount = spent/debit, negative amount = received/credit
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
                
            # Cash App Log
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
            # Exclude income from spending totals
            df_spending = df_txs[(df_txs['amount_clean'] > 0) & (df_txs['category'] != 'Income')]
            
            # Map category spendings
            cat_spending = df_spending.groupby('category')['amount_clean'].sum().to_dict()
            
            # Render budgets
            if not budgets:
                st.info("No budgets configured yet. Use the sidebar to set category spending limits!")
            else:
                for cat, limit in budgets.items():
                    spent = cat_spending.get(cat, 0.0)
                    percent = min(spent / limit, 1.0) if limit > 0 else 0.0
                    
                    # Colors
                    if percent < 0.70:
                        prog_color = "normal"
                        status_text = f"<span style='color: #10b981; font-weight: 600;'>Under Budget</span>"
                    elif percent < 0.95:
                        prog_color = "normal"
                        status_text = f"<span style='color: #fbbf24; font-weight: 600;'>Approaching Limit</span>"
                    else:
                        prog_color = "normal"
                        status_text = f"<span style='color: #ef4444; font-weight: 600;'>OVER BUDGET</span>"
                        
                    # Show progress bar and values
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

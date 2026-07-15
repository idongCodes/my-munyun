import os
import sys
import subprocess
import time
import signal

def run_services():
    print("🚀 Starting my-munyun Services...")
    
    # Get paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    venv_bin = os.path.join(base_dir, ".venv", "bin")
    
    # Path to binaries inside virtualenv
    uvicorn_path = os.path.join(venv_bin, "uvicorn")
    streamlit_path = os.path.join(venv_bin, "streamlit")
    
    # Fallback to system path if virtualenv binaries are not found
    if not os.path.exists(uvicorn_path):
        uvicorn_path = "uvicorn"
    if not os.path.exists(streamlit_path):
        streamlit_path = "streamlit"

    processes = []
    
    try:
        # 1. Start FastAPI backend
        print("⚡ Starting FastAPI Backend on http://localhost:8000...")
        backend_proc = subprocess.Popen(
            [uvicorn_path, "backend:app", "--host", "0.0.0.0", "--port", "8000"],
            cwd=base_dir
        )
        processes.append(backend_proc)
        
        # Give backend a second to start up
        time.sleep(2)
        
        # 2. Start Streamlit frontend
        print("💻 Starting Streamlit Frontend on http://localhost:8501...")
        frontend_proc = subprocess.Popen(
            [streamlit_path, "run", "app.py", "--server.port", "8501", "--server.address", "0.0.0.0"],
            cwd=base_dir
        )
        processes.append(frontend_proc)
        
        print("\n🎉 Both services are running! Press Ctrl+C to terminate.")
        
        # Monitor processes
        while True:
            for p in processes:
                if p.poll() is not None:
                    print(f"\n⚠️ Process {p.args} exited with code {p.returncode}")
                    return
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
    finally:
        for p in processes:
            if p.poll() is None:
                print(f"Terminating process {p.pid}...")
                # Try graceful terminate first
                p.terminate()
                try:
                    p.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    # Kill if it doesn't shut down in 3s
                    p.kill()
        print("👋 Goodbye!")

if __name__ == "__main__":
    run_services()

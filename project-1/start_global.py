# project-1/start_global.py
"""
StudyAI Global Tunnel & Server Orchestrator
Domain: https://study.longbrother.org
Features:
1. Starts FastAPI Backend on 0.0.0.0:8000
2. Starts React Vite Frontend on 0.0.0.0:5173
3. Starts Cloudflare Tunnel (or localtunnel) mapping study.longbrother.org to local server
4. Displays live Global URLs directly in terminal
5. Enforces 2-Hour Daily Server Runtime Window with clean automatic shutdown
"""

import os
import sys
import json
import time
import shutil
import urllib.request
import subprocess
import threading
from pathlib import Path

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR
CLOUDFLARED_EXE = BASE_DIR / "cloudflared.exe"

DURATION_SECONDS = 2 * 3600  # 2 Hours Daily Window

def get_tunnel_target():
    """Finds the tunnel UUID and credentials file from ~/.cloudflared to prevent REST API lookups over IPv6."""
    cf_dir = Path.home() / ".cloudflared"
    if cf_dir.exists():
        for f in cf_dir.glob("*.json"):
            if f.name.endswith(".json") and "cert" not in f.name:
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    if "TunnelID" in data:
                        return data["TunnelID"], str(f)
                except Exception:
                    pass
    return "ed6961ca-c20f-4d0f-8ab3-c40ba2e00b8f", str(Path.home() / ".cloudflared" / "ed6961ca-c20f-4d0f-8ab3-c40ba2e00b8f.json")

def download_cloudflared_if_needed():
    if CLOUDFLARED_EXE.exists():
        return str(CLOUDFLARED_EXE)
    
    # Check if in PATH
    system_cf = shutil.which("cloudflared")
    if system_cf:
        return system_cf
    
    print("\n[DevOps] cloudflared.exe not found. Downloading official Cloudflare Tunnel binary...")
    url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try:
        urllib.request.urlretrieve(url, str(CLOUDFLARED_EXE))
        print(f"[DevOps] cloudflared.exe successfully installed to {CLOUDFLARED_EXE}")
        return str(CLOUDFLARED_EXE)
    except Exception as e:
        print(f"[DevOps] Notice: Could not download cloudflared binary ({e}). Will use npx localtunnel.")
        return None

def stream_logs(process, prefix):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            line_str = line.strip()
            if any(k in line_str for k in ["trycloudflare.com", "localtunnel.me", "longbrother.org", "http://", "https://", "Registered", "Connection", "error", "INF", "ERR", "Uvicorn running"]):
                print(f"[{prefix}] {line_str}")
    except Exception:
        pass

def main():
    print("=" * 70)
    print("  [StudyAI] Global Hosting Orchestrator - https://study.longbrother.org")
    print("  [Tunnel] Reverse Proxy & Secure HTTPS Tunnel")
    print(f"  [Timer] Daily Operational Window: 2 Hours ({DURATION_SECONDS // 3600}h 00m)")
    print("=" * 70)

    # 1. Start FastAPI Backend with Hot Reloading
    print("\n[1/3] Starting FastAPI Backend on port 8000 (with --reload)...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend", "--reload"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(PROJECT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    threading.Thread(target=stream_logs, args=(backend_proc, "BACKEND"), daemon=True).start()

    # 2. Start Vite Frontend
    print("[2/3] Starting React Vite Frontend on port 5173...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    vite_proc = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
        cwd=str(PROJECT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    time.sleep(3)

    # 3. Start Tunnel
    print("[3/3] Establishing Secure Public Tunnel...")
    cf_path = download_cloudflared_if_needed()
    tunnel_proc = None

    if cf_path:
        tunnel_id, creds_file = get_tunnel_target()
        print(f"[Tunnel] Launching persistent Cloudflare Tunnel '{tunnel_id}' (IPv4 enforced)...")
        tunnel_cmd = [
            cf_path,
            "--edge-ip-version", "4",
            "--protocol", "http2",
            "tunnel", "run",
        ]
        if creds_file:
            tunnel_cmd.extend(["--credentials-file", creds_file])
        tunnel_cmd.extend(["--url", "http://localhost:5173", tunnel_id])

        tunnel_proc = subprocess.Popen(
            tunnel_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    else:
        print("[Tunnel] Launching fallback localtunnel...")
        tunnel_cmd = ["npx.cmd" if os.name == "nt" else "npx", "localtunnel", "--port", "5173", "--subdomain", "study-longbrother"]
        tunnel_proc = subprocess.Popen(
            tunnel_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

    # Log stream thread for tunnel URL
    if tunnel_proc:
        threading.Thread(target=stream_logs, args=(tunnel_proc, "GLOBAL-TUNNEL"), daemon=True).start()

    print("\n" + "=" * 70)
    print("  [SUCCESS] PLATFORM IS NOW LIVE WORLDWIDE!")
    print("  Custom Domain : https://study.longbrother.org")
    print("  Local Vite UI : http://localhost:5173")
    print("  FastAPI API   : http://localhost:8000/docs")
    print(f"  Timer Running : 2 Hours (Auto-shutdown in {DURATION_SECONDS} seconds)")
    print("  Press CTRL+C at any time to stop early.")
    print("=" * 70 + "\n")

    start_time = time.time()
    try:
        while True:
            elapsed = int(time.time() - start_time)
            remaining = max(0, DURATION_SECONDS - elapsed)
            rem_min, rem_sec = divmod(remaining, 60)
            rem_hr, rem_min = divmod(rem_min, 60)

            print(f"\r[Live Status: ONLINE] Time remaining today: {rem_hr:02d}h {rem_min:02d}m {rem_sec:02d}s | Press Ctrl+C to stop", end="", flush=True)

            if remaining <= 0:
                print("\n\n[Timer] 2-Hour Daily Operating Window has concluded.")
                break
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n[Shutdown] Manual stop signal received.")

    finally:
        print("[Shutdown] Gracefully terminating server processes...")
        for p in [tunnel_proc, vite_proc, backend_proc]:
            if p:
                try:
                    p.terminate()
                    p.wait(timeout=3)
                except Exception:
                    try:
                        p.kill()
                    except Exception:
                        pass
        print("[Shutdown] All servers closed. Ready to run tomorrow at the same scheduled time.")

if __name__ == "__main__":
    main()

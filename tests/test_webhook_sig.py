# tests/test_webhook_sig.py
import json, base64, hmac, hashlib
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.security.webhook import verify_signature

def test_body_only_b64():
    secret = "top_secret"
    body = json.dumps({"hello":"world"}, separators=(",",":")).encode()
    sig_b64 = base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()
    result = verify_signature(body, sig_b64, secret)
    assert result["valid"], f"Expected valid=True, got {result}"
    print(f"✅ test_body_only_b64 PASSED (mode: {result.get('mode')})")

def test_ts_prefix_hex():
    secret = "top_secret"
    ts = "1700000000"
    body = b'{"amount":123}'
    msg = ts.encode() + b"." + body
    sig_hex = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    result = verify_signature(body, sig_hex, secret, timestamp=ts)
    assert result["valid"], f"Expected valid=True, got {result}"
    print(f"✅ test_ts_prefix_hex PASSED (mode: {result.get('mode')})")

def test_invalid_sig():
    secret = "top_secret"
    body = b"{}"
    result = verify_signature(body, "deadbeef", secret)
    assert result["valid"] is False, f"Expected valid=False, got {result}"
    print(f"✅ test_invalid_sig PASSED")

def test_event_id_ts_body():
    secret = "top_secret"
    eid = "evt_123"
    ts = "1700000000"
    body = b'{"test":"data"}'
    msg = f"{eid}.{ts}.".encode() + body
    sig_hex = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    result = verify_signature(body, sig_hex, secret, timestamp=ts, event_id=eid)
    assert result["valid"], f"Expected valid=True, got {result}"
    print(f"✅ test_event_id_ts_body PASSED (mode: {result.get('mode')})")

def test_padding_tolerance():
    secret = "top_secret"
    body = b'{"x":1}'
    sig_b64 = base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()
    # Remove padding
    sig_no_pad = sig_b64.rstrip("=")
    result = verify_signature(body, sig_no_pad, secret)
    assert result["valid"], f"Expected valid=True with padding tolerance, got {result}"
    print(f"✅ test_padding_tolerance PASSED (mode: {result.get('mode')})")

if __name__ == "__main__":
    print("Running webhook signature tests...")
    test_body_only_b64()
    test_ts_prefix_hex()
    test_invalid_sig()
    test_event_id_ts_body()
    test_padding_tolerance()
    print("\n🎉 All tests passed!")

import base64
import hashlib
import hmac
from typing import Dict, Optional


def _b64decode_with_padding(s: str) -> bytes:
    # Add padding if missing
    padding_needed = (4 - len(s) % 4) % 4
    s_padded = s + ("=" * padding_needed)
    return base64.b64decode(s_padded)


def verify_signature(
    body: bytes,
    signature: str,
    secret: str,
    timestamp: Optional[str] = None,
    event_id: Optional[str] = None,
) -> Dict[str, str | bool]:
    """
    Flexible HMAC-SHA256 signature verification supporting multiple modes used in webhooks.

    Modes supported (auto-detected):
    - body:b64 -> signature is base64(HMAC(secret, body))
    - hex -> signature is hex(HMAC(secret, body))
    - ts+hex -> signature is hex(HMAC(secret, f"{ts}." + body)) when timestamp provided
    - id+ts+hex -> signature is hex(HMAC(secret, f"{event_id}.{ts}." + body)) when event_id and timestamp provided

    Returns dict with keys: { valid: bool, mode: str }
    """
    # Normalize inputs
    sig = signature.strip()
    key = secret.encode()

    # Try id+ts+hex first when both provided
    if timestamp and event_id:
        msg = f"{event_id}.{timestamp}.".encode() + body
        expected = hmac.new(key, msg, hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected, sig.lower()):
            return {"valid": True, "mode": "id+ts+hex"}

    # Try ts+hex when timestamp provided
    if timestamp:
        msg = f"{timestamp}.".encode() + body
        expected = hmac.new(key, msg, hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected, sig.lower()):
            return {"valid": True, "mode": "ts+hex"}

    # Try body-only hex
    expected_hex = hmac.new(key, body, hashlib.sha256).hexdigest()
    if hmac.compare_digest(expected_hex, sig.lower()):
        return {"valid": True, "mode": "body:hex"}

    # Try body-only base64 (with tolerant padding)
    expected_b64 = base64.b64encode(hmac.new(key, body, hashlib.sha256).digest()).decode()

    # Compare allowing missing padding in provided signature
    try:
        provided_bytes = _b64decode_with_padding(sig)
        expected_bytes = _b64decode_with_padding(expected_b64)
        if hmac.compare_digest(expected_bytes, provided_bytes):
            return {"valid": True, "mode": "body:b64"}
    except Exception:
        # Fall through to invalid
        pass

    return {"valid": False, "mode": "unknown"}

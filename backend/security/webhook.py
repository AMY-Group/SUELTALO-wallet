# app/security/webhook.py
import hmac, hashlib, base64
from typing import Optional

def _b64digest(secret: bytes, msg: bytes) -> str:
    return base64.b64encode(hmac.new(secret, msg, hashlib.sha256).digest()).decode()

def _hexdigest(secret: bytes, msg: bytes) -> str:
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()

def _safe_eq(a: str, b: str) -> bool:
    try:
        return hmac.compare_digest(a, b)
    except Exception:
        return False

def verify_signature(body_raw: bytes, header_sig: str, secret: str,
                     timestamp: Optional[str] = None, event_id: Optional[str] = None) -> dict:
    secret_b = secret.encode()
    hs = header_sig.strip()
    candidates = []
    candidates.append(("body:b64", _b64digest(secret_b, body_raw)))
    candidates.append(("body:hex", _hexdigest(secret_b, body_raw)))
    if timestamp:
        msg = f"{timestamp}.".encode() + body_raw
        candidates.append(("ts+b64", _b64digest(secret_b, msg)))
        candidates.append(("ts+hex", _hexdigest(secret_b, msg)))
    if timestamp and event_id:
        msg2 = f"{event_id}.{timestamp}.".encode() + body_raw
        candidates.append(("id+ts+b64", _b64digest(secret_b, msg2)))
        candidates.append(("id+ts+hex", _hexdigest(secret_b, msg2)))

    for mode, sig in candidates:
        if _safe_eq(hs, sig):
            return {"valid": True, "mode": mode}

    if len(hs) % 4 != 0:  # base64 sin padding
        hs_padded = hs + ("=" * (4 - len(hs) % 4))
        for mode, sig in candidates:
            if _safe_eq(hs_padded, sig):
                return {"valid": True, "mode": mode + "+pad"}

    return {"valid": False}

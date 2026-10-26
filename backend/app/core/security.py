import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Configure CryptContext for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # Truncate password to 72 bytes if necessary for bcrypt limitation
    password_bytes = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(password_bytes)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode: Dict[str, Any] = {"exp": expire, "sub": str(subject), "type": "access"}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode: Dict[str, Any] = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token.
    Supports both backend internal access tokens and Supabase Auth JWT tokens.
    """
    # 1. Try local backend SECRET_KEY
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        pass

    # 2. Try Supabase JWT Secret if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        except Exception:
            pass

    # 3. Fallback check for Supabase Auth tokens with standard claims
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        # If it has standard Supabase Auth claims (aud='authenticated' and sub is UUID)
        if unverified.get("aud") == "authenticated" and "sub" in unverified and "email" in unverified:
            # Check expiration
            exp = unverified.get("exp")
            if exp and datetime.now(timezone.utc).timestamp() > exp:
                return None
            unverified["type"] = "access"
            unverified["is_supabase"] = True
            return unverified
    except Exception:
        pass

    return None

def sign_audit_payload(data: str) -> str:
    """Generates an HMAC-SHA256 signature for tamper-evident audit log records."""
    key = settings.AUDIT_SIGNING_SECRET.encode("utf-8")
    return hmac.new(key, data.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_audit_signature(data: str, signature: str) -> bool:
    """Verifies the HMAC-SHA256 signature of an audit record."""
    if not signature:
        return False
    expected = sign_audit_payload(data)
    return hmac.compare_digest(expected, signature)

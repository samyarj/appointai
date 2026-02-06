from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import hashlib

def verify_password(plain_password, hashed_password):
    # Pre-hash with SHA256 to avoid bcrypt's 72-byte limit
    password_hash_input = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(password_hash_input, hashed_password)

def get_password_hash(password):
    # Pre-hash with SHA256 to avoid bcrypt's 72-byte limit
    password_hash_input = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password_hash_input)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

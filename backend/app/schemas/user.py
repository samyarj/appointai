from pydantic import BaseModel, field_validator
from typing import Optional

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str]
    join_date: Optional[str]
    timezone: Optional[str]
    date_format: Optional[str]
    time_format: Optional[str]
    theme: Optional[str]
    notifications: Optional[dict]
    privacy: Optional[dict]
    is_verified: bool
    class Config:
        from_attributes = True

class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    theme: Optional[str] = None
    notifications: Optional[dict] = None
    privacy: Optional[dict] = None

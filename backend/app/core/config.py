import sys
from pydantic_settings import BaseSettings
from pydantic import model_validator

_DEFAULT_SECRET = "your-secret-key-change-in-production"


class Settings(BaseSettings):
    PROJECT_NAME: str = "AppointAI API"
    PROJECT_VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql://user:password@localhost/appointai"
    SECRET_KEY: str = _DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if self.SECRET_KEY == _DEFAULT_SECRET:
            print(
                "FATAL: SECRET_KEY is set to the default placeholder. "
                "Set a secure SECRET_KEY in your .env file before running the server.",
                file=sys.stderr,
            )
            sys.exit(1)
        return self


settings = Settings()

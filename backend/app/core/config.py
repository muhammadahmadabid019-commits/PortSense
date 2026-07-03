from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PortSense"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_USER: str = "portsense"
    POSTGRES_PASSWORD: str = "portsense_password"
    POSTGRES_DB: str = "portsense"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: str = "6379"

    SECRET_KEY: str = "supersecretkey_change_me_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

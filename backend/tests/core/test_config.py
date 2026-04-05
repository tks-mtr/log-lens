import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_values(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.delenv("LOG_LEVEL", raising=False)
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    s = Settings(_env_file=None)
    assert s.log_level == "INFO"
    assert s.allowed_origins == "http://localhost:3000"


def test_custom_values(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:4000")
    s = Settings(_env_file=None)
    assert s.log_level == "DEBUG"
    assert s.allowed_origins_list == ["http://localhost:3000", "http://localhost:4000"]


def test_missing_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_allowed_origins_list_single(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000")
    s = Settings(_env_file=None)
    assert s.allowed_origins_list == ["http://localhost:3000"]


def test_allowed_origins_list_multiple(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("ALLOWED_ORIGINS", " http://a.com , http://b.com ")
    s = Settings(_env_file=None)
    assert s.allowed_origins_list == ["http://a.com", "http://b.com"]

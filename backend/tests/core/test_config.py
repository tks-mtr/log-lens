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


def test_allowed_origins_empty_string_returns_single_empty_element(monkeypatch):
    # 空文字列を設定した場合 → split(",") → [""] が返る（フィルタなし）
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("ALLOWED_ORIGINS", "")
    s = Settings(_env_file=None)
    assert s.allowed_origins_list == [""]


@pytest.mark.parametrize("level", ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
def test_log_level_accepts_standard_values(monkeypatch, level):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("LOG_LEVEL", level)
    s = Settings(_env_file=None)
    assert s.log_level == level


def test_log_level_case_preserved(monkeypatch):
    # Settings はバリデーションなし、値をそのまま保持する
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("LOG_LEVEL", "debug")
    s = Settings(_env_file=None)
    assert s.log_level == "debug"

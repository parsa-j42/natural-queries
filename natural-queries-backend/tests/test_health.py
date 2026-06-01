from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "environment" in body


def test_cors_origins_parsed_from_settings():
    from app.config import Settings

    settings = Settings(cors_origins="https://a.example, http://localhost:5173")
    assert settings.cors_origin_list == ["https://a.example", "http://localhost:5173"]

"""Tournament API backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://liga-sorteo-equipos.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # Cleanup: leave a clean reset at module end
    try:
        s.delete(f"{API}/tournament", timeout=10)
    except Exception:
        pass


@pytest.fixture(autouse=True)
def reset_before_each(client):
    """Ensure clean state before each test."""
    client.delete(f"{API}/tournament", timeout=10)
    yield


def test_root_health(client):
    r = client.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert "message" in r.json()


def test_get_empty_default(client):
    """GET /api/tournament returns empty default state when not saved."""
    r = client.get(f"{API}/tournament", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["teams"] == []
    assert data["matchdays"] == []
    assert data["id"] == "default-tournament"


def test_put_saves_teams_and_matchdays(client):
    """PUT /api/tournament saves teams + matchdays correctly."""
    teams = [f"Equipo{i}" for i in range(1, 12)]
    matchdays = [
        {
            "number": 1,
            "matches": [
                {"id": "m1", "matchday": 1, "teamA": "Equipo1", "teamB": "Equipo2"},
                {"id": "m2", "matchday": 1, "teamA": "Equipo3", "teamB": "Equipo4"},
            ],
            "resting": "Equipo11",
        }
    ]
    r = client.put(f"{API}/tournament", json={"teams": teams, "matchdays": matchdays}, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["teams"] == teams
    assert len(data["matchdays"]) == 1
    assert data["matchdays"][0]["resting"] == "Equipo11"
    assert len(data["matchdays"][0]["matches"]) == 2
    assert data["matchdays"][0]["matches"][0]["teamA"] == "Equipo1"


def test_put_rejects_duplicate_teams(client):
    """PUT /api/tournament rejects duplicate teams with 400."""
    teams = ["A", "B", "A"]
    r = client.put(f"{API}/tournament", json={"teams": teams, "matchdays": []}, timeout=10)
    assert r.status_code == 400
    data = r.json()
    assert "detail" in data
    assert "duplic" in data["detail"].lower()


def test_delete_resets_state(client):
    """DELETE /api/tournament resets state."""
    teams = [f"T{i}" for i in range(11)]
    client.put(f"{API}/tournament", json={"teams": teams, "matchdays": []}, timeout=10)
    # Verify saved
    r1 = client.get(f"{API}/tournament", timeout=10)
    assert len(r1.json()["teams"]) == 11

    # Delete
    r2 = client.delete(f"{API}/tournament", timeout=10)
    assert r2.status_code == 200

    # Verify reset
    r3 = client.get(f"{API}/tournament", timeout=10)
    assert r3.status_code == 200
    assert r3.json()["teams"] == []
    assert r3.json()["matchdays"] == []


def test_put_then_get_round_trip(client):
    """PUT then GET round-trips matchdays with matches preserved."""
    teams = [f"E{i}" for i in range(1, 12)]
    matchdays = [
        {
            "number": n,
            "matches": [
                {"id": f"m{n}-1", "matchday": n, "teamA": "E1", "teamB": "E2"},
                {"id": f"m{n}-2", "matchday": n, "teamA": "E3", "teamB": "E4"},
                {"id": f"m{n}-3", "matchday": n, "teamA": "E5", "teamB": "E6"},
                {"id": f"m{n}-4", "matchday": n, "teamA": "E7", "teamB": "E8"},
                {"id": f"m{n}-5", "matchday": n, "teamA": "E9", "teamB": "E10"},
            ],
            "resting": "E11",
        }
        for n in range(1, 7)
    ]
    put_r = client.put(f"{API}/tournament", json={"teams": teams, "matchdays": matchdays}, timeout=10)
    assert put_r.status_code == 200

    get_r = client.get(f"{API}/tournament", timeout=10)
    assert get_r.status_code == 200
    data = get_r.json()
    assert data["teams"] == teams
    assert len(data["matchdays"]) == 6
    for i, md in enumerate(data["matchdays"], start=1):
        assert md["number"] == i
        assert len(md["matches"]) == 5
        assert md["resting"] == "E11"
        # Verify first match content
        assert md["matches"][0]["teamA"] == "E1"
        assert md["matches"][0]["teamB"] == "E2"


def test_put_with_empty_payload(client):
    """PUT with empty teams should work (during setup)."""
    r = client.put(f"{API}/tournament", json={"teams": [], "matchdays": []}, timeout=10)
    assert r.status_code == 200
    assert r.json()["teams"] == []

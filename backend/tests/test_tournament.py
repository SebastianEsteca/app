"""Copa ESTECA 2026 - Multi-tournament backend tests (plural endpoints)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s


@pytest.fixture
def created_ids():
    """Track created tournaments for cleanup."""
    ids = []
    yield ids
    # Teardown
    s = requests.Session()
    for tid in ids:
        try:
            s.delete(f"{API}/tournaments/{tid}", timeout=10)
        except Exception:
            pass


# ---------- Health ----------
def test_root(client):
    r = client.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- List ----------
def test_list_returns_array(client):
    r = client.get(f"{API}/tournaments", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Create ----------
def test_create_with_all_fields(client, created_ids):
    payload = {
        "name": "TEST_Copa ESTECA 2026",
        "format": "liga",
        "teams_count": 11,
        "matchdays_count": 6,
        "qualifiers_count": 4,
        "matches_per_team": 6,
        "allow_auto_rest": True,
        "auto_generate": False,
        "primary_logo": "https://example.com/p.png",
        "secondary_logo": "https://example.com/s.png",
    }
    r = client.post(f"{API}/tournaments", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    created_ids.append(data["id"])
    assert "id" in data and isinstance(data["id"], str)
    assert data["name"] == payload["name"]
    assert data["format"] == "liga"
    assert data["teams_count"] == 11
    assert data["matchdays_count"] == 6
    assert data["qualifiers_count"] == 4
    assert data["matches_per_team"] == 6
    assert data["allow_auto_rest"] is True
    assert data["auto_generate"] is False
    assert data["primary_logo"] == payload["primary_logo"]
    assert data["secondary_logo"] == payload["secondary_logo"]
    assert data["teams"] == []
    # Auto-built empty matchdays of length matchdays_count
    assert isinstance(data["matchdays"], list)
    assert len(data["matchdays"]) == 6
    for i, md in enumerate(data["matchdays"], start=1):
        assert md["number"] == i
        assert md["matches"] == []
        assert md["resting"] is None


def test_create_validation_teams_count(client):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_x", "teams_count": 1}, timeout=10)
    assert r.status_code == 400


# ---------- Get by id ----------
def test_get_by_id(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_get"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    g = client.get(f"{API}/tournaments/{tid}", timeout=10)
    assert g.status_code == 200
    assert g.json()["id"] == tid
    assert g.json()["name"] == "TEST_get"


def test_get_404(client):
    r = client.get(f"{API}/tournaments/nonexistent-id-xyz", timeout=10)
    assert r.status_code == 404


# ---------- Update ----------
def test_put_updates_partial_fields(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_up"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    teams = [
        {"id": f"t{i}", "name": f"Equipo{i}", "short_name": f"E{i}", "color": "#F26321", "logo": ""}
        for i in range(1, 12)
    ]
    matchdays = [
        {
            "number": 1,
            "matches": [
                {"id": "m1", "matchday": 1, "teamA": "Equipo1", "teamB": "Equipo2", "status": "pending"},
            ],
            "resting": "Equipo11",
        }
    ]
    u = client.put(
        f"{API}/tournaments/{tid}",
        json={"teams": teams, "matchdays": matchdays},
        timeout=10,
    )
    assert u.status_code == 200, u.text
    data = u.json()
    assert len(data["teams"]) == 11
    assert data["teams"][0]["name"] == "Equipo1"
    assert len(data["matchdays"]) == 1
    assert data["matchdays"][0]["resting"] == "Equipo11"
    # GET verifies persistence
    g = client.get(f"{API}/tournaments/{tid}", timeout=10)
    assert len(g.json()["teams"]) == 11
    assert g.json()["matchdays"][0]["matches"][0]["teamA"] == "Equipo1"


def test_put_rejects_duplicate_team_names(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_dup"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    teams = [
        {"id": "a", "name": "Alpha", "short_name": "A", "color": "#000", "logo": ""},
        {"id": "b", "name": "alpha", "short_name": "B", "color": "#000", "logo": ""},
    ]
    u = client.put(f"{API}/tournaments/{tid}", json={"teams": teams}, timeout=10)
    assert u.status_code == 400
    assert "duplic" in u.json()["detail"].lower()


def test_put_404(client):
    r = client.put(f"{API}/tournaments/nope", json={"name": "X"}, timeout=10)
    assert r.status_code == 404


# ---------- Delete ----------
def test_delete_then_404(client):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_del"}, timeout=10)
    tid = r.json()["id"]
    d = client.delete(f"{API}/tournaments/{tid}", timeout=10)
    assert d.status_code == 200
    g = client.get(f"{API}/tournaments/{tid}", timeout=10)
    assert g.status_code == 404


def test_delete_404(client):
    r = client.delete(f"{API}/tournaments/nonexistent-zzz", timeout=10)
    assert r.status_code == 404


# ---------- Summary list ----------
def test_list_summary_fields(client, created_ids):
    r = client.post(
        f"{API}/tournaments",
        json={"name": "TEST_summary", "teams_count": 11, "matchdays_count": 6, "matches_per_team": 6, "qualifiers_count": 4},
        timeout=10,
    )
    tid = r.json()["id"]
    created_ids.append(tid)
    # Add 2 teams + 1 matchday with 1 match
    teams = [
        {"id": "t1", "name": "A", "short_name": "A", "color": "#000", "logo": ""},
        {"id": "t2", "name": "B", "short_name": "B", "color": "#000", "logo": ""},
    ]
    matchdays = [
        {"number": 1, "matches": [{"id": "m1", "matchday": 1, "teamA": "A", "teamB": "B", "status": "pending"}], "resting": None}
    ]
    client.put(f"{API}/tournaments/{tid}", json={"teams": teams, "matchdays": matchdays}, timeout=10)

    lr = client.get(f"{API}/tournaments", timeout=10)
    assert lr.status_code == 200
    items = lr.json()
    found = next((it for it in items if it["id"] == tid), None)
    assert found is not None
    assert "progress" in found
    assert "teams_registered" in found and found["teams_registered"] == 2
    assert "current_matchday" in found and found["current_matchday"] == 1
    assert found["matches_played"] == 0
    assert found["total_matches_target"] == 33  # 6*11//2
    assert 0.0 <= found["progress"] <= 1.0

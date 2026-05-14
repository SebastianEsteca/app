"""Copa ESTECA 2026 Phase 2 backend tests - PIN gate, public view, bracket."""
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
    ids = []
    yield ids
    s = requests.Session()
    for tid in ids:
        try:
            s.delete(f"{API}/tournaments/{tid}", timeout=10)
        except Exception:
            pass


# ---------- Create with new Phase 2 fields ----------
def test_create_with_phase2_fields(client, created_ids):
    payload = {
        "name": "TEST_Phase2_full",
        "admin_pin": "1234",
        "allow_double_matches": True,
        "allow_extra_matchdays": True,
        "allow_repeated_opponents": True,
        "balance_level": "strict",
        "max_matches_per_matchday": 5,
    }
    r = client.post(f"{API}/tournaments", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    created_ids.append(data["id"])
    assert data["admin_pin"] == "1234"
    assert data["allow_double_matches"] is True
    assert data["allow_extra_matchdays"] is True
    assert data["allow_repeated_opponents"] is True
    assert data["balance_level"] == "strict"
    assert data["max_matches_per_matchday"] == 5
    # Verify defaults for bracket
    assert data["bracket"] == []


def test_create_with_default_phase2_flags(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_Phase2_def"}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    created_ids.append(data["id"])
    assert data["admin_pin"] == ""
    assert data["allow_double_matches"] is False
    assert data["allow_extra_matchdays"] is True
    assert data["allow_repeated_opponents"] is False
    assert data["balance_level"] == "flexible"


# ---------- PIN verification ----------
def test_verify_pin_correct(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_pin_ok", "admin_pin": "9876"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    v = client.post(f"{API}/tournaments/{tid}/verify-pin", json={"pin": "9876"}, timeout=10)
    assert v.status_code == 200
    body = v.json()
    assert body["valid"] is True
    assert body["open"] is False


def test_verify_pin_wrong(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_pin_bad", "admin_pin": "9876"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    v = client.post(f"{API}/tournaments/{tid}/verify-pin", json={"pin": "0000"}, timeout=10)
    assert v.status_code == 200
    body = v.json()
    assert body["valid"] is False


def test_verify_pin_no_pin_set(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_pin_none"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    v = client.post(f"{API}/tournaments/{tid}/verify-pin", json={"pin": ""}, timeout=10)
    assert v.status_code == 200
    body = v.json()
    assert body["valid"] is True
    assert body["open"] is True


def test_verify_pin_404(client):
    v = client.post(f"{API}/tournaments/no-such-id/verify-pin", json={"pin": "1234"}, timeout=10)
    assert v.status_code == 404


# ---------- Public read view strips admin_pin ----------
def test_public_view_strips_pin(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_public", "admin_pin": "4321"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    g = client.get(f"{API}/public/tournaments/{tid}", timeout=10)
    assert g.status_code == 200
    data = g.json()
    assert data["id"] == tid
    assert data["name"] == "TEST_public"
    # admin_pin must be empty in public response
    assert data.get("admin_pin", "") == ""


def test_public_view_404(client):
    g = client.get(f"{API}/public/tournaments/no-such", timeout=10)
    assert g.status_code == 404


# ---------- Bracket field on PUT ----------
def test_put_bracket(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_bracket"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    bracket = [
        {
            "name": "Cuartos",
            "matches": [
                {"id": "c1", "teamA": "A", "teamB": "B", "scoreA": 2, "scoreB": 1, "winner": "A"},
                {"id": "c2", "teamA": "C", "teamB": "D", "scoreA": None, "scoreB": None, "winner": None},
            ],
        },
        {"name": "Semifinal", "matches": []},
        {"name": "Final", "matches": []},
    ]
    u = client.put(f"{API}/tournaments/{tid}", json={"bracket": bracket}, timeout=10)
    assert u.status_code == 200, u.text
    data = u.json()
    assert len(data["bracket"]) == 3
    assert data["bracket"][0]["name"] == "Cuartos"
    assert data["bracket"][0]["matches"][0]["winner"] == "A"
    assert data["bracket"][0]["matches"][0]["scoreA"] == 2
    # GET verifies persistence
    g = client.get(f"{API}/tournaments/{tid}", timeout=10)
    assert len(g.json()["bracket"]) == 3
    assert g.json()["bracket"][0]["matches"][0]["teamA"] == "A"


def test_put_advanced_flags(client, created_ids):
    r = client.post(f"{API}/tournaments", json={"name": "TEST_flags"}, timeout=10)
    tid = r.json()["id"]
    created_ids.append(tid)
    u = client.put(
        f"{API}/tournaments/{tid}",
        json={
            "allow_double_matches": True,
            "allow_repeated_opponents": True,
            "balance_level": "fast",
            "admin_pin": "5555",
        },
        timeout=10,
    )
    assert u.status_code == 200
    data = u.json()
    assert data["allow_double_matches"] is True
    assert data["allow_repeated_opponents"] is True
    assert data["balance_level"] == "fast"
    assert data["admin_pin"] == "5555"


# ---------- Backwards compat: existing endpoints still work ----------
def test_backward_compat_list(client):
    r = client.get(f"{API}/tournaments", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

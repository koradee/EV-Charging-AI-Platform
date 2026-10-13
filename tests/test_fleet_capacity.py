"""Regression tests for the hourly, same-day fleet capacity demo."""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def vehicle(id, arrival, departure, energy=7.2):
    return {"id": id, "arrival_hour": arrival,
            "departure_hour": departure, "energy_needed_kwh": energy}


def test_concurrent_sessions_respect_shared_capacity():
    payload = {"max_grid_capacity": 7.2, "vehicles": [
        vehicle("A", 8, 10), vehicle("B", 8, 10)]}
    response = client.post("/fleet/optimize", json=payload)
    assert response.status_code == 200
    schedule = response.json()["schedule"]
    assert [item["assigned_start_hour"] for item in schedule] == [8, 9]
    assert all(item["status"] == "Scheduled" for item in schedule)


def test_unschedulable_when_grid_capacity_is_too_low():
    response = client.post("/fleet/optimize", json={
        "max_grid_capacity": 5, "vehicles": [vehicle("A", 8, 12)]})
    assert response.status_code == 200
    assert response.json()["schedule"][0]["status"] == "Impossible"


def test_no_room_before_departure():
    response = client.post("/fleet/optimize", json={
        "max_grid_capacity": 7.2, "vehicles": [
            vehicle("A", 8, 9), vehicle("B", 8, 9)]})
    schedule = response.json()["schedule"]
    assert [item["status"] for item in schedule] == ["Scheduled", "Impossible"]


def test_fractional_energy_rounds_up_and_last_hour_is_reserved():
    response = client.post("/fleet/optimize", json={
        "max_grid_capacity": 7.2,
        "vehicles": [vehicle("A", 8, 11, 7.3), vehicle("B", 9, 11, 7.2)]})
    schedule = response.json()["schedule"]
    assert schedule[0]["duration"] == 2
    assert schedule[1]["assigned_start_hour"] == 10


def test_invalid_time_and_capacity_rejected():
    cases = [
        {"max_grid_capacity": 0, "vehicles": []},
        {"vehicles": [vehicle("A", 10, 9)]},
        {"vehicles": [vehicle("A", -1, 9)]},
        {"vehicles": [vehicle("A", 0, 25)]},
        {"vehicles": [vehicle("A", 8, 10, 0)]},
    ]
    for payload in cases:
        assert client.post("/fleet/optimize", json=payload).status_code == 422


def test_empty_fleet_maintains_legacy_response():
    response = client.post("/fleet/optimize", json={"vehicles": []})
    assert response.status_code == 200
    assert response.json()["schedule"] == []
    assert response.json()["vehicles_count"] == 0

def test_stats_by_type_empty(client):
    r = client.get('/api/stats/by-type')
    assert r.status_code == 200
    assert r.json == []


def test_stats_by_level_empty(client):
    r = client.get('/api/stats/by-level')
    assert r.status_code == 200


def test_stats_timeline_empty(client):
    r = client.get('/api/stats/timeline')
    assert r.status_code == 200


def test_stats_top_rules_empty(client):
    r = client.get('/api/stats/top-rules')
    assert r.status_code == 200

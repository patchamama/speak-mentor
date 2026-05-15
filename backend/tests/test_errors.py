def test_list_errors_empty(client):
    r = client.get('/api/errors')
    assert r.status_code == 200
    assert 'errors' in r.json
    assert r.json['total'] == 0

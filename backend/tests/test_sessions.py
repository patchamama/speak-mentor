def test_health(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.json['status'] == 'ok'


def test_create_session(client):
    payload = {
        'mode': 'correction',
        'source_lang': 'de',
        'target_lang': 'de',
        'level': 'B1',
        'input_text': 'Ich gehe in die Schule.',
        'output_text': 'Ich gehe in die Schule.',
        'errors': [],
    }
    r = client.post('/api/sessions', json=payload)
    assert r.status_code == 201
    assert 'session_id' in r.json


def test_create_session_with_errors(client):
    payload = {
        'mode': 'correction',
        'source_lang': 'de',
        'target_lang': 'de',
        'level': 'A2',
        'input_text': 'Ich habe den Hund gesehen.',
        'output_text': 'Ich habe den Hund gesehen.',
        'errors': [{
            'original': 'den Hund',
            'correction': 'den Hund',
            'type': 'case',
            'severity': 'minor',
            'explanation': 'Akkusativ korrekt',
            'rule_reference': 'Akkusativ',
        }],
    }
    r = client.post('/api/sessions', json=payload)
    assert r.status_code == 201


def test_list_sessions(client):
    r = client.get('/api/sessions')
    assert r.status_code == 200
    assert 'sessions' in r.json


def test_get_session_not_found(client):
    r = client.get('/api/sessions/9999')
    assert r.status_code == 404


def test_delete_session(client):
    payload = {
        'mode': 'translation',
        'source_lang': 'de',
        'target_lang': 'es',
        'level': 'B2',
        'input_text': 'Hallo',
        'output_text': 'Hola',
    }
    r = client.post('/api/sessions', json=payload)
    session_id = r.json['session_id']

    r = client.delete(f'/api/sessions/{session_id}')
    assert r.status_code == 204

    r = client.get(f'/api/sessions/{session_id}')
    assert r.status_code == 404

from unittest.mock import patch, MagicMock

import pytest
import requests
from speak_mentor import create_app
from speak_mentor.extensions import db as _db


def _build_client(**provider_keys):
    config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'OPENAI_API_KEY': None,
        'ANTHROPIC_API_KEY': None,
        'GEMINI_API_KEY': None,
        'LLM_PROXY_TIMEOUT': 30,
    }
    config.update(provider_keys)
    app = create_app(config)
    with app.app_context():
        _db.create_all()
    return app.test_client()


# ── /api/llm/providers ───────────────────────────────────────────────────────


def test_providers_all_unset():
    client = _build_client()
    res = client.get('/api/llm/providers')
    assert res.status_code == 200
    assert res.get_json() == {'openai': False, 'anthropic': False, 'gemini': False}


def test_providers_some_set():
    client = _build_client(OPENAI_API_KEY='sk-test', GEMINI_API_KEY='AIza-test')
    assert client.get('/api/llm/providers').get_json() == {
        'openai': True,
        'anthropic': False,
        'gemini': True,
    }


# ── /api/llm/models ──────────────────────────────────────────────────────────


def test_models_unsupported_provider():
    client = _build_client(OPENAI_API_KEY='sk-test')
    res = client.get('/api/llm/models?provider=cohere')
    assert res.status_code == 400


def test_models_missing_key():
    client = _build_client()
    res = client.get('/api/llm/models?provider=openai')
    assert res.status_code == 503
    assert 'OPENAI_API_KEY' in res.get_json()['error']


@patch('speak_mentor.routes.llm.requests.get')
def test_models_openai_filters_chat_models(mock_get):
    mock_res = MagicMock()
    mock_res.json.return_value = {
        'data': [
            {'id': 'gpt-4o'},
            {'id': 'text-embedding-3-small'},
            {'id': 'o3-mini'},
            {'id': 'dall-e-3'},
        ],
    }
    mock_res.raise_for_status.return_value = None
    mock_get.return_value = mock_res

    client = _build_client(OPENAI_API_KEY='sk-test')
    res = client.get('/api/llm/models?provider=openai')
    assert res.status_code == 200
    names = [m['name'] for m in res.get_json()['models']]
    assert 'gpt-4o' in names
    assert 'o3-mini' in names
    assert 'text-embedding-3-small' not in names
    assert 'dall-e-3' not in names


@patch('speak_mentor.routes.llm.requests.get')
def test_models_anthropic(mock_get):
    mock_res = MagicMock()
    mock_res.json.return_value = {
        'data': [
            {'id': 'claude-sonnet-4-5', 'created_at': '2025-09-29T00:00:00Z'},
            {'id': 'claude-haiku-4-5', 'created_at': '2025-10-15T00:00:00Z'},
        ],
    }
    mock_res.raise_for_status.return_value = None
    mock_get.return_value = mock_res

    client = _build_client(ANTHROPIC_API_KEY='sk-ant-test')
    res = client.get('/api/llm/models?provider=anthropic')
    assert res.status_code == 200
    assert res.get_json()['models'][0]['name'] == 'claude-sonnet-4-5'


@patch('speak_mentor.routes.llm.requests.get')
def test_models_gemini_strips_models_prefix(mock_get):
    mock_res = MagicMock()
    mock_res.json.return_value = {
        'models': [
            {'name': 'models/gemini-2.5-pro', 'supportedGenerationMethods': ['generateContent']},
            {'name': 'models/text-bison', 'supportedGenerationMethods': ['generateText']},
        ],
    }
    mock_res.raise_for_status.return_value = None
    mock_get.return_value = mock_res

    client = _build_client(GEMINI_API_KEY='AIza-test')
    res = client.get('/api/llm/models?provider=gemini')
    assert res.status_code == 200
    names = [m['name'] for m in res.get_json()['models']]
    assert names == ['gemini-2.5-pro']


@patch('speak_mentor.routes.llm.requests.get')
def test_models_upstream_error_propagates_status(mock_get):
    mock_res = MagicMock()
    mock_res.status_code = 401
    err = requests.HTTPError()
    err.response = mock_res
    mock_res.raise_for_status.side_effect = err
    mock_get.return_value = mock_res

    client = _build_client(OPENAI_API_KEY='sk-bad')
    res = client.get('/api/llm/models?provider=openai')
    assert res.status_code == 401


# ── /api/llm/chat ────────────────────────────────────────────────────────────


def _chat_body(provider='openai', model='gpt-4o', **overrides):
    body = {
        'provider': provider,
        'model': model,
        'system': 'You are a helpful assistant.',
        'user': 'Hello.',
        'options': {'temperature': 0.2, 'top_p': 0.9, 'num_ctx': 4096},
        'timeout': 30000,
    }
    body.update(overrides)
    return body


def test_chat_rejects_non_json_body():
    client = _build_client(OPENAI_API_KEY='sk-test')
    res = client.post('/api/llm/chat', data='not json', content_type='text/plain')
    assert res.status_code == 400


def test_chat_rejects_unsupported_provider():
    client = _build_client(OPENAI_API_KEY='sk-test')
    res = client.post('/api/llm/chat', json=_chat_body(provider='nope'))
    assert res.status_code == 400


def test_chat_rejects_missing_field():
    client = _build_client(OPENAI_API_KEY='sk-test')
    body = _chat_body()
    del body['system']
    res = client.post('/api/llm/chat', json=body)
    assert res.status_code == 400


def test_chat_missing_key_returns_503():
    client = _build_client()
    res = client.post('/api/llm/chat', json=_chat_body())
    assert res.status_code == 503


@patch('speak_mentor.routes.llm.requests.post')
def test_chat_openai_returns_content(mock_post):
    mock_res = MagicMock()
    mock_res.json.return_value = {'choices': [{'message': {'content': '{"ok":true}'}}]}
    mock_res.raise_for_status.return_value = None
    mock_post.return_value = mock_res

    client = _build_client(OPENAI_API_KEY='sk-test')
    res = client.post('/api/llm/chat', json=_chat_body())
    assert res.status_code == 200
    assert res.get_json() == {'content': '{"ok":true}'}

    payload = mock_post.call_args.kwargs['json']
    assert payload['model'] == 'gpt-4o'
    assert payload['response_format'] == {'type': 'json_object'}
    assert payload['messages'][0]['role'] == 'system'


@patch('speak_mentor.routes.llm.requests.post')
def test_chat_anthropic_extracts_text_block(mock_post):
    mock_res = MagicMock()
    mock_res.json.return_value = {
        'content': [
            {'type': 'tool_use'},
            {'type': 'text', 'text': '{"hello":"world"}'},
        ],
    }
    mock_res.raise_for_status.return_value = None
    mock_post.return_value = mock_res

    client = _build_client(ANTHROPIC_API_KEY='sk-ant-test')
    res = client.post(
        '/api/llm/chat',
        json=_chat_body(provider='anthropic', model='claude-sonnet-4-5'),
    )
    assert res.status_code == 200
    assert res.get_json()['content'] == '{"hello":"world"}'

    headers = mock_post.call_args.kwargs['headers']
    assert headers['x-api-key'] == 'sk-ant-test'
    assert headers['anthropic-version'] == '2023-06-01'


@patch('speak_mentor.routes.llm.requests.post')
def test_chat_gemini_extracts_first_part(mock_post):
    mock_res = MagicMock()
    mock_res.json.return_value = {
        'candidates': [{'content': {'parts': [{'text': '{"answer":42}'}]}}],
    }
    mock_res.raise_for_status.return_value = None
    mock_post.return_value = mock_res

    client = _build_client(GEMINI_API_KEY='AIza-test')
    res = client.post(
        '/api/llm/chat',
        json=_chat_body(provider='gemini', model='gemini-2.5-flash'),
    )
    assert res.status_code == 200
    assert res.get_json()['content'] == '{"answer":42}'

    params = mock_post.call_args.kwargs['params']
    assert params == {'key': 'AIza-test'}


@patch('speak_mentor.routes.llm.requests.post')
def test_chat_upstream_error_propagates_status(mock_post):
    mock_res = MagicMock()
    mock_res.status_code = 429
    err = requests.HTTPError()
    err.response = mock_res
    mock_res.raise_for_status.side_effect = err
    mock_post.return_value = mock_res

    client = _build_client(OPENAI_API_KEY='sk-bad')
    res = client.post('/api/llm/chat', json=_chat_body())
    assert res.status_code == 429

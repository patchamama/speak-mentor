"""LLM proxy endpoints.

Forwards chat and model-list calls to OpenAI, Anthropic, or Gemini using
server-side API keys read from the environment. Frontend never sees the keys.

Supported providers:
- openai     → POST /v1/chat/completions, GET /v1/models
- anthropic  → POST /v1/messages,         GET /v1/models
- gemini     → POST /v1beta/models/{m}:generateContent, GET /v1beta/models
"""

from __future__ import annotations

import re
from typing import Any

import requests
from flask import Blueprint, current_app, jsonify, request

llm_bp = Blueprint('llm', __name__)

ANTHROPIC_VERSION = '2023-06-01'

PROVIDERS = ('openai', 'anthropic', 'gemini')


def _api_key(provider: str) -> str | None:
    key_name = f'{provider.upper()}_API_KEY'
    return current_app.config.get(key_name)


def _bad_request(message: str, status: int = 400):
    return jsonify({'error': message}), status


# ── Provider availability ────────────────────────────────────────────────────


@llm_bp.get('/llm/providers')
def llm_providers():
    return jsonify({p: bool(_api_key(p)) for p in PROVIDERS})


# ── Models list ──────────────────────────────────────────────────────────────


def _models_openai(api_key: str) -> list[dict[str, Any]]:
    res = requests.get(
        'https://api.openai.com/v1/models',
        headers={'authorization': f'Bearer {api_key}'},
        timeout=30,
    )
    res.raise_for_status()
    data = res.json().get('data', [])
    return [
        {'name': m['id']}
        for m in data
        if m['id'].startswith(('gpt-', 'o1', 'o3', 'o4'))
    ]


def _models_anthropic(api_key: str) -> list[dict[str, Any]]:
    res = requests.get(
        'https://api.anthropic.com/v1/models',
        params={'limit': 200},
        headers={
            'x-api-key': api_key,
            'anthropic-version': ANTHROPIC_VERSION,
        },
        timeout=30,
    )
    res.raise_for_status()
    return [
        {'name': m['id'], 'modified_at': m.get('created_at')}
        for m in res.json().get('data', [])
    ]


def _models_gemini(api_key: str) -> list[dict[str, Any]]:
    res = requests.get(
        'https://generativelanguage.googleapis.com/v1beta/models',
        params={'key': api_key},
        timeout=30,
    )
    res.raise_for_status()
    return [
        {'name': m['name'].replace('models/', '')}
        for m in res.json().get('models', [])
        if 'generateContent' in (m.get('supportedGenerationMethods') or [])
    ]


_MODEL_FETCHERS = {
    'openai': _models_openai,
    'anthropic': _models_anthropic,
    'gemini': _models_gemini,
}


@llm_bp.get('/llm/models')
def llm_models():
    provider = request.args.get('provider', '').lower()
    if provider not in PROVIDERS:
        return _bad_request(f'Unsupported provider: {provider}')

    api_key = _api_key(provider)
    if not api_key:
        return _bad_request(f'{provider.upper()}_API_KEY not configured on server', 503)

    try:
        models = _MODEL_FETCHERS[provider](api_key)
        return jsonify({'models': models})
    except requests.HTTPError as exc:
        return _bad_request(
            f'Upstream error: {exc.response.status_code}',
            exc.response.status_code,
        )
    except requests.RequestException as exc:
        return _bad_request(f'Network error: {exc}', 502)


# ── Chat ─────────────────────────────────────────────────────────────────────


def _chat_openai(api_key: str, payload: dict[str, Any], timeout: int) -> str:
    res = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'authorization': f'Bearer {api_key}',
            'content-type': 'application/json',
        },
        json={
            'model': payload['model'],
            'messages': [
                {'role': 'system', 'content': payload['system']},
                {'role': 'user', 'content': payload['user']},
            ],
            'temperature': payload['options']['temperature'],
            'top_p': payload['options']['top_p'],
            'response_format': {'type': 'json_object'},
        },
        timeout=timeout,
    )
    res.raise_for_status()
    return res.json()['choices'][0]['message']['content']


def _strip_code_fence(text: str) -> str:
    fenced = re.fullmatch(r'```(?:json)?\s*(.*?)\s*```', text.strip(), re.S | re.I)
    return fenced.group(1) if fenced else text


def _chat_anthropic(api_key: str, payload: dict[str, Any], timeout: int) -> str:
    res = requests.post(
        'https://api.anthropic.com/v1/messages',
        headers={
            'x-api-key': api_key,
            'anthropic-version': ANTHROPIC_VERSION,
            'content-type': 'application/json',
        },
        json={
            'model': payload['model'],
            'max_tokens': 16000,
            'system': payload['system']
            + '\n\nReturn a single valid JSON object. No prose outside JSON.',
            'messages': [{'role': 'user', 'content': payload['user']}],
        },
        timeout=timeout,
    )
    res.raise_for_status()
    body = res.json()
    for block in body.get('content', []):
        if block.get('type') == 'text':
            return _strip_code_fence(block.get('text', ''))
    return ''


def _chat_gemini(api_key: str, payload: dict[str, Any], timeout: int) -> str:
    model = payload['model'].replace('models/', '')
    res = requests.post(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        params={'key': api_key},
        headers={'content-type': 'application/json'},
        json={
            'systemInstruction': {'parts': [{'text': payload['system']}]},
            'contents': [{'role': 'user', 'parts': [{'text': payload['user']}]}],
            'generationConfig': {
                'temperature': payload['options']['temperature'],
                'topP': payload['options']['top_p'],
                'responseMimeType': 'application/json',
            },
        },
        timeout=timeout,
    )
    res.raise_for_status()
    candidates = res.json().get('candidates') or []
    if not candidates:
        return ''
    parts = candidates[0].get('content', {}).get('parts', [])
    return parts[0].get('text', '') if parts else ''


_CHAT_FETCHERS = {
    'openai': _chat_openai,
    'anthropic': _chat_anthropic,
    'gemini': _chat_gemini,
}


@llm_bp.post('/llm/chat')
def llm_chat():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return _bad_request('Body must be JSON object')

    provider = (body.get('provider') or '').lower()
    if provider not in PROVIDERS:
        return _bad_request(f'Unsupported provider: {provider}')

    required = ('model', 'system', 'user', 'options')
    for field in required:
        if field not in body:
            return _bad_request(f'Missing field: {field}')

    api_key = _api_key(provider)
    if not api_key:
        return _bad_request(f'{provider.upper()}_API_KEY not configured on server', 503)

    timeout_ms = int(body.get('timeout') or current_app.config['LLM_PROXY_TIMEOUT'] * 1000)
    timeout_s = max(5, timeout_ms // 1000)

    try:
        content = _CHAT_FETCHERS[provider](api_key, body, timeout_s)
        return jsonify({'content': content})
    except requests.HTTPError as exc:
        return _bad_request(
            f'Upstream error: {exc.response.status_code}',
            exc.response.status_code,
        )
    except requests.RequestException as exc:
        return _bad_request(f'Network error: {exc}', 502)

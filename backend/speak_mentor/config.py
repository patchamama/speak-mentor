import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///speak_mentor.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174'
    ).split(',')

    # LLM provider API keys (server-side proxy mode)
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

    LLM_PROXY_TIMEOUT = int(os.environ.get('LLM_PROXY_TIMEOUT', '600'))

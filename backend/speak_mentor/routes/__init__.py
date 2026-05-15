from .sessions import sessions_bp
from .errors import errors_bp
from .stats import stats_bp


def register_routes(app):
    app.register_blueprint(sessions_bp, url_prefix='/api')
    app.register_blueprint(errors_bp, url_prefix='/api')
    app.register_blueprint(stats_bp, url_prefix='/api')

    @app.get('/api/health')
    def health():
        return {'status': 'ok', 'version': '0.1.0'}

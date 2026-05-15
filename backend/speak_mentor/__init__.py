import os
from flask import Flask, send_from_directory, send_file
from flask_cors import CORS
from .config import Config
from .extensions import db
from .routes import register_routes

STATIC_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static')


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    CORS(app, origins=app.config['CORS_ORIGINS'])
    db.init_app(app)

    with app.app_context():
        db.create_all()

    register_routes(app)
    _register_static_routes(app)
    return app


def _register_static_routes(app: Flask) -> None:
    static = os.path.abspath(STATIC_FOLDER)
    if not os.path.isdir(static):
        return  # no static folder — dev mode, skip

    @app.get('/assets/<path:filename>')
    def assets(filename: str):
        return send_from_directory(os.path.join(static, 'assets'), filename)

    @app.get('/', defaults={'path': ''})
    @app.get('/<path:path>')
    def spa(path: str):
        if path.startswith('api/'):
            from flask import abort
            abort(404)
        index = os.path.join(static, 'index.html')
        return send_file(index)

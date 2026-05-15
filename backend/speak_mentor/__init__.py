from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db
from .routes import register_routes


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    CORS(app, origins=app.config['CORS_ORIGINS'])
    db.init_app(app)

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app

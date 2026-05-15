from datetime import datetime, timezone
from .extensions import db


class Session(db.Model):
    __tablename__ = 'sessions'

    id = db.Column(db.Integer, primary_key=True)
    mode = db.Column(db.String(20), nullable=False)
    source_lang = db.Column(db.String(2), nullable=False)
    target_lang = db.Column(db.String(2), nullable=False)
    level = db.Column(db.String(2), nullable=False)
    input_text = db.Column(db.Text, nullable=False)
    output_text = db.Column(db.Text, nullable=False)
    raw_llm = db.Column(db.Text)
    model = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    errors = db.relationship(
        'Error', backref='session', cascade='all, delete-orphan', lazy=True
    )

    def to_dict(self, include_errors=False):
        data = {
            'id': self.id,
            'mode': self.mode,
            'source_lang': self.source_lang,
            'target_lang': self.target_lang,
            'level': self.level,
            'input_text': self.input_text,
            'output_text': self.output_text,
            'model': self.model,
            'created_at': self.created_at.isoformat(),
        }
        if include_errors:
            data['errors'] = [e.to_dict() for e in self.errors]
        return data


class Error(db.Model):
    __tablename__ = 'errors'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer, db.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False
    )
    original = db.Column(db.Text, nullable=False)
    correction = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    position_start = db.Column(db.Integer)
    position_end = db.Column(db.Integer)
    explanation = db.Column(db.Text, nullable=False)
    rule_reference = db.Column(db.Text)
    example = db.Column(db.Text)
    level = db.Column(db.String(2), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'original': self.original,
            'correction': self.correction,
            'type': self.type,
            'severity': self.severity,
            'position_start': self.position_start,
            'position_end': self.position_end,
            'explanation': self.explanation,
            'rule_reference': self.rule_reference,
            'example': self.example,
            'level': self.level,
            'created_at': self.created_at.isoformat(),
        }

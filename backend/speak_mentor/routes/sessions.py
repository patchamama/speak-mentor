from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Session, Error

sessions_bp = Blueprint('sessions', __name__)


@sessions_bp.post('/sessions')
def create_session():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    required = ['mode', 'source_lang', 'target_lang', 'level', 'input_text', 'output_text']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    session = Session(
        mode=data['mode'],
        source_lang=data['source_lang'],
        target_lang=data['target_lang'],
        level=data['level'],
        input_text=data['input_text'],
        output_text=data['output_text'],
        raw_llm=data.get('raw_llm'),
        model=data.get('model'),
    )
    db.session.add(session)
    db.session.flush()

    for err in data.get('errors', []):
        error = Error(
            session_id=session.id,
            original=err['original'],
            correction=err['correction'],
            type=err['type'],
            severity=err['severity'],
            position_start=err.get('position_start'),
            position_end=err.get('position_end'),
            position_unreliable=err.get('position_unreliable', False),
            explanation=err['explanation'],
            rule_reference=err.get('rule_reference'),
            example=err.get('example'),
            level=data['level'],
        )
        db.session.add(error)

    db.session.commit()
    return jsonify({'session_id': session.id}), 201


@sessions_bp.get('/sessions')
def list_sessions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    mode = request.args.get('mode')

    q = Session.query.order_by(Session.created_at.desc())
    if mode:
        q = q.filter_by(mode=mode)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'sessions': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages,
    })


@sessions_bp.get('/sessions/<int:session_id>')
def get_session(session_id):
    session = db.get_or_404(Session, session_id)
    return jsonify(session.to_dict(include_errors=True))


@sessions_bp.delete('/sessions/<int:session_id>')
def delete_session(session_id):
    session = db.get_or_404(Session, session_id)
    db.session.delete(session)
    db.session.commit()
    return '', 204

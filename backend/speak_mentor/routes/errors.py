from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Error

errors_bp = Blueprint('errors', __name__)


@errors_bp.get('/errors')
def list_errors():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    error_type = request.args.get('type')
    level = request.args.get('level')

    q = Error.query.order_by(Error.created_at.desc())
    if error_type:
        q = q.filter_by(type=error_type)
    if level:
        q = q.filter_by(level=level)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'errors': [e.to_dict() for e in pagination.items],
        'total': pagination.total,
    })

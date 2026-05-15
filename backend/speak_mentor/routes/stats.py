from flask import Blueprint, request, jsonify
from sqlalchemy import func, text
from ..extensions import db
from ..models import Error, Session

stats_bp = Blueprint('stats', __name__)


@stats_bp.get('/stats/by-type')
def stats_by_type():
    rows = (
        db.session.query(Error.type, func.count(Error.id).label('count'))
        .group_by(Error.type)
        .order_by(func.count(Error.id).desc())
        .all()
    )
    return jsonify([{'type': r.type, 'count': r.count} for r in rows])


@stats_bp.get('/stats/by-level')
def stats_by_level():
    rows = (
        db.session.query(Error.level, func.count(Error.id).label('count'))
        .group_by(Error.level)
        .order_by(Error.level)
        .all()
    )
    return jsonify([{'level': r.level, 'count': r.count} for r in rows])


@stats_bp.get('/stats/timeline')
def stats_timeline():
    days = request.args.get('days', 30, type=int)
    rows = db.session.execute(
        text("""
            SELECT date(created_at) as day, COUNT(*) as count
            FROM errors
            WHERE created_at >= date('now', :offset)
            GROUP BY day
            ORDER BY day
        """),
        {'offset': f'-{days} days'},
    ).fetchall()
    return jsonify([{'day': r.day, 'count': r.count} for r in rows])


@stats_bp.get('/stats/top-rules')
def stats_top_rules():
    limit = request.args.get('limit', 10, type=int)
    rows = (
        db.session.query(
            Error.rule_reference,
            func.count(Error.id).label('count'),
        )
        .filter(Error.rule_reference.isnot(None))
        .group_by(Error.rule_reference)
        .order_by(func.count(Error.id).desc())
        .limit(limit)
        .all()
    )
    return jsonify([{'rule': r.rule_reference, 'count': r.count} for r in rows])

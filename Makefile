.PHONY: dev-frontend dev-backend dev install-frontend install-backend test-frontend test-backend

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && FLASK_APP=wsgi:app FLASK_ENV=development .venv/bin/flask run --port 5000

dev:
	make -j2 dev-frontend dev-backend

test-frontend:
	cd frontend && npm test

test-backend:
	cd backend && .venv/bin/pytest

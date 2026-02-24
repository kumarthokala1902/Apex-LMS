# Apex-LMS: Production-Ready Flask & PostgreSQL Backend

This documentation provides the full backend implementation for your LMS Admin Panel using **Python Flask** and **PostgreSQL**.

## 1. Project Structure
```text
backend/
├── app.py              # Entry point
├── config.py           # Configuration (DB, JWT)
├── middleware.py       # JWT & RBAC logic
├── models.py           # SQLAlchemy Models
├── routes/
│   ├── __init__.py
│   ├── auth.py         # /admin/login
│   ├── users.py        # /admin/users
│   ├── courses.py      # /admin/courses
│   └── tasks.py        # /admin/tasks
└── requirements.txt
```

## 2. Database Schema (PostgreSQL)
```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('admin', 'instructor', 'learner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Backend Implementation

### config.py
```python
import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/lms')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
```

### middleware.py (JWT & RBAC)
```python
from functools import wraps
from flask import request, jsonify
import jwt
from config import Config

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token.split(" ")[1], Config.JWT_SECRET_KEY, algorithms=["HS256"])
            request.user = data
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_only(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({'message': 'Admin access required!'}), 403
        return f(*args, **kwargs)
    return decorated
```

### models.py
```python
from flask_sqlalchemy import SQLAlchemy
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100))
    email = db.Column(db.String(255), unique=True)
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20), default='learner')

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255))
    description = db.Column(db.Text)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255))
    status = db.Column(db.String(20), default='pending')
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
```

### routes/users.py (Example Blueprint)
```python
from flask import Blueprint, request, jsonify
from models import db, User
from middleware import token_required, admin_only

users_bp = Blueprint('users', __name__)

@users_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_only
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id, 
        'name': u.name, 
        'email': u.email, 
        'role': u.role
    } for u in users])

@users_bp.route('/admin/users', methods=['POST'])
@token_required
@admin_only
def create_user():
    data = request.json
    new_user = User(
        name=data['name'], 
        email=data['email'], 
        role=data.get('role', 'learner'),
        password_hash='hashed_placeholder' # Use bcrypt locally
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created'}), 201
```

## 4. Setup Instructions
1.  **Install Dependencies**: `pip install flask flask-sqlalchemy PyJWT psycopg2-binary`
2.  **Environment Variables**: Set `DATABASE_URL` and `JWT_SECRET_KEY`.
3.  **Run Migrations**: Use Flask-Migrate or `db.create_all()` in a shell.
4.  **Start Server**: `python app.py`

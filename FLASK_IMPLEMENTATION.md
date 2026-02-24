# Apex-LMS: Flask & PostgreSQL Implementation Guide

Use this code for your local project in **PyCharm**.

## 1. Project Structure
```text
apex_lms/
├── app.py
├── models.py
├── requirements.txt
├── static/
│   ├── css/
│   └── js/
└── templates/
    ├── base.html
    ├── dashboard.html
    └── course_builder.html
```

## 2. Backend: app.py (Flask)
```python
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/apex_lms'
db = SQLAlchemy(app)

class Tenant(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subdomain = db.Column(db.String(50), unique=True)
    primary_color = db.Column(db.String(7), default='#4f46e5')

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/courses', methods=['GET'])
def get_courses():
    # Logic to fetch courses from Postgres
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True)
```

## 3. Database Schema (PostgreSQL)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#4f46e5'
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'LEARNER'))
);
```

## 4. Frontend (HTML/JS)
Use the Tailwind Play CDN for quick styling in your local HTML files:
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            primary: '#4f46e5',
          }
        }
      }
    }
  }
</script>
```

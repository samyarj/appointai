from sqlalchemy import Column, Integer, String, Text, Date, Time, Boolean, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # For JWT authentication
    avatar = Column(Text)
    join_date = Column(Date, default=datetime.utcnow().date)
    timezone = Column(String(50), default='UTC')
    date_format = Column(String(20), default='MM/DD/YYYY')
    time_format = Column(String(10), default='12h')
    theme = Column(String(20), default='light')
    notifications = Column(JSON, default=lambda: {
        "email": True,
        "push": True,
        "reminders": True,
        "weeklyDigest": False
    })
    privacy = Column(JSON, default=lambda: {
        "profileVisibility": "public",
        "showActivity": True
    })
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    events = relationship('Event', back_populates='user')
    todos = relationship('Todo', back_populates='user')

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    color = Column(String(10))
    description = Column(Text)
    created_at = Column(TIMESTAMP)
    usage_count = Column(Integer, default=0)
    events = relationship('Event', back_populates='category')
    todos = relationship('Todo', back_populates='category')

class Event(Base):
    __tablename__ = 'events'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    category_id = Column(Integer, ForeignKey('categories.id'))
    title = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration = Column(String(20))
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP)
    user = relationship('User', back_populates='events')
    category = relationship('Category', back_populates='events')

class Todo(Base):
    __tablename__ = 'todos'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    category_id = Column(Integer, ForeignKey('categories.id'))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(10))  # 'low', 'medium', 'high'
    estimated_duration = Column(String(20))
    due_date = Column(Date)
    completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP)
    user = relationship('User', back_populates='todos')
    category = relationship('Category', back_populates='todos')

from sqlalchemy import Column, Integer, String, Text, Date, Time, Boolean, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    avatar = Column(Text)
    join_date = Column(Date)
    timezone = Column(String(50))
    date_format = Column(String(20))
    time_format = Column(String(10))
    theme = Column(String(20))
    notifications = Column(JSON)  # {email: bool, push: bool, reminders: bool, weeklyDigest: bool}
    privacy = Column(JSON)        # {profileVisibility: string, showActivity: bool}
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

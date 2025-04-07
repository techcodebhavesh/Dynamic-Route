from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class BusStop(Base):
    __tablename__ = "bus_stops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    current_density = Column(Float, default=0.0)
    base_demand = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    stops = Column(JSON)  # List of stop IDs in order
    total_distance = Column(Float)
    estimated_time = Column(Integer)  # in minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="off_duty")  # active, on_break, off_duty
    current_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    hours_today = Column(Float, default=0.0)
    break_slots = Column(JSON, default=list)  # List of break time slots
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    current_route = relationship("Route")

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    capacity = Column(Integer)
    current_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    current_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    current_driver = relationship("Driver")
    current_route = relationship("Route")

class CrowdData(Base):
    __tablename__ = "crowd_data"

    id = Column(Integer, primary_key=True, index=True)
    stop_id = Column(Integer, ForeignKey("bus_stops.id"))
    density = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    stop = relationship("BusStop") 
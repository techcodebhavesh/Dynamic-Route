import sqlite3
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from datetime import datetime

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Sample data
bus_stops = [
    {"name": "Swargate Bus Terminal", "latitude": 18.5089, "longitude": 73.8567, "base_demand": 150.0},
    {"name": "Pune Station Bus Stand", "latitude": 18.5299, "longitude": 73.8556, "base_demand": 200.0},
    {"name": "Kharadi Bus Stand", "latitude": 18.5515, "longitude": 73.9345, "base_demand": 120.0},
    {"name": "Hadapsar Bus Stand", "latitude": 18.5167, "longitude": 73.9250, "base_demand": 130.0},
    {"name": "Katraj Bus Stand", "latitude": 18.4568, "longitude": 73.8035, "base_demand": 110.0},
    {"name": "Bund Garden", "latitude": 18.5362, "longitude": 73.8931, "base_demand": 90.0},
    {"name": "Koregaon Park", "latitude": 18.5362, "longitude": 73.8931, "base_demand": 100.0},
    {"name": "Aundh", "latitude": 18.5590, "longitude": 73.8070, "base_demand": 80.0},
    {"name": "Baner", "latitude": 18.5590, "longitude": 73.7870, "base_demand": 70.0},
    {"name": "Wakad", "latitude": 18.5790, "longitude": 73.7670, "base_demand": 60.0},
]

drivers = [
    {"name": "Rajesh Kumar", "status": "off_duty"},
    {"name": "Suresh Patel", "status": "off_duty"},
    {"name": "Amit Singh", "status": "off_duty"},
    {"name": "Priya Sharma", "status": "off_duty"},
    {"name": "Rahul Verma", "status": "off_duty"},
]

buses = [
    {"number": "BUS001", "capacity": 50},
    {"number": "BUS002", "capacity": 50},
    {"number": "BUS003", "capacity": 50},
    {"number": "BUS004", "capacity": 50},
    {"number": "BUS005", "capacity": 50},
]

# Define 10 bus routes for Pune
routes = [
    {
        "name": "Route 1: Swargate - Station - Kharadi",
        "stops": [1, 2, 3],
        "total_distance": 6.32,
        "estimated_time": 45,
        "is_active": True
    },
    {
        "name": "Route 2: Hadapsar - Katraj - Swargate",
        "stops": [4, 5, 1],
        "total_distance": 8.75,
        "estimated_time": 60,
        "is_active": True
    },
    {
        "name": "Route 3: Bund Garden - Koregaon Park - Station",
        "stops": [6, 7, 2],
        "total_distance": 5.20,
        "estimated_time": 35,
        "is_active": True
    },
    {
        "name": "Route 4: Aundh - Baner - Wakad",
        "stops": [8, 9, 10],
        "total_distance": 7.50,
        "estimated_time": 50,
        "is_active": True
    },
    {
        "name": "Route 5: Station - Kharadi - Hadapsar",
        "stops": [2, 3, 4],
        "total_distance": 9.30,
        "estimated_time": 65,
        "is_active": True
    },
    {
        "name": "Route 6: Swargate - Katraj - Bund Garden",
        "stops": [1, 5, 6],
        "total_distance": 10.20,
        "estimated_time": 70,
        "is_active": True
    },
    {
        "name": "Route 7: Koregaon Park - Aundh - Baner",
        "stops": [7, 8, 9],
        "total_distance": 8.40,
        "estimated_time": 55,
        "is_active": True
    },
    {
        "name": "Route 8: Wakad - Station - Swargate",
        "stops": [10, 2, 1],
        "total_distance": 12.30,
        "estimated_time": 85,
        "is_active": True
    },
    {
        "name": "Route 9: Hadapsar - Koregaon Park - Aundh",
        "stops": [4, 7, 8],
        "total_distance": 7.80,
        "estimated_time": 50,
        "is_active": True
    },
    {
        "name": "Route 10: Baner - Wakad - Kharadi",
        "stops": [9, 10, 3],
        "total_distance": 11.20,
        "estimated_time": 75,
        "is_active": True
    },
]

def init_db():
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_stops = db.query(models.BusStop).count()
        if existing_stops > 0:
            print("Database already initialized with data.")
            return
        
        # Add bus stops
        for stop_data in bus_stops:
            stop = models.BusStop(
                name=stop_data["name"],
                latitude=stop_data["latitude"],
                longitude=stop_data["longitude"],
                base_demand=stop_data["base_demand"],
                current_density=100.0,  # Initial density
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(stop)
        
        # Add drivers
        for driver_data in drivers:
            driver = models.Driver(
                name=driver_data["name"],
                status=driver_data["status"],
                current_route_id=None,
                hours_today=0.0,
                break_slots=[],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(driver)
        
        # Add buses
        for bus_data in buses:
            bus = models.Bus(
                number=bus_data["number"],
                capacity=bus_data["capacity"],
                current_driver_id=None,
                current_route_id=None,
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(bus)
        
        # Add routes
        for route_data in routes:
            route = models.Route(
                name=route_data["name"],
                stops=route_data["stops"],
                total_distance=route_data["total_distance"],
                estimated_time=route_data["estimated_time"],
                is_active=route_data["is_active"],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(route)
        
        db.commit()
        print("Database initialized successfully!")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 
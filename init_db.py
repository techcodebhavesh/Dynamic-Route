from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Sample data
PUNE_STOPS = [
    {
        "name": "Swargate Bus Terminal",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "base_demand": 150
    },
    {
        "name": "Pune Station Bus Stand",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "base_demand": 200
    },
    {
        "name": "Kharadi Bus Stand",
        "latitude": 18.5525,
        "longitude": 73.9375,
        "base_demand": 100
    },
    {
        "name": "Hadapsar Bus Stand",
        "latitude": 18.5177,
        "longitude": 73.9252,
        "base_demand": 120
    },
    {
        "name": "Katraj Bus Stand",
        "latitude": 18.4568,
        "longitude": 73.8665,
        "base_demand": 180
    },
    {
        "name": "Bund Garden Bus Stand",
        "latitude": 18.5362,
        "longitude": 73.8931,
        "base_demand": 90
    },
    {
        "name": "Koregaon Park Bus Stand",
        "latitude": 18.5362,
        "longitude": 73.8931,
        "base_demand": 110
    },
    {
        "name": "Aundh Bus Stand",
        "latitude": 18.5590,
        "longitude": 73.8077,
        "base_demand": 80
    },
    {
        "name": "Baner Bus Stand",
        "latitude": 18.5590,
        "longitude": 73.7867,
        "base_demand": 70
    },
    {
        "name": "Wakad Bus Stand",
        "latitude": 18.5833,
        "longitude": 73.7667,
        "base_demand": 60
    }
]

DRIVERS = [
    {"name": "Rajesh Kumar"},
    {"name": "Suresh Patel"},
    {"name": "Amit Singh"},
    {"name": "Priya Sharma"},
    {"name": "Vikram Desai"}
]

BUSES = [
    {"number": "BUS001", "capacity": 50},
    {"number": "BUS002", "capacity": 50},
    {"number": "BUS003", "capacity": 50},
    {"number": "BUS004", "capacity": 50},
    {"number": "BUS005", "capacity": 50}
]

def init_db():
    db = SessionLocal()
    try:
        # Add bus stops
        for stop_data in PUNE_STOPS:
            db_stop = models.BusStop(**stop_data)
            db.add(db_stop)
        
        # Add drivers
        for driver_data in DRIVERS:
            db_driver = models.Driver(**driver_data)
            db.add(db_driver)
        
        # Add buses
        for bus_data in BUSES:
            db_bus = models.Bus(**bus_data)
            db.add(db_bus)
        
        # Create some sample routes
        stops = db.query(models.BusStop).all()
        for i in range(0, len(stops), 3):
            if i + 2 < len(stops):
                route = models.Route(
                    name=f"Route {i//3 + 1}",
                    stops=[stops[i].id, stops[i+1].id, stops[i+2].id],
                    total_distance=10.0,  # This should be calculated based on actual distances
                    estimated_time=30,    # This should be calculated based on actual times
                    is_active=True
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
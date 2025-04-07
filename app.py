from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
from pydantic import BaseModel
import asyncio

from database import get_db, engine
import models
from crowd_simulation import CrowdSimulator
from bus_routing_system import BusRoutingSystem
from map_integration import MapIntegration

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bus Routing System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize system components
crowd_simulator = CrowdSimulator()
bus_routing_system = BusRoutingSystem()
map_integration = MapIntegration()

# Pydantic models for request/response
class BusStopBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    base_demand: float = 100.0

class BusStopCreate(BusStopBase):
    pass

class BusStop(BusStopBase):
    id: int
    current_density: float
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class RouteBase(BaseModel):
    name: str
    stops: List[int]
    total_distance: float
    estimated_time: int

class RouteCreate(RouteBase):
    pass

class Route(RouteBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class DriverBase(BaseModel):
    name: str
    status: str = "off_duty"

class DriverCreate(DriverBase):
    pass

class Driver(DriverBase):
    id: int
    current_route_id: Optional[int]
    hours_today: float
    break_slots: List[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BusBase(BaseModel):
    number: str
    capacity: int

class BusCreate(BusBase):
    pass

class Bus(BusBase):
    id: int
    current_driver_id: Optional[int]
    current_route_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class DensityUpdate(BaseModel):
    stop_id: int
    new_density: float

# Background task for crowd simulation
async def update_crowd_density(db: Session):
    while True:
        try:
            stops = db.query(models.BusStop).all()
            for stop in stops:
                new_density = crowd_simulator.simulate_density(
                    stop.base_demand,
                    datetime.now().hour
                )
                stop.current_density = new_density
                db.commit()
        except Exception as e:
            print(f"Error updating crowd density: {e}")
        await asyncio.sleep(300)  # Update every 5 minutes

@app.on_event("startup")
async def startup_event():
    # Start crowd simulation background task
    asyncio.create_task(update_crowd_density(next(get_db())))

@app.get("/")
async def root():
    return {"message": "Welcome to Bus Routing System API"}

@app.get("/stops", response_model=List[BusStop])
def get_stops(db: Session = Depends(get_db)):
    return db.query(models.BusStop).all()

@app.post("/stops", response_model=BusStop)
def create_stop(stop: BusStopCreate, db: Session = Depends(get_db)):
    db_stop = models.BusStop(**stop.dict())
    db.add(db_stop)
    db.commit()
    db.refresh(db_stop)
    return db_stop

@app.get("/routes", response_model=List[Route])
def get_routes(db: Session = Depends(get_db)):
    return db.query(models.Route).all()

@app.post("/routes", response_model=Route)
def create_route(route: RouteCreate, db: Session = Depends(get_db)):
    db_route = models.Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@app.get("/drivers", response_model=List[Driver])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).all()

@app.post("/drivers", response_model=Driver)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = models.Driver(**driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@app.post("/route")
async def find_route(from_stop: int, to_stop: int, db: Session = Depends(get_db)):
    try:
        route = bus_routing_system.find_optimal_route(from_stop, to_stop)
        return route
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/update-density")
def update_density(update: DensityUpdate, db: Session = Depends(get_db)):
    stop = db.query(models.BusStop).filter(models.BusStop.id == update.stop_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    stop.current_density = update.new_density
    db.commit()
    return {"message": "Density updated successfully"}

@app.post("/assign-drivers")
def assign_drivers(db: Session = Depends(get_db)):
    try:
        # Get all active routes and available drivers
        routes = db.query(models.Route).filter(models.Route.is_active == True).all()
        drivers = db.query(models.Driver).filter(models.Driver.status == "off_duty").all()
        
        # Simple assignment logic (can be enhanced with more sophisticated algorithms)
        for i, route in enumerate(routes):
            if i < len(drivers):
                driver = drivers[i]
                driver.current_route_id = route.id
                driver.status = "active"
                driver.hours_today = 0.0
                db.commit()
        
        return db.query(models.Driver).all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
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

class RouteRequest(BaseModel):
    from_stop: int
    to_stop: int

    class Config:
        from_attributes = True  # New Pydantic V2 syntax for orm_mode

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
                new_density = crowd_simulator.get_current_density(
                    stop.id
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
async def find_route(route_request: RouteRequest, db: Session = Depends(get_db)):
    try:
        # Get all active routes
        all_routes = db.query(models.Route).filter(models.Route.is_active == True).all()
        
        # Get the stops
        from_stop_obj = db.query(models.BusStop).filter(models.BusStop.id == route_request.from_stop).first()
        to_stop_obj = db.query(models.BusStop).filter(models.BusStop.id == route_request.to_stop).first()
        
        if not from_stop_obj or not to_stop_obj:
            raise HTTPException(status_code=404, detail="Stop not found")
        
        # Find all possible routes between the stops
        possible_routes = []
        for route in all_routes:
            route_stops = route.stops
            if route_request.from_stop in route_stops and route_request.to_stop in route_stops:
                # Calculate route metrics
                from_idx = route_stops.index(route_request.from_stop)
                to_idx = route_stops.index(route_request.to_stop)
                
                # Get the stops in the correct order
                if from_idx < to_idx:
                    route_stops = route_stops[from_idx:to_idx + 1]
                else:
                    route_stops = route_stops[to_idx:from_idx + 1]
                    route_stops.reverse()
                
                # Calculate total crowd density and demand along the route
                total_density = 0
                total_demand = 0
                stop_details = []
                
                for stop_id in route_stops:
                    stop = db.query(models.BusStop).filter(models.BusStop.id == stop_id).first()
                    total_density += stop.current_density
                    total_demand += stop.base_demand
                    stop_details.append({
                        "id": stop.id,
                        "name": stop.name,
                        "density": stop.current_density,
                        "demand": stop.base_demand
                    })
                
                # Calculate route score based on both density and demand
                avg_density = total_density / len(route_stops)
                avg_demand = total_demand / len(route_stops)
                
                # Lower score is better - prioritize routes with high demand but manageable density
                route_score = avg_density / (avg_demand + 1)  # Add 1 to avoid division by zero
                
                possible_routes.append({
                    "route_id": route.id,
                    "name": route.name,
                    "stops": route_stops,
                    "stop_details": stop_details,
                    "total_distance": route.total_distance,
                    "estimated_time": route.estimated_time,
                    "avg_density": avg_density,
                    "avg_demand": avg_demand,
                    "route_score": route_score
                })
        
        if not possible_routes:
            raise HTTPException(status_code=404, detail="No route found between the specified stops")
        
        # Sort routes by score (lower is better) and return the best one
        best_route = min(possible_routes, key=lambda x: x["route_score"])
        
        return {
            "route": best_route,
            "from_stop": from_stop_obj.name,
            "to_stop": to_stop_obj.name,
            "total_stops": len(best_route["stops"]),
            "estimated_time": best_route["estimated_time"],
            "crowd_score": best_route["avg_density"],
            "demand_score": best_route["avg_demand"],
            "route_score": best_route["route_score"]
        }
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
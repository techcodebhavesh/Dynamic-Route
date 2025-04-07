import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import random

class CrowdSimulator:
    def __init__(self, base_density: float = 100.0):
        self.base_density = base_density
        self.time_factors = {
            0: 0.3,  # 12 AM
            1: 0.2,
            2: 0.1,
            3: 0.1,
            4: 0.2,
            5: 0.4,
            6: 0.6,
            7: 0.8,
            8: 1.0,  # Peak morning
            9: 0.9,
            10: 0.7,
            11: 0.8,
            12: 0.9,  # Peak afternoon
            13: 0.8,
            14: 0.7,
            15: 0.8,
            16: 0.9,
            17: 1.0,  # Peak evening
            18: 0.9,
            19: 0.8,
            20: 0.6,
            21: 0.5,
            22: 0.4,
            23: 0.3
        }
        
    def get_current_density(self, stop_id: int) -> float:
        """Simulate crowd density based on time and location"""
        current_hour = datetime.now().hour
        time_factor = self.time_factors[current_hour]
        
        # Add some randomness based on stop location
        location_factor = 1.0 + (stop_id % 5) * 0.2  # Different stops have different base densities
        
        # Add some random variation
        random_factor = random.uniform(0.8, 1.2)
        
        return self.base_density * time_factor * location_factor * random_factor

class Driver:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name
        self.current_bus = None
        self.current_route = None
        self.break_slots = []  # List of (start_time, end_time) tuples
        self.total_hours = 0
        self.is_on_break = False
        
    def assign_bus(self, bus_id: int, route: List[int], start_time: datetime):
        self.current_bus = bus_id
        self.current_route = route
        self.start_time = start_time
        
    def add_break_slot(self, start_time: datetime, duration_minutes: int = 30):
        end_time = start_time + timedelta(minutes=duration_minutes)
        self.break_slots.append((start_time, end_time))
        
    def is_break_time(self, current_time: datetime) -> bool:
        for start, end in self.break_slots:
            if start <= current_time <= end:
                return True
        return False

class DriverScheduler:
    def __init__(self):
        self.drivers: List[Driver] = []
        self.break_stops = {
            1: "Swargate Bus Terminal",
            2: "Pune Station Bus Stand",
            3: "Kharadi Bus Stand"
        }
        
    def add_driver(self, driver: Driver):
        self.drivers.append(driver)
        
    def assign_breaks(self, driver: Driver, route: List[int]):
        """Assign break slots at designated stops"""
        # Find break stop indices in the route
        break_indices = []
        for i, stop in enumerate(route):
            if stop in self.break_stops.values():
                break_indices.append(i)
                
        if len(break_indices) >= 3:
            # Assign breaks at three different stops
            for i in range(3):
                break_index = break_indices[i]
                # Calculate approximate time to reach break stop
                break_time = datetime.now() + timedelta(hours=i*2)  # Simulated time
                driver.add_break_slot(break_time)
                
    def get_available_driver(self, current_time: datetime) -> Driver:
        """Find an available driver who is not on break"""
        for driver in self.drivers:
            if not driver.is_break_time(current_time):
                return driver
        return None
        
    def schedule_drivers(self, routes: List[List[int]], start_time: datetime):
        """Schedule drivers for multiple routes"""
        assignments = []
        current_time = start_time
        
        for route in routes:
            driver = self.get_available_driver(current_time)
            if driver:
                driver.assign_bus(len(assignments) + 1, route, current_time)
                self.assign_breaks(driver, route)
                assignments.append((driver, route))
                current_time += timedelta(minutes=30)  # Stagger start times
                
        return assignments

if __name__ == "__main__":
    # Example usage
    simulator = CrowdSimulator()
    
    # Simulate crowd density for different stops
    for stop_id in range(5):
        density = simulator.get_current_density(stop_id)
        print(f"Stop {stop_id} current density: {density:.2f}")
        
    # Create and schedule drivers
    scheduler = DriverScheduler()
    
    # Add some drivers
    drivers = [
        Driver(1, "Rajesh Kumar"),
        Driver(2, "Suresh Patel"),
        Driver(3, "Amit Singh")
    ]
    
    for driver in drivers:
        scheduler.add_driver(driver)
        
    # Example routes
    routes = [
        [1, 2, 3, 4, 5],  # Route 1
        [2, 3, 4, 5, 1],  # Route 2
        [3, 4, 5, 1, 2]   # Route 3
    ]
    
    # Schedule drivers
    assignments = scheduler.schedule_drivers(routes, datetime.now())
    
    # Print assignments
    for driver, route in assignments:
        print(f"\nDriver: {driver.name}")
        print(f"Assigned to Route: {route}")
        print("Break slots:")
        for start, end in driver.break_slots:
            print(f"  {start.strftime('%H:%M')} - {end.strftime('%H:%M')}") 
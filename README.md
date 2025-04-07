# Bus Routing System with Dynamic Programming

This project implements a Bus Routing System that uses Dynamic Programming algorithms to optimize bus routes based on various factors such as distance, demand, and vehicle capacity.

## Features

- Dynamic route optimization using Floyd-Warshall algorithm
- Traveling Salesman Problem solution with capacity constraints
- Real-time demand-based route adjustments
- Network visualization capabilities
- Efficient path finding between stops

## Project Structure

- `bus_routing_system.py`: Main module containing the core bus routing system implementation
- `dynamic_programming.py`: Module containing dynamic programming algorithms for route optimization
- `requirements.txt`: Project dependencies

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Create a bus routing system instance:
```python
from bus_routing_system import BusRoutingSystem, BusStop

routing_system = BusRoutingSystem()
```

2. Add bus stops:
```python
stops = [
    BusStop(1, 0, 0, 100),  # id, x, y, demand
    BusStop(2, 1, 1, 150),
    # ... more stops
]

for stop in stops:
    routing_system.add_stop(stop)
```

3. Add connections between stops:
```python
connections = [
    (1, 2, 1.4),  # stop1_id, stop2_id, distance
    (2, 3, 1.0),
    # ... more connections
]

for stop1, stop2, distance in connections:
    routing_system.add_connection(stop1, stop2, distance)
```

4. Find optimal routes:
```python
# Find shortest path between two stops
optimal_route = routing_system.find_optimal_route(1, 4)

# Optimize route considering demand
bus_route = BusRoute(stops, capacity=50)
optimized_route = routing_system.optimize_route_with_demand(bus_route)
```

5. Visualize the network:
```python
routing_system.visualize_network()
```

## Algorithms

1. **Floyd-Warshall Algorithm**
   - Finds shortest paths between all pairs of stops
   - Used for base route optimization

2. **Traveling Salesman Problem with DP**
   - Optimizes route sequence considering all stops
   - Handles capacity constraints

3. **Demand-Based Route Optimization**
   - Adjusts routes based on stop demands
   - Considers vehicle capacity constraints

## Contributing

Feel free to submit issues and enhancement requests!
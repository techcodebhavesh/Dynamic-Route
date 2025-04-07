import numpy as np
import networkx as nx
from typing import List, Tuple, Dict
import matplotlib.pyplot as plt
from map_integration import MapIntegration

class BusStop:
    def __init__(self, id: int, x: float, y: float, demand: float = 0.0):
        self.id = id
        self.x = x
        self.y = y
        self.demand = demand  # Population density/demand at this stop

class BusRoute:
    def __init__(self, stops: List[BusStop], capacity: int):
        self.stops = stops
        self.capacity = capacity
        self.current_load = 0

class BusRoutingSystem:
    def __init__(self, area_name: str = None):
        self.stops: Dict[int, BusStop] = {}
        self.graph = nx.Graph()
        self.routes: List[BusRoute] = []
        self.map_integration = MapIntegration()
        if area_name:
            self.map_integration.load_area(area_name)
        
    def add_stop_from_coordinates(self, lat: float, lon: float, demand: float = 0.0) -> int:
        """Add a bus stop using real-world coordinates"""
        node_id = self.map_integration.find_nearest_node(lat, lon)
        stop = BusStop(node_id, lon, lat, demand)
        self.add_stop(stop)
        return node_id
        
    def add_stop_from_address(self, address: str, demand: float = 0.0) -> int:
        """Add a bus stop using an address"""
        lat, lon = self.map_integration.get_coordinates(address)
        return self.add_stop_from_coordinates(lat, lon, demand)
        
    def add_stop(self, stop: BusStop):
        """Add a bus stop to the system"""
        self.stops[stop.id] = stop
        self.graph.add_node(stop.id, pos=(stop.x, stop.y))
        
    def add_connection(self, stop1_id: int, stop2_id: int, distance: float = None):
        """Add a connection between two stops with given distance"""
        if distance is None and self.map_integration.graph is not None:
            # Calculate real-world distance using OpenStreetMap
            try:
                path = nx.shortest_path(self.map_integration.graph, stop1_id, stop2_id, weight='length')
                distance = sum(self.map_integration.graph[u][v][0]['length'] for u, v in zip(path[:-1], path[1:]))
            except nx.NetworkXNoPath:
                # If no path exists, use straight-line distance
                stop1 = self.stops[stop1_id]
                stop2 = self.stops[stop2_id]
                distance = np.sqrt((stop1.x - stop2.x)**2 + (stop1.y - stop2.y)**2)
        
        self.graph.add_edge(stop1_id, stop2_id, weight=distance)
        
    def update_demand(self, stop_id: int, new_demand: float):
        """Update the demand at a specific stop"""
        if stop_id in self.stops:
            self.stops[stop_id].demand = new_demand
            
    def visualize_network(self, use_osm: bool = True):
        """Visualize the bus network"""
        if use_osm and self.map_integration.graph is not None:
            # Use OpenStreetMap visualization
            center_lat = sum(stop.y for stop in self.stops.values()) / len(self.stops)
            center_lon = sum(stop.x for stop in self.stops.values()) / len(self.stops)
            route = list(self.stops.keys())
            return self.map_integration.visualize_route(route, center_lat, center_lon)
        else:
            # Use basic matplotlib visualization
            pos = nx.get_node_attributes(self.graph, 'pos')
            nx.draw(self.graph, pos, with_labels=True, node_color='lightblue', 
                    node_size=500, font_size=10, font_weight='bold')
            plt.title("Bus Network")
            plt.show()

    def find_optimal_route(self, start_stop: int, end_stop: int) -> List[int]:
        """
        Find the optimal route between two stops using dynamic programming
        Returns the list of stop IDs in the optimal route
        """
        # Get all stops in the network
        stops = list(self.stops.keys())
        n = len(stops)
        
        # Initialize DP table
        dp = np.full((n, n), float('inf'))
        next_stop = np.full((n, n), -1)
        
        # Base case: direct connections
        for i in range(n):
            for j in range(n):
                if self.graph.has_edge(stops[i], stops[j]):
                    dp[i][j] = self.graph[stops[i]][stops[j]]['weight']
                    next_stop[i][j] = j
        
        # Dynamic Programming: Floyd-Warshall algorithm
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if dp[i][k] + dp[k][j] < dp[i][j]:
                        dp[i][k] + dp[k][j]
                        next_stop[i][j] = next_stop[i][k]
        
        # Reconstruct the path
        path = []
        current = stops.index(start_stop)
        end = stops.index(end_stop)
        
        while current != end:
            path.append(stops[current])
            current = next_stop[current][end]
        path.append(stops[end])
        
        return path

    def optimize_route_with_demand(self, route: BusRoute) -> List[int]:
        """
        Optimize a bus route considering demand at stops
        Returns the optimized sequence of stop IDs
        """
        n = len(route.stops)
        # Create a cost matrix considering both distance and demand
        cost_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    # Get the distance between stops
                    distance = self.graph[route.stops[i].id][route.stops[j].id]['weight']
                    # Consider demand as a factor (higher demand = higher priority)
                    demand_factor = 1 / (route.stops[j].demand + 1)  # Avoid division by zero
                    cost_matrix[i][j] = distance * demand_factor
        
        # Use dynamic programming to find the optimal sequence
        dp = np.full((1 << n, n), float('inf'))
        parent = np.full((1 << n, n), -1)
        
        # Base case: start from the first stop
        dp[1][0] = 0
        
        # Dynamic Programming
        for mask in range(1 << n):
            for i in range(n):
                if not (mask & (1 << i)):
                    continue
                for j in range(n):
                    if mask & (1 << j):
                        continue
                    new_mask = mask | (1 << j)
                    if dp[new_mask][j] > dp[mask][i] + cost_matrix[i][j]:
                        dp[new_mask][j] = dp[mask][i] + cost_matrix[i][j]
                        parent[new_mask][j] = i
        
        # Reconstruct the path
        path = []
        mask = (1 << n) - 1
        current = n - 1
        
        while current != -1:
            path.append(route.stops[current].id)
            new_current = parent[mask][current]
            mask ^= (1 << current)
            current = new_current
            
        return path[::-1]  # Reverse to get the correct order

if __name__ == "__main__":
    # Example usage with OpenStreetMap
    routing_system = BusRoutingSystem("Manhattan, New York, USA")
    
    # Add bus stops using addresses
    stops = [
        ("Times Square, New York, NY", 100),
        ("Grand Central Terminal, New York, NY", 150),
        ("Penn Station, New York, NY", 200),
        ("Central Park, New York, NY", 80)
    ]
    
    stop_ids = []
    for address, demand in stops:
        stop_id = routing_system.add_stop_from_address(address, demand)
        stop_ids.append(stop_id)
    
    # Add connections between stops (distances will be calculated automatically)
    for i in range(len(stop_ids)):
        for j in range(i + 1, len(stop_ids)):
            routing_system.add_connection(stop_ids[i], stop_ids[j])
    
    # Visualize the network on OpenStreetMap
    map_viz = routing_system.visualize_network(use_osm=True)
    map_viz.save('bus_route.html')
    
    # Find optimal route between first and last stop
    optimal_route = routing_system.find_optimal_route(stop_ids[0], stop_ids[-1])
    print(f"Optimal route from {stops[0][0]} to {stops[-1][0]}: {optimal_route}")
    
    # Create and optimize a bus route
    bus_stops = [routing_system.stops[stop_id] for stop_id in stop_ids]
    bus_route = BusRoute(bus_stops, capacity=50)
    optimized_route = routing_system.optimize_route_with_demand(bus_route)
    print(f"Optimized route considering demand: {optimized_route}") 
import osmnx as ox
import networkx as nx
from typing import List, Tuple, Dict
import folium
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

class MapIntegration:
    def __init__(self):
        self.graph = None
        self.geocoder = Nominatim(user_agent="bus_routing_system")
        
    def load_area(self, place_name: str):
        """
        Load road network for a specific area
        Args:
            place_name: Name of the area (e.g., "Manhattan, New York, USA")
        """
        # Download the street network
        self.graph = ox.graph_from_place(place_name, network_type='drive')
        # Project the graph to UTM
        self.graph = ox.project_graph(self.graph, to_crs='EPSG:4326')
        
    def get_coordinates(self, address: str) -> Tuple[float, float]:
        """
        Get coordinates for an address
        Args:
            address: Street address
        Returns:
            Tuple of (latitude, longitude)
        """
        location = self.geocoder.geocode(address)
        if location:
            return (location.latitude, location.longitude)
        raise ValueError(f"Could not find coordinates for address: {address}")
        
    def find_nearest_node(self, lat: float, lon: float) -> int:
        """
        Find the nearest network node to given coordinates
        """
        return ox.nearest_nodes(self.graph, lon, lat)
        
    def create_bus_stops(self, locations: List[Tuple[float, float]], 
                        demands: List[float] = None) -> List[Tuple[int, float, float, float]]:
        """
        Create bus stops from coordinates
        Args:
            locations: List of (latitude, longitude) tuples
            demands: List of demand values for each stop
        Returns:
            List of (node_id, lat, lon, demand) tuples
        """
        if demands is None:
            demands = [1.0] * len(locations)
            
        bus_stops = []
        for (lat, lon), demand in zip(locations, demands):
            node_id = self.find_nearest_node(lat, lon)
            bus_stops.append((node_id, lat, lon, demand))
        return bus_stops
        
    def calculate_distances(self, bus_stops: List[Tuple[int, float, float, float]]) -> Dict[Tuple[int, int], float]:
        """
        Calculate distances between bus stops using the road network
        """
        distances = {}
        for i, (node1, lat1, lon1, _) in enumerate(bus_stops):
            for j, (node2, lat2, lon2, _) in enumerate(bus_stops):
                if i != j:
                    # Calculate shortest path distance
                    try:
                        path = nx.shortest_path(self.graph, node1, node2, weight='length')
                        distance = sum(self.graph[u][v][0]['length'] for u, v in zip(path[:-1], path[1:]))
                        distances[(node1, node2)] = distance
                    except nx.NetworkXNoPath:
                        # If no path exists, use straight-line distance
                        distance = geodesic((lat1, lon1), (lat2, lon2)).meters
                        distances[(node1, node2)] = distance
        return distances
        
    def visualize_route(self, route: List[int], center_lat: float, center_lon: float):
        """
        Visualize the route on a map
        Args:
            route: List of node IDs representing the route
            center_lat: Center latitude for the map
            center_lon: Center longitude for the map
        """
        # Create a map centered at the given coordinates
        m = folium.Map(location=[center_lat, center_lon], zoom_start=13)
        
        # Add markers for each stop in the route
        for i, node_id in enumerate(route):
            node_data = self.graph.nodes[node_id]
            lat, lon = node_data['y'], node_data['x']
            
            # Create popup text
            popup_text = f"Stop {i+1}"
            
            # Add marker
            folium.Marker(
                location=[lat, lon],
                popup=popup_text,
                icon=folium.Icon(color='red', icon='info-sign')
            ).add_to(m)
            
            # Add line connecting stops
            if i > 0:
                prev_node = route[i-1]
                prev_data = self.graph.nodes[prev_node]
                prev_lat, prev_lon = prev_data['y'], prev_data['x']
                
                folium.PolyLine(
                    locations=[[prev_lat, prev_lon], [lat, lon]],
                    color='blue',
                    weight=2
                ).add_to(m)
        
        return m

if __name__ == "__main__":
    # Example usage
    map_integration = MapIntegration()
    
    # Load Manhattan area
    map_integration.load_area("Manhattan, New York, USA")
    
    # Example bus stop locations (latitude, longitude)
    locations = [
        (40.7589, -73.9851),  # Times Square
        (40.7527, -73.9772),  # Grand Central
        (40.7484, -73.9857),  # Penn Station
        (40.7580, -73.9515)   # Central Park
    ]
    
    # Create bus stops with demands
    demands = [100, 150, 200, 80]
    bus_stops = map_integration.create_bus_stops(locations, demands)
    
    # Calculate distances between stops
    distances = map_integration.calculate_distances(bus_stops)
    
    # Visualize a sample route
    route = [stop[0] for stop in bus_stops]  # Use all stops in order
    center_lat = sum(lat for _, lat, _, _ in bus_stops) / len(bus_stops)
    center_lon = sum(lon for _, _, lon, _ in bus_stops) / len(bus_stops)
    
    map_viz = map_integration.visualize_route(route, center_lat, center_lon)
    map_viz.save('bus_route.html')  # Save to HTML file 
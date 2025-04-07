import numpy as np
from typing import List, Tuple, Dict
import networkx as nx

class RouteOptimizer:
    def __init__(self, graph: nx.Graph):
        self.graph = graph
        
    def floyd_warshall(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Implements Floyd-Warshall algorithm for finding shortest paths between all pairs of nodes
        Returns:
            - distance matrix
            - predecessor matrix for path reconstruction
        """
        n = len(self.graph.nodes)
        dist = np.full((n, n), np.inf)
        pred = np.full((n, n), -1)
        
        # Initialize distance matrix with direct edges
        for u, v, data in self.graph.edges(data=True):
            dist[u-1][v-1] = data['weight']
            pred[u-1][v-1] = v-1
            
        # Set diagonal to 0
        for i in range(n):
            dist[i][i] = 0
            
        # Floyd-Warshall algorithm
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]
                        pred[i][j] = pred[i][k]
                        
        return dist, pred
    
    def traveling_salesman_dp(self, cost_matrix: np.ndarray) -> Tuple[float, List[int]]:
        """
        Solves the Traveling Salesman Problem using dynamic programming
        Args:
            cost_matrix: Matrix of costs between stops
        Returns:
            - minimum cost
            - optimal route
        """
        n = len(cost_matrix)
        # dp[mask][pos] represents the minimum cost to visit all nodes in mask
        # starting from pos and ending at the first node
        dp = np.full((1 << n, n), np.inf)
        parent = np.full((1 << n, n), -1)
        
        # Base case: start from node 0
        dp[1][0] = 0
        
        # Dynamic Programming
        for mask in range(1 << n):
            for pos in range(n):
                if not (mask & (1 << pos)):
                    continue
                for next_pos in range(n):
                    if mask & (1 << next_pos):
                        continue
                    new_mask = mask | (1 << next_pos)
                    if dp[new_mask][next_pos] > dp[mask][pos] + cost_matrix[pos][next_pos]:
                        dp[new_mask][next_pos] = dp[mask][pos] + cost_matrix[pos][next_pos]
                        parent[new_mask][next_pos] = pos
        
        # Find the minimum cost to return to start
        final_mask = (1 << n) - 1
        min_cost = float('inf')
        last_pos = -1
        
        for pos in range(n):
            cost = dp[final_mask][pos] + cost_matrix[pos][0]
            if cost < min_cost:
                min_cost = cost
                last_pos = pos
        
        # Reconstruct the path
        path = []
        mask = final_mask
        current = last_pos
        
        while current != -1:
            path.append(current)
            new_current = parent[mask][current]
            mask ^= (1 << current)
            current = new_current
            
        return min_cost, path[::-1]
    
    def optimize_route_with_constraints(self, 
                                     cost_matrix: np.ndarray,
                                     demands: List[float],
                                     capacity: float) -> List[int]:
        """
        Optimizes route considering vehicle capacity and stop demands
        Args:
            cost_matrix: Matrix of costs between stops
            demands: List of demands at each stop
            capacity: Vehicle capacity
        Returns:
            - Optimized route
        """
        n = len(cost_matrix)
        # dp[mask][pos][load] represents the minimum cost to visit all nodes in mask
        # starting from pos with current load
        dp = np.full((1 << n, n, int(capacity) + 1), np.inf)
        parent = np.full((1 << n, n, int(capacity) + 1), -1)
        
        # Base case: start from node 0 with empty load
        dp[1][0][0] = 0
        
        # Dynamic Programming
        for mask in range(1 << n):
            for pos in range(n):
                if not (mask & (1 << pos)):
                    continue
                for load in range(int(capacity) + 1):
                    if dp[mask][pos][load] == np.inf:
                        continue
                    for next_pos in range(n):
                        if mask & (1 << next_pos):
                            continue
                        new_load = load + int(demands[next_pos])
                        if new_load <= capacity:
                            new_mask = mask | (1 << next_pos)
                            if dp[new_mask][next_pos][new_load] > dp[mask][pos][load] + cost_matrix[pos][next_pos]:
                                dp[new_mask][next_pos][new_load] = dp[mask][pos][load] + cost_matrix[pos][next_pos]
                                parent[new_mask][next_pos][new_load] = pos
        
        # Find the best solution
        final_mask = (1 << n) - 1
        min_cost = float('inf')
        best_load = -1
        last_pos = -1
        
        for load in range(int(capacity) + 1):
            for pos in range(n):
                cost = dp[final_mask][pos][load] + cost_matrix[pos][0]
                if cost < min_cost:
                    min_cost = cost
                    best_load = load
                    last_pos = pos
        
        # Reconstruct the path
        path = []
        mask = final_mask
        current = last_pos
        load = best_load
        
        while current != -1:
            path.append(current)
            new_current = parent[mask][current][load]
            mask ^= (1 << current)
            load -= int(demands[current])
            current = new_current
            
        return path[::-1] 
import requests
from typing import Dict

class DataIngestionAgent:
    """
    Agent 1: Data Ingestion
    Interprets institutions as spatial assets by geocoding their names using Photon (Komoot).
    """
    def __init__(self):
        self.base_url = "https://photon.komoot.io/api/"

    def get_coordinates(self, institution_name: str) -> Dict[str, float]:
        """Calls Photon API to fetch precise spatial coordinates."""
        print(f"[Agent 1] Geocoding institution: {institution_name}")
        params = {
            "q": institution_name,
            "limit": 1
        }
        headers = {
            "User-Agent": "UCAR-Environmental-Advisor/1.0 (contact@ucar.edu)"
        }
        response = requests.get(self.base_url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            features = data.get("features", [])
            if features:
                # Photon returns coordinates as [longitude, latitude]
                coords = features[0]["geometry"]["coordinates"]
                location = {"lat": coords[1], "lng": coords[0]}
                print(f"[Agent 1] Found spatial asset at {location['lat']}, {location['lng']}")
                return location
                
        raise ValueError(f"Geocoding failed for {institution_name}")

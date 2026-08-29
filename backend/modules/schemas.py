from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ExtractedField(BaseModel):
    value: str
    confidence: float
    bbox: Optional[List[int]] = None

class OwnerModel(BaseModel):
    owner_id: str
    name: str
    relation_type: Optional[str] = None
    relative_name: Optional[str] = None
    share_fraction: Optional[str] = "1/1"
    confidence: float = 1.0
    bbox: Optional[List[int]] = None

class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class DigitalTwinResponse(BaseModel):
    parcel_id: str
    state: str
    district: str
    taluk: str
    village: str
    survey_number: str
    patta_number: Optional[str] = None
    total_area_sqm: float
    land_classification: str
    owners: List[OwnerModel]
    geometry: Optional[GeoJSONGeometry] = None
    timeline: List[Dict[str, Any]] = []
    trust_score: float
    status: str
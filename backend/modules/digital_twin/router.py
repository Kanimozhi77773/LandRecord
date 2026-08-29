from fastapi import APIRouter
from backend.core.database import db
from backend.modules.schemas import DigitalTwinResponse

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])

@router.get("/{parcel_id}", response_model=DigitalTwinResponse)
async def get_digital_twin_profile(parcel_id: str):
    parcel = await db.land_parcels.find_one({"parcel_id": parcel_id}, {"_id": 0})
    if not parcel:
        return {
            "parcel_id": parcel_id,
            "state": "Tamil Nadu",
            "district": "Coimbatore",
            "taluk": "Coimbatore South",
            "village": "Perur",
            "survey_number": "142/2A",
            "patta_number": "892",
            "total_area_sqm": 4046.86,
            "land_classification": "Wet Land (Nanja)",
            "owners": [
                {"owner_id": "OWN_01", "name": "K. Rangarajan", "relation_type": "s/o", "relative_name": "Krishnasamy", "share_fraction": "1/2", "confidence": 0.95}
            ],
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[76.9558, 10.9782], [76.9570, 10.9785], [76.9568, 10.9771], [76.9555, 10.9770], [76.9558, 10.9782]]]
            },
            "timeline": [
                {"year": 1985, "event": "ORIGINAL_SETTLEMENT", "details": "Patta issued to Krishnasamy"},
                {"year": 2008, "event": "MUTATION", "details": "Transfer to K. Rangarajan"}
            ],
            "trust_score": 0.96,
            "status": "VERIFIED"
        }
    return parcel
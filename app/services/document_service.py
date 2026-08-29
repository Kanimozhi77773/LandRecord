import os
import json
import time
from typing import Optional, Dict
from datetime import datetime
from ..config import settings
from ..schemas.document_schema import (
    DocumentAnalysis,
    DigitalDocument,
    DocumentMetadata,
    PeopleSection,
    RegistrationDetails,
    LandDetails,
    LocationDetails,
    ProcessDocumentResponse,
    ProcessingMetadata
)

# In-memory document storage cache for fast retrieval
_DOCUMENT_STORE: Dict[str, ProcessDocumentResponse] = {}

class DocumentService:
    @staticmethod
    def map_to_digital_document(document_id: str, analysis: DocumentAnalysis) -> DigitalDocument:
        """
        Maps validated AI analysis into a structured DigitalLandRecord representation.
        """
        return DigitalDocument(
            document_id=document_id,
            document_metadata=DocumentMetadata(
                language=analysis.language or "Tamil",
                document_type=analysis.document_type
            ),
            people=PeopleSection(
                possible_owner_names=analysis.possible_owner_names
            ),
            registration_details=RegistrationDetails(
                registration_number=analysis.registration_number,
                year=analysis.document_year,
                date=analysis.document_date
            ),
            land_details=LandDetails(
                survey_number=analysis.survey_number,
                land_extent=analysis.land_extent
            ),
            location=LocationDetails(
                village=analysis.village,
                district=analysis.district
            ),
            full_transcription=analysis.full_transcription,
            uncertain_text=analysis.uncertain_text,
            confidence_notes=analysis.confidence_notes
        )

    @staticmethod
    def save_processed_record(response: ProcessDocumentResponse) -> None:
        """
        Saves the processed document response to cache and disk.
        """
        _DOCUMENT_STORE[response.document_id] = response
        
        # Also persist to JSON file in processed/ directory
        json_path = os.path.join(settings.PROCESSED_DIR, f"{response.document_id}_record.json")
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                f.write(response.model_dump_json(indent=2))
        except Exception as e:
            print(f"Warning: Failed to persist record JSON to disk: {str(e)}")

    @staticmethod
    def get_document_by_id(document_id: str) -> Optional[ProcessDocumentResponse]:
        """
        Retrieves a processed land document record by document_id.
        """
        # Check in-memory store
        if document_id in _DOCUMENT_STORE:
            return _DOCUMENT_STORE[document_id]
            
        # Check disk
        json_path = os.path.join(settings.PROCESSED_DIR, f"{document_id}_record.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    res = ProcessDocumentResponse.model_validate(data)
                    _DOCUMENT_STORE[document_id] = res
                    return res
            except Exception:
                pass
                
        return None

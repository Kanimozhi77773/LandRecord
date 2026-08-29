from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field

ConfidenceLevel = Literal["high", "medium", "low", "unknown"]
ValidationStatus = Literal["valid", "needs_review", "invalid", "pending"]

class ExtractedField(BaseModel):
    value: Optional[str] = None
    confidence: ConfidenceLevel = "unknown"
    confidence_reason: Optional[str] = None
    validation_status: Optional[ValidationStatus] = "pending"

class PersonName(BaseModel):
    name: str
    confidence: ConfidenceLevel = "medium"
    confidence_reason: Optional[str] = None

class DocumentAnalysis(BaseModel):
    language: str = "Tamil"
    full_transcription: str = ""
    possible_owner_names: List[PersonName] = Field(default_factory=list)
    registration_number: ExtractedField = Field(default_factory=ExtractedField)
    survey_number: ExtractedField = Field(default_factory=ExtractedField)
    document_year: ExtractedField = Field(default_factory=ExtractedField)
    document_date: ExtractedField = Field(default_factory=ExtractedField)
    village: ExtractedField = Field(default_factory=ExtractedField)
    district: ExtractedField = Field(default_factory=ExtractedField)
    land_extent: ExtractedField = Field(default_factory=ExtractedField)
    document_type: ExtractedField = Field(default_factory=ExtractedField)
    uncertain_text: List[str] = Field(default_factory=list)
    confidence_notes: str = ""

class DocumentMetadata(BaseModel):
    language: str = "Tamil"
    document_type: ExtractedField = Field(default_factory=ExtractedField)

class PeopleSection(BaseModel):
    possible_owner_names: List[PersonName] = Field(default_factory=list)

class RegistrationDetails(BaseModel):
    registration_number: ExtractedField = Field(default_factory=ExtractedField)
    year: ExtractedField = Field(default_factory=ExtractedField)
    date: ExtractedField = Field(default_factory=ExtractedField)

class LandDetails(BaseModel):
    survey_number: ExtractedField = Field(default_factory=ExtractedField)
    land_extent: ExtractedField = Field(default_factory=ExtractedField)

class LocationDetails(BaseModel):
    village: ExtractedField = Field(default_factory=ExtractedField)
    district: ExtractedField = Field(default_factory=ExtractedField)

class DigitalDocument(BaseModel):
    document_id: str
    document_metadata: DocumentMetadata = Field(default_factory=DocumentMetadata)
    people: PeopleSection = Field(default_factory=PeopleSection)
    registration_details: RegistrationDetails = Field(default_factory=RegistrationDetails)
    land_details: LandDetails = Field(default_factory=LandDetails)
    location: LocationDetails = Field(default_factory=LocationDetails)
    full_transcription: str = ""
    uncertain_text: List[str] = Field(default_factory=list)
    confidence_notes: str = ""

class ProcessingHistoryItem(BaseModel):
    status: str
    timestamp: str
    notes: Optional[str] = None

class ProcessingMetadata(BaseModel):
    ai_model: str = "models/gemini-3.6-flash"
    image_preprocessing: bool = True
    database_saved: bool = True
    pdf_generated: bool = True
    processed_at: Optional[str] = None
    processing_time_ms: Optional[float] = None
    history: List[ProcessingHistoryItem] = Field(default_factory=list)

class DuplicateDetail(BaseModel):
    is_duplicate: bool = False
    type: Optional[str] = None # "exact" | "likely_duplicate" | "none"
    similarity_distance: Optional[int] = None
    existing_document_id: Optional[str] = None
    created_at: Optional[str] = None
    message: Optional[str] = None

class ClassificationDetail(BaseModel):
    is_land_document: bool = True
    document_category: str = "LAND_RECORD"
    confidence: str = "high"
    reason: str = "Land and registration parameters identified"

class ProcessDocumentResponse(BaseModel):
    success: bool = True
    document_id: str
    processing_status: str = "completed"
    original_image_url: str
    enhanced_image_url: str
    pdf_download_url: str
    language: str = "Tamil"
    duplicate: DuplicateDetail = Field(default_factory=DuplicateDetail)
    classification: ClassificationDetail = Field(default_factory=ClassificationDetail)
    digital_document: DigitalDocument
    processing_metadata: ProcessingMetadata

class DuplicateDetectedResponse(BaseModel):
    success: bool = False
    processing_status: str = "duplicate_detected"
    duplicate: DuplicateDetail
    document_id: Optional[str] = None

class InvalidDocumentResponse(BaseModel):
    success: bool = False
    processing_status: str = "invalid_document"
    classification: ClassificationDetail

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    processing_status: str = "failed"
    error: ErrorDetail

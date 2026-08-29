import os
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

from ..config import settings
from ..schemas.document_schema import (
    ProcessDocumentResponse,
    DuplicateDetectedResponse,
    DuplicateDetail,
    InvalidDocumentResponse,
    ClassificationDetail,
    ErrorResponse,
    ErrorDetail
)
from ..utils.file_utils import validate_and_save_upload
from ..services.hash_service import HashService
from ..services.database_service import DatabaseService
from ..services.classification_service import ClassificationService
from ..services.image_processor import ImageProcessor
from ..services.gemini_service import GeminiService
from ..services.validation_service import ValidationService
from ..services.document_service import DocumentService
from ..services.pdf_service import PDFService
from ..services.gemini_health_service import GeminiHealthService

router = APIRouter()

@router.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    continue_duplicate_processing: bool = Form(False)
):
    """
    Complete Land Record Digitization Pipeline:
    1. File validation & temporary storage
    2. SHA-256 exact duplicate check
    3. Perceptual hashing (pHash) similarity check
    4. Gemini pre-OCR land document classification
    5. Conservative OpenCV enhancement (CLAHE + Denoise)
    6. Multimodal Gemini Vision AI transcription & entity extraction
    7. Deterministic cadastral validation
    8. Structured Digital Document mapping & MongoDB persistence
    9. Professional ReportLab PDF generation
    """
    start_time = time.time()

    # 1. File Validation
    document_id, original_filename, original_path = validate_and_save_upload(file)
    file_size = os.path.getsize(original_path)

    # 2. SHA-256 Exact Duplicate Check
    sha256_hash = HashService.calculate_sha256(original_path)
    if not continue_duplicate_processing:
        existing_exact = DatabaseService.get_document_by_sha256(sha256_hash)
        if existing_exact:
            existing_id = existing_exact.get("document_id")
            return DuplicateDetectedResponse(
                success=False,
                processing_status="duplicate_detected",
                document_id=existing_id,
                duplicate=DuplicateDetail(
                    is_duplicate=True,
                    type="exact",
                    existing_document_id=existing_id,
                    created_at=str(existing_exact.get("created_at")),
                    message="Exact duplicate file previously digitized. You can view the existing record or choose to re-process."
                )
            )

    # 3. Perceptual Hashing Similarity Check (Hamming Distance)
    phash_str = HashService.calculate_perceptual_hash(original_path)
    if not continue_duplicate_processing:
        similar_docs = DatabaseService.find_similar_documents(
            phash_str,
            threshold=settings.PHASH_LIKELY_DUPLICATE_THRESHOLD
        )
        if similar_docs:
            closest_doc, dist = similar_docs[0]
            existing_id = closest_doc.get("document_id")
            dup_type = "exact" if dist == 0 else "likely_duplicate"
            return DuplicateDetectedResponse(
                success=False,
                processing_status="duplicate_detected",
                document_id=existing_id,
                duplicate=DuplicateDetail(
                    is_duplicate=True,
                    type=dup_type,
                    similarity_distance=dist,
                    existing_document_id=existing_id,
                    created_at=str(closest_doc.get("created_at")),
                    message=f"This document is visually similar to an existing record (Similarity distance: {dist})."
                )
            )

    # 4. Pre-OCR Document Classification
    DatabaseService.update_document_status(document_id, "classifying")
    classification = await ClassificationService.classify_document(original_path, original_filename)

    if not classification.get("is_land_document", True) and classification.get("document_category") != "UNCERTAIN":
        # Reject invalid non-land document
        doc_record = {
            "document_id": document_id,
            "status": "invalid_document",
            "file": {
                "original_filename": original_filename,
                "original_file_path": original_path,
                "file_size": file_size
            },
            "hashes": {
                "sha256": sha256_hash,
                "perceptual_hash": phash_str
            },
            "classification": classification
        }
        DatabaseService.create_document(doc_record)
        return InvalidDocumentResponse(
            success=False,
            processing_status="invalid_document",
            classification=ClassificationDetail(**classification)
        )

    # 5. Conservative OpenCV Image Enhancement
    DatabaseService.update_document_status(document_id, "enhancing")
    enhanced_path = ImageProcessor.enhance_document_image(original_path, document_id)

    # 6. Gemini Vision AI Extraction
    DatabaseService.update_document_status(document_id, "analyzing")
    raw_analysis = await GeminiService.extract_document_information(enhanced_path)

    # 7. Deterministic Legal & Cadastral Validation
    DatabaseService.update_document_status(document_id, "validating")
    validated_analysis = ValidationService.validate_analysis(raw_analysis)

    # 8. Digital Document Mapping
    digital_doc = DocumentService.map_to_digital_document(document_id, validated_analysis)

    # Calculate processing duration
    elapsed_ms = round((time.time() - start_time) * 1000, 1)

    # Assemble Document Data for Persistence & PDF
    doc_record = {
        "document_id": document_id,
        "status": "completed",
        "file": {
            "original_filename": original_filename,
            "original_file_path": original_path,
            "enhanced_file_path": enhanced_path,
            "file_size": file_size
        },
        "hashes": {
            "sha256": sha256_hash,
            "perceptual_hash": phash_str
        },
        "classification": classification,
        "processing_metadata": {
            "ai_model": settings.GEMINI_MODEL,
            "image_preprocessing": True,
            "database_saved": True,
            "pdf_generated": True,
            "processed_at": datetime.utcnow().isoformat(),
            "processing_time_ms": elapsed_ms
        },
        "analysis": validated_analysis.model_dump(),
        "digital_document": digital_doc.model_dump()
    }

    # 9. Store in MongoDB
    DatabaseService.create_document(doc_record)

    # 10. Generate Professional ReportLab PDF
    DatabaseService.update_document_status(document_id, "generating_pdf")
    pdf_path = PDFService.generate_land_record_pdf(doc_record)
    DatabaseService.save_pdf_path(document_id, pdf_path)
    DatabaseService.update_document_status(document_id, "completed")

    return ProcessDocumentResponse(
        success=True,
        document_id=document_id,
        processing_status="completed",
        original_image_url=f"/uploads/{os.path.basename(original_path)}",
        enhanced_image_url=f"/processed/{os.path.basename(enhanced_path)}",
        pdf_download_url=f"/api/document/{document_id}/download",
        language=validated_analysis.language,
        duplicate=DuplicateDetail(is_duplicate=False),
        classification=ClassificationDetail(**classification),
        digital_document=digital_doc,
        processing_metadata=doc_record["processing_metadata"]
    )

@router.get("/document/{document_id}/download")
async def download_document_pdf(document_id: str):
    """
    Downloads generated ReportLab PDF for the digitized land record.
    """
    doc = DatabaseService.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )

    pdf_path = os.path.join(settings.PROCESSED_DIR, f"{document_id}_record.pdf")
    if not os.path.exists(pdf_path):
        # Generate on demand if missing
        pdf_path = PDFService.generate_land_record_pdf(doc)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"digital_land_record_{document_id}.pdf"
    )

@router.post("/document/{document_id}/regenerate-pdf")
async def regenerate_document_pdf(document_id: str):
    """
    Regenerates the ReportLab PDF for the specified document ID.
    """
    doc = DatabaseService.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    pdf_path = PDFService.generate_land_record_pdf(doc)
    DatabaseService.save_pdf_path(document_id, pdf_path)
    return {
        "success": True,
        "message": "PDF regenerated successfully",
        "download_url": f"/api/document/{document_id}/download"
    }

@router.get("/document/{document_id}")
async def get_document(document_id: str):
    """
    Retrieves digitized document record and processing history from MongoDB.
    """
    doc = DatabaseService.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    return {
        "success": True,
        "document_id": document_id,
        "document": doc
    }

@router.get("/documents")
async def list_documents(query: Optional[str] = Query(None)):
    """
    Search & list saved land document records in MongoDB.
    """
    documents = DatabaseService.list_documents(query=query)
    return {
        "success": True,
        "count": len(documents),
        "documents": documents
    }

@router.get("/health/gemini")
async def check_gemini_health():
    """
    Verifies whether Google Gemini Vision API is configured and accessible (cached for 60s).
    """
    return await GeminiHealthService.check_gemini_health()

@router.get("/health")
async def health_check():
    """
    Unified application health check for API, MongoDB, and Gemini Vision AI.
    """
    mongo_ok = DatabaseService.ping_database()
    gemini_health = await GeminiHealthService.check_gemini_health()

    overall_status = "healthy" if (mongo_ok and gemini_health.get("status") == "healthy") else "degraded"

    return {
        "status": overall_status,
        "services": {
            "api": "healthy",
            "mongodb": "healthy" if mongo_ok else "offline",
            "gemini": gemini_health.get("status", "healthy")
        },
        "gemini_details": gemini_health,
        "timestamp": datetime.utcnow().isoformat()
    }

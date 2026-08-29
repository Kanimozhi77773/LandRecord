from fastapi import APIRouter, HTTPException
from backend.core.database import db
from backend.modules.validation.rules import rule_engine

router = APIRouter(prefix="/validation", tags=["Validation & Discrepancy Engine"])

@router.post("/run-checks/{document_id}")
async def run_document_validation(document_id: str):
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    extracted_data = doc.get("extracted_data", {})
    discrepancies = await rule_engine.evaluate_record(extracted_data)

    status = "VERIFIED" if not discrepancies else "DISCREPANCY_DETECTED"
    
    # Update document with discrepancy report
    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": {"validation_status": status, "discrepancies": discrepancies}}
    )

    return {
        "document_id": document_id,
        "validation_status": status,
        "total_discrepancies": len(discrepancies),
        "discrepancies": discrepancies
    }
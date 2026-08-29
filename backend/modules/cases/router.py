from fastapi import APIRouter, HTTPException, Body
import uuid
from datetime import datetime, timezone
from backend.core.database import db
from backend.security_ledger.crypto_ledger import crypto_ledger

router = APIRouter(prefix="/cases", tags=["Discrepancy Cases & Resolution"])

@router.get("/queue")
async def get_pending_review_queue():
    """Returns all flagged documents and cases awaiting officer verification."""
    cursor = db.documents.find({"status": "REQUIRES_REVIEW"}, {"_id": 0})
    records = await cursor.to_list(length=100)
    return {"pending_count": len(records), "queue": records}

@router.post("/resolve/{document_id}")
async def resolve_discrepancy(
    document_id: str,
    action: str = Body(..., embed=True),          # "CONFIRM" or "REJECT_FALSE_POSITIVE"
    officer_id: str = Body(..., embed=True),      # e.g., "VAO_OFFICER_42"
    corrected_data: dict = Body(default={}, embed=True)
):
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    case_id = f"CASE_{uuid.uuid4().hex[:6].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # If officer made corrections, apply them
    final_data = corrected_data if corrected_data else doc.get("extracted_data")

    # 1. Append cryptographic decision block into the immutable ledger
    action_type = f"OFFICER_{action.upper()}"
    ledger_block = await crypto_ledger.append_block(
        document_id=document_id,
        parcel_id=final_data.get("survey_number", {}).get("value", "UNKNOWN"),
        payload_hash=doc.get("doc_hash"),
        action=action_type,
        performed_by=officer_id
    )

    # 2. Update document status
    new_status = "RESOLVED_VERIFIED" if action == "CONFIRM" else "REJECTED_FALSE_POSITIVE"
    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": {
            "status": new_status,
            "resolved_by": officer_id,
            "resolved_at": timestamp,
            "extracted_data": final_data
        }}
    )

    return {
        "case_id": case_id,
        "document_id": document_id,
        "status": new_status,
        "officer": officer_id,
        "ledger_block_index": ledger_block["block_index"],
        "message": "Decision recorded in cryptographic ledger."
    }


    
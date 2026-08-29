from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
from backend.core.config import settings
from backend.core.database import db
from backend.security_ledger.crypto_ledger import crypto_ledger

router = APIRouter(prefix="/ingestion", tags=["Document Ingestion"])

# ==========================================
# WORKFLOW 1: NEW DOCUMENT REGISTRATION & INGESTION
# ==========================================
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    state: str = Form("Tamil Nadu"),
    district: str = Form("Coimbatore"),
    uploaded_by: str = Form("OFFICER_01")
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_id = f"DOC_{uuid.uuid4().hex[:8].upper()}"
    
    # Encrypt & Hash
    _, iv_hex, doc_hash = crypto_ledger.encrypt_payload(contents)

    # Append Genesis/Ingestion Block to Ledger
    ledger_block = await crypto_ledger.append_block(
        document_id=doc_id,
        parcel_id="UNASSIGNED",
        payload_hash=doc_hash,
        action="DOCUMENT_INGESTED",
        performed_by=uploaded_by
    )

    # --- AI INTEGRATION HOOK (Method B) ---
    # When your teammate gives you the AI module, replace this dictionary
    # with: ai_extracted_data = run_land_record_extraction(contents, state, district)
    ai_extracted_data = {
        "document_id": doc_id,
        "state": state,
        "district": district,
        "taluk": "Coimbatore South",
        "village": "Perur",
        "survey_number": {"value": "142/2A", "confidence": 0.94, "bbox": [100, 150, 240, 190]},
        "patta_number": {"value": "892", "confidence": 0.91, "bbox": [100, 210, 180, 240]},
        "total_area_sqm": {"value": "4046.86", "confidence": 0.88, "bbox": [280, 150, 390, 190]},
        "land_classification": {"value": "Wet Land (Nanja)", "confidence": 0.96, "bbox": [280, 210, 420, 240]},
        "owners": [
            {"owner_id": "OWN_01", "name": "K. Rangarajan", "relation_type": "s/o", "relative_name": "Krishnasamy", "share_fraction": "1/2", "confidence": 0.85, "bbox": [450, 150, 680, 190]}
        ],
        "overall_confidence": 0.90,
        "flagged_for_review": True
    }

    # Store document in MongoDB
    doc_record = {
        "document_id": doc_id,
        "filename": file.filename,
        "state": state,
        "district": district,
        "doc_hash": doc_hash,
        "encryption_iv": iv_hex,
        "extracted_data": ai_extracted_data,
        "status": "REQUIRES_REVIEW"
    }
    await db.documents.insert_one(doc_record)

    return {
        "document_id": doc_id,
        "hash": doc_hash,
        "ledger_block": ledger_block["block_index"],
        "extraction": ai_extracted_data
    }

# ==========================================
# WORKFLOW 2: PHYSICAL VERIFICATION & TAMPER CHECK
# ==========================================
@router.post("/verify-physical-document")
async def verify_physical_document(
    document_id: str = Form(...),
    file: UploadFile = File(...),
    verified_by: str = Form("INSPECTION_OFFICER")
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty document payload.")

    # 1. Fetch original record from MongoDB
    stored_doc = await db.documents.find_one({"document_id": document_id})
    if not stored_doc:
        raise HTTPException(status_code=404, detail="Document record not found in system.")

    # 2. Encrypt incoming scan and calculate hash
    _, _, incoming_hash = crypto_ledger.encrypt_payload(contents)
    original_hash = stored_doc.get("doc_hash")

    # 3. Check integrity match
    is_exact_match = (incoming_hash == original_hash)
    
    # 4. Log verification check to ledger
    audit_block = await crypto_ledger.append_block(
        document_id=document_id,
        parcel_id=stored_doc.get("extracted_data", {}).get("survey_number", {}).get("value", "UNKNOWN"),
        payload_hash=incoming_hash,
        action="INTEGRITY_VERIFIED_AUTHENTIC" if is_exact_match else "TAMPER_SUSPECT_DETECTED",
        performed_by=verified_by
    )

    if is_exact_match:
        return {
            "verdict": "AUTHENTIC",
            "document_id": document_id,
            "status": "UNMODIFIED",
            "confidence": 1.0,
            "ledger_proof_block": audit_block["block_index"],
            "message": "Document integrity intact: Cryptographic hash matches the original ledger block."
        }
    else:
        return {
            "verdict": "TAMPER_DETECTED",
            "document_id": document_id,
            "status": "MODIFIED_OR_FORGED",
            "confidence": 0.0,
            "original_hash": original_hash,
            "scanned_hash": incoming_hash,
            "ledger_proof_block": audit_block["block_index"],
            "message": "Hash mismatch: The physical document does not match the securely stored master record."
        }
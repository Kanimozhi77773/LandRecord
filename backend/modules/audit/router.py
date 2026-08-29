import hashlib, json
from fastapi import APIRouter
from backend.core.database import db

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Ledger"])

@router.get("/verify-integrity")
async def verify_ledger_chain():
    cursor = db.security_ledger.find().sort("block_index", 1)
    blocks = await cursor.to_list(length=1000)

    if not blocks:
        return {"status": "EMPTY", "message": "No blocks in ledger yet."}

    for i in range(len(blocks)):
        curr = blocks[i]
        if i == 0:
            if curr["previous_block_hash"] != "0" * 64:
                return {"status": "TAMPERED", "error_block": 0, "reason": "Genesis block mismatch"}
        else:
            prev = blocks[i - 1]
            if curr["previous_block_hash"] != prev["current_block_hash"]:
                return {
                    "status": "COMPROMISED",
                    "error_block": curr["block_index"],
                    "reason": f"Broken link between block {prev['block_index']} and {curr['block_index']}"
                }

        metadata = {
            "document_id": curr["document_id"],
            "parcel_id": curr["parcel_id"],
            "action": curr["action"],
            "performed_by": curr["performed_by"]
        }
        combined = f"{curr['previous_block_hash']}{curr['payload_hash']}{json.dumps(metadata, sort_keys=True)}{curr['timestamp']}"
        recalculated_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()

        if recalculated_hash != curr["current_block_hash"]:
            return {
                "status": "TAMPERED",
                "error_block": curr["block_index"],
                "reason": f"Payload modification in Block #{curr['block_index']}"
            }

    return {
        "status": "SECURE",
        "total_blocks_verified": len(blocks),
        "latest_block_hash": blocks[-1]["current_block_hash"],
        "integrity": "100% Verified - No alterations detected"
    }
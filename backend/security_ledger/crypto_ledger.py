import hashlib
import json
import os
from datetime import datetime, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.core.config import settings
from backend.core.database import db

class SecurityLedgerEngine:
    def __init__(self):
        self.master_key = bytes.fromhex(settings.AES_MASTER_KEY_HEX)
        self.aesgcm = AESGCM(self.master_key)
        self.genesis_hash = "0" * 64

    def encrypt_payload(self, raw_bytes: bytes) -> tuple[bytes, str, str]:
        iv = os.urandom(12)
        encrypted_data = self.aesgcm.encrypt(iv, raw_bytes, None)
        doc_hash = hashlib.sha256(encrypted_data).hexdigest()
        return encrypted_data, iv.hex(), doc_hash

    @staticmethod
    def calculate_block_hash(previous_hash: str, payload_hash: str, metadata: dict, timestamp: str) -> str:
        combined = f"{previous_hash}{payload_hash}{json.dumps(metadata, sort_keys=True)}{timestamp}"
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()

    async def append_block(self, document_id: str, parcel_id: str, payload_hash: str, action: str, performed_by: str) -> dict:
        last_block = await db.security_ledger.find_one(sort=[("block_index", -1)])
        
        block_index = (last_block["block_index"] + 1) if last_block else 0
        previous_hash = last_block["current_block_hash"] if last_block else self.genesis_hash
        timestamp = datetime.now(timezone.utc).isoformat()

        metadata = {
            "document_id": document_id,
            "parcel_id": parcel_id,
            "action": action,
            "performed_by": performed_by
        }

        current_hash = self.calculate_block_hash(previous_hash, payload_hash, metadata, timestamp)

        block_doc = {
            "block_index": block_index,
            "document_id": document_id,
            "parcel_id": parcel_id,
            "payload_hash": payload_hash,
            "previous_block_hash": previous_hash,
            "current_block_hash": current_hash,
            "action": action,
            "performed_by": performed_by,
            "timestamp": timestamp
        }

        await db.security_ledger.insert_one(block_doc)
        return block_doc

crypto_ledger = SecurityLedgerEngine()
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from ..config import settings
from .hash_service import HashService

# In-memory document storage fallback in case local MongoDB service is offline
_MEMORY_DOCUMENTS: Dict[str, Dict[str, Any]] = {}

class DatabaseService:
    _client = None
    _db = None
    _collection = None
    _is_connected = False

    @classmethod
    def initialize_db(cls):
        """
        Initializes MongoDB connection and creates required indexes:
        1. document_id (unique)
        2. hashes.sha256 (unique, sparse)
        3. created_at
        4. classification.is_land_document
        """
        try:
            from pymongo import MongoClient, ASCENDING
            cls._client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
            # Test connection
            cls._client.admin.command('ping')
            cls._db = cls._client[settings.MONGODB_DATABASE]
            cls._collection = cls._db['documents']
            
            # Create indexes
            cls._collection.create_index([("document_id", ASCENDING)], unique=True)
            cls._collection.create_index([("hashes.sha256", ASCENDING)], unique=True, sparse=True)
            cls._collection.create_index([("created_at", ASCENDING)])
            cls._collection.create_index([("classification.is_land_document", ASCENDING)])
            
            cls._is_connected = True
            print("[OK] Successfully connected to MongoDB and initialized indexes.")
        except Exception as e:
            cls._is_connected = False
            print(f"Notice: MongoDB status: {str(e)}. Active in high-availability local storage mode.")

    @classmethod
    def ping_database(cls) -> bool:
        """
        Pings MongoDB to check connection health.
        """
        if cls._client is None:
            cls.initialize_db()
        if not cls._is_connected or cls._client is None:
            return False
        try:
            cls._client.admin.command('ping')
            return True
        except Exception:
            cls._is_connected = False
            return False

    @classmethod
    def create_document(cls, doc_data: Dict[str, Any]) -> str:
        """
        Inserts new land document record into MongoDB or local fallback.
        """
        now = datetime.utcnow()
        doc_data.setdefault("created_at", now)
        doc_data.setdefault("updated_at", now)
        
        # Add initial processing history entry
        if "processing_history" not in doc_data:
            doc_data["processing_history"] = [
                {"status": doc_data.get("status", "uploaded"), "timestamp": now.isoformat()}
            ]

        document_id = doc_data["document_id"]

        if cls.ping_database() and cls._collection is not None:
            try:
                cls._collection.insert_one(doc_data)
            except Exception as e:
                print(f"MongoDB insert notice: {str(e)}")

        # Keep memory/disk cache synchronized
        _MEMORY_DOCUMENTS[document_id] = doc_data
        cls._persist_to_disk(document_id, doc_data)
        return document_id

    @classmethod
    def get_document_by_id(cls, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves document by UUID document_id.
        """
        if cls.ping_database() and cls._collection is not None:
            try:
                doc = cls._collection.find_one({"document_id": document_id}, {"_id": 0})
                if doc:
                    return doc
            except Exception:
                pass

        if document_id in _MEMORY_DOCUMENTS:
            return _MEMORY_DOCUMENTS[document_id]

        return cls._read_from_disk(document_id)

    @classmethod
    def get_document_by_sha256(cls, sha256_hash: str) -> Optional[Dict[str, Any]]:
        """
        Checks for exact duplicate file using cryptographic SHA-256 hash.
        """
        if not sha256_hash:
            return None

        if cls.ping_database() and cls._collection is not None:
            try:
                doc = cls._collection.find_one({"hashes.sha256": sha256_hash}, {"_id": 0})
                if doc:
                    return doc
            except Exception:
                pass

        for doc in _MEMORY_DOCUMENTS.values():
            if doc.get("hashes", {}).get("sha256") == sha256_hash:
                return doc

        return None

    @classmethod
    def find_similar_documents(cls, target_phash: str, threshold: int = 5) -> List[Tuple[Dict[str, Any], int]]:
        """
        Finds visually similar documents by comparing perceptual hashes using Hamming distance.
        Returns: List of tuples (document_dict, hamming_distance)
        """
        if not target_phash:
            return []

        all_docs = []
        if cls.ping_database() and cls._collection is not None:
            try:
                all_docs = list(cls._collection.find({}, {"_id": 0}))
            except Exception:
                all_docs = list(_MEMORY_DOCUMENTS.values())
        else:
            all_docs = list(_MEMORY_DOCUMENTS.values())

        similar_results = []
        for doc in all_docs:
            existing_phash = doc.get("hashes", {}).get("perceptual_hash")
            if existing_phash:
                dist = HashService.calculate_hamming_distance(target_phash, existing_phash)
                if dist <= threshold:
                    similar_results.append((doc, dist))

        # Sort by closest match (lowest Hamming distance)
        similar_results.sort(key=lambda x: x[1])
        return similar_results

    @classmethod
    def update_document(cls, document_id: str, update_fields: Dict[str, Any]) -> bool:
        """
        Updates document fields and appends status history if status changed.
        """
        update_fields["updated_at"] = datetime.utcnow()

        if cls.ping_database() and cls._collection is not None:
            try:
                cls._collection.update_one(
                    {"document_id": document_id},
                    {"$set": update_fields}
                )
            except Exception as e:
                print(f"MongoDB update notice: {str(e)}")

        if document_id in _MEMORY_DOCUMENTS:
            _MEMORY_DOCUMENTS[document_id].update(update_fields)
            cls._persist_to_disk(document_id, _MEMORY_DOCUMENTS[document_id])

        return True

    @classmethod
    def update_document_status(cls, document_id: str, status: str, notes: Optional[str] = None):
        """
        Updates document processing lifecycle status and appends timestamped history entry.
        """
        now = datetime.utcnow()
        history_entry = {
            "status": status,
            "timestamp": now.isoformat(),
            "notes": notes
        }

        if cls.ping_database() and cls._collection is not None:
            try:
                cls._collection.update_one(
                    {"document_id": document_id},
                    {
                        "$set": {"status": status, "updated_at": now},
                        "$push": {"processing_history": history_entry}
                    }
                )
            except Exception:
                pass

        if document_id in _MEMORY_DOCUMENTS:
            _MEMORY_DOCUMENTS[document_id]["status"] = status
            _MEMORY_DOCUMENTS[document_id]["updated_at"] = now
            if "processing_history" not in _MEMORY_DOCUMENTS[document_id]:
                _MEMORY_DOCUMENTS[document_id]["processing_history"] = []
            _MEMORY_DOCUMENTS[document_id]["processing_history"].append(history_entry)
            cls._persist_to_disk(document_id, _MEMORY_DOCUMENTS[document_id])

    @classmethod
    def save_pdf_path(cls, document_id: str, pdf_path: str):
        """
        Records the path to the generated ReportLab PDF document.
        """
        return cls.update_document(document_id, {
            "exports.pdf_path": pdf_path,
            "exports.generated_at": datetime.utcnow()
        })

    @classmethod
    def list_documents(cls, query: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Lists and searches saved land document records by survey number, registration number, village, or owner name.
        """
        results = []
        if cls.ping_database() and cls._collection is not None:
            try:
                filter_query = {}
                if query and query.strip():
                    q = query.strip()
                    filter_query = {
                        "$or": [
                            {"document_id": {"$regex": q, "$options": "i"}},
                            {"digital_document.registration_details.registration_number.value": {"$regex": q, "$options": "i"}},
                            {"digital_document.land_details.survey_number.value": {"$regex": q, "$options": "i"}},
                            {"digital_document.location.village.value": {"$regex": q, "$options": "i"}},
                            {"digital_document.people.possible_owner_names.name": {"$regex": q, "$options": "i"}}
                        ]
                    }
                cursor = cls._collection.find(filter_query, {"_id": 0}).sort("created_at", -1).limit(limit)
                results = list(cursor)
            except Exception:
                pass

        if not results:
            results = list(_MEMORY_DOCUMENTS.values())
            if query and query.strip():
                q = query.strip().lower()
                results = [
                    d for d in results
                    if q in d.get("document_id", "").lower()
                    or q in str(d.get("digital_document", {}).get("registration_details", {}).get("registration_number", {}).get("value", "")).lower()
                    or q in str(d.get("digital_document", {}).get("land_details", {}).get("survey_number", {}).get("value", "")).lower()
                    or q in str(d.get("digital_document", {}).get("location", {}).get("village", {}).get("value", "")).lower()
                ]

        return results

    @staticmethod
    def _persist_to_disk(document_id: str, data: Dict[str, Any]):
        try:
            path = os.path.join(settings.PROCESSED_DIR, f"{document_id}_db_record.json")
            # Convert datetime objects to isoformat for JSON storage
            def serializer(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                return str(obj)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, default=serializer, indent=2)
        except Exception:
            pass

    @staticmethod
    def _read_from_disk(document_id: str) -> Optional[Dict[str, Any]]:
        try:
            path = os.path.join(settings.PROCESSED_DIR, f"{document_id}_db_record.json")
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return None

# Initialize on module import
DatabaseService.initialize_db()

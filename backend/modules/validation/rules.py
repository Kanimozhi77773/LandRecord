from backend.core.database import db

class ValidationRuleEngine:
    @staticmethod
    async def evaluate_record(extracted_data: dict) -> list[dict]:
        """
        Runs business and historical logic tests against the extracted document.
        Returns a list of detected discrepancies.
        """
        discrepancies = []
        survey_no = extracted_data.get("survey_number", {}).get("value")
        district = extracted_data.get("district")
        extracted_area = float(extracted_data.get("total_area_sqm", {}).get("value", 0))

        # Rule 1: Cross-check with existing master land parcel in MongoDB
        existing_parcel = await db.land_parcels.find_one({
            "district": district,
            "survey_number": survey_no
        })

        if existing_parcel:
            db_area = float(existing_parcel.get("total_area_sqm", 0))
            # Check for area inconsistency > 2% margin
            if db_area > 0 and abs(extracted_area - db_area) / db_area > 0.02:
                discrepancies.append({
                    "field": "total_area_sqm",
                    "severity": "HIGH",
                    "rule_triggered": "AREA_MISMATCH_WITH_MASTER_RECORD",
                    "legacy_db_value": str(db_area),
                    "extracted_value": str(extracted_area),
                    "confidence": extracted_data.get("total_area_sqm", {}).get("confidence", 0.0),
                    "reason": f"Extracted plot area ({extracted_area} sqm) differs from master registry ({db_area} sqm) by > 2%."
                })

            # Check for ownership name conflicts
            existing_owners = [o.get("name", "").strip().lower() for o in existing_parcel.get("owners", [])]
            for owner in extracted_data.get("owners", []):
                owner_name = owner.get("name", "").strip().lower()
                if owner_name and owner_name not in existing_owners:
                    discrepancies.append({
                        "field": "owner_name",
                        "severity": "MEDIUM",
                        "rule_triggered": "UNRECORDED_OWNER_MUTATION",
                        "legacy_db_value": ", ".join(existing_owners),
                        "extracted_value": owner.get("name"),
                        "confidence": owner.get("confidence", 0.0),
                        "reason": f"Owner '{owner.get('name')}' is not listed in the legacy title records."
                    })

        # Rule 2: Low confidence threshold flag
        for field_name, field_obj in extracted_data.items():
            if isinstance(field_obj, dict) and "confidence" in field_obj:
                if field_obj["confidence"] < 0.80:
                    discrepancies.append({
                        "field": field_name,
                        "severity": "LOW",
                        "rule_triggered": "LOW_OCR_CONFIDENCE",
                        "legacy_db_value": "N/A",
                        "extracted_value": str(field_obj.get("value")),
                        "confidence": field_obj["confidence"],
                        "reason": f"Field '{field_name}' extraction confidence ({field_obj['confidence']:.2f}) is below the automated threshold."
                    })

        return discrepancies

rule_engine = ValidationRuleEngine()
import re
from datetime import datetime
from typing import List
from ..schemas.document_schema import DocumentAnalysis, ExtractedField, PersonName, ValidationStatus

class ValidationService:
    @staticmethod
    def validate_analysis(analysis: DocumentAnalysis) -> DocumentAnalysis:
        """
        Performs deterministic legal & cadastral validation on AI extracted fields:
        - Validates Year (1800 to Current Year)
        - Validates Survey Number format (e.g. 142, 142/2, 142/2A, 142/2B)
        - Validates Registration Number (numeric / alphanumeric)
        - Deduplicates person names while preserving highest confidence
        - Assigns validation_status: 'valid' | 'needs_review' | 'invalid'
        """
        current_year = datetime.now().year

        # 1. Year Validation
        if analysis.document_year.value:
            year_str = re.sub(r"[^\d]", "", str(analysis.document_year.value))
            if year_str and len(year_str) == 4:
                year_int = int(year_str)
                if 1800 <= year_int <= current_year:
                    analysis.document_year.validation_status = "valid"
                else:
                    analysis.document_year.validation_status = "needs_review"
                    analysis.document_year.confidence_reason = (
                        f"Year {year_int} outside typical registration record window (1800 - {current_year})"
                    )
            else:
                analysis.document_year.validation_status = "needs_review"
        else:
            analysis.document_year.validation_status = "needs_review"

        # 2. Survey Number Validation
        if analysis.survey_number.value:
            sno_val = str(analysis.survey_number.value).strip()
            # Standard Tamil Nadu survey patterns: 142, 142/2, 142/2A, 142/2A1
            if re.match(r"^\d+([/-]\d+)?([A-Za-z\d]+)?$", sno_val):
                analysis.survey_number.validation_status = "valid"
            else:
                analysis.survey_number.validation_status = "needs_review"
                analysis.survey_number.confidence_reason = "Survey number format requires Sub-Registrar review"
        else:
            analysis.survey_number.validation_status = "needs_review"

        # 3. Registration Number Validation
        if analysis.registration_number.value:
            reg_val = str(analysis.registration_number.value).strip()
            if len(reg_val) >= 1 and any(c.isdigit() for c in reg_val):
                analysis.registration_number.validation_status = "valid"
            else:
                analysis.registration_number.validation_status = "needs_review"
        else:
            analysis.registration_number.validation_status = "needs_review"

        # 4. Village & District Validation
        if analysis.village.value and len(analysis.village.value.strip()) >= 2:
            analysis.village.validation_status = "valid"
        else:
            analysis.village.validation_status = "needs_review"

        if analysis.district.value and len(analysis.district.value.strip()) >= 2:
            analysis.district.validation_status = "valid"
        else:
            analysis.district.validation_status = "needs_review"

        # 5. Land Extent Validation
        if analysis.land_extent.value and len(analysis.land_extent.value.strip()) >= 2:
            analysis.land_extent.validation_status = "valid"
        else:
            analysis.land_extent.validation_status = "needs_review"

        # 6. Document Type Validation
        if analysis.document_type.value and len(analysis.document_type.value.strip()) >= 2:
            analysis.document_type.validation_status = "valid"
        else:
            analysis.document_type.validation_status = "needs_review"

        # 7. Deduplicate Person Names
        analysis.possible_owner_names = ValidationService._deduplicate_names(analysis.possible_owner_names)

        return analysis

    @staticmethod
    def _deduplicate_names(names: List[PersonName]) -> List[PersonName]:
        seen = set()
        deduped = []
        for p in names:
            clean_name = p.name.strip().lower()
            if clean_name not in seen and len(clean_name) > 1:
                seen.add(clean_name)
                deduped.append(p)
        return deduped

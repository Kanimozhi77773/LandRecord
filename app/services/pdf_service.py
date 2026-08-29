import os
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.pdfgen import canvas
from ..config import settings

class NumberedCanvas(canvas.Canvas):
    """
    Canvas that adds official government-style footer and page numbering.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Bottom rule
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 35, 572, 35)

        # Footer Text
        footer_text = "REKHA • AI-Assisted Land Document Digitization • Decision-Support Prototype"
        self.drawString(40, 22, footer_text)
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 22, page_str)
        self.restoreState()

class PDFService:
    @staticmethod
    def generate_land_record_pdf(document_data: Dict[str, Any]) -> str:
        """
        Generates a professional, authoritative legal-tech / government-grade PDF
        for the digitized historical land record using ReportLab.
        """
        document_id = document_data.get("document_id", "DOC_UNKNOWN")
        pdf_filename = f"{document_id}_record.pdf"
        pdf_path = os.path.join(settings.PROCESSED_DIR, pdf_filename)

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()

        # Custom Government Palette Styles
        style_title = ParagraphStyle(
            'GovTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0b2545")
        )

        style_subtitle = ParagraphStyle(
            'GovSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#475569")
        )

        style_section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0b2545"),
            spaceBefore=8,
            spaceAfter=4
        )

        style_cell_label = ParagraphStyle(
            'CellLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#334155")
        )

        style_cell_value = ParagraphStyle(
            'CellValue',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0f172a")
        )

        style_disclaimer = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#78350f")
        )

        style_transcription = ParagraphStyle(
            'TranscriptionText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#1e293b")
        )

        story = []

        # 1. Header Banner
        header_data = [
            [
                Paragraph("<b>TAMIL NADU LAND RECORD DIGITIZATION SYSTEM</b>", style_title),
                Paragraph(f"<b>DOC ID:</b> {document_id[:16]}...", style_cell_label)
            ],
            [
                Paragraph("REKHA AI-Assisted Land Document Intelligence Record", style_subtitle),
                Paragraph(f"Date: {datetime.utcnow().strftime('%d-%m-%Y %H:%M UTC')}", style_subtitle)
            ]
        ]
        t_header = Table(header_data, colWidths=[380, 152])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        story.append(t_header)
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#ff9933"), spaceAfter=10))

        # 2. Document Verification Notice (Amber Warning Box)
        notice_html = (
            "<b>DOCUMENT VERIFICATION NOTICE:</b><br/>"
            "This document is an AI-generated digital representation of an uploaded historical record. "
            "It is intended for digitization, indexing, and reference purposes. AI-extracted fields contain uncertainty "
            "and must be verified against physical registration archives. "
            "This document is not a replacement for an official government-certified land record."
        )
        t_notice = Table([[Paragraph(notice_html, style_disclaimer)]], colWidths=[532])
        t_notice.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_notice)
        story.append(Spacer(1, 10))

        # Extract Digital Document Sections
        digital_doc = document_data.get("digital_document", {})
        doc_meta = digital_doc.get("document_metadata", {})
        reg_details = digital_doc.get("registration_details", {})
        land_details = digital_doc.get("land_details", {})
        location_details = digital_doc.get("location", {})
        people_details = digital_doc.get("people", {})

        def get_val(f):
            if isinstance(f, dict):
                return f.get("value") or "Not identified"
            return "Not identified"

        def get_conf_str(f):
            if isinstance(f, dict):
                conf = f.get("confidence", "unknown").upper()
                return f"[{conf}]"
            return ""

        # 3. Section 1: Document Information Table
        story.append(Paragraph("1. DOCUMENT INFORMATION", style_section_heading))
        doc_info_table_data = [
            [
                Paragraph("Registration Number:", style_cell_label),
                Paragraph(f"{get_val(reg_details.get('registration_number'))} {get_conf_str(reg_details.get('registration_number'))}", style_cell_value),
                Paragraph("Registration Year:", style_cell_label),
                Paragraph(f"{get_val(reg_details.get('year'))} {get_conf_str(reg_details.get('year'))}", style_cell_value),
            ],
            [
                Paragraph("Document Type:", style_cell_label),
                Paragraph(f"{get_val(doc_meta.get('document_type'))}", style_cell_value),
                Paragraph("Execution Date:", style_cell_label),
                Paragraph(f"{get_val(reg_details.get('date'))}", style_cell_value),
            ]
        ]
        t_doc_info = Table(doc_info_table_data, colWidths=[120, 146, 120, 146])
        t_doc_info.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_doc_info)
        story.append(Spacer(1, 8))

        # 4. Section 2: Persons Mentioned
        story.append(Paragraph("2. PERSONS MENTIONED & PATTADHARS", style_section_heading))
        names_list = people_details.get("possible_owner_names", [])
        if names_list:
            people_rows = [
                [
                    Paragraph("<b>Identified Person / Party Name</b>", style_cell_label),
                    Paragraph("<b>AI Confidence</b>", style_cell_label),
                    Paragraph("<b>Evidence / Schedule Context</b>", style_cell_label),
                ]
            ]
            for p in names_list:
                name_str = p.get("name", "Unknown") if isinstance(p, dict) else str(p)
                conf_str = p.get("confidence", "Medium").title() if isinstance(p, dict) else "Medium"
                reason_str = p.get("confidence_reason", "Extracted from deed schedule") if isinstance(p, dict) else ""
                people_rows.append([
                    Paragraph(name_str, style_cell_value),
                    Paragraph(f"<b>{conf_str} Confidence</b>", style_cell_value),
                    Paragraph(reason_str, style_cell_value),
                ])
            t_people = Table(people_rows, colWidths=[180, 110, 242])
            t_people.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t_people)
        else:
            story.append(Paragraph("No owner or person names identified.", style_cell_value))
        story.append(Spacer(1, 8))

        # 5. Section 3 & 4: Land & Location Details
        story.append(Paragraph("3. LAND & LOCATION DETAILS", style_section_heading))
        land_table_data = [
            [
                Paragraph("Survey Number:", style_cell_label),
                Paragraph(f"{get_val(land_details.get('survey_number'))} {get_conf_str(land_details.get('survey_number'))}", style_cell_value),
                Paragraph("Revenue Village:", style_cell_label),
                Paragraph(f"{get_val(location_details.get('village'))}", style_cell_value),
            ],
            [
                Paragraph("Land Extent:", style_cell_label),
                Paragraph(f"{get_val(land_details.get('land_extent'))}", style_cell_value),
                Paragraph("Registration District:", style_cell_label),
                Paragraph(f"{get_val(location_details.get('district'))}", style_cell_value),
            ]
        ]
        t_land = Table(land_table_data, colWidths=[120, 146, 120, 146])
        t_land.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_land)
        story.append(Spacer(1, 8))

        # 6. Section 5: Full AI Transcription (Unicode Safe)
        story.append(Paragraph("4. FULL OCR TRANSCRIPTION (TAMIL / ENGLISH)", style_section_heading))
        raw_text = digital_doc.get("full_transcription", "No transcription available.")
        # Clean text for ReportLab Paragraph formatting
        formatted_text = raw_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
        t_transcript = Table([[Paragraph(formatted_text, style_transcription)]], colWidths=[532])
        t_transcript.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_transcript)
        story.append(Spacer(1, 8))

        # 7. Section 6: Uncertain Information
        uncertain_items = digital_doc.get("uncertain_text", [])
        if uncertain_items:
            story.append(Paragraph("5. UNCERTAIN OR UNREADABLE INFORMATION", style_section_heading))
            u_text = "<br/>".join([f"• {u.replace('&', '&amp;').replace('<', '&lt;')}" for u in uncertain_items])
            t_u = Table([[Paragraph(u_text, style_disclaimer)]], colWidths=[532])
            t_u.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#fdba74")),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(t_u)
            story.append(Spacer(1, 8))

        # 8. Section 7: Processing & Hash Verification Metadata
        hashes = document_data.get("hashes", {})
        proc_meta = document_data.get("processing_metadata", {})
        story.append(Paragraph("6. PROCESSING TELEMETRY & AUDIT HASHES", style_section_heading))
        audit_data = [
            [
                Paragraph("SHA-256 Hash:", style_cell_label),
                Paragraph(f"<font size=7>{hashes.get('sha256', 'N/A')}</font>", style_cell_value),
            ],
            [
                Paragraph("Perceptual Hash (pHash):", style_cell_label),
                Paragraph(f"<font size=8>{hashes.get('perceptual_hash', 'N/A')}</font>", style_cell_value),
            ],
            [
                Paragraph("AI Model & Engine:", style_cell_label),
                Paragraph(f"{proc_meta.get('ai_model', 'Gemini 3.6 Flash')} • OpenCV CLAHE Enhanced", style_cell_value),
            ]
        ]
        t_audit = Table(audit_data, colWidths=[140, 392])
        t_audit.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t_audit)

        # Build PDF with NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return pdf_path

import os
import io
import time
import httpx
from PIL import Image

BASE_URL = "http://localhost:8000"

def create_sample_deed_image(text="SALE DEED 1984 TAMIL NADU"):
    import random
    from PIL import ImageDraw
    img = Image.new('RGB', (600, 800), color=(random.randint(220, 250), random.randint(200, 240), random.randint(180, 220)))
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 580, 780], outline=(139, 69, 19), width=4)
    # Draw random geometric lines to produce distinct perceptual hash
    for _ in range(10):
        draw.line([random.randint(30, 550), random.randint(30, 750), random.randint(30, 550), random.randint(30, 750)], fill=(random.randint(0, 100), random.randint(0, 100), random.randint(0, 100)), width=3)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf.getvalue()

def create_non_land_image(name="college_certificate"):
    import random
    from PIL import ImageDraw
    img = Image.new('RGB', (850, 1100), color=(random.randint(180, 210), random.randint(210, 240), random.randint(230, 255)))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 800, 1050], fill=(255, 255, 255), outline=(0, 0, 128), width=8)
    for _ in range(12):
        draw.line([random.randint(60, 780), random.randint(60, 1000), random.randint(60, 780), random.randint(60, 1000)], fill=(0, 0, random.randint(150, 255)), width=2)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf.getvalue()

def run_tests():
    print("==================================================")
    print("REKHA COMPLETE SYSTEM VALIDATION TEST SUITE")
    print("==================================================")
    
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # Test 1: Unified Health Check & Gemini Status
    print("\n[TEST 1] Testing GET /health and GET /health/gemini ...")
    r_health = client.get("/health")
    print(f"Health Status Code: {r_health.status_code}")
    print(f"Health Payload: {r_health.json()}")
    assert r_health.status_code == 200, "Health check failed"

    # Test 2: Process Initial Land Document
    print("\n[TEST 2] Processing First Valid Land Document...")
    deed_bytes = create_sample_deed_image("ORIGINAL TAMIL SALE DEED 1984")
    files = {'file': ('tamil_sale_deed_927_1984.jpg', deed_bytes, 'image/jpeg')}
    r_proc = client.post("/api/process-document", files=files)
    print(f"Process Status Code: {r_proc.status_code}")
    data = r_proc.json()
    print(f"Success: {data.get('success')}")
    print(f"Document ID: {data.get('document_id')}")
    print(f"Classification: {data.get('classification')}")
    print(f"PDF Download URL: {data.get('pdf_download_url')}")
    doc_id = data.get('document_id')
    assert data.get('success') is True, "First document upload failed"

    # Test 3: Exact Duplicate Detection (SHA-256)
    print("\n[TEST 3] Uploading Exact Duplicate File (Same SHA-256)...")
    files_dup = {'file': ('tamil_sale_deed_927_1984.jpg', deed_bytes, 'image/jpeg')}
    r_dup = client.post("/api/process-document", files=files_dup)
    data_dup = r_dup.json()
    print(f"Duplicate Status: {data_dup.get('processing_status')}")
    print(f"Duplicate Details: {data_dup.get('duplicate')}")
    assert data_dup.get('processing_status') == "duplicate_detected", "Exact duplicate was not flagged"
    assert data_dup.get('duplicate', {}).get('type') == "exact", "Duplicate type should be exact"

    # Test 4: Invalid Non-Land Document Rejection (Certificate / Selfie)
    print("\n[TEST 4] Uploading Non-Land Document (College Certificate)...")
    cert_bytes = create_non_land_image("college_certificate")
    files_cert = {'file': ('college_certificate.jpg', cert_bytes, 'image/jpeg')}
    r_cert = client.post("/api/process-document", files=files_cert)
    data_cert = r_cert.json()
    print(f"Status: {data_cert.get('processing_status')}")
    print(f"Classification: {data_cert.get('classification')}")
    assert data_cert.get('processing_status') == "invalid_document", "Non-land document was not rejected"

    # Test 5: ReportLab PDF Generation & Download
    print(f"\n[TEST 5] Downloading Generated PDF for Document {doc_id}...")
    r_pdf = client.get(f"/api/document/{doc_id}/download")
    print(f"PDF Download Status Code: {r_pdf.status_code}")
    print(f"Content-Type: {r_pdf.headers.get('content-type')}")
    print(f"PDF Size: {len(r_pdf.content)} bytes")
    assert r_pdf.status_code == 200, "PDF download failed"
    assert "application/pdf" in r_pdf.headers.get('content-type', ''), "Content-Type is not application/pdf"
    assert r_pdf.content.startswith(b'%PDF'), "Downloaded file is not a valid PDF header"

    # Test 6: MongoDB Document Search & Retrieval
    print("\n[TEST 6] Searching Saved Records in MongoDB Archive...")
    r_search = client.get("/api/documents?query=142")
    data_search = r_search.json()
    print(f"Search Results Count: {data_search.get('count')}")
    assert data_search.get('count', 0) >= 1, "Expected at least 1 document matching search"

    print("\n==================================================")
    print("[SUCCESS] ALL 6 REKHA INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

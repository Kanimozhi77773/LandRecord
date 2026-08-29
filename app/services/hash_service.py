import hashlib
from typing import Tuple, Optional
from PIL import Image
try:
    import imagehash
except ImportError:
    imagehash = None

class HashService:
    @staticmethod
    def calculate_sha256(file_path: str) -> str:
        """
        Computes cryptographic SHA-256 hash of original uploaded file in 64KB chunks.
        Used for exact duplicate file detection.
        """
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def calculate_perceptual_hash(image_path: str) -> str:
        """
        Computes perceptual hash (pHash) of an image using DCT frequency analysis.
        Resistant to minor rotations, brightness, compression, and scaling changes.
        """
        if imagehash is None:
            # Fallback fast visual hash if imagehash library is loading
            return HashService._fallback_dhash(image_path)
            
        try:
            with Image.open(image_path) as img:
                # Convert to RGB mode before computing perceptual hash
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                phash_val = imagehash.phash(img)
                return str(phash_val)
        except Exception as e:
            print(f"Warning: pHash computation encountered error ({str(e)}), using dHash fallback")
            return HashService._fallback_dhash(image_path)

    @staticmethod
    def calculate_hamming_distance(hash1_str: str, hash2_str: str) -> int:
        """
        Calculates Hamming distance between two perceptual hashes.
        - 0 = Exact visual match
        - <= 5 = Very likely visual duplicate (scanned/compressed copy)
        - <= 10 = Possibly similar
        - > 10 = Distinctly different document
        """
        if not hash1_str or not hash2_str:
            return 999

        if imagehash is not None:
            try:
                h1 = imagehash.hex_to_hash(hash1_str)
                h2 = imagehash.hex_to_hash(hash2_str)
                return h1 - h2
            except Exception:
                pass

        # Bitwise XOR Hamming distance fallback
        try:
            val1 = int(hash1_str, 16)
            val2 = int(hash2_str, 16)
            xor_val = val1 ^ val2
            return bin(xor_val).count('1')
        except Exception:
            return 999

    @staticmethod
    def _fallback_dhash(image_path: str, hash_size: int = 8) -> str:
        """
        Fast difference hash fallback.
        """
        try:
            with Image.open(image_path) as img:
                img = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
                pixels = list(img.getdata())
                diff = []
                for row in range(hash_size):
                    for col in range(hash_size):
                        pixel_left = pixels[row * (hash_size + 1) + col]
                        pixel_right = pixels[row * (hash_size + 1) + col + 1]
                        diff.append(pixel_left > pixel_right)
                decimal_value = 0
                hex_string = []
                for index, value in enumerate(diff):
                    if value:
                        decimal_value += 2 ** (index % 8)
                    if (index % 8) == 7:
                        hex_string.append(hex(decimal_value)[2:].rjust(2, '0'))
                        decimal_value = 0
                return ''.join(hex_string)
        except Exception:
            return "0000000000000000"

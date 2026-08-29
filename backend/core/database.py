from motor.motor_asyncio import AsyncIOMotorClient
from backend.core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

async def init_indexes():
    try:
        await db.land_parcels.create_index([("geometry", "2dsphere")])
        await db.land_parcels.create_index([("state", 1), ("district", 1), ("survey_number", 1)])
        await db.security_ledger.create_index([("current_block_hash", 1)], unique=True)
        await db.security_ledger.create_index([("block_index", 1)], unique=True)
        await db.discrepancy_cases.create_index([("status", 1), ("priority", 1)])
        print("[DB] MongoDB indexes initialized.")
    except Exception as e:
        print(f"[DB] Index status note: {e}")
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env from backend directory
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

if not MONGO_URL:
    raise RuntimeError('MONGO_URL environment variable is required for database connection')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

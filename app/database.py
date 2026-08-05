from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
for env_file in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    if env_file.exists():
        load_dotenv(env_file, encoding="utf-8-sig")
        break
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)    

Local_Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = Local_Session()
    try:
        yield db
    finally:
        db.close()

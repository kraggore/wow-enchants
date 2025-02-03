from sqlalchemy import Column, Integer, String, JSON, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional

DATABASE_URL = "sqlite:///./enchants.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class EnchantDB(Base):
    __tablename__ = "enchants"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    name_part1 = Column(String)
    name_part2 = Column(String)
    reagents = Column(JSON)

# Pydantic models for API
class Reagent(BaseModel):
    name: str
    quantity: int
    icon_url: Optional[str] = None

class EnchantBase(BaseModel):
    url: str
    name_part1: str
    name_part2: str
    reagents: List[Reagent]

class EnchantCreate(EnchantBase):
    pass

class Enchant(EnchantBase):
    id: int

    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, scraper
from pydantic import BaseModel
from fastapi.security.api_key import APIKeyHeader, APIKey
from starlette.status import HTTP_403_FORBIDDEN
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.0.0.2:5173",
        "http://localhost:5173",
        "http://wow-enchants.murumb.dev",
        "https://wow-enchants.murumb.dev",
        "https://wow-api.murumb.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY", "your-secret-api-key-here")
API_KEY_NAME = "X-API-Key"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=HTTP_403_FORBIDDEN, detail="Could not validate API key"
    )

class EnchantUrlRequest(BaseModel):
    url: str

@app.post("/enchants/", response_model=models.Enchant)
async def create_enchant(request: EnchantUrlRequest, db: Session = Depends(models.get_db), api_key: APIKey = Depends(get_api_key)):
    # Check if enchant already exists
    db_enchant = db.query(models.EnchantDB).filter(models.EnchantDB.url == request.url).first()
    if db_enchant:
        raise HTTPException(status_code=400, detail="Enchant already exists")
    
    # Parse enchant data
    data = await scraper.parse_wowhead_enchant(request.url)
    if not data:
        raise HTTPException(status_code=400, detail="Failed to parse enchant data")
    
    # Create new enchant
    db_enchant = models.EnchantDB(
        url=request.url,
        name_part1=data['name_parts'][0],
        name_part2=data['name_parts'][1],
        reagents=data['reagents']
    )
    db.add(db_enchant)
    db.commit()
    db.refresh(db_enchant)
    return db_enchant

@app.get("/enchants/", response_model=List[models.Enchant])
async def get_enchants(db: Session = Depends(models.get_db), api_key: APIKey = Depends(get_api_key)):
    return db.query(models.EnchantDB).all()

@app.delete("/enchants/{enchant_id}")
async def delete_enchant(enchant_id: int, db: Session = Depends(models.get_db), api_key: APIKey = Depends(get_api_key)):
    enchant = db.query(models.EnchantDB).filter(models.EnchantDB.id == enchant_id).first()
    if not enchant:
        raise HTTPException(status_code=404, detail="Enchant not found")
    db.delete(enchant)
    db.commit()
    return {"message": "Enchant deleted"}

@app.post("/calculate/")
async def calculate_total(enchant_ids: List[int], db: Session = Depends(models.get_db), api_key: APIKey = Depends(get_api_key)):
    # Count how many times each enchant ID appears
    id_counts = {}
    for enchant_id in enchant_ids:
        id_counts[enchant_id] = id_counts.get(enchant_id, 0) + 1

    # Get unique enchants
    unique_enchants = db.query(models.EnchantDB).filter(models.EnchantDB.id.in_(list(id_counts.keys()))).all()
    total_reagents = {}
    
    # Calculate totals considering quantities
    for enchant in unique_enchants:
        quantity = id_counts[enchant.id]
        for reagent in enchant.reagents:
            name = reagent['name']
            total_reagents[name] = total_reagents.get(name, {
                'name': name,
                'quantity': 0,
                'icon_url': reagent.get('icon_url')
            })
            total_reagents[name]['quantity'] += reagent['quantity'] * quantity
    
    return list(total_reagents.values())
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Single document tournament state key
TOURNAMENT_ID = "default-tournament"

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ------------- Models -------------
class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matchday: int  # 1..6
    teamA: str
    teamB: str


class Matchday(BaseModel):
    model_config = ConfigDict(extra="ignore")
    number: int  # 1..6
    matches: List[Match] = []
    resting: Optional[str] = None


class Tournament(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = TOURNAMENT_ID
    teams: List[str] = []
    matchdays: List[Matchday] = []
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TournamentUpdate(BaseModel):
    teams: List[str] = []
    matchdays: List[Matchday] = []


# ------------- Routes -------------
@api_router.get("/")
async def root():
    return {"message": "Torneo API listo"}


@api_router.get("/tournament", response_model=Tournament)
async def get_tournament():
    doc = await db.tournaments.find_one({"id": TOURNAMENT_ID}, {"_id": 0})
    if not doc:
        # Return empty default tournament
        empty = Tournament(teams=[], matchdays=[])
        return empty
    return Tournament(**doc)


@api_router.put("/tournament", response_model=Tournament)
async def update_tournament(payload: TournamentUpdate):
    # Validate team count (allow partial during setup; final must be 11)
    if len(payload.teams) > 0 and len(set(payload.teams)) != len(payload.teams):
        raise HTTPException(status_code=400, detail="Equipos duplicados no permitidos")

    tournament = Tournament(
        id=TOURNAMENT_ID,
        teams=payload.teams,
        matchdays=payload.matchdays,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    doc = tournament.model_dump()
    await db.tournaments.update_one(
        {"id": TOURNAMENT_ID},
        {"$set": doc},
        upsert=True,
    )
    return tournament


@api_router.delete("/tournament")
async def reset_tournament():
    await db.tournaments.delete_one({"id": TOURNAMENT_ID})
    return {"message": "Torneo reiniciado"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

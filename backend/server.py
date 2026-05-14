from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ------------- Models -------------
class TeamConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    short_name: Optional[str] = ""
    color: Optional[str] = "#F26321"
    logo: Optional[str] = ""  # base64 data URL or external URL


class MatchEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matchday: int
    teamA: str
    teamB: str
    scoreA: Optional[int] = None
    scoreB: Optional[int] = None
    date: Optional[str] = ""
    time: Optional[str] = ""
    status: Literal["pending", "in_progress", "finished"] = "pending"


class Matchday(BaseModel):
    model_config = ConfigDict(extra="ignore")
    number: int
    matches: List[MatchEntry] = []
    resting: Optional[str] = None


class Tournament(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    format: Literal["liga", "liga_ko", "ko"] = "liga"
    teams_count: int = 11
    matchdays_count: int = 6
    qualifiers_count: int = 4
    matches_per_team: int = 6
    allow_auto_rest: bool = True
    auto_generate: bool = False
    primary_logo: Optional[str] = ""
    secondary_logo: Optional[str] = ""
    teams: List[TeamConfig] = []
    matchdays: List[Matchday] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TournamentSummary(BaseModel):
    id: str
    name: str
    format: str
    teams_count: int
    matchdays_count: int
    qualifiers_count: int
    matches_per_team: int
    primary_logo: Optional[str] = ""
    secondary_logo: Optional[str] = ""
    teams_registered: int = 0
    current_matchday: int = 0
    matches_played: int = 0
    total_matches_target: int = 0
    progress: float = 0.0
    created_at: str
    updated_at: str


class TournamentCreate(BaseModel):
    name: str
    format: Literal["liga", "liga_ko", "ko"] = "liga"
    teams_count: int = 11
    matchdays_count: int = 6
    qualifiers_count: int = 4
    matches_per_team: int = 6
    allow_auto_rest: bool = True
    auto_generate: bool = False
    primary_logo: Optional[str] = ""
    secondary_logo: Optional[str] = ""


class TournamentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    format: Optional[Literal["liga", "liga_ko", "ko"]] = None
    teams_count: Optional[int] = None
    matchdays_count: Optional[int] = None
    qualifiers_count: Optional[int] = None
    matches_per_team: Optional[int] = None
    allow_auto_rest: Optional[bool] = None
    auto_generate: Optional[bool] = None
    primary_logo: Optional[str] = None
    secondary_logo: Optional[str] = None
    teams: Optional[List[TeamConfig]] = None
    matchdays: Optional[List[Matchday]] = None


def _summary(doc: dict) -> dict:
    teams = doc.get("teams", []) or []
    matchdays = doc.get("matchdays", []) or []
    matches_played = sum(
        1
        for md in matchdays
        for m in md.get("matches", [])
        if m.get("status") == "finished"
    )
    matches_total = sum(len(md.get("matches", [])) for md in matchdays)
    current_md = 0
    for md in matchdays:
        if md.get("matches"):
            current_md = max(current_md, md.get("number", 0))
    # target = matches_per_team * teams_count / 2 (approx)
    target = (doc.get("matches_per_team", 6) * doc.get("teams_count", 0)) // 2
    progress = (matches_total / target) if target > 0 else 0.0
    return {
        "id": doc["id"],
        "name": doc["name"],
        "format": doc.get("format", "liga"),
        "teams_count": doc.get("teams_count", 0),
        "matchdays_count": doc.get("matchdays_count", 0),
        "qualifiers_count": doc.get("qualifiers_count", 0),
        "matches_per_team": doc.get("matches_per_team", 0),
        "primary_logo": doc.get("primary_logo", ""),
        "secondary_logo": doc.get("secondary_logo", ""),
        "teams_registered": len(teams),
        "current_matchday": current_md,
        "matches_played": matches_played,
        "total_matches_target": target,
        "progress": min(1.0, progress),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


# ------------- Routes -------------
@api_router.get("/")
async def root():
    return {"message": "Copa ESTECA API"}


@api_router.get("/tournaments", response_model=List[TournamentSummary])
async def list_tournaments():
    docs = await db.tournaments_v2.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_summary(d) for d in docs]


@api_router.post("/tournaments", response_model=Tournament)
async def create_tournament(payload: TournamentCreate):
    if payload.teams_count < 2:
        raise HTTPException(status_code=400, detail="Mínimo 2 equipos")
    if payload.matchdays_count < 1:
        raise HTTPException(status_code=400, detail="Mínimo 1 jornada")

    # Empty matchdays placeholder
    matchdays = [
        Matchday(number=i + 1, matches=[], resting=None)
        for i in range(payload.matchdays_count)
    ]
    tournament = Tournament(
        **payload.model_dump(),
        teams=[],
        matchdays=matchdays,
    )
    doc = tournament.model_dump()
    await db.tournaments_v2.insert_one(doc)
    # remove the _id mongo added to the dict (mutation)
    doc.pop("_id", None)
    return Tournament(**doc)


@api_router.get("/tournaments/{tournament_id}", response_model=Tournament)
async def get_tournament(tournament_id: str):
    doc = await db.tournaments_v2.find_one({"id": tournament_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return Tournament(**doc)


@api_router.put("/tournaments/{tournament_id}", response_model=Tournament)
async def update_tournament(tournament_id: str, payload: TournamentUpdate):
    existing = await db.tournaments_v2.find_one({"id": tournament_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")

    update_dict = {k: v for k, v in payload.model_dump(exclude_none=True).items()}

    # Validate duplicate team names if teams provided
    if "teams" in update_dict:
        names = [t["name"].strip().lower() for t in update_dict["teams"]]
        if len(set(names)) != len(names):
            raise HTTPException(status_code=400, detail="Equipos duplicados no permitidos")

    # If matchdays_count changed, resize matchdays
    if "matchdays_count" in update_dict:
        current_mds = existing.get("matchdays", [])
        new_count = update_dict["matchdays_count"]
        if len(current_mds) < new_count:
            for i in range(len(current_mds), new_count):
                current_mds.append({"number": i + 1, "matches": [], "resting": None})
        else:
            current_mds = current_mds[:new_count]
        update_dict["matchdays"] = current_mds

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tournaments_v2.update_one(
        {"id": tournament_id}, {"$set": update_dict}
    )
    doc = await db.tournaments_v2.find_one({"id": tournament_id}, {"_id": 0})
    return Tournament(**doc)


@api_router.delete("/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str):
    res = await db.tournaments_v2.delete_one({"id": tournament_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return {"message": "Torneo eliminado"}


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

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.engine.url import make_url
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "chembase.db")

# Fallback to /tmp/chembase.db for cloud read-only filesystems
try:
    with open(DB_PATH, "a"): pass
except Exception:
    DB_PATH = "/tmp/chembase.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Normalize Supabase Postgres URLs to SQLAlchemy 2.0 format.
# Accepts: postgresql://, postgres://, and the Supabase pooler URI form
# (supabase-pooler:... or any host containing 'pooler').
url = make_url(DATABASE_URL)
if url.drivername in ("postgres", "postgresql"):
    url = url.set(drivername="postgresql+psycopg2")

is_sqlite = url.get_backend_name() == "sqlite"
is_pooler = "pooler" in (url.host or "")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False
elif is_pooler:
    # Supabase Session-mode pooler speaks a transaction protocol that is
    # incompatible with prepared statements — disable them.
    connect_args["options"] = "-c statement_timeout=15000"

engine = create_engine(
    url,
    connect_args=connect_args,
    pool_pre_ping=True,          # survives Render idle disconnects
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

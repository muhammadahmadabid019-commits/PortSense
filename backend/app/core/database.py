from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    # Local imports inside the function body to avoid the circular import that
    # would occur if these were imported at module level (both User and
    # get_password_hash themselves import Base / settings from this module or
    # its siblings before database.py has finished initialising).
    from app.core.security import get_password_hash
    from sqlalchemy.future import select
    from app.models.user import User

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalars().first():
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin"),
                role="admin",
            )
            db.add(admin)
            await db.commit()

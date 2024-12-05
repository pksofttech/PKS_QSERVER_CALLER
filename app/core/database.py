from datetime import datetime, timedelta
import json
import logging
import random
from typing import AsyncIterator
from typing import AsyncGenerator

from app.core.models import (
    Monitor_QPKS,
    Printer_QPKS,
    Service,
    System_User_Type,
    System_Users,
    Transaction,
    Transaction_Record,
)
from app.stdio import time_now, print_success, print_warning
from .utility import get_password_hash
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession


from sqlalchemy.sql import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.orm import aliased


import urllib
import logging
import logging.handlers

from fastapi import Depends
from sqlmodel import SQLModel, delete, func, insert, text, update

# from app.core import models

from sqlalchemy import event
from sqlalchemy.engine import Engine

from app.core import config


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///sqlacm.db"
# ? connect_args={"check_same_thread": False} For Sqlite เท่านั้น
async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

data_base_ip = "localhost"
data_base_name = "dpark_vms"
data_base_password = "dls@1234"

print("Connect DataBase")
_password = urllib.parse.quote_plus(data_base_password)
# SQLALCHEMY_DATABASE_URL = f"mssql+pymssql://sa:{_password}@{data_base_ip}/{data_base_name}?charset=utf8"
# engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_size=20, max_overflow=0)

# For postgres DB
postgres_server = "localhost"
postgres_database = "database"
_password = urllib.parse.quote_plus("#bunpotnumnak24")
# SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://root:{_password}@{postgres_server}/{postgres_database}"
# async_engine = create_async_engine(SQLALCHEMY_DATABASE_URL)

# ? MAIN LIB+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

_async_session_maker = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


async def get_async_session() -> AsyncSession:
    async with _async_session_maker() as session:
        yield session


async def set_databases(init=None):
    print_success("********************************************************")
    print_success(f"Init_db config Time {time_now()}")

    if init:
        print_warning("Clear database for initialization")
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)

            await conn.run_sync(SQLModel.metadata.create_all)

        async with _async_session_maker() as db:
            for l in ["USER_02", "USER_01", "OPERATOR", "ADMIN", "ROOT"]:
                _system_user_type = System_User_Type(user_type=l)
                if l == "ROOT":
                    _system_user_type.permission_allowed = (
                        "system_config,management_system_user,station_config"
                    )
                db.add(_system_user_type)
            await db.commit()

            sql = select(System_User_Type.id).where(
                System_User_Type.user_type == "ROOT"
            )
            _system_user_type_root: System_User_Type = (
                await db.execute(sql)
            ).one_or_none()
            # print(_system_user_type_root.id)
            print_warning("DataBase is missing root user")
            print_warning("SystemUser root not found init_db() create new root")
            _password = get_password_hash("qpks")
            _root = System_Users(
                name="qpks system",
                username="qpks",
                password=_password,
                system_user_type_id=_system_user_type_root.id,
                create_by="init_db",
                status="Enable",
                pictureUrl="/static/data_base/image/default/system.png",
            )
            db.add(_root)
            await db.commit()

            for i in range(1, 10):
                g = chr(0x40 + i)
                _s = Service(
                    group=f"{g}",
                    name=f"บริการ {i}",
                    tag=f"รายละเอียด {i}",
                )
                db.add(_s)
            await db.commit()

            for i in range(1, 6):
                _p = Printer_QPKS(name=f"Printer {i}")
                db.add(_p)
            await db.commit()

            for i in range(1, 6):
                _m = Monitor_QPKS(name=f"Monitor {i}")
                db.add(_m)
            await db.commit()

            # **!SECTION For testing **
            d = datetime.today() - timedelta(days=1)
            for service_id in range(1, 10):
                for i in range(1, 26):
                    dc = d + timedelta(minutes=random.randint(2, 20))
                    ds = dc + timedelta(minutes=random.randint(2, 20))
                    _transaction = Transaction_Record(
                        machine="test Database",
                        service_id=service_id,
                        number=str(i).zfill(3),
                        status=201,
                        createDate=d,
                        callerDate=dc,
                        successDate=ds,
                        caller_device=random.choice("123456789ABCDEFGHI"),
                    )
                    db.add(_transaction)
            await db.commit()
    print_success(
        "********************* Success Set Data For Test ************************"
    )


INIT_DATABASE = 0


async def init_db():
    if INIT_DATABASE:
        await set_databases(True)
    await clear_transaction()


async def clear_transaction(force=False):
    print_warning("Clearing transaction database")
    async with _async_session_maker() as db:
        sql = select(Transaction)
        if not force:
            str_time = f"{time_now()}".split(" ")[0]
            print(str_time)
            offset_time = datetime.strptime(str_time, "%Y-%m-%d")
            print(offset_time)
            sql = sql.where(Transaction.createDate < offset_time)
        rows = (await db.execute(sql)).all()
        for row in rows:
            _transaction: Transaction = row[0]
            print(_transaction)

            transaction_record = Transaction_Record(
                machine=_transaction.machine,
                number=_transaction.number,
                createDate=_transaction.createDate,
                caller_device=_transaction.caller_device,
                callerDate=_transaction.callerDate,
                successDate=_transaction.successDate,
                review=_transaction.review,
                tag=_transaction.tag,
                status=_transaction.status,
                service_id=_transaction.service_id,
            )

            db.add(transaction_record)
            result = await db.delete(_transaction)
            print_success(result)
            await db.commit()

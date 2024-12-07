# import base64
# from http.client import HTTPResponse
# from io import BytesIO
# import json
# import os
# import time
# from typing import Union
# from unittest import result

from fastapi import APIRouter, Cookie, Depends, Request, Header, Response

# from fastapi.exceptions import HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import (
    FileResponse,
    RedirectResponse,
    StreamingResponse,
)
import httpx
from pydantic import BaseModel

# from requests.auth import HTTPDigestAuth, HTTPBasicAuth
from PIL import Image

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, asc, desc
from app.core.database import get_async_session
from app.core.auth import (
    access_cookie_token,
    allowed_permissions,
    get_jwt_access,
    get_user_by_id,
)

from app.core import config
from app.core.models import (
    Monitor_QPKS,
    Printer_QPKS,
    Service,
    System_Users,
    Transaction,
)
from sqlalchemy import select, delete

from app.core import models
from app.routes.websocket import WebSockets
from app.stdio import CREATED, PROCESS, time_now, print_error


DIR_PATH = config.DIR_PATH

templates = Jinja2Templates(directory="templates")
router = APIRouter(tags=["Public"])


@router.get("/page_404")
async def page_404(url: str = ""):
    _now = time_now()
    print_error(f"page_404 : {url}")
    return templates.TemplateResponse(
        "404.html",
        {"request": {}, "now": _now, "app_title": config.APP_TITLE, "url": url},
    )


@router.get("/")
async def main_path(
    app_mode: str | None = Cookie(default="SYSTEM"),
    db: AsyncSession = Depends(get_async_session),
    user=Depends(access_cookie_token),
):
    _now = time_now()
    # for check_login user
    print("request from user", user)
    # Check login user
    if user:
        return RedirectResponse(url="/home")
    else:
        return templates.TemplateResponse(
            "login.html",
            {"request": {}, "now": _now, "app_title": config.APP_TITLE},
        )


@router.get("/about")
async def about_path(
    db: AsyncSession = Depends(get_async_session), user=Depends(access_cookie_token)
):
    _now = time_now()
    # for check_login user
    print("request from user", user)
    # Check login user
    return templates.TemplateResponse(
        "about.html",
        {"request": {}, "now": _now, "app_title": config.APP_TITLE},
    )


@router.get("/ping")
async def ping(request: Request):
    _now = time_now()
    _header = request.headers
    for k, v in _header.items():
        print(k, v)
    return f"Time process : {time_now() - _now}"


@router.get("/home")
async def router_home(
    db: AsyncSession = Depends(get_async_session),
    user=Depends(access_cookie_token),
):
    if not user:
        return RedirectResponse(url="/")
    _now = time_now()
    print(user)
    datas = {}
    _sql = select(Service).where(Service.active == True)
    services: Service = (await db.execute(_sql)).all()
    print(services)
    return templates.TemplateResponse(
        "home.html",
        {
            "request": {},
            "user": user,
            "datas": datas,
            "now": _now,
            "services": services,
        },
    )


@router.get("/transection_report")
async def router_transection_report(
    db: AsyncSession = Depends(get_async_session),
    user=Depends(access_cookie_token),
):
    if not user:
        return RedirectResponse(url="/")
    _now = time_now()
    print(user)
    return templates.TemplateResponse(
        "transection_report.html",
        {
            "request": {},
            "user": user,
            "now": _now,
        },
    )


@router.get("/printer_kiosk")
async def router_printer_kiosk(
    system_config: str = None,
    printer_id: int = 1,
    db: AsyncSession = Depends(get_async_session),
):
    datas = {}
    _now = time_now()
    _sql = select(Service).where(Service.active == True)
    services: Service = (await db.execute(_sql)).all()
    service_len = len(services)
    print(service_len)
    text_size = "text-xl"
    if service_len > 7:
        text_size = "text-2xl"
    elif service_len > 3:
        text_size = "text-3xl"
    else:
        text_size = "text-4xl"

    _sql = select(Printer_QPKS).where(Printer_QPKS.id == printer_id)
    printer_QPKS: Printer_QPKS = (await db.execute(_sql)).one()[0]

    info_title = printer_QPKS.info_title
    info_text = printer_QPKS.info_text
    iframe_path = printer_QPKS.iframe_path
    picture_path = printer_QPKS.picture_path
    sounds_path = f"/static/sound/{printer_QPKS.language}/"
    language = printer_QPKS.language
    printer_name = printer_QPKS.name

    print(printer_QPKS.video_path)

    return templates.TemplateResponse(
        "printer_kiosk.html",
        {
            "request": {},
            "datas": datas,
            "now": _now,
            "printer_name": printer_name,
            "system_services": True if system_config else False,
            "services": services,
            "text_size": text_size,
            "info_title": info_title,
            "info_text": info_text,
            "video_path": printer_QPKS.video_path,
            "iframe_path": "https://www.youtube.com/embed/W1zP2pV9470?autoplay=1&mute=1",
            "PRINTER_SELECT": printer_id,
            "PRINTER_LANGUAGE": language,
            "sounds_path": sounds_path,
        },
    )


@router.get("/monitor_kiosk")
async def router_monitor_kiosk(
    system_config: str = None,
    monitor_id: int = 1,
    db: AsyncSession = Depends(get_async_session),
):
    LIMIT = 8
    datas = {}
    _now = time_now()
    _sql = (
        select(Transaction, Service)
        .where(Transaction.status != CREATED)
        .join(Service, (Service.id == Transaction.service_id))
        .limit(LIMIT)
        .order_by(desc(Transaction.callerDate))
    )
    monitor_services = (await db.execute(_sql)).all()

    print(monitor_services)

    _sql = (
        select(
            Transaction.service_id,
            Service.id,
            Service.name,
            func.count(Transaction.id),
        )
        .where(Transaction.status == CREATED)
        .join(
            Service,
            Transaction.service_id == Service.id,
        )
    )

    _sql = _sql.group_by(Transaction.service_id)
    service_counts = (await db.execute(_sql)).all()

    _sql = select(Monitor_QPKS).where(Monitor_QPKS.id == monitor_id)
    monitor: Monitor_QPKS = (await db.execute(_sql)).one()[0]

    monitor_info = {}
    monitor_info["info01"] = monitor.info_title
    monitor_info["info02"] = monitor.info_text
    video_path = monitor.video_path
    iframe_path = monitor.iframe_path
    picture_path = monitor.picture_path
    sounds_path = f"/static/sound/{monitor.language}/"
    language = monitor.language
    language_display = monitor.language_display
    monitor_id = monitor.id
    number_text = monitor.number_text
    counter_text = monitor.counter_text

    if language_display == "Thai":
        pass

    return templates.TemplateResponse(
        "monitor_kiosk.html",
        {
            "request": {},
            "datas": datas,
            "now": _now,
            "monitor_services": monitor_services,
            "system_services": True if system_config else False,
            "monitor_info": monitor_info,
            "video_path": video_path,
            # "iframe_path": "https://www.youtube.com/embed/W1zP2pV9470?autoplay=1&mute=1",
            "monitor_id": monitor_id,
            "service_counts": service_counts,
            "sounds_path": sounds_path,
            "MONITOR_LANGUAGE": language,
            "MONITOR_LANGUAGE_DISPLAY": language_display,
            "MONITOR_SELECT": monitor_id,
            "number_text": number_text,
            "counter_text": counter_text,
        },
    )


@router.get("/caller_kiosk")
async def router_caller_kiosk(
    caller_id: str = 1,
    db: AsyncSession = Depends(get_async_session),
):
    datas = {}
    _now = time_now()
    _sql = select(Service.id, Service.group, Service.name).where(Service.active == True)
    row = (await db.execute(_sql)).all()
    print(row)
    sevices = row
    _sql = (
        select(Transaction, Service)
        .where(
            Transaction.caller_device == caller_id,
        )
        .join(Service, (Transaction.service_id == Service.id))
    )
    row = (await db.execute(_sql)).first()
    last_service = None
    if row:
        last_service = row
    print(last_service)
    return templates.TemplateResponse(
        "caller_kiosk.html",
        {
            "request": {},
            "datas": datas,
            "now": _now,
            "sevices": sevices,
            "caller_id": caller_id,
            "last_service": last_service,
        },
    )


@router.get("/monitor_kiosk_info")
async def router_monitor_kiosk_info(
    system_config: str = None,
    monitor_id: int = 1,
    db: AsyncSession = Depends(get_async_session),
):
    LIMIT = 15
    datas = {}
    _now = time_now()
    _sql = (
        select(Transaction, Service)
        .where(Transaction.status == CREATED)
        .join(Service, (Service.id == Transaction.service_id))
        .limit(LIMIT)
        .order_by(desc(Transaction.id))
    )
    rows = (await db.execute(_sql)).all()
    monitor_services = []
    for row in rows:
        _Transaction: Transaction = row[0]
        time_call = _Transaction.createDate.strftime("%H:%M:%S")
        monitor_services.append((_Transaction.number, time_call))
    print(monitor_services)

    _sql = (
        select(Transaction, Service)
        .where(Transaction.status == PROCESS)
        .join(Service, (Service.id == Transaction.service_id))
        .limit(LIMIT)
        .order_by(desc(Transaction.id))
    )
    rows = (await db.execute(_sql)).all()
    monitor_services_process = []
    for row in rows:
        _Transaction: Transaction = row[0]
        time_call = _Transaction.callerDate.strftime("%H:%M:%S")
        monitor_services_process.append((_Transaction.number, time_call))
    print(monitor_services_process)

    _sql = (
        select(
            Transaction.service_id,
            Service.id,
            Service.name,
            func.count(Transaction.id),
        )
        .where(Transaction.status == CREATED)
        .join(
            Service,
            Transaction.service_id == Service.id,
        )
    )

    _sql = _sql.group_by(Transaction.service_id)
    service_counts = (await db.execute(_sql)).all()

    _sql = select(Monitor_QPKS).where(Monitor_QPKS.id == monitor_id)
    monitor: Monitor_QPKS = (await db.execute(_sql)).one()[0]

    monitor_info = {}
    monitor_info["info01"] = monitor.info_title
    monitor_info["info02"] = monitor.info_text
    video_path = monitor.video_path
    # iframe_path = monitor.iframe_path
    # picture_path = monitor.picture_path
    sounds_path = f"/static/sound/{monitor.language}/"
    language = monitor.language
    language_display = monitor.language_display
    monitor_id = monitor.id
    number_text = monitor.number_text
    counter_text = monitor.counter_text

    if language_display == "Thai":
        pass
    print(sounds_path)
    return templates.TemplateResponse(
        "monitor_kiosk_info.html",
        {
            "request": {},
            "datas": datas,
            "now": _now,
            "monitor_services": monitor_services,
            "monitor_services_process": monitor_services_process,
            "system_services": True if system_config else False,
            "monitor_info": monitor_info,
            "video_path": video_path,
            # "iframe_path": "https://www.youtube.com/embed/W1zP2pV9470?autoplay=1&mute=1",
            "monitor_id": monitor_id,
            "service_counts": service_counts,
            "sounds_path": sounds_path,
            "MONITOR_LANGUAGE": language,
            "MONITOR_LANGUAGE_DISPLAY": language_display,
            "MONITOR_SELECT": monitor_id,
            "number_text": number_text,
            "counter_text": counter_text,
        },
    )


@router.get("/caller_key")
async def router_caller_key(
    caller_id: int = 1,
    db: AsyncSession = Depends(get_async_session),
):
    datas = {}
    _now = time_now()
    _sql = select(Service.id, Service.group, Service.name).where(Service.active == True)
    row = (await db.execute(_sql)).all()
    print(row)
    sevices = row
    _sql = (
        select(Transaction, Service)
        .where(
            Transaction.caller_device == caller_id,
        )
        .join(Service, (Transaction.service_id == Service.id))
    )
    row = (await db.execute(_sql)).first()
    last_service = None
    if row:
        last_service = row
    print(last_service)
    return templates.TemplateResponse(
        "caller_key.html",
        {
            "request": {},
            "datas": datas,
            "now": _now,
            "sevices": sevices,
            "caller_id": caller_id,
            "last_service": last_service,
        },
    )


@router.get("/services")
async def router_sevice(
    db: AsyncSession = Depends(get_async_session),
    user=Depends(access_cookie_token),
):
    if not user:
        return RedirectResponse(url="/")
    _now = time_now()
    print(user)
    datas = {}
    _sql = select(Service)
    services: Service = (await db.execute(_sql)).all()
    print(services)
    return templates.TemplateResponse(
        "services.html",
        {
            "request": {},
            "user": user,
            "datas": datas,
            "now": _now,
            "services": services,
        },
    )


@router.get("/system_config")
async def router_system_config(
    db: Session = Depends(get_async_session),
    user=Depends(access_cookie_token),
):
    if not user:
        return RedirectResponse(url="/")
    print(user)
    if not (await allowed_permissions(db, user, "system_config")):
        # return {"success": False, "msg": "not permission_allowed"}
        return templates.TemplateResponse(
            "403.html",
            {
                "request": {},
                "user": user,
            },
        )
    _now = time_now()
    print(user)
    datas = {}

    return templates.TemplateResponse(
        "system_config.html",
        {
            "request": {},
            "user": user,
            "datas": datas,
            "now": _now,
        },
    )

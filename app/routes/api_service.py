from http.client import HTTPResponse
import json
import os
import re
import shutil
import time
from typing import Optional, Union
from unittest import result
from PIL import Image, ImageFont, ImageOps, ImageDraw
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask
from fastapi import APIRouter, Depends, File, Form, Request, Header, UploadFile

from fastapi.exceptions import HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import (
    FileResponse,
    RedirectResponse,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, or_, desc, asc
from app.core.database import get_async_session
from app.core.auth import (
    access_cookie_token,
    allowed_permissions,
    get_jwt_access,
    get_user,
    get_user_by_id,
)
from app.core.utility import get_password_hash, verify_password

from app.core import config
from app.core.database import System_Users
from sqlalchemy import select
from fastapi import status, HTTPException
from PIL import Image, ImageOps
from io import BytesIO

from app.core.models import (
    Log,
    Monitor_QPKS,
    Printer_QPKS,
    Service,
    System_Users,
    System_User_Type,
    Transaction,
    Transaction_Record,
)
from app.routes.websocket import WebSockets
from app.stdio import (
    CREATED,
    PROCESS,
    RECALL,
    SUCCESS,
    time_now,
    print_warning,
    print_success,
    print_error,
)

router_service = APIRouter(prefix="/api/service", tags=["API_Service"])
router_transaction = APIRouter(prefix="/api/transaction", tags=["API_Transaction"])
router_app_config = APIRouter(prefix="/api/app_config", tags=["API_AppConfig"])

IMAGE_LOGO = None


@router_service.post("/")
async def path_service_post(
    id: int = Form(...),
    group: str = Form(None),
    name: str = Form(None),
    tag: str = Form(None),
    fg_color: str = Form(None),
    bg_color: str = Form(None),
    active: bool = Form(None),
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    print(bg_color)
    _sql = select(Service).where(Service.id == id)
    row = (await db.execute(_sql)).one_or_none()
    if row is None:
        return {"success": False, "data": "Service not found"}
    _service: Service = row[0]
    if group:
        _service.group = group
        await db.commit()

    if name:
        _service.name = name
        await db.commit()

    if tag:
        if tag == "-":
            tag = ""
        _service.tag = tag
        await db.commit()
    if fg_color:
        _service.fg_color = fg_color
        await db.commit()
    if bg_color:
        _service.bg_color = bg_color
        await db.commit()

    if active is not None:
        print(active)
        _service.active = active
        await db.commit()

    return {"success": True, "data": str(_service)}


# **ANCHOR - Printer Q Service **!SECTION


@router_transaction.post("/")
async def path_post_transaction(
    machine: str = Form(...),
    service_id: int = Form(...),
    number: str = Form(None),
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = select(Service).where(Service.id == service_id)
    row = (await db.execute(_sql)).one_or_none()
    if not row:
        return {"success": False, "data": "Service not found"}
    _service: Service = row[0]
    _sql = select(Transaction).where(Transaction.service_id == _service.id)
    if not number:
        last_number = (await db.execute(select(func.count()).select_from(_sql))).one()[
            0
        ] + 1
        number = str(last_number).zfill(3)

    sql = select(Transaction).limit(1).order_by(Transaction.id.desc())
    row = (await db.execute(sql)).one_or_none()
    print_success(row)
    if row:
        last_transaction: Transaction = row[0]
        if last_transaction.number == number:
            return {
                "success": True,
                "data": (last_transaction, last_transaction.service),
            }
    _transaction = Transaction(
        machine=machine,
        service_id=service_id,
        number=number,
        status=201,
        createDate=time_now(),
    )
    db.add(_transaction)
    await db.commit()
    await db.refresh(_transaction)
    print(_transaction.service)
    _sql = (
        select(func.count(Transaction.id))
        .where(
            Transaction.status == 201,
            Transaction.service_id == _service.id,
        )
        .group_by(Transaction.service_id)
    )
    wait_service = (await db.execute(_sql)).one()[0]

    _sql = select(func.count(Transaction.id)).where(Transaction.status == 201)
    wait_all = (await db.execute(_sql)).one()[0]
    cmd = {
        "cmd": "update",
        "service_id": service_id,
        "number": f"{_service.group}{number}",
        "wait_service": wait_service,
        "wait_all": wait_all,
    }
    json = {"caller_kiosk": cmd}
    await WebSockets.broadcast(json, "json")
    return {"success": True, "data": (_transaction, _transaction.service)}


# **ANCHOR - Called Devices services


@router_service.get("/service_status/")
async def path_get_service_status(
    caller_device: str = "test",
    service_id: Optional[int] = None,
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    service_info = {}
    if service_id:
        _sql = select(Service).where(Service.id == service_id)
        row = (await db.execute(_sql)).one_or_none()
        if not row:
            return {"success": False, "data": "Service not found"}
        _service: Service = row[0]
        service_info["Service"] = _service
        service_info["wait_all"] = 0
        _sql = (
            select(Transaction)
            .where(
                Transaction.status == PROCESS,
                Transaction.service_id == _service.id,
            )
            .order_by(Transaction.id)
        )
        row = (await db.execute(_sql)).first()
        if row:
            service_info["Transaction"] = row[0]

        _sql = select(
            Transaction.service_id,
            func.count(Transaction.id),
        ).where(Transaction.status == CREATED, Transaction.service_id == _service.id)
    else:
        _sql = (
            select(
                Transaction.service_id,
                Service.group,
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
    row = (await db.execute(_sql)).mappings().all()
    if not row:
        row = [{"service_id": service_id, "count": 0}]
    _sql = select(func.count(Transaction.id)).where(Transaction.status == 201)
    wait_all = (await db.execute(_sql)).one()[0]
    service_info["wait_all"] = wait_all
    return {"success": True, "data": row, "service_info": service_info}


@router_service.post("/service_call/")
async def path_post_service_call(
    service_id: int,
    caller_device: str,
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _now = time_now()
    _sql = select(Service).where(Service.id == service_id)
    row = (await db.execute(_sql)).one_or_none()
    if not row:
        return {"success": False, "data": "Service not found"}
    _service: Service = row[0]
    _sql = (
        select(Transaction)
        .where(
            Transaction.service_id == _service.id,
            Transaction.callerDate == None,
        )
        .order_by(Transaction.id)
    )
    row = (await db.execute(_sql)).first()
    print(row)
    transaction_call = None
    if row:
        transaction_call: Transaction = row[0]
        transaction_call.caller_device = caller_device
        transaction_call.callerDate = _now
        transaction_call.status = PROCESS
        await db.commit()
        await db.refresh(transaction_call)

        _sql = (
            select(
                Transaction.service_id,
                Service.group,
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
        row = (await db.execute(_sql)).all()
        # print(row)
        service_info = []
        wait_total = 0
        for i in row:
            # print(i)
            _s = {"service_id": i[0], "wait_count": i[3]}
            wait_total += i[3]
            service_info.append(_s)
        service_info.append({"service_id": 0, "wait_count": wait_total})

        transaction_call_data = {
            "caller_device": caller_device,
            "group": _service.group,
            "number": transaction_call.number,
            "status": transaction_call.status,
            "service_info": service_info,
        }
        json = {"monitor_kiosk": transaction_call_data}
        await WebSockets.broadcast(json, "json")

    else:
        sql = select(Transaction).limit(1).order_by(Transaction.id.desc())
        row = (await db.execute(sql)).one_or_none()
        print_success(row)
        if row:
            transaction_call: Transaction = row[0]
            transaction_call_data = {
                "caller_device": caller_device,
                "group": _service.group,
                "number": transaction_call.number,
                "status": transaction_call.status,
                # "service_info": service_info,
            }
            json = {"monitor_kiosk": transaction_call_data}
            await WebSockets.broadcast(json, "json")

    return {"success": True, "data": transaction_call}


@router_service.get("/service_call/slip_image/")
async def path_get_service_call_slip_image(
    transaction_id: str,
    printer_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    # **NOTE - Slip Generator
    slip_size_W = 400
    slip_size_max_h = 800

    def draw_text(img, text, py, font, align="center", slip_size_W=slip_size_W):
        text = str(text)
        # _w, _h = img.textsize(text, font=font)
        _w = 0
        texts = text.split("\n")
        stroke_width = 1
        for t in texts:
            _w_t = img.textlength(t.strip(), font=font)
            if _w_t > _w:
                _w = _w_t
        if align == "left":
            img.text((40, py), text, font=font, fill="black", stroke_width=stroke_width)
        elif align == "right":
            img.text(
                (slip_size_W - _w, py),
                text,
                font=font,
                fill="black",
                stroke_width=stroke_width,
            )
        else:
            img.text(
                (int((slip_size_W - _w) / 2), py),
                text,
                font=font,
                fill="black",
                stroke_width=stroke_width,
            )
        _h = font.size
        return _h * 1.5

    _now = time_now()
    _sql = (
        select(Transaction, Service)
        .where(Transaction.id == transaction_id)
        .join(
            Service,
            (Transaction.service_id == Service.id),
        )
    )
    row = (await db.execute(_sql)).one_or_none()
    if not row:
        return FileResponse("./static/image/error404.png")

    _sql = select(Printer_QPKS).where(
        Printer_QPKS.id == printer_id,
    )
    printer_QPKS: Printer_QPKS = (await db.execute(_sql)).one()[0]
    printerName = printer_QPKS.name

    transaction: Transaction = row[0]
    service: Service = row[1]

    _sql = select(func.count(Transaction.id)).where(
        Transaction.service_id == service.id, Transaction.status == CREATED
    )
    row = (await db.execute(_sql)).one_or_none()
    service_wait_count = row[0]
    number = f"{service.group}{transaction.number}"

    qr_code_number = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr_code_number.add_data(number)
    qr_code_number.make(fit=True)
    qr_code_number_image = qr_code_number.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
    )
    qr_size = int(slip_size_W * 0.5)
    qr_code_number_image = qr_code_number_image.resize(
        (qr_size, qr_size), Image.Resampling.LANCZOS
    )

    global IMAGE_LOGO
    if not IMAGE_LOGO:
        print_success("Creating image logo...")
        logo_img = Image.open("./static/image/logo.png")  # open in a PIL Image object
        logo_size = int(slip_size_W * 0.5)
        logo_img = logo_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        logo_print = Image.new("RGB", logo_img.size, (255, 255, 255))
        logo_print.paste(logo_img, mask=logo_img.split()[3])
        IMAGE_LOGO = logo_print

    offset_py = 0
    font_Q = ImageFont.truetype("./static/font/Kodchasan-Regular.ttf", 96)
    font_title = ImageFont.truetype("./static/font/Kodchasan-Regular.ttf", 48)
    font_data = ImageFont.truetype("./static/font/Kodchasan-Regular.ttf", 20)
    slip_image = Image.new(
        mode="RGB", size=(slip_size_W, slip_size_max_h), color=(0xFF, 0xFF, 0x9F)
    )
    _w, _h = IMAGE_LOGO.size
    slip_image.paste(IMAGE_LOGO, (int((slip_size_W - _w) / 2), offset_py))
    slip_draw = ImageDraw.Draw(slip_image)

    offset_py += _h

    _h = draw_text(slip_draw, f"{service.name}", offset_py, font_title, "center")
    offset_py += _h

    _h = draw_text(slip_draw, number, offset_py, font_Q, "center")
    offset_py += _h + 20

    # _w, _h = qr_code_number_image.size
    # slip_image.paste(qr_code_number_image, (int((slip_size_W - _w) / 2), offset_py))
    # slip_draw = ImageDraw.Draw(slip_image)
    # offset_py += _h

    _h = draw_text(
        slip_draw,
        f"จำนวนผู้รอรับบริการ {service_wait_count} ราย",
        offset_py,
        font_data,
        "right",
    )
    offset_py += _h

    _h = draw_text(slip_draw, f"พิมพ์ โดย:{printerName}", offset_py, font_data, "right")
    offset_py += _h

    _t = str(_now).split(".")[0]
    _h = draw_text(slip_draw, f"เวลา {_t}", offset_py, font_data, "right")
    offset_py += _h

    # ?*NOTE - For Save slip files
    offset_py += 50
    slip_size = (0, 0, slip_size_W, offset_py)
    slip_ing_file = slip_image.crop(slip_size)
    slip_image_file = f"slip_image.png"
    # slip_ing_file = ImageOps.expand(slip_ing_file, border=4, fill='red')
    slip_ing_file.save(slip_image_file)
    return FileResponse(slip_image_file)


@router_transaction.post("/recall/")
async def path_post_transaction_recall(
    transaction_id: int,
    caller_device: str = "test",
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = (
        select(Transaction, Service)
        .where(
            Transaction.id == transaction_id,
        )
        .join(Service, (Transaction.service_id == Service.id))
    )
    row = (await db.execute(_sql)).one_or_none()
    if not row:
        return {"success": False, "data": "Transaction not found"}
    _transaction: Transaction = row[0]
    _service: Service = row[1]
    print(_transaction)
    # TODO: This should Sound to call Module

    transaction_call_data = {
        "caller_device": caller_device,
        "group": _service.group,
        "number": _transaction.number,
        "status": 301,
    }
    json = {"monitor_kiosk": transaction_call_data}
    await WebSockets.broadcast(json, "json")
    return {"success": True, "data": "Successfully call transaction"}


@router_transaction.post("/update/")
async def path_post_transaction_update(
    transaction_id: int,
    status_code: int,
    caller_device: str = "test",
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = (
        select(Transaction, Service)
        .where(
            Transaction.id == transaction_id,
        )
        .join(Service, (Transaction.service_id == Service.id))
    )
    row = (await db.execute(_sql)).one_or_none()
    if not row:
        return {"success": False, "data": "Transaction not found"}
    _transaction: Transaction = row[0]
    _service: Service = row[1]

    _transaction.status = status_code

    await db.commit()
    await db.refresh(_transaction)

    transaction_call_data = {
        "caller_device": caller_device,
        "group": _service.group,
        "number": _transaction.number,
        "status": _transaction.status,
    }

    if status_code == RECALL:
        print_warning(f"Service Recall to :{_service.group}{_transaction.number}")
    # ! Transaction Success
    elif status_code == SUCCESS:
        transaction_record = Transaction_Record(
            machine=_transaction.machine,
            number=_transaction.number,
            createDate=_transaction.createDate,
            caller_device=_transaction.caller_device,
            callerDate=_transaction.callerDate,
            successDate=time_now(),
            review=_transaction.review,
            tag=_transaction.tag,
            status=_transaction.status,
            service_id=_transaction.service_id,
        )

        db.add(transaction_record)
        await db.commit()
        await db.delete(_transaction)
        await db.commit()

    else:
        print_error(f"Unknown Status Code:{status_code}")
    json = {"monitor_kiosk": transaction_call_data}
    await WebSockets.broadcast(json, "json")

    return {"success": True, "data": _transaction}


# **ANCHOR - DataTable API


@router_transaction.get("/datatable/")
async def path_transaction_datatable(
    req_para: Request,
    date_range: str = None,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    params = dict(req_para.query_params)
    select_columns = set()
    for k in params:
        # print(f"{k}:{params[k]}")
        match = re.search(r"^columns\[.*\]\[data\]", k)
        if match:
            select_columns.add(f"{params[k]}")
    # print(select_columns)
    order_by_col = params["order[0][column]"]

    order_by_column = params.get(f"columns[{order_by_col}][data]")
    order_dir = params["order[0][dir]"]

    print(order_by_col, order_by_column, order_dir)
    limit = params["length"]
    skip = params["start"]
    condition = ""
    search = params["search[value]"]

    rows = []

    condition = True
    search = search.strip()
    if search:
        if search.isdecimal():
            condition = or_(
                Transaction.id == int(search),
            )
        else:
            condition = or_(
                Transaction.service.name.like(f"%{search}%"),
            )
    # print_success(condition)

    if order_by_column:
        _table_name, _col_name = order_by_column.split(".")
    if _table_name == "Transaction":
        _order_columns = getattr(Transaction, _col_name, Transaction.id)

    if _table_name == "Service":
        _order_columns = getattr(Service, _col_name, Service.id)

    print(f"order_by_column : {_order_columns}")
    _order_by = _order_columns.asc() if order_dir == "asc" else _order_columns.desc()
    print_success(_order_by)

    sql = select(
        Transaction,
        Service,
    ).join(
        Service,
        (Transaction.service_id == Service.id),
    )

    # recordsTotal = (await db.execute(select(func.count()).select_from(sql))).one()[0]
    recordsTotal = (await db.execute(select(func.count()).select_from(sql))).one()[0]
    if search:
        _sql = sql.where(condition)
        recordsFiltered = (
            await db.execute(select(func.count()).select_from(_sql))
        ).one()[0]
    else:
        recordsFiltered = recordsTotal

    rows = (
        (
            await db.execute(
                sql.where(condition).order_by(_order_by).offset(skip).limit(limit)
            )
        )
        .mappings()
        .all()
    )

    # print(rows[0])
    result = {
        "draw": params["draw"],
        "recordsTotal": recordsTotal,
        "recordsFiltered": recordsFiltered,
        "data": rows,
    }

    # time.sleep(1)
    return result


@router_transaction.get("/datatable_record/")
async def path_transaction_datatable_record(
    req_para: Request,
    date_range: str = None,
    user_jwt=Depends(get_jwt_access),
    # user=Depends(access_cookie_token),
    db: AsyncSession = Depends(get_async_session),
):
    print("\n\n" + "*" * 20 + "datatable_record" + "*" * 20)
    try:
        d_start, d_end = date_range.split(" - ")
        d_start = d_start.replace("/", "-")
        d_end = d_end.replace("/", "-")

    except ValueError as e:
        return {"success": False, "msg": str(e)}

    print_success(f"{d_start} : {d_end}")

    params = dict(req_para.query_params)
    select_columns = set()
    for k in params:
        # print(f"{k}:{params[k]}")
        match = re.search(r"^columns\[.*\]\[data\]", k)
        if match:
            select_columns.add(f"{params[k]}")
    # print(select_columns)
    order_by_col = params["order[0][column]"]

    order_by_column = params.get(f"columns[{order_by_col}][data]")
    order_dir = params["order[0][dir]"]

    limit = params["length"]
    skip = params["start"]
    condition = ""
    search = params["search[value]"]

    rows = []

    condition = True
    search = search.strip()
    print(search)
    if search:
        if search.isdecimal():
            condition = or_(
                Transaction_Record.id == int(search),
            )
        else:
            condition = or_(
                Transaction_Record.machine.like(f"%{search}%"),
                Service.name.like(f"%{search}%"),
            )
    print_success(condition)

    print(order_by_col, order_by_column, order_dir)

    # _order_columns = Transaction_Record.id
    if order_by_column:
        _table_name, _col_name = order_by_column.split(".")
        if _table_name == "Transaction_Record":
            _order_columns = getattr(
                Transaction_Record, _col_name, Transaction_Record.id
            )

        if _table_name == "Service":
            _order_columns = getattr(Service, _col_name, Service.id)

    print(f"order_by_column : {_order_columns}")
    _order_by = _order_columns.asc() if order_dir == "asc" else _order_columns.desc()
    print_success(_order_by)

    # ? ----------------------- select ---------------------------------------!SECTION

    # sql = select(_table, Service_Fees, Log_Transaction, GateWay, Account_Record)
    # sql = select(_table).where(_table.date_time.between(d_start, d_end))
    # sql = select(_table)

    sql = (
        select(
            Transaction_Record,
            Service,
        )
        .join(
            Service,
            (Transaction_Record.service_id == Service.id),
        )
        .where(Transaction_Record.createDate.between(d_start, d_end))
    )

    # recordsTotal = (await db.execute(select(func.count()).select_from(sql))).one()[0]
    recordsTotal = (await db.execute(select(func.count()).select_from(sql))).one()[0]
    if search:
        _sql = sql.where(condition)
        recordsFiltered = (
            await db.execute(select(func.count()).select_from(_sql))
        ).one()[0]
    else:
        recordsFiltered = recordsTotal

    rows = (
        (
            await db.execute(
                sql.where(condition).order_by(_order_by).offset(skip).limit(limit)
            )
        )
        .mappings()
        .all()
    )

    # print(rows[0])
    result = {
        "draw": params["draw"],
        "recordsTotal": recordsTotal,
        "recordsFiltered": recordsFiltered,
        "data": rows,
    }

    # time.sleep(1)
    return result


@router_transaction.post("/chart/")
async def path_post_transaction_chart(
    date_range: str = Form(...),
    chart_type_select: str = Form(...),
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        d_start, d_end = date_range.split(" - ")
        d_start = d_start.replace("/", "-")
        d_end = d_end.replace("/", "-")

    except Exception as e:
        print_error(e)
        return {"success": False, "msg": str(e)}

    print(chart_type_select)
    _sql = (
        select(
            Transaction_Record.service_id,
            Transaction_Record.caller_device,
            Service.group,
            Service.name,
            func.count(Transaction_Record.id),
        )
        .where(Transaction_Record.createDate.between(d_start, d_end))
        .join(
            Service,
            Transaction_Record.service_id == Service.id,
        )
    )

    if chart_type_select == "services":
        _sql = _sql.group_by(Transaction_Record.service_id)
    elif chart_type_select == "counters":
        _sql = _sql.group_by(Transaction_Record.caller_device)
    else:
        _sql = _sql.group_by(Transaction_Record.service_id)

    row = (await db.execute(_sql)).mappings().all()

    return {"success": True, "data": row}


@router_transaction.post("/clear_transaction/")
async def path_clear_transaction(
    req_para: Request,
    # user_jwt=Depends(get_jwt_access),
    # user=Depends(access_cookie_token),
    db: AsyncSession = Depends(get_async_session),
):
    print("\n\n" + "*" * 20 + "clear_transaction" + "*" * 20)
    success = False
    mag = ""
    try:
        sql = select(Transaction)
        rows = (await db.execute(sql)).all()
        for row in rows:
            _transaction: Transaction = row[0]
            print_warning(_transaction)
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
        success = True
        json = {"monitor_kiosk": {"reload": True}}
        await WebSockets.broadcast(json, "json")
    except Exception as err:
        mag = f"{err}"
    return {"success": success, "mag": mag}


# **!SECTION **************************************************************************


@router_app_config.post("/app_config_monitor/")
async def path_post_app_config_monitor(
    monitor_id: int = Form(...),
    number_text: str = Form(None),
    counter_text: str = Form(None),
    infotitle: str = Form(None),
    info01: str = Form(None),
    info02: str = Form(None),
    language: str = Form(None),
    language_display: str = Form(None),
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = select(Monitor_QPKS).where(Monitor_QPKS.id == monitor_id)
    nonitor_QPKS: Monitor_QPKS = (await db.execute(_sql)).one()[0]

    if infotitle:
        nonitor_QPKS.info_title = info01
    if info02:
        nonitor_QPKS.info_text = info02
    if language:
        nonitor_QPKS.language = language
    if language_display:
        nonitor_QPKS.language = language_display
    if number_text:
        nonitor_QPKS.number_text = number_text
    if counter_text:
        nonitor_QPKS.counter_text = counter_text
    await db.commit()

    return {"success": True, "data": "successfully configured"}


@router_app_config.post("/app_config_monitor_video/")
async def path_post_app_config_monitor_video(
    monitor_id: int = Form(...),
    info_video: UploadFile = File(None),
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = select(Monitor_QPKS).where(Monitor_QPKS.id == monitor_id)
    monitor_QPKS: Monitor_QPKS = (await db.execute(_sql)).one()[0]

    if info_video and info_video.filename.split(".")[1] == "mp4":
        print_success(type(info_video))
        try:
            video_path = f"./static/video/monitor_QPKS_{monitor_QPKS.id}.mp4"
            with open(video_path, "wb") as buffer:
                shutil.copyfileobj(info_video.file, buffer)

            monitor_QPKS.video_path = video_path
            print_success(f"Uploaded video with {info_video.filename} successfully")
            await db.commit()
        except Exception as e:
            return {"success": False, "msg": str(e)}
            # return {"message": "There was an error uploading the file"}
        finally:
            info_video.file.close()
    else:
        return {"success": False, "data": "File not uploaded or not supported"}

    await db.commit()

    return {"success": True, "data": "successfully configured"}


@router_app_config.post("/app_config_monitor_reload/")
async def path_post_app_config_monitor_reload(
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    json = {"monitor_kiosk": {"reload": True}}
    await WebSockets.broadcast(json, "json")

    return {"success": True, "data": "successfully send monitor release"}


@router_app_config.post("/app_config_printer/")
async def path_post_app_config_printer(
    printer_id: int = Form(...),
    printer_name: str = Form(None),
    info_title: str = Form(None),
    info_text: str = Form(None),
    language: str = Form(None),
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = select(Printer_QPKS).where(
        Printer_QPKS.id == printer_id,
    )
    printer_QPKS: Printer_QPKS = (await db.execute(_sql)).one()[0]
    if info_title:
        printer_QPKS.info_title = info_title
    if info_text:
        printer_QPKS.info_text = info_text
    if language:
        printer_QPKS.language = language
    if printer_name:
        printer_QPKS.name = printer_name

    await db.commit()

    return {"success": True, "data": "successfully configured"}


@router_app_config.post("/app_config_printer_video/")
async def path_post_app_config_printer_video(
    printer_id: int = Form(...),
    printer_video: UploadFile = File(None),
    # user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    _sql = select(Printer_QPKS).where(Printer_QPKS.id == printer_id)
    printer_QPKS: Printer_QPKS = (await db.execute(_sql)).one()[0]

    if printer_video and printer_video.filename.split(".")[1] == "mp4":
        print_success(type(printer_video))
        try:
            video_path = f"./static/video/printer_QPKS_{printer_QPKS.id}.mp4"
            with open(video_path, "wb") as buffer:
                shutil.copyfileobj(printer_video.file, buffer)

            printer_QPKS.video_path = video_path
            print_success(f"Uploaded video with {printer_video.filename} successfully")
            await db.commit()
        except Exception as e:
            return {"success": False, "msg": str(e)}
            # return {"message": "There was an error uploading the file"}
        finally:
            printer_video.file.close()
    else:
        return {"success": False, "data": "File not uploaded or not supported"}

    await db.commit()

    return {"success": True, "data": "successfully configured"}


@router_app_config.post("/app_config_printer_reload/")
async def path_post_app_config_printer_reload(
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    json = {"printer_kiosk": {"reload": True}}
    await WebSockets.broadcast(json, "json")

    return {"success": True, "data": "successfully send printer release"}

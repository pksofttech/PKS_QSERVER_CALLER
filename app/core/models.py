from sqlmodel import Relationship, SQLModel, Field
from typing import List, Optional
from datetime import datetime

from app.stdio import time_now


class System_User_Type(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_type: str
    permission_allowed: str = Field(default="")
    system_users: List["System_Users"] = Relationship(back_populates="system_user_type")


class System_Users(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    name: str = Field(unique=True)
    password: str
    createDate: datetime = Field(default=time_now(0), nullable=False)
    create_by: str
    # last_login_Date = Column(DateTime)
    status: str
    pictureUrl: str = Field(default="/static/image/logo.png")
    remark: str = Field(default="")
    system_user_type_id: int = Field(foreign_key="system_user_type.id", nullable=False)
    system_user_type: Optional[System_User_Type] = Relationship(
        back_populates="system_users"
    )


class Log(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    time: Optional[datetime]
    log_type: Optional[str] = Field(default="info")
    msg: str
    log_owner: int = Field(default=None, foreign_key="system_users.id")


# **NOTE - For Q DATE
class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group: str = Field(unique=True)
    name: str = Field(unique=True)
    tag: Optional[str] = Field(default="")
    fg_color: str = Field(default="#2bbb07")
    bg_color: str = Field(default="#365566")
    msg: Optional[str] = Field(default="")
    status: str = Field(default="enable")
    active: bool = Field(default=True)
    transactions: List["Transaction"] = Relationship(back_populates="service")
    transaction_records: List["Transaction_Record"] = Relationship(
        back_populates="service"
    )


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    machine: str
    number: str
    createDate: datetime
    caller_device: str = Field(default=None, nullable=True)
    callerDate: datetime = Field(default=None, nullable=True)
    successDate: datetime = Field(default=None, nullable=True)
    review: int = Field(default=None, nullable=True)
    tag: Optional[str] = Field(default="")
    status: int
    service_id: int = Field(foreign_key="service.id", nullable=False)
    service: Optional[Service] = Relationship(back_populates="transactions")


class Transaction_Record(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    machine: str
    number: str
    createDate: datetime
    caller_device: str = Field(default=None, nullable=True)
    callerDate: datetime = Field(default=None, nullable=True)
    successDate: datetime = Field(default=None, nullable=True)
    review: int = Field(default=0)
    tag: Optional[str] = Field(default="")
    status: int
    service_id: int = Field(foreign_key="service.id", nullable=False)
    service: Optional[Service] = Relationship(back_populates="transaction_records")


class Monitor_QPKS(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    number_text: str = Field(default="หมายเลข")
    counter_text: str = Field(default="ช่องบริการ")
    info_title: str = Field(
        default="ข่าวประชาสัมพันธ์            Information mesages for the application QPKS"
    )
    info_text: str = Field(
        default="ระบบเรียกบริการคือระบบที่ใช้ในการจัดการและควบคุมการเรียกให้บริการหรือการรอคอยของลูกค้าหรือผู้ใช้บริการในสถานที่ต่าง ๆ เช่น โรงพยาบาล ห้างสรรพสินค้า ร้านอาหาร เป็นต้น เป้าหมายหลักของระบบเรียกบริการคือการลดระยะเวลารอคอยและเพิ่มประสิทธิภาพในการให้บริการแก่ลูกค้าหรือผู้ใช้งานโดยทั่วไป"
    )
    language: str = Field(default="Thai")
    language_display: str = Field(default="Thai")
    video_path: str = Field(default="/static/video/monitor_video_default.mp4")
    video_height: int = Field(default=400)
    iframe_path: str = Field(default="")
    iframe_height: int = Field(default=400)
    picture_path: str = Field(default="/static/image/monitor_picture_default.jpg")
    picture_height: int = Field(default=400)
    logo_path: str = Field(default="")


class Printer_QPKS(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    info_title: str = Field(
        default="ข่าวประชาสัมพันธ์            Information mesages for the application QPKS"
    )
    info_text: str = Field(
        default="ระบบเรียกบริการคือระบบที่ใช้ในการจัดการและควบคุมการเรียกให้บริการหรือการรอคอยของลูกค้าหรือผู้ใช้บริการในสถานที่ต่าง ๆ เช่น โรงพยาบาล ห้างสรรพสินค้า ร้านอาหาร เป็นต้น เป้าหมายหลักของระบบเรียกบริการคือการลดระยะเวลารอคอยและเพิ่มประสิทธิภาพในการให้บริการแก่ลูกค้าหรือผู้ใช้งานโดยทั่วไป"
    )
    language: str = Field(default="Thai")
    language_display: str = Field(default="Thai")
    video_path: str = Field(default="/static/video/monitor_video_default.mp4")
    video_height: int = Field(default=400)
    iframe_path: str = Field(default="")
    iframe_height: int = Field(default=400)
    picture_path: str = Field(default="/static/image/monitor_picture_default.jpg")
    picture_height: int = Field(default=400)
    logo_path: str = Field(default="")

    btn_service_visibles: str = Field(default="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15")

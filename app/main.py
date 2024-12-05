# Python > 3.8
# Edit by Pksofttech for user
# ? main for set application


# from fastapi_mqtt.fastmqtt import FastMQTT
# from fastapi_mqtt.config import MQTTConfig
import asyncio
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.openapi.docs import get_swagger_ui_html
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.stdio import time_now, print_success, print_warning

from app.core import auth, database


from app.routes import views, websocket, api_system_user, api_service


async def task_run_repeat_every() -> None:
    print_success("task_run_repeat_every for 60s")
    while True:
        _now = time_now()
        print_success(f"task_run_repeat_every : {_now}")
        if _now.hour == 0 and _now.minute == 0:
            print_success(f"Task run repeat :{time_now()}")
            await database.clear_transaction(force=True)
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(_):
    """lifespan"""
    # await database.init_db()
    # asyncio.create_task(task_run_repeat_every())
    print_success(f"Server Start Time : {time_now()}")
    yield
    # Clean up the ML models and release the resources
    print_warning(f"Server shutdown Time : {time_now()}")


app = FastAPI(
    title="WEB-API",
    version="3.10",
    lifespan=lifespan,
    docs_url=None,
)

app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """custom_swagger_ui_html"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Docs Api",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/docs/swagger-ui-bundle.js",
        swagger_css_url="/static/docs/swagger-ui.css",
        swagger_favicon_url="/static/favicon.svg",
        # swagger_ui_parameters={"syntaxHighlight.theme": "obsidian"},
    )


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.middleware("http")
# async def process_time(request: Request, call_next):
#     start_time = time_now()
#     print("-" * 50)
#     response = await call_next(request)
#     process_time = time_now() - start_time
#     response.headers["X-Process-Time"] = str(process_time)
#     print(f"Process time :{process_time.microseconds} us")
#     print("-" * 50)
#     return response


# ? Setting router path


app.include_router(auth.router)
app.include_router(websocket.router)
app.include_router(views.router)
app.include_router(api_system_user.router)
app.include_router(api_service.router_service)
app.include_router(api_service.router_transaction)
app.include_router(api_service.router_app_config)


# @app.exception_handler(HTTPException)
# async def app_exception_handler(request: Request, exception: HTTPException):
#     url_str = str(request.url).split("/")[-1]
#     # print_error(url_str)
#     if request.method == "GET":
#         print_error(exception.detail)
#         if exception.detail == "Not Found":
#             if "." in url_str:
#                 return HTMLResponse(str(exception.detail), status_code=exception.status_code)
#             return RedirectResponse(url=f"/page_404?url={request.url}")
#         return PlainTextResponse(str(exception.detail), status_code=exception.status_code)

#     else:
#         return JSONResponse(str(exception.detail), status_code=exception.status_code)

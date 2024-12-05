"""Start App Module"""

import configparser
import sys
import uvicorn

# from uvicorn.config import LOGGING_CONFIG

# LOGGING_CONFIG["formatters"]["default"][
#     "fmt"
# ] = "%(asctime)s %(levelprefix)s %(message)s"

print("*" * 100)
print("*" * 100)
print("\n\nStarting Server...")

PROD_MODE = False
try:
    if sys.argv[1] == "prod":
        PROD_MODE = True
except IndexError:
    print("WARNING : >> Run Server in Dev Mode")
if __name__ == "__main__":
    HOST = "0.0.0.0"
    PORT = 8000
    print(f"Start App Service at IP>>{HOST}:{PORT}")
    print(f"Service at Mode Product >>{PROD_MODE}")
    uvicorn.run(
        "app.main:app",
        # workers=4,
        host=HOST,
        port=PORT,
        timeout_keep_alive=30,
        reload_includes=["*.html"],
        reload_dirs=[
            "./app",
            "./templates",
        ],
        reload=not PROD_MODE,
        # debug=True,
        # log_level="warning",
    )

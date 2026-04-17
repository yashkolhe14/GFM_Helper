"""
Consulevent Azure Application Template
---------------------------------------
This is the entry point for your application.
Replace this with your actual application code.

Supports:
- Plain Python scripts / AI pipelines
- Flask web applications
- FastAPI web applications

Uncomment the relevant section below based on your project type.
"""

import os
import sys

# Add the repo root to the path so shared modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "../../.."))

# Uncomment when you need Key Vault access:
# from shared.keyvault import get_secret


# -------------------------------------------------------
# OPTION 1: Plain Python Script / AI Pipeline (default)
# -------------------------------------------------------
def run():
    """Main entry point for scripts and AI pipelines."""
    print("Starting Consulevent application...")

    # Example: retrieve a secret from Key Vault
    # api_key = get_secret("your-project-apikey")

    # Add your application logic here
    pass


if __name__ == "__main__":
    run()


# -------------------------------------------------------
# OPTION 2: Flask Web Application
# Uncomment below and run: flask run
# -------------------------------------------------------
# from flask import Flask
# app = Flask(__name__)
#
# @app.route("/")
# def index():
#     return {"status": "ok", "service": "consulevent-app"}
#
# @app.route("/health")
# def health():
#     return {"status": "healthy"}
#
# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=8000)


# -------------------------------------------------------
# OPTION 3: FastAPI Web Application
# Uncomment below and run: uvicorn src.app:app --reload
# -------------------------------------------------------
# from fastapi import FastAPI
# app = FastAPI()
#
# @app.get("/")
# def index():
#     return {"status": "ok", "service": "consulevent-app"}
#
# @app.get("/health")
# def health():
#     return {"status": "healthy"}

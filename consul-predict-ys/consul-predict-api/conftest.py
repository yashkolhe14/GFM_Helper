import sys
import os

# consul-predict-api/ — package root
sys.path.insert(0, os.path.dirname(__file__))
# src/ — for `from agent import ...` and `from app import ...`
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
# consul-predict/ — for `from shared.keyvault import get_secret`
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

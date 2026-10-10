import os
import sys

# Add backend directory to Python sys.path so Azure can boot from root or backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from config.wsgi import application

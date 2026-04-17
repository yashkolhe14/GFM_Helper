FROM python:3.11-slim

WORKDIR /app

COPY consul-predict-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY consul-predict-api/src/ ./src/
COPY shared/ ./shared/
COPY config/ ./config/

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]

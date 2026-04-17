# ConsulPredict

A predictive analytics service for Consulevent client engagements. Provides AI-powered forecasting and insight generation via a REST API.

> **Status:** Scaffold deployed. Implementation in progress.

---

## Services

| Service | Folder | Deploy Target | Container App |
|---|---|---|---|
| ConsulPredict API | `consul-predict-api/` | Container Apps | `app-consul-predict-api-dev` |

**Live URL:** `https://app-consul-predict-api-dev.bravemeadow-2ffacfe5.centralindia.azurecontainerapps.io`

---

## Key Vault Secrets

All secrets prefixed `consul-predict-`. Stored in `kv-consulevent-dev`. Engineers have read access only — platform team adds secrets.

| Secret | Purpose |
|---|---|
| `consul-predict-openai-endpoint` | Azure OpenAI endpoint |
| `consul-predict-openai-apikey` | Azure OpenAI API key |

Add further secrets here as the app grows.

---

## Local Development
```bash
cd consul-predict/consul-predict-api/
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Run tests
pytest tests/ -v --cov=src --cov-report=term-missing

# Run linter
flake8 src/ tests/ --max-line-length=120

# Run locally
export KEY_VAULT_URL=https://kv-consulevent-dev.vault.azure.net/
python src/app.py
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/predict` | Submit input for prediction — implementation pending |

---
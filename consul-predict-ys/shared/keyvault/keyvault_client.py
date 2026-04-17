"""
keyvault_client.py

Shared Key Vault client for all Consulevent Azure projects.

The Key Vault URL is loaded from the environment variable KEY_VAULT_URL,
falling back to the dev vault if not set. This makes the module client-agnostic
— each client deployment sets KEY_VAULT_URL in their Container App environment.

Usage:
    from shared.keyvault import get_secret
    secret = get_secret("my-secret-name")
"""

import os

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

# Key Vault URL is configurable per deployment via environment variable.
# Default to dev vault for local development.
_DEFAULT_KEY_VAULT_URL = "https://kv-consulevent-dev.vault.azure.net/"
KEY_VAULT_URL = os.environ.get("KEY_VAULT_URL", _DEFAULT_KEY_VAULT_URL)

_client = None


def _get_client() -> SecretClient:
    """Initialise and return a singleton Key Vault client."""
    global _client
    if _client is None:
        credential = DefaultAzureCredential()
        _client = SecretClient(vault_url=KEY_VAULT_URL, credential=credential)
    return _client


def get_secret(secret_name: str) -> str:
    """
    Retrieve a secret from Key Vault.

    Args:
        secret_name: The name of the secret e.g. 'consul-predict-openai-apikey'

    Returns:
        The secret value as a string.
    """
    client = _get_client()
    secret = client.get_secret(secret_name)
    return secret.value

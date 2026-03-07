from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

def get_supabase() -> Client:
    """
    Returns a fresh Supabase client instance.
    We avoid caching a global instance because the underlying 
    httpx HTTP/2 client can drop long-lived idle connections 
    and raise httpcore.RemoteProtocolError on subsequent requests.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

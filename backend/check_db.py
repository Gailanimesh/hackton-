import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table("projects").select("*").limit(1).execute()
if res.data:
    print("Project columns:", list(res.data[0].keys()))
else:
    print("No projects found, or table empty.")
    
inv = supabase.table("invitations").select("*").limit(1).execute()
if inv.data:
    print("Invitation columns:", list(inv.data[0].keys()))

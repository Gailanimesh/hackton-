import os
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client, Client

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Testing connection to missions table...")
    res = supabase.table("missions").select("*").limit(1).execute()
    print("Success! Data:", res.data)
    
    print("\nTesting parallel/rapid requests...")
    for i in range(5):
        print(f"Request {i+1}...")
        supabase.table("missions").select("*").limit(1).execute()
        
    print("Rapid requests succeeded.")
    
except Exception as e:
    print(f"Error occurred: {type(e).__name__} - {str(e)}")
    import traceback
    traceback.print_exc()

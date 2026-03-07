import os
from database import get_supabase
from dotenv import load_dotenv

# Run locally or in script
load_dotenv()

def seed_vendor_history():
    print("🌱 Connecting to Supabase...")
    supabase = get_supabase()

    # 1. Fetch all vendors who have profiles
    print("🔍 Fetching registered vendors...")
    response = supabase.table("vendor_details").select("id, business_name").execute()
    vendors = response.data

    if not vendors:
        print("❌ No vendors found in `vendor_details`. Please register a vendor first.")
        return

    print(f"✅ Found {len(vendors)} vendors. Generating history data...")

    history_entries = []

    # 2. Create impressive fake history for each vendor
    for vendor in vendors:
        vendor_id = vendor["id"]
        business_name = vendor["business_name"]
        
        # Entry 1: Highly successful enterprise project
        history_entries.append({
            "vendor_id": vendor_id,
            "project_name": f"{business_name} - Enterprise Migration Phase 1",
            "category": "Software Migration",
            "success_rate": 98,
            "feedback_summary": "Extremely fast delivery, followed all ISO 27001 guidelines perfectly. Minimal bugs in production."
        })
        
        # Entry 2: Average project with some delays 
        history_entries.append({
            "vendor_id": vendor_id,
            "project_name": f"{business_name} - Legacy System Update",
            "category": "Maintenance",
            "success_rate": 85,
            "feedback_summary": "Solid technical work but communication was slightly delayed. End result was still fully functional."
        })
        
        # Entry 3: Specialized quick sprint
        history_entries.append({
            "vendor_id": vendor_id,
            "project_name": f"{business_name} - Security Audit Protocol",
            "category": "Security",
            "success_rate": 100,
            "feedback_summary": "Top tier consulting. Found vulnerabilities no one else caught. RFP compliant."
        })

    # 3. Insert into database
    print("💾 Inserting history records into Supabase...")
    try:
        # Clear existing history first to avoid duplicates if run multiple times
        print("🧹 Clearing old history data...")
        supabase.table("vendor_history").delete().neq("project_name", "dummy_value_to_delete_all").execute()
        
        # Insert new demo data
        result = supabase.table("vendor_history").insert(history_entries).execute()
        print(f"🎉 Successfully inserted {len(history_entries)} demo history records for {len(vendors)} vendors!")
    except Exception as e:
        print(f"❌ Error inserting history: {str(e)}")

if __name__ == "__main__":
    seed_vendor_history()

import os
import time
from database import get_supabase

def seed_vendors():
    supabase = get_supabase()

    mock_vendors = [
        {
            "email": "vendor_ai@example.com",
            "password": "Password123!",
            "full_name": "Synthetix AI Solutions",
            "business_name": "Synthetix AI Solutions",
            "domain": "Artificial Intelligence / Machine Learning",
            "services": ["LLM Integration", "Computer Vision", "Data Science", "Python", "TensorFlow"],
            "preferred_work_mode": "remote",
            "service_tier": "quality",
            "min_budget": 5000
        },
        {
            "email": "vendor_web@example.com",
            "password": "Password123!",
            "full_name": "Rapid Web Creators",
            "business_name": "Rapid Web Creators",
            "domain": "Web Development / UI Design",
            "services": ["React", "Vue", "Frontend", "UI/UX", "TailwindCSS", "FastAPI"],
            "preferred_work_mode": "remote",
            "service_tier": "speed",
            "min_budget": 1000
        },
        {
            "email": "vendor_logistics@example.com",
            "password": "Password123!",
            "full_name": "Global Cargo Movers",
            "business_name": "Global Cargo Movers",
            "domain": "Logistics / Supply Chain",
            "services": ["Last-Mile Delivery", "Cold Storage", "Freight Forwarding", "Supply Chain Management"],
            "preferred_work_mode": "onsite",
            "service_tier": "quality",
            "min_budget": 20000
        },
        {
            "email": "vendor_hardware@example.com",
            "password": "Password123!",
            "full_name": "IoT Embedded Systems Inc",
            "business_name": "IoT Embedded Systems Inc",
            "domain": "Hardware / Embedded Engineering",
            "services": ["Raspberry Pi", "Arduino", "PCB Design", "IoT Sensors", "C++", "Robotics"],
            "preferred_work_mode": "hybrid",
            "service_tier": "quality",
            "min_budget": 10000
        }
    ]

    print("Starting Vendor Database Seeding...")

    for v in mock_vendors:
        print(f"\nProcessing {v['business_name']}...")
        
        # 1. Sign up the user (or login if exists)
        try:
            auth_response = supabase.auth.sign_up({
                "email": v["email"],
                "password": v["password"],
                "options": {
                    "data": {
                        "full_name": v["full_name"],
                        "role": "vendor"
                    }
                }
            })
            user_id = auth_response.user.id
            print(f"  [OK] User created/found with ID: {user_id}")
        except Exception as e:
            print(f"  [WARN] Signup failed (might already exist): {e}")
            # Try logging in to get the ID instead
            auth_response = supabase.auth.sign_in_with_password({
                "email": v["email"],
                "password": v["password"]
            })
            user_id = auth_response.user.id
            print(f"  [OK] User logged in successfully. ID: {user_id}")
        
        # 2. Add slight delay for Supabase triggers to run (create profile)
        time.sleep(2)

        # 2.5 Manual Profile fallback
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "full_name": v["full_name"],
                "role": "vendor"
            }).execute()
        except Exception as e:
            print(f"  [WARN] Profile manual insert failed: {e}")

        # 3. Upsert Vendor Details
        try:
            res = supabase.table("vendor_details").upsert({
                "id": user_id,
                "business_name": v["business_name"],
                "vendor_domain": v["domain"],
                "skills": v["services"],
                "preferred_work_mode": v["preferred_work_mode"],
                "service_tier": v["service_tier"],
                "min_budget": v["min_budget"]
            }).execute()
            print(f"  [OK] Vendor details stored successfully.")
        except Exception as e:
            print(f"  [FAILED] Failed to store vendor details: {e}")

    print("\n[DONE] Seeding complete! You can now test the AI Matchmaking.")
    print("Test prompts for the Generator:")
    print("1. 'Build an advanced image recognition mobile app.' (Should match Synthetix & Web Creators)")
    print("2. 'Establish a nationwide cold chain delivery network.' (Should match Global Cargo Movers)")
    print("3. 'Design an autonomous warehouse robot prototype.' (Should match IoT Embedded & Synthetix)")

if __name__ == "__main__":
    seed_vendors()

"""
Quick test script for the backend API.
Run the backend first: python main.py
"""
import requests
import uuid
import os

BASE = "http://127.0.0.1:8000"

TEST_USER_ID = os.getenv("TEST_USER_ID", "00000000-0000-0000-0000-000000000000")
def test():
    print("1. Health check...")
    r = requests.get(f"{BASE}/")
    print(f"   {r.status_code}: {r.json()}")
    print("\n2. Generate projects...")
    mission = "home Automation"
    r = requests.post(f"{BASE}/generate-projects", json={
        "user_id": TEST_USER_ID,
        "mission_text": mission,
    })
    if r.status_code != 200:
        print(f"   FAILED: {r.status_code} - {r.text}")
        return
    data = r.json()
    print(f"   mission_id: {data['mission_id']}")
    print(f"   projects: {len(data['projects'])}")
    for p in data["projects"]:
        print(f"     - {p['project_name']}")
    print(f"\n3. Generate subtasks for -" )
    for i in range(len(data["projects"])):
        if data["projects"]:
            proj = data["projects"][i]
            print(f"\n{proj['project_name']}...")
            r = requests.post(f"{BASE}/generate-subtasks", json={
                "project_id": proj["id"],
                "project_name": proj["project_name"],
            })
            if r.status_code != 200:
                print(f"   FAILED: {r.status_code} - {r.text}")
                return
            tasks = r.json()["tasks"]
            print(f"   tasks: {len(tasks)}")
            for t in tasks:
                print(f"     - {t['task_name']}")

    print("\nDone.")

if __name__ == "__main__":
    test()

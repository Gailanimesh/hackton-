"""
LLM integration for OpenAI and Google Gemini.
Uses whichever API key is available (OpenAI takes precedence).
"""
import re
import json
import os
from typing import Any

from config import OPENAI_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY


def _call_openai(prompt: str) -> str:
    import httpx
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
        },
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_gemini(prompt: str) -> str:
    import httpx
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}"
    response = httpx.post(
        url,
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7},
        },
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    return text.strip()


def _call_groq(prompt: str) -> str:
    import httpx
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
        },
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


MATCHING_PROMPT = """You are an AI Matchmaker for a procurement platform.
Your job is to evaluate if a Vendor is a good match for a specific Project.
The project has a budget, deadline, work mode, and service tier requirement.
The vendor has a specific domain, skill set, and preferred execution preferences.

Project Name: {project_name}
Project Requirements: {required_technologies}
Project Description: {description}
Project Constraints: Budget: ${budget}, Deadline: {deadline}, Mode: {work_mode}, Tier: {service_tier}
RFP Rules / Compliance Needs: {rfp_rules}

Vendor Name: {business_name}
Vendor Domain: {vendor_domain}
Vendor Skills: {skills}
Vendor Past Performance History: {vendor_history}

Scoring Criteria:
1. Technical Fit (30%): Does the vendor have the specific skills and technologies required?
2. RFP Compliance (30%): Does the vendor's profile and history prove they meet the strict RFP rules? Deduct heavily if they fail a hard constraint.
3. Historical Reliability (25%): Does their past performance history show they are reliable and competent for this type of work?
4. Logistics & Tier (15%): Does the project budget meet the vendor's minimums, and is the service tier compatible?

Output:
- score: A match score from 0-100.
- match_reason: A 1-sentence punchy summary for the MANAGER (e.g., "Perfect technical fit, 100% RFP compliant, and proven 98% success rate in past projects.").
- fit_analysis: A 2-3 sentence technical analysis for the VENDOR, explaining why they were selected and how their specific history or skills align with the RFP and project constraints.

Return ONLY a JSON object with this exact format:
{{
    "score": 85,
    "match_reason": "Strong technical alignment and proven history, though budget is tight.",
    "fit_analysis": "Your profile was selected because your React skills perfectly match the 'Project Name' requirements, and your past 98% success rate in Software Migration proves you can handle this. You also fully satisfy the ISO 27001 RFP requirement."
}}
"""

def call_llm(prompt: str) -> str:
    errors = []
    # Try Gemini FIRST since we know it works from Phase 3
    if GOOGLE_API_KEY:
        try:
            return _call_gemini(prompt)
        except Exception as e:
            errors.append(f"Gemini failed: {str(e)}")
    # Try OpenAI
    if OPENAI_API_KEY:
        try:
            return _call_openai(prompt)
        except Exception as e:
            errors.append(f"OpenAI failed: {str(e)}")
    # Try Groq
    if GROQ_API_KEY:
        try:
            return _call_groq(prompt)
        except Exception as e:
            errors.append(f"Groq failed: {str(e)}")
    
    raise ValueError(" | ".join(errors) or "No API keys configured")


def parse_json_response(raw: str) -> dict[str, Any]:
    # 1. Strip reasoning tags if present (e.g. <thought>...</thought>)
    raw = re.sub(r'<thought>.*?</thought>', '', raw, flags=re.DOTALL)
    
    # 2. Extract content between first { and last }
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # 3. Last ditch effort: fix common AI mistakes (trailing commas, etc.)
        import ast
        try:
            return ast.literal_eval(cleaned)
        except:
            raise ValueError(f"Could not parse AI response as JSON: {cleaned[:100]}...")


def parse_list(data: Any, key: str) -> list[Any]:
    """Helper to find a list in data even if the key is slightly different."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # Direct match
        if key in data and isinstance(data[key], list):
            return data[key]
        # Case insensitive match
        for k, v in data.items():
            if k.lower().strip() == key.lower().strip() and isinstance(v, list):
                return v
        # Any list found
        for v in data.values():
            if isinstance(v, list):
                return v
    return []
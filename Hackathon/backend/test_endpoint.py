#!/usr/bin/env python3
"""
Quick test script for the review insights endpoint
"""
import requests
import json

def test_review_insights():
    url = "http://localhost:8000/ai/review-insights"
    
    test_data = {
        "comment": "Great service, very friendly staff! The food was delicious and the atmosphere was perfect.",
        "rating": 5,
        "businessContext": "Family restaurant in downtown area"
    }
    
    try:
        print("🧪 Testing review insights endpoint...")
        print(f"📤 Request: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"📥 Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"📥 {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    print("🚀 Testing FastAPI endpoints...\n")
    
    # Test health first
    test_health()
    print()
    
    # Test review insights
    test_review_insights()
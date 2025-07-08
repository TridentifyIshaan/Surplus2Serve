"""
Test script for MongoDB integration in Surplus2Serve backend.
Run this to verify that all components are working correctly.
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

class BackendTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.product_id = None
    
    async def test_health_check(self, session):
        """Test health endpoint."""
        print("\n1. Testing health check...")
        
        async with session.get(f"{BASE_URL}/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✓ Health check passed")
                print(f"  - API Status: {data.get('status')}")
                print(f"  - Model Status: {data.get('model_status')}")
                print(f"  - Database Status: {data.get('database_status', 'unknown')}")
                print(f"  - Version: {data.get('version')}")
                return True
            else:
                print(f"✗ Health check failed: {response.status}")
                return False
    
    async def test_registration(self, session):
        """Test user registration."""
        print("\n2. Testing user registration...")
        
        test_user = {
            "username": f"testuser_{int(datetime.now().timestamp())}",
            "email": f"test_{int(datetime.now().timestamp())}@example.com",
            "full_name": "Test User",
            "user_type": "supplier",
            "organization": "Test Organization",
            "location": "Test City",
            "password": "testpassword123"
        }
        
        async with session.post(
            f"{BASE_URL}/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("success"):
                    self.user_id = data["data"]["user_id"]
                    print(f"✓ Registration successful")
                    print(f"  - User ID: {self.user_id}")
                    self.test_user = test_user
                    return True
                else:
                    print(f"✗ Registration failed: {data.get('message')}")
                    return False
            else:
                error_data = await response.json()
                print(f"✗ Registration failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_login(self, session):
        """Test user login."""
        print("\n3. Testing user login...")
        
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        async with session.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("success"):
                    self.token = data["data"]["access_token"]
                    print(f"✓ Login successful")
                    print(f"  - Token received: {self.token[:20]}...")
                    print(f"  - User type: {data['data']['user']['user_type']}")
                    return True
                else:
                    print(f"✗ Login failed: {data.get('message')}")
                    return False
            else:
                error_data = await response.json()
                print(f"✗ Login failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_protected_endpoint(self, session):
        """Test accessing protected endpoint."""
        print("\n4. Testing protected endpoint access...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        async with session.get(f"{BASE_URL}/auth/me", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✓ Protected endpoint access successful")
                print(f"  - Username: {data.get('username')}")
                print(f"  - Email: {data.get('email')}")
                print(f"  - User type: {data.get('user_type')}")
                return True
            else:
                error_data = await response.json()
                print(f"✗ Protected endpoint access failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_product_creation(self, session):
        """Test product creation."""
        print("\n5. Testing product creation...")
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        test_product = {
            "commodity_name": "Tomato",
            "commodity_category": "Vegetables",
            "quantity": 10.5,
            "unit": "kg",
            "temperature": 25.0,
            "humidity": 75.0,
            "storage_type": "cold_storage",
            "days_since_harvest": 3,
            "location": "Test Farm Location",
            "pickup_address": "123 Test Street, Test City",
            "packaging_quality": "good",
            "transport_duration": 8.0,
            "available_from": datetime.now().isoformat(),
            "notes": "Test product for MongoDB integration"
        }
        
        async with session.post(
            f"{BASE_URL}/products",
            json=test_product,
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("success"):
                    self.product_id = data["data"]["product_id"]
                    print(f"✓ Product creation successful")
                    print(f"  - Product ID: {self.product_id}")
                    return True
                else:
                    print(f"✗ Product creation failed: {data.get('message')}")
                    return False
            else:
                error_data = await response.json()
                print(f"✗ Product creation failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_prediction(self, session):
        """Test spoilage prediction."""
        print("\n6. Testing spoilage prediction...")
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        prediction_request = {
            "Commodity_name": "Tomato",
            "Commodity_Category": "Vegetables",
            "Temperature": 25.0,
            "Humidity": 75.0,
            "Storage_Type": "cold_storage",
            "Days_Since_Harvest": 3,
            "Transport_Duration": 8.0,
            "Packaging_Quality": "good",
            "Month_num": 7,
            "Location": "Delhi",
            "Ethylene_Level": 0.0
        }
        
        async with session.post(
            f"{BASE_URL}/predict",
            json=prediction_request,
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✓ Prediction successful")
                print(f"  - Risk Score: {data.get('Spoilage_Risk_Score', 0):.3f}")
                print(f"  - Risk Level: {data.get('Risk_Interpretation')}")
                print(f"  - Estimated Shelf Life: {data.get('Estimated_Shelf_Life')} days")
                print(f"  - Model Version: {data.get('Model_Version')}")
                return True
            else:
                error_data = await response.json()
                print(f"✗ Prediction failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_my_products(self, session):
        """Test getting user's products."""
        print("\n7. Testing user products retrieval...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        async with session.get(f"{BASE_URL}/my-products", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✓ Products retrieval successful")
                print(f"  - Total products: {data.get('total', 0)}")
                print(f"  - Products on page: {len(data.get('items', []))}")
                if data.get('items'):
                    product = data['items'][0]
                    print(f"  - First product: {product.get('commodity_name')} (Risk: {product.get('spoilage_risk_score', 'N/A')})")
                return True
            else:
                error_data = await response.json()
                print(f"✗ Products retrieval failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def test_analytics(self, session):
        """Test analytics dashboard."""
        print("\n8. Testing analytics dashboard...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        async with session.get(f"{BASE_URL}/analytics/dashboard?days=7", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✓ Analytics retrieval successful")
                summary = data.get('summary', {})
                print(f"  - Total predictions: {summary.get('total_predictions', 0)}")
                print(f"  - Total products: {summary.get('total_products', 0)}")
                print(f"  - Average risk score: {summary.get('avg_risk_score', 0):.3f}")
                return True
            else:
                error_data = await response.json()
                print(f"✗ Analytics retrieval failed: {response.status} - {error_data.get('detail')}")
                return False
    
    async def run_all_tests(self):
        """Run all tests."""
        print("=== Surplus2Serve MongoDB Integration Test ===")
        
        async with aiohttp.ClientSession() as session:
            tests = [
                self.test_health_check,
                self.test_registration,
                self.test_login,
                self.test_protected_endpoint,
                self.test_product_creation,
                self.test_prediction,
                self.test_my_products,
                self.test_analytics
            ]
            
            passed = 0
            failed = 0
            
            for test in tests:
                try:
                    result = await test(session)
                    if result:
                        passed += 1
                    else:
                        failed += 1
                except Exception as e:
                    print(f"✗ Test failed with exception: {e}")
                    failed += 1
            
            print(f"\n=== Test Results ===")
            print(f"✓ Passed: {passed}")
            print(f"✗ Failed: {failed}")
            print(f"Total: {passed + failed}")
            
            if failed == 0:
                print("\n🎉 All tests passed! MongoDB integration is working correctly.")
            else:
                print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
            
            return failed == 0

async def main():
    """Main test function."""
    print("Starting MongoDB integration tests...")
    print("Make sure your FastAPI server is running on http://localhost:8000")
    print("and MongoDB is connected.\n")
    
    # Wait for user confirmation
    input("Press Enter to continue...")
    
    tester = BackendTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n✅ MongoDB integration is fully functional!")
        print("\nNext steps:")
        print("1. Update your frontend to use the new authenticated endpoints")
        print("2. Test the complete user flow in your browser")
        print("3. Deploy to production with proper security settings")
    else:
        print("\n❌ Some tests failed. Please review the error messages above.")
        print("\nTroubleshooting:")
        print("1. Check if the FastAPI server is running: uvicorn main:app --reload")
        print("2. Verify MongoDB connection in the health check")
        print("3. Check the server logs for detailed error messages")
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(result)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        sys.exit(1)

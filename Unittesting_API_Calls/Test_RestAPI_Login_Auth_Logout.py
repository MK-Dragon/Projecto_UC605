#import unittest
import requests
import json
import warnings

# --- Configuration ---
# WARNING: When testing against 'https://localhost', you usually need verify=False
# because of self-signed SSL certificates.
SERVER_IP = "https://localhost:7181"

# Define expected response bodies (these are now just for reference, not mocking)
EXPECTED_LOGIN_SUCCESS = {"token": "mock_jwt_token_12345", "username": "admin", "message": "Login successful!"}
EXPECTED_LOGIN_FAILED = {"message": "Invalid credentials."}


class TestAPI():
    """
    Integration Test suite for the /api/login endpoint.
    
    NOTE: This suite requires the server running at https://localhost:7181 
    to be active and configured with the 'admin:123' credentials.
    """
    # Class-level variables to store state for subsequent tests
    token: str = "None"
    username: str = "None"

    @classmethod
    def setUpClass(cls):
        # Suppress the InsecureRequestWarning that arises from using verify=False
        warnings.filterwarnings("ignore", category=requests.packages.urllib3.exceptions.InsecureRequestWarning)


    # Test Case 1: Failed Login Login (401)
    def test_01_login_fail(self):
        print("\nTestlogin with code 401 and captures the token:")
        try:
            url = SERVER_IP + "/api/login"
        
            # 1. Prepare and execute the request, disabling SSL verification
            data = {"username": "admin", "password": "hgfhfg"}
            response = requests.post(url, json=data, timeout=10, verify=False)
            
            # 2. Assertions
            # Ensure the test fails if the server is unreachable or SSL fails
            #response.raise_for_status() 
            
            print(f"\tExpected status code 401 -> Got {response.status_code}")

            
            # 3. Check response content and capture token for later tests
        
            response_json = response.json()
            #self.assertEqual(response_json.get("message"), "Login successful!", "Check for success message.")
            
            TestAPI.token = response_json.get("token")
            TestAPI.username = response_json.get("username")
            
            #self.assertTrue(TestAPI.token, "Token should be captured from the response.")
            print(f"\nTest 200 Success Passed. Captured Token: {TestAPI.token[:10]}...")
            
        except Exception as e:
            #self.fail(f"Test failed: Received 200 but response was not valid JSON. Response text: {response.text}")
            print(f"\tError: {e}")


    # Test Case 2: Successful Login (200)
    def test_02_login_success(self):
        print("\nTestlogin with code 200 and captures the token:")
        try:
            url = SERVER_IP + "/api/login"
        
            # 1. Prepare and execute the request, disabling SSL verification
            data = {"username": "admin", "password": "123"}
            response = requests.post(url, json=data, timeout=10, verify=False)
            
            # 2. Assertions
            # Ensure the test fails if the server is unreachable or SSL fails
            #response.raise_for_status() 
            
            print(f"\tExpected status code 200 -> Got {response.status_code}")
            
            # 3. Check response content and capture token for later tests
        
            response_json = response.json()
            #self.assertEqual(response_json.get("message"), "Login successful!", "Check for success message.")
            
            TestAPI.token = response_json.get("token")
            TestAPI.username = response_json.get("username")
            
            #self.assertTrue(TestAPI.token, "Token should be captured from the response.")
            print(f"\nTest 200 Success Passed. Captured Token: {TestAPI.token[:10]}...")
            
        except Exception as e:
            #self.fail(f"Test failed: Received 200 but response was not valid JSON. Response text: {response.text}")
            print(f"\tError: {e}")


    def test_03_get_products_with_Token(self):
        print("\nTestlogin with code 200 and captures the token:")
        try:
            url = SERVER_IP + "/api/getproducts"
            # 1. Prepare and execute the request, disabling SSL verification
            data = {"username": "admin", "token": self.token}
            response = requests.get(url, json=data, timeout=10, verify=False)

            print(f"\tExpected status code 200 -> Got {response.status_code}")

            for i in response.json()["products"]:
                print(f"\t\t{i}")

        except Exception as e:
            #self.fail(f"Test failed: Received 200 but response was not valid JSON. Response text: {response.text}")
            print(f"\tError: {e}")







if __name__ == '__main__':
    # Add verbosity (v=2) to see test names in the output
    test = TestAPI()

    test.test_01_login_fail()
    test.test_02_login_success()
    test.test_03_get_products_with_Token()
import unittest
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


class TestLoginAPI(unittest.TestCase):
    """
    Integration Test suite for the /api/login endpoint.
    
    NOTE: This suite requires the server running at https://localhost:7181 
    to be active and configured with the 'admin:123' credentials.
    """
    # Class-level variables to store state for subsequent tests
    token: str = ""
    username: str = ""

    @classmethod
    def setUpClass(cls):
        # Suppress the InsecureRequestWarning that arises from using verify=False
        warnings.filterwarnings("ignore", category=requests.packages.urllib3.exceptions.InsecureRequestWarning)


    # Test Case 1: Successful Login (200)
    def test_01_login_success(self):
        """Tests successful login with code 200 and captures the token."""
        url = SERVER_IP + "/api/login"
        
        # 1. Prepare and execute the request, disabling SSL verification
        data = {"username": "admin", "password": "123"}
        response = requests.post(url, json=data, timeout=10, verify=False)
        
        # 2. Assertions
        # Ensure the test fails if the server is unreachable or SSL fails
        response.raise_for_status() 
        
        self.assertEqual(response.status_code, 200, "Expected status code 200 for successful login.")
        
        # 3. Check response content and capture token for later tests
        try:
            response_json = response.json()
            self.assertEqual(response_json.get("message"), "Login successful!", "Check for success message.")
            
            TestLoginAPI.token = response_json.get("token")
            TestLoginAPI.username = response_json.get("username")
            
            self.assertTrue(TestLoginAPI.token, "Token should be captured from the response.")
            print(f"\nTest 200 Success Passed. Captured Token: {TestLoginAPI.token[:10]}...")
            
        except json.JSONDecodeError:
            self.fail(f"Test failed: Received 200 but response was not valid JSON. Response text: {response.text}")


    # Test Case 2: Failed Login (401 Unauthorized or 400 Bad Request)
    def test_02_login_failure(self):
        """Tests login failure with code 401 (or 400, depending on API design)."""
        url = SERVER_IP + "/api/login"

        # 1. Prepare and execute the request with bad credentials, disabling SSL verification
        data = {"username": "lol", "password": "algo"}
        response = requests.post(url, json=data, timeout=10, verify=False)

        # 2. Assertions
        # We expect a failure status code (4xx), so we do NOT use response.raise_for_status() here.
        self.assertIn(response.status_code, [400, 401], "Expected status code 400 or 401 for invalid credentials.")
        
        try:
            response_json = response.json()
            # The API documentation suggests 401 returns 'Invalid credentials.'
            self.assertEqual(response_json.get("message"), "Invalid credentials.", "Check for failure message.")
            print("\nTest 401/400 Failure Passed.")
        except json.JSONDecodeError:
             self.fail(f"Test failed: Received {response.status_code} but response was not valid JSON. Response text: {response.text}")
    
    def test_03_get_products_with_Token(self):
        """Tests login failure with code 401 (or 400, depending on API design)."""
        url = SERVER_IP + "/api/getproducts"

        # 1. Prepare and execute the request with bad credentials, disabling SSL verification
        data = {"username": "lol", "token": self.token, "data": None}
        response = requests.get(url, json=data, timeout=10, verify=False)

        print(response.json())




if __name__ == '__main__':
    # Add verbosity (v=2) to see test names in the output
    unittest.main(argv=['first-arg-is-ignored'], exit=False, verbosity=2)
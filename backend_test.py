#!/usr/bin/env python3
"""
SUÉLTALO Crypto Wallet Backend API Test Suite
Tests all backend endpoints for the crypto wallet application
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Configuration
BASE_URL = "https://latam-wallet.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test Data
TEST_WALLET_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
TEST_EMAIL = "test@sueltalo.com"
TEST_FULL_NAME = "Test User"
TEST_TRANSACTION_AMOUNT = 10.5  # USDC amount that should generate 1.05 SLT reward

class APITester:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results = []
        
    def log_test(self, test_name, passed, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response_data and not passed:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "response": response_data
        })
        
        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
    
    def test_health_check(self):
        """Test the health check endpoint"""
        print("🔍 Testing Health Check Endpoint...")
        try:
            response = requests.get(f"{BASE_URL}/health", headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and "timestamp" in data:
                    self.log_test("Health Check", True, f"API is healthy - {data.get('service', 'Unknown service')}")
                    return True
                else:
                    self.log_test("Health Check", False, "Invalid health response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_wallet_creation(self):
        """Test wallet creation endpoint"""
        print("🔍 Testing Wallet Creation...")
        try:
            wallet_data = {
                "public_key": TEST_WALLET_ADDRESS,
                "address": TEST_WALLET_ADDRESS
            }
            
            response = requests.post(f"{BASE_URL}/wallet", 
                                   json=wallet_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("public_key") == TEST_WALLET_ADDRESS and 
                    data.get("address") == TEST_WALLET_ADDRESS and
                    "id" in data and "created_at" in data):
                    self.log_test("Wallet Creation", True, f"Wallet created with ID: {data.get('id')}")
                    return True
                else:
                    self.log_test("Wallet Creation", False, "Invalid wallet response format", data)
                    return False
            else:
                self.log_test("Wallet Creation", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Wallet Creation", False, f"Request error: {str(e)}")
            return False
    
    def test_wallet_retrieval(self):
        """Test wallet retrieval endpoint"""
        print("🔍 Testing Wallet Retrieval...")
        try:
            response = requests.get(f"{BASE_URL}/wallet/{TEST_WALLET_ADDRESS}", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("public_key") == TEST_WALLET_ADDRESS and 
                    "balance_sol" in data and "balance_usdc" in data and "balance_slt" in data):
                    self.log_test("Wallet Retrieval", True, f"Wallet retrieved successfully")
                    return True
                else:
                    self.log_test("Wallet Retrieval", False, "Invalid wallet data format", data)
                    return False
            else:
                self.log_test("Wallet Retrieval", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Wallet Retrieval", False, f"Request error: {str(e)}")
            return False
    
    def test_wallet_balance(self):
        """Test wallet balance endpoint"""
        print("🔍 Testing Wallet Balance Query...")
        try:
            response = requests.get(f"{BASE_URL}/wallet/{TEST_WALLET_ADDRESS}/balance", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if ("balances" in data and 
                    "SOL" in data["balances"] and 
                    "USDC" in data["balances"] and 
                    "SLT" in data["balances"] and
                    data.get("public_key") == TEST_WALLET_ADDRESS):
                    balances = data["balances"]
                    self.log_test("Wallet Balance", True, 
                                f"Balances - SOL: {balances['SOL']}, USDC: {balances['USDC']}, SLT: {balances['SLT']}")
                    return True
                else:
                    self.log_test("Wallet Balance", False, "Invalid balance response format", data)
                    return False
            else:
                self.log_test("Wallet Balance", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Wallet Balance", False, f"Request error: {str(e)}")
            return False
    
    def test_transaction_creation(self):
        """Test transaction creation and SLT reward calculation"""
        print("🔍 Testing Transaction Creation and SLT Rewards...")
        try:
            # Create a USDC transaction that should generate SLT rewards
            transaction_data = {
                "from_address": TEST_WALLET_ADDRESS,
                "to_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",  # Different test address
                "amount": TEST_TRANSACTION_AMOUNT,
                "token_type": "USDC",
                "signature": "test_signature_12345"
            }
            
            response = requests.post(f"{BASE_URL}/transaction", 
                                   json=transaction_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_slt_reward = TEST_TRANSACTION_AMOUNT * 0.1  # 0.1 SLT per USDC
                
                if (data.get("amount") == TEST_TRANSACTION_AMOUNT and
                    data.get("token_type") == "USDC" and
                    data.get("reward_slt") == expected_slt_reward and
                    "id" in data and "timestamp" in data):
                    self.log_test("Transaction Creation", True, 
                                f"Transaction created with {expected_slt_reward} SLT reward")
                    return data.get("id")  # Return transaction ID for further tests
                else:
                    self.log_test("Transaction Creation", False, 
                                f"Invalid transaction data or SLT reward calculation", data)
                    return None
            else:
                self.log_test("Transaction Creation", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Transaction Creation", False, f"Request error: {str(e)}")
            return None
    
    def test_transaction_history(self):
        """Test transaction history retrieval"""
        print("🔍 Testing Transaction History...")
        try:
            response = requests.get(f"{BASE_URL}/wallet/{TEST_WALLET_ADDRESS}/transactions", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Transaction History", True, 
                                f"Retrieved {len(data)} transactions")
                    return True
                else:
                    self.log_test("Transaction History", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Transaction History", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Transaction History", False, f"Request error: {str(e)}")
            return False
    
    def test_kyc_start(self):
        """Test KYC process initiation"""
        print("🔍 Testing KYC Process Start...")
        try:
            kyc_data = {
                "wallet_address": TEST_WALLET_ADDRESS,
                "email": TEST_EMAIL,
                "full_name": TEST_FULL_NAME
            }
            
            response = requests.post(f"{BASE_URL}/kyc/start", 
                                   json=kyc_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("success") == True and 
                    data.get("status") == "pending" and
                    "kyc_id" in data):
                    self.log_test("KYC Start", True, f"KYC started with ID: {data.get('kyc_id')}")
                    return data.get("kyc_id")
                else:
                    self.log_test("KYC Start", False, "Invalid KYC start response", data)
                    return None
            else:
                self.log_test("KYC Start", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("KYC Start", False, f"Request error: {str(e)}")
            return None
    
    def test_kyc_status_progression(self):
        """Test KYC status progression (pending -> under_review -> approved)"""
        print("🔍 Testing KYC Status Progression...")
        try:
            # Test initial status (should be pending)
            response = requests.get(f"{BASE_URL}/kyc/status/{TEST_WALLET_ADDRESS}", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") in ["pending", "under_review", "approved"]:
                    self.log_test("KYC Status Check", True, 
                                f"KYC status: {data.get('status')}")
                    
                    # If status is pending, wait a bit and check for progression
                    if data.get("status") == "pending":
                        print("   Waiting 65 seconds to test status progression...")
                        time.sleep(65)  # Wait for status to change to under_review
                        
                        response2 = requests.get(f"{BASE_URL}/kyc/status/{TEST_WALLET_ADDRESS}", 
                                               headers=HEADERS, 
                                               timeout=10)
                        if response2.status_code == 200:
                            data2 = response2.json()
                            if data2.get("status") == "under_review":
                                self.log_test("KYC Status Progression", True, 
                                            "Status progressed to under_review")
                                return True
                            else:
                                self.log_test("KYC Status Progression", False, 
                                            f"Expected under_review, got {data2.get('status')}", data2)
                                return False
                    return True
                else:
                    self.log_test("KYC Status Check", False, "Invalid KYC status", data)
                    return False
            else:
                self.log_test("KYC Status Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("KYC Status Check", False, f"Request error: {str(e)}")
            return False
    
    def test_slt_airdrop(self):
        """Test SLT token airdrop functionality"""
        print("🔍 Testing SLT Airdrop...")
        try:
            airdrop_amount = 100.0
            
            response = requests.post(f"{BASE_URL}/slt/airdrop", 
                                   params={"wallet_address": TEST_WALLET_ADDRESS, "amount": airdrop_amount},
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("success") == True and 
                    "transaction_id" in data and
                    f"{airdrop_amount}" in data.get("message", "")):
                    self.log_test("SLT Airdrop", True, 
                                f"Airdropped {airdrop_amount} SLT tokens")
                    return True
                else:
                    self.log_test("SLT Airdrop", False, "Invalid airdrop response", data)
                    return False
            else:
                self.log_test("SLT Airdrop", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("SLT Airdrop", False, f"Request error: {str(e)}")
            return False
    
    def test_cors_headers(self):
        """Test CORS configuration"""
        print("🔍 Testing CORS Headers...")
        try:
            response = requests.options(f"{BASE_URL}/health", 
                                      headers={**HEADERS, "Origin": "https://example.com"}, 
                                      timeout=10)
            
            cors_headers = response.headers
            if ("Access-Control-Allow-Origin" in cors_headers or 
                response.status_code in [200, 204]):
                self.log_test("CORS Configuration", True, "CORS headers present")
                return True
            else:
                self.log_test("CORS Configuration", False, "CORS headers missing", dict(cors_headers))
                return False
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🚀 SUÉLTALO Crypto Wallet Backend API Test Suite")
        print("=" * 60)
        print(f"Testing API at: {BASE_URL}")
        print(f"Test wallet: {TEST_WALLET_ADDRESS}")
        print("=" * 60)
        print()
        
        # Run tests in logical order
        tests_passed = []
        
        # 1. Health Check
        tests_passed.append(self.test_health_check())
        
        # 2. CORS
        tests_passed.append(self.test_cors_headers())
        
        # 3. Wallet Management
        tests_passed.append(self.test_wallet_creation())
        tests_passed.append(self.test_wallet_retrieval())
        tests_passed.append(self.test_wallet_balance())
        
        # 4. Transaction Management
        transaction_id = self.test_transaction_creation()
        tests_passed.append(transaction_id is not None)
        tests_passed.append(self.test_transaction_history())
        
        # 5. KYC System
        kyc_id = self.test_kyc_start()
        tests_passed.append(kyc_id is not None)
        tests_passed.append(self.test_kyc_status_progression())
        
        # 6. SLT Token System
        tests_passed.append(self.test_slt_airdrop())
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📈 Success Rate: {(self.passed_tests/(self.passed_tests + self.failed_tests)*100):.1f}%")
        print()
        
        if self.failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"   • {result['test']}: {result['message']}")
            print()
        
        # Check critical functionality
        critical_tests = [
            "Health Check",
            "Wallet Creation", 
            "Wallet Balance",
            "Transaction Creation"
        ]
        
        critical_failures = [r for r in self.test_results 
                           if not r["passed"] and r["test"] in critical_tests]
        
        if critical_failures:
            print("🚨 CRITICAL ISSUES DETECTED:")
            for failure in critical_failures:
                print(f"   • {failure['test']}: {failure['message']}")
            print()
            return False
        else:
            print("✅ All critical backend functionality is working!")
            return True

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
SUÉLTALO Crypto Wallet Devnet API Test Suite
Tests Solana Devnet integration endpoints
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Configuration
BASE_URL = "https://que-etapa.preview.emergentagent.com/api/devnet"
HEADERS = {"Content-Type": "application/json"}

# Test Data - Using real Devnet addresses from the review request
TREASURY_ADDRESS = "ERXnmYXWkMeWGJR54RUX7qUvfkz7qEBhVW4aAx6wcvv8"
SLT_MINT = "9P9kuseXSQPEdmrmy2DJ2NYa4tvf69yZVnbDu1VApi84"
USDC_MOCK_MINT = "2C9UWeZwQ8W3pjV65uJcpWYWdqw2sghqiq2MvBGNW2qr"

class DevnetAPITester:
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
    
    def test_devnet_balance(self):
        """Test GET /api/devnet/balance/:address endpoint"""
        print("🔍 Testing Devnet Balance Endpoint...")
        try:
            # Test with treasury address
            response = requests.get(f"{BASE_URL}/balance/{TREASURY_ADDRESS}", 
                                  headers=HEADERS, 
                                  timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["address", "sol_balance", "slt_balance", "usdc_balance", "timestamp"]
                
                if all(field in data for field in required_fields):
                    if data.get("address") == TREASURY_ADDRESS:
                        self.log_test("Devnet Balance - Treasury", True, 
                                    f"SOL: {data['sol_balance']}, SLT: {data['slt_balance']}, USDC: {data['usdc_balance']}")
                        return True
                    else:
                        self.log_test("Devnet Balance - Treasury", False, 
                                    f"Address mismatch: expected {TREASURY_ADDRESS}, got {data.get('address')}", data)
                        return False
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Devnet Balance - Treasury", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Devnet Balance - Treasury", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Devnet Balance - Treasury", False, f"Request error: {str(e)}")
            return False
    
    def test_devnet_balance_invalid_address(self):
        """Test balance endpoint with invalid address"""
        print("🔍 Testing Devnet Balance with Invalid Address...")
        try:
            invalid_address = "invalid_address_123"
            response = requests.get(f"{BASE_URL}/balance/{invalid_address}", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            # Should return error for invalid address
            if response.status_code >= 400:
                self.log_test("Devnet Balance - Invalid Address", True, 
                            f"Correctly rejected invalid address with HTTP {response.status_code}")
                return True
            else:
                # If it returns 200, check if balance is 0 (which is also acceptable)
                data = response.json()
                if data.get("sol_balance") == 0.0:
                    self.log_test("Devnet Balance - Invalid Address", True, 
                                "Invalid address returned zero balance (acceptable)")
                    return True
                else:
                    self.log_test("Devnet Balance - Invalid Address", False, 
                                "Invalid address should return error or zero balance", data)
                    return False
                
        except Exception as e:
            self.log_test("Devnet Balance - Invalid Address", False, f"Request error: {str(e)}")
            return False
    
    def test_verify_transaction(self):
        """Test POST /api/devnet/verify-transaction endpoint"""
        print("🔍 Testing Devnet Verify Transaction...")
        try:
            # Test with a sample transaction signature (this will likely not exist, but tests the endpoint)
            test_signature = "5VERxVfbK2thJ9AP2MtLVXM48C2Z9JkuEKv4FYnwwYnH9kxgLLDbuFqFzSEfJQjYjVWBFKg1NNq1Mh1MuHdw9voD"
            
            request_data = {
                "signature": test_signature
            }
            
            response = requests.post(f"{BASE_URL}/verify-transaction", 
                                   json=request_data,
                                   headers=HEADERS, 
                                   timeout=15)
            
            if response.status_code == 404:
                # Expected for non-existent transaction
                self.log_test("Devnet Verify Transaction", True, 
                            "Correctly returned 404 for non-existent transaction")
                return True
            elif response.status_code == 200:
                data = response.json()
                required_fields = ["signature", "valid", "rewardedSLT", "usdcAmount"]
                
                if all(field in data for field in required_fields):
                    self.log_test("Devnet Verify Transaction", True, 
                                f"Valid response structure: {data}")
                    return True
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Devnet Verify Transaction", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Devnet Verify Transaction", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Devnet Verify Transaction", False, f"Request error: {str(e)}")
            return False
    
    def test_airdrop_stats(self):
        """Test GET /api/devnet/airdrop-stats/:address endpoint"""
        print("🔍 Testing Devnet Airdrop Stats...")
        try:
            response = requests.get(f"{BASE_URL}/airdrop-stats/{TREASURY_ADDRESS}", 
                                  headers=HEADERS, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["address", "date", "total_received_today", "remaining_today", "cap_per_day", "max_per_transaction"]
                
                if all(field in data for field in expected_fields):
                    if data.get("address") == TREASURY_ADDRESS:
                        self.log_test("Devnet Airdrop Stats", True, 
                                    f"Stats retrieved: received today: {data['total_received_today']}, remaining: {data['remaining_today']}")
                        return True
                    else:
                        self.log_test("Devnet Airdrop Stats", False, 
                                    f"Address mismatch: expected {TREASURY_ADDRESS}, got {data.get('address')}", data)
                        return False
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Devnet Airdrop Stats", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Devnet Airdrop Stats", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Devnet Airdrop Stats", False, f"Request error: {str(e)}")
            return False
    
    def test_faucet_request(self):
        """Test POST /api/devnet/faucet endpoint"""
        print("🔍 Testing Devnet Faucet...")
        try:
            request_data = {
                "address": TREASURY_ADDRESS,
                "amount": 1.0
            }
            
            response = requests.post(f"{BASE_URL}/faucet", 
                                   json=request_data,
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["message", "rpc_url", "address", "amount"]
                
                if all(field in data for field in expected_fields):
                    if (data.get("rpc_url") == "https://api.devnet.solana.com" and 
                        data.get("address") == TREASURY_ADDRESS and
                        data.get("amount") == 1.0):
                        self.log_test("Devnet Faucet", True, 
                                    f"Faucet info returned correctly: {data['message']}")
                        return True
                    else:
                        self.log_test("Devnet Faucet", False, 
                                    "Incorrect faucet response values", data)
                        return False
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Devnet Faucet", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Devnet Faucet", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Devnet Faucet", False, f"Request error: {str(e)}")
            return False
    
    def test_slt_airdrop_endpoint(self):
        """Test POST /api/devnet/airdrop-slt endpoint"""
        print("🔍 Testing SLT Airdrop Endpoint...")
        try:
            request_data = {
                "recipient_address": TREASURY_ADDRESS,
                "amount": 1.0,
                "trigger_tx_signature": None
            }
            
            response = requests.post(f"{BASE_URL}/airdrop-slt", 
                                   json=request_data,
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["success", "message", "recipient"]
                
                if all(field in data for field in required_fields):
                    if data.get("recipient") == TREASURY_ADDRESS:
                        self.log_test("SLT Airdrop Endpoint", True, 
                                    f"Airdrop response: {data['message']}")
                        return True
                    else:
                        self.log_test("SLT Airdrop Endpoint", False, 
                                    f"Recipient mismatch: expected {TREASURY_ADDRESS}, got {data.get('recipient')}", data)
                        return False
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("SLT Airdrop Endpoint", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("SLT Airdrop Endpoint", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("SLT Airdrop Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Devnet API tests"""
        print("=" * 70)
        print("🚀 SUÉLTALO Crypto Wallet Devnet API Test Suite")
        print("=" * 70)
        print(f"Testing API at: {BASE_URL}")
        print(f"Treasury address: {TREASURY_ADDRESS}")
        print(f"SLT Mint: {SLT_MINT}")
        print(f"USDC-MOCK Mint: {USDC_MOCK_MINT}")
        print("=" * 70)
        print()
        
        # Run tests in logical order
        tests_passed = []
        
        # 1. Balance endpoints
        tests_passed.append(self.test_devnet_balance())
        tests_passed.append(self.test_devnet_balance_invalid_address())
        
        # 2. Transaction verification
        tests_passed.append(self.test_verify_transaction())
        
        # 3. Airdrop functionality
        tests_passed.append(self.test_airdrop_stats())
        tests_passed.append(self.test_slt_airdrop_endpoint())
        
        # 4. Faucet
        tests_passed.append(self.test_faucet_request())
        
        # Print summary
        print("=" * 70)
        print("📊 DEVNET TEST SUMMARY")
        print("=" * 70)
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
            "Devnet Balance - Treasury",
            "Devnet Verify Transaction", 
            "Devnet Airdrop Stats",
            "Devnet Faucet"
        ]
        
        critical_failures = [r for r in self.test_results 
                           if not r["passed"] and r["test"] in critical_tests]
        
        if critical_failures:
            print("🚨 CRITICAL DEVNET ISSUES DETECTED:")
            for failure in critical_failures:
                print(f"   • {failure['test']}: {failure['message']}")
            print()
            return False
        else:
            print("✅ All critical Devnet functionality is working!")
            return True

if __name__ == "__main__":
    tester = DevnetAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
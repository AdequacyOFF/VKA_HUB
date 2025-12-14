#!/bin/bash

# API Testing Script for VKA Hub
# Tests POST, PUT, and GET endpoints

set -e

BASE_URL="http://localhost:8000"
TEST_LOGIN="test_user_$(date +%s)"
TEST_PASSWORD="testpass123"
ACCESS_TOKEN=""

echo "========================================="
echo "VKA Hub API Testing Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/health)
if [ "$response" = "200" ]; then
    success "Health check passed"
else
    error "Health check failed (HTTP $response)"
    exit 1
fi
echo ""

# Test 2: Register New User
echo "Test 2: Register New User"
register_response=$(curl -s -X POST ${BASE_URL}/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"login\": \"${TEST_LOGIN}\",
        \"password\": \"${TEST_PASSWORD}\",
        \"password_confirm\": \"${TEST_PASSWORD}\"
    }")

if echo "$register_response" | grep -q "id"; then
    success "User registered successfully"
    info "Response: $register_response"
else
    error "User registration failed"
    info "Response: $register_response"
fi
echo ""

# Test 3: Login
echo "Test 3: Login"
login_response=$(curl -s -X POST ${BASE_URL}/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{
        \"login\": \"${TEST_LOGIN}\",
        \"password\": \"${TEST_PASSWORD}\"
    }")

ACCESS_TOKEN=$(echo $login_response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    success "Login successful"
    info "Access token obtained"
else
    error "Login failed"
    info "Response: $login_response"
    exit 1
fi
echo ""

# Test 4: Update User Profile (PUT)
echo "Test 4: Update User Profile (PUT)"
profile_response=$(curl -s -X PUT ${BASE_URL}/api/users/profile \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d "{
        \"first_name\": \"Test\",
        \"last_name\": \"User\",
        \"study_group\": \"ИВТ-101\"
    }")

if echo "$profile_response" | grep -q "first_name"; then
    success "Profile updated successfully (PUT)"
    info "Response: $profile_response"
else
    error "Profile update failed"
    info "Response: $profile_response"
fi
echo ""

# Test 5: Get User List (GET)
echo "Test 5: Get User List (GET)"
users_response=$(curl -s -X GET "${BASE_URL}/api/users?limit=10" \
    -H "Content-Type: application/json")

if echo "$users_response" | grep -q "items"; then
    success "User list retrieved successfully (GET)"
    user_count=$(echo $users_response | grep -o '"total":[0-9]*' | cut -d':' -f2)
    info "Total users: $user_count"
else
    error "Failed to retrieve user list"
    info "Response: $users_response"
fi
echo ""

# Test 6: Create Certificate (POST)
echo "Test 6: Create Certificate (POST)"
cert_response=$(curl -s -X POST ${BASE_URL}/api/certificates \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d "{
        \"title\": \"Test Certificate\",
        \"description\": \"This is a test certificate\",
        \"category\": \"Testing\",
        \"file_url\": \"http://example.com/cert.pdf\"
    }")

CERT_ID=$(echo $cert_response | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$CERT_ID" ]; then
    success "Certificate created successfully (POST)"
    info "Certificate ID: $CERT_ID"
else
    error "Certificate creation failed"
    info "Response: $cert_response"
fi
echo ""

# Test 7: Update Certificate (PUT)
if [ -n "$CERT_ID" ]; then
    echo "Test 7: Update Certificate (PUT)"
    update_cert_response=$(curl -s -X PUT ${BASE_URL}/api/certificates/${CERT_ID} \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -d "{
            \"title\": \"Updated Test Certificate\",
            \"description\": \"This certificate has been updated\"
        }")

    if echo "$update_cert_response" | grep -q "Updated Test Certificate"; then
        success "Certificate updated successfully (PUT)"
        info "Response: $update_cert_response"
    else
        error "Certificate update failed"
        info "Response: $update_cert_response"
    fi
    echo ""
fi

# Test 8: Get Certificates (GET)
echo "Test 8: Get Certificates (GET)"
get_certs_response=$(curl -s -X GET ${BASE_URL}/api/certificates \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$get_certs_response" | grep -q "items"; then
    success "Certificates retrieved successfully (GET)"
    cert_count=$(echo $get_certs_response | grep -o '"id":[0-9]*' | wc -l)
    info "Total certificates: $(echo $cert_count | tr -d ' ')"
else
    error "Failed to retrieve certificates"
    info "Response: $get_certs_response"
fi
echo ""

# Test 9: Token Refresh
echo "Test 9: Token Refresh"
REFRESH_TOKEN=$(echo $login_response | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$REFRESH_TOKEN" ]; then
    refresh_response=$(curl -s -X POST ${BASE_URL}/api/auth/refresh \
        -H "Content-Type: application/json" \
        -d "{
            \"refresh_token\": \"${REFRESH_TOKEN}\"
        }")

    NEW_ACCESS_TOKEN=$(echo $refresh_response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

    if [ -n "$NEW_ACCESS_TOKEN" ]; then
        success "Token refresh successful"
        info "New access token obtained"
    else
        error "Token refresh failed"
        info "Response: $refresh_response"
    fi
else
    error "No refresh token available"
fi
echo ""

echo "========================================="
echo "API Testing Complete!"
echo "========================================="

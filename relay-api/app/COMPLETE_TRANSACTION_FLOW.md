# Complete Step-by-Step Flow (Updated with Server-Side IP Capture)

## Setup Phase

1. **You create API key** → User gets API key from your dashboard
2. **You set IPINFO_TOKEN** → Your relay API can capture locations server-side
3. **User deploys app** → User's app calls your `/v1/relay` endpoint with their API key
4. **User's app is live** → End-users can now make payments through user's app

## Transaction Flow

### Step 1: End-User Initiates Payment

- **End-user** (in Japan) opens user's deployed app
- **End-user** wants to send 0.1 ETH to `0x742d35Cc...`
- **User's app** may or may not capture end-user location client-side

### Step 2: User's App Calls Your Relay API

#### Case A: User implements client-side geo (best case)

```javascript
// User's app captures end-user location
const geoData = await fetch('https://api.ipinfo.io/lite/me?token=USER_APP_TOKEN')
// Returns: {country_code: "JP", country: "Japan", continent: "Asia"}

// User's app sends to your relay API
{
  "Authorization": "Bearer <user_api_key>",
  "chain": "ethereum", 
  "rawTx": "0x02f86b01843b9aca00847735940082520894b60e8dd61c5d32be8058bb8eb970870f07233155080c080a0...",
  "user_geo": {
    "country_code": "JP",
    "country": "Japan", 
    "continent": "Asia"
  }
}
```

#### Case B: User doesn't implement geo (fallback)

```javascript
// User's app sends only basic data
{
  "Authorization": "Bearer <user_api_key>",
  "chain": "ethereum", 
  "rawTx": "0x02f86b01843b9aca00847735940082520894b60e8dd61c5d32be8058bb8eb970870f07233155080c080a0..."
  // No user_geo field
}
```

### Step 3: Your Relay API Processes Request

#### Location Capture

- **Your API** extracts real client IP using `get_real_client_ip()`:
  - Checks `X-Forwarded-For` header (proxies)
  - Checks `X-Real-IP` header (nginx)
  - Checks `CF-Connecting-IP` header (Cloudflare)
  - Falls back to `request.client.host`
- **Your API** calls IPinfo Lite API with your token:
  ```python
  # Your API does this server-side
  response = await client.get(f"https://api.ipinfo.io/lite/{client_ip}?token={YOUR_IPINFO_TOKEN}")
  # Returns: {country_code: "US", country: "United States"} (AWS server location)
  ```
- **Priority system**: Uses `user_geo` if provided, otherwise uses server-side IP result

#### What your API extracts from rawTx

- **Sender address** (`from`): `0x1234...` (via signature recovery)
- **Recipient address** (`to`): `0x742d35Cc...` (via extract_to_address)
- **Amount**: 0.1 ETH (wei → ether conversion)
- **Currency**: ETH (native token)
- **Blockchain**: ethereum (normalized)
- **Transaction data**: size, complexity, gas price

#### Final location data

- **Case A**: `geo_data = {country: "Japan"}` (from user_geo)
- **Case B**: `geo_data = {country: "United States"}` (from server-side IP)

### Step 4: Sanctions Check

- **Your API** checks if `0x742d35Cc...` is in sanctions list
- **Result**: Clean ✅ or Sanctioned ❌

### Step 5: Risk Assessment

- **Your API** calculates risk score based on:
  - Sanctions status
  - Transaction features
  - Amount, complexity
  - Geographic risk (Japan = low risk, US = medium risk)
- **Result**: Risk score 0-100, risk band (LOW/MEDIUM/HIGH/CRITICAL)

### Step 6: Decision & Logging

**Your API logs to `relay_logs` table:**

```json
{
  "partner_id": "user_partner_id",
  "chain": "ethereum",
  "to_addr": "0x742d35Cc...",
  "decision": "allowed/blocked",
  "risk_score": 15,
  "risk_band": "LOW",
  "reasons": ["+5 TRANSACTION_CONTEXT"],
  "created_at": "2025-01-09T10:30:00Z"
}
```

## Case A: Payment BLOCKED (High Risk/Sanctions)

### Step 7A: Block Decision

- **Risk score** ≥ 80 OR **sanctions match** = BLOCKED
- **Your API** sends webhook to Supabase Edge Function:

```json
{
  "partner_id": "user_partner_id",
  "to_address": "0x742d35Cc...",
  "amount": 0.1,
  "currency": "ETH", 
  "blockchain": "ethereum",
  "tx_hash": null,
  "status": "blocked",
  "risk_level": "HIGH",
  "risk_score": 85,
  "client_ip": "user_app_server_ip",
  "geo_data": {"country": "Japan"}
}
```

### Step 8A: Webhook Stores Blocked Transaction

- **Edge Function** inserts into `public.transactions`:

```json
{
  "user_id": "user_auth_id",
  "to_address": "0x742d35Cc...",
  "amount": 0.1,
  "currency": "ETH",
  "blockchain": "ethereum", 
  "status": "blocked",
  "risk_score": 85,
  "description": "Transaction blocked: HIGH risk detected"
}
```

### Step 9A: Response to User's App

- **Your API** returns `403 Forbidden`:

```json
{
  "allowed": false,
  "risk_band": "HIGH", 
  "risk_score": 85,
  "reasons": ["HIGH risk factors detected"],
  "status": "blocked"
}
```

- **User's app** shows "Payment Blocked" to end-user

## Case B: Payment SUCCESSFUL (Low Risk)

### Step 7B: Allow Decision

- **Risk score** < 80 AND **no sanctions** = ALLOWED
- **Your API** broadcasts transaction to blockchain:
  - Calls `w3.eth.send_raw_transaction(rawTx)`
  - **Blockchain** returns `tx_hash`: `0x8b3f...c9a1`

### Step 8B: Update Logs

- **Your API** updates `relay_logs` with `tx_hash`
- **Your API** sends webhook to Supabase Edge Function:

```json
{
  "partner_id": "user_partner_id",
  "to_address": "0x742d35Cc...",
  "amount": 0.1,
  "currency": "ETH",
  "blockchain": "ethereum",
  "tx_hash": "0x8b3f...c9a1",
  "status": "completed", 
  "risk_level": "LOW",
  "risk_score": 15,
  "client_ip": "user_app_server_ip",
  "geo_data": {"country": "Japan"}
}
```

### Step 9B: Webhook Stores Successful Transaction

- **Edge Function** inserts into `public.transactions`:

```json
{
  "user_id": "user_auth_id",
  "to_address": "0x742d35Cc...",
  "amount": 0.1,
  "currency": "ETH",
  "blockchain": "ethereum",
  "tx_hash": "0x8b3f...c9a1", 
  "status": "completed",
  "risk_score": 15,
  "description": "Transaction completed successfully"
}
```

### Step 10B: Response to User's App

- **Your API** returns `200 OK`:

```json
{
  "allowed": true,
  "risk_band": "LOW",
  "risk_score": 15, 
  "txHash": "0x8b3f...c9a1",
  "reasons": ["No risk factors detected"],
  "status": "success"
}
```

- **User's app** shows "Payment Successful" to end-user

## Step 11: Dashboard Display

- **You** (API key holder) log into your dashboard
- **Dashboard** queries `public.transactions` WHERE `user_id = your_id`
- **Dashboard** shows:
  - ✅ **Successful transactions** with amounts, countries, risk scores
  - ❌ **Blocked transactions** with reasons, risk scores
  - 📊 **Analytics**: Geographic distribution, risk trends, compliance reports

## Data Storage Summary

- **`relay_logs`**: Detailed audit trail (all API calls)
- **`public.transactions`**: User-facing records (successful + blocked)
- **Both tables** include: amounts, currencies, countries, risk scores, blockchain info

## Location Data Priority

1. **Best**: End-user location (Japan) - if user implements client-side geo
2. **Fallback**: API caller location (US - AWS server) - if user doesn't implement geo
3. **Always captured**: No missing location data

## Key Benefits

- ✅ **Reliable location capture**: Always gets some location data
- ✅ **No dependency on user**: Works regardless of user's implementation
- ✅ **Handles production setups**: Proxies, CDNs, load balancers
- ✅ **Complete audit**: Every transaction logged with full context
- ✅ **Risk compliance**: Sanctions + risk scoring + geographic analysis
- ✅ **User visibility**: Dashboard shows all transaction activity

## Environment Requirements

```bash
# Your relay API needs this
IPINFO_TOKEN=your_free_token_here
```

**You now have bulletproof location capture that works with any user implementation!**

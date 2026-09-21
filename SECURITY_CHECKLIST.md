# Security and Production Readiness Checklist

## Required before production launch

### 1. Pricing integrity
- Server recalculates `total` from current product price and quantity.
- Client-sent totals are ignored or validated against server calculation.
- Price tampering is rejected with a 400 response.

### 2. Inventory integrity
- Product stock is checked before creating an order.
- Order creation rejects insufficient stock.
- Stock decrement is handled atomically or transaction-safe.
- Race conditions during concurrent requests are prevented.

### 3. API abuse prevention
- Rate limit all public endpoints, especially:
  - `/api/orders`
  - `/api/orders-lookup`
  - `/api/gift-suggestion`
  - `/api/generate-greeting`
- Block abusive IPs or suspicious burst traffic.
- Consider CAPTCHA or WAF for public forms if needed.

### 4. Order identifiers
- Use UUID or random alphanumeric order codes.
- Avoid sequential numeric IDs.
- Do not expose internal DB IDs publicly when a random order code suffices.

### 5. Data privacy
- Document why personal data is stored.
- Store only the minimum required information.
- Define retention period and deletion workflow.
- Do not use customer data for AI training without explicit consent.
- Restrict access to order data and logs.

### 6. Input validation and server-side trust
- Validate body fields, lengths, ranges, and product IDs on the server.
- Reject malformed items, duplicate products, and invalid quantities.
- Reject requests that try to bypass business rules.

### 7. AI endpoint hardening
- Keep Gemini keys on server only.
- Rate limit AI traffic by IP or user.
- Log AI requests without exposing secrets.
- Keep user prompts limited in length and scope.

### 8. Production deployment gate
- Run build, lint, and regression tests successfully.
- Ensure environment variables are set in Vercel production.
- Confirm no server secrets are bundled into frontend.
- Recheck Supabase authentication and RLS policies.

## Sign-off

Do not mark the app as production-ready until each checklist item above is confirmed.

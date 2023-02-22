
## Inspect the JWT token

```
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=authorization_code&code=UJCt2uXf6cS5udacw5Xdb_K_SFffGnH2UJF1-XF8C4P&redirect_uri=https%3A%2F%2Foidcdebugger.com%2Fdebug&client_id=ping&client_secret=abc" http://localhost:3000/token

```

## Inspect the JWT token

```
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=authorization_code&code=KOnFjB_Y9WkiusVMrX3x1z96ZmjZxjneteMWnVBlTQC&redirect_uri=https%3A%2F%2Foidcdebugger.com%2Fdebug&client_id=ping&client_secret=abc" http://localhost:3000/token

```
# stephanie-challenge

NestJS API with MongoDB, JWT auth, roles, and Products CRUD.

## MongoDB (Local)

- Install via Homebrew and run as a service.

## Quickstart

1. Create `.env` from `.env.example` and set:
   - `KENILITY_MONGODB_URI`
   - `KENILITY_JWT_SECRET`
   - `KENILITY_REFRESH_SECRET`
   - `KENILITY_BOOTSTRAP_TOKEN`
   - `KENILITY_JWT_EXPIRES_SECONDS=900`
   - `KENILITY_REFRESH_EXPIRES_SECONDS=604800`
2. Install and run:
```bash
npm install
npm run start:dev
```

## Docker

Build and run the API + MongoDB:
```bash
docker compose up --build
```

## Auth Bootstrap (No Users Yet)

There are no users by default. The initial bootstrap token is sent by email (out-of-band). Use it once to create the first admin:

```bash
POST /auth/bootstrap
Header: X-Bootstrap-Token: <KENILITY_BOOTSTRAP_TOKEN>
Body: { "email": "admin@example.com", "password": "your-password" }
```

Then login:
```bash
POST /auth/login
Body: { "email": "admin@example.com", "password": "your-password" }
```

## Swagger

Docs are available at `http://localhost:3000/docs`. Use the **Authorize** button with your JWT.

## Example Requests

Create product (multipart):
```bash
curl -X POST http://localhost:3000/products \\
  -H "Authorization: Bearer <JWT>" \\
  -F "name=Widget" \\
  -F "sku=SKU-123" \\
  -F "price=19.99" \\
  -F "picture=@/path/to/image.png"
```

Create order:
```bash
curl -X POST http://localhost:3000/orders \\
  -H "Authorization: Bearer <JWT>" \\
  -H "Content-Type: application/json" \\
  -d '{\"clientName\":\"Acme\",\"items\":[{\"productId\":\"<PRODUCT_ID>\",\"quantity\":2}]}' 
```

## Health Checks

- **Liveness**: `GET /health/live`
- **Readiness**: `GET /health/ready` (reports MongoDB connectivity)

The app starts even if MongoDB is down. Readiness will fail until the database is reachable and returns a 503 with details:

```json
{
  "status": "error",
  "info": {},
  "error": {
    "mongo": {
      "status": "down",
      "message": "MongoDB not reachable"
    }
  },
  "details": {
    "mongo": { "status": "down" }
  }
}
```

Health endpoints are implemented using `@nestjs/terminus`.

## Run

```bash
npm install
npm run start:dev
```

## Auth Tokens

Access tokens expire based on `KENILITY_JWT_EXPIRES_SECONDS` and can be renewed using the refresh token via `POST /auth/refresh`. Refresh tokens expire based on `KENILITY_REFRESH_EXPIRES_SECONDS`.

Example flow:
1. `POST /auth/login` with email/password to get `accessToken` + `refreshToken`.
2. Use `Authorization: Bearer <accessToken>` on protected endpoints.
3. When access token expires, call `POST /auth/refresh` with `{ "refreshToken": "<token>" }` to receive a new access token and refresh token.

## Products

Products are identified by MongoDB ObjectId in the API (e.g. `GET /products/:id`). SKU is a mutable field and can be updated. All Products endpoints require a valid JWT; any authenticated user can create, update, delete, list, and get products.

Search on `GET /products` supports pagination (`page`, `limit`), sorting (`sortBy`, `sortDir`), exact filters (`name`, `sku`, `price`), and criteria (`nameContains`, `minPrice`, `maxPrice`).

## Orders

Orders store embedded product snapshots (full item objects) to preserve historical pricing; they do not store only product references.

Endpoints:
1. `POST /products` (create)
2. `GET /products/:id` (retrieve)
3. `GET /products` (search: pagination/sorting/filters/criteria)
4. `POST /orders` (create)
5. `PUT /orders/:id` (update)
6. `GET /orders/metrics/total-sold-last-month`
7. `GET /orders/metrics/highest-total`

## Tests

Unit tests run with Jest. Requires Node.js 18+ (recommended 20 LTS).

```bash
npm test
```

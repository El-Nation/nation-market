# Nation-Market — General Multi-Vendor Marketplace

This repository hosts the **Nation-Market**, a highly generic multi-vendor marketplace platform.

### Architecture

The platform follows a split component architecture representing Stage 1 of its development plan:

- **`customer`** - The primary customer-facing platform. (Next.js - Port 3000)
- **`vendor`** - The isolated vendor dashboard. (Next.js - Port 3001)
- **`admin`** - The administrative panel. (Next.js - Port 3002)
- **`backend`** - The Node.js Express API. (Port 5000)
- **`rider`** - The delivery application in React Native via Expo.

### Development Boot Instructions

To run each environment locally, open up separate terminal tabs and navigate to their respective directories. You should allocate a different local port for the apps so they do not collide.

#### Start the Backend API
```sh
cd backend
npm run dev
```

#### Start the Customer Platform
```sh
cd customer
npm run dev
```

#### Start the Vendor Dashboard
```sh
cd vendor
npm run dev -- -p 3001
```

#### Start the Admin Dashboard
```sh
cd admin
npm run dev -- -p 3002
```

#### Start the Rider Mobile App
```sh
cd rider
npm start
```

### Note on Databases
The `backend/.env.example` file contains connection URIs for PostgreSQL and Redis, which must be installed and running locally for the backend's persistent and caching layers.

# ShopKB Backend

A robust backend system for managing shop inventory with specific inventory tracking, user roles, and business day management.

## Overview

ShopKB Backend is a TypeScript-based Node.js application built with Express.js and Prisma ORM. It provides comprehensive inventory management features for retail operations, including stock tracking, sales management, user authentication, and activity logging.

## Features

- **User Management**
  - Multiple user roles (ADMIN, SUPERADMIN, STAFF)
  - User authentication with JWT and bcrypt password hashing
  - User status tracking (PENDING, ACTIVE, SUSPENDED, DISABLED)

- **Inventory Management**
  - Product catalog with descriptions and images
  - Real-time stock quantity tracking
  - Stock movement tracking (IN/OUT operations)

- **Sales Operations**
  - Record sales transactions with product details
  - Track sales by staff member and business day
  - Detailed pricing information (unit price, total amount)

- **Business Day Management**
  - Open/close business days with timestamp tracking
  - Associate sales and stock movements to specific business days
  - Track who opened/closed each business day

- **Activity Logging**
  - Comprehensive audit trail of all operations
  - Track actions by user and business day
  - Detailed activity notes and descriptions

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL
- **ORM:** Prisma 7.x
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcrypt for password hashing
- **CORS:** Enabled for cross-origin requests
- **Environment:** dotenv for configuration management

## Project Structure

```
shopkb-backend/
├── src/
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Server entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── prisma.config.ts    # Prisma configuration
└── .gitignore         # Git ignore rules
```

## Database Schema

### User
- Manages system users with roles and authentication
- Fields: id, fullName, email, passwordHash, role, status, timestamps
- Relations: sales, stock movements, activity logs, business day operations

### Product
- Stores product catalog information
- Fields: id, name, description, imageUrl, sellingPrice, stockQuantity, timestamps
- Relations: sales, stock movements

### BusinessDay
- Tracks business operations by day
- Fields: id, businessDate, status, openedBy/ClosedBy user references, timestamps
- Relations: sales, stock movements, activity logs

### Sale
- Records individual sales transactions
- Fields: id, productId, soldBy (userId), businessDayId, quantity, unitPrice, totalAmount, timestamp

### StockMovement
- Tracks inventory changes (stock in/out)
- Fields: id, productId, userId, businessDayId, movementType, reason, quantity, notes, timestamp
- Movement Types: IN, OUT
- Reasons: STOCK_RECEIVED, SALE, ADJUSTMENT

### ActivityLog
- Audit trail for all operations
- Fields: id, userId, businessDayId, action, details, timestamp

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/angelo627/shopkb-backend.git
   cd shopkb-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/shopkb"
   ```

4. **Setup the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

## Running the Application

### Development
Start the development server with hot reload:
```bash
npm run dev
```
The server will run on `http://localhost:5000`

### Production Build
Build the TypeScript to JavaScript:
```bash
npm run build
```

### Production Start
Run the compiled application:
```bash
npm start
```

## API Endpoints

### Base
- `GET /` - Returns welcome message

**Note:** Full API route documentation will be available once routes are implemented.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (required) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run tests (not configured) |

## Security Features

- **Password Security:** Bcrypt hashing with salt rounds
- **JWT Authentication:** Secure token-based authentication
- **CORS Protection:** Cross-origin request handling
- **Type Safety:** Full TypeScript strict mode enabled
- **Validation:** Strict type checking and validation

## Configuration Files

### tsconfig.json
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Root directory: `./src`
- Output directory: `./dist`

### prisma.config.ts
- Schema location: `prisma/schema.prisma`
- Migrations path: `prisma/migrations`
- Database connection via environment variable

## Development Notes

- The application uses `ts-node-dev` for development with auto-restart on file changes
- Source maps are enabled for debugging
- All TypeScript files are in the `src/` directory
- Compiled JavaScript output goes to `dist/` directory

## Future Enhancements

- Complete API route implementation
- Request validation middleware
- Error handling middleware
- Comprehensive API documentation (Swagger/OpenAPI)
- Unit and integration tests
- Input sanitization
- Rate limiting
- Database seeding script

## License

ISC

## Author

angelo627

---

For more information, visit the [GitHub repository](https://github.com/angelo627/shopkb-backend)

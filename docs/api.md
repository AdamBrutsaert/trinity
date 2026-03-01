# API Documentation

## Technical Documentation

### Architecture Overview

Trinity API is a **modular REST API** built with a modern, type-safe architecture following **hexagonal (ports and adapters)** design principles. The application is structured into independent, composable modules that handle specific business domains.

#### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Layer (Elysia)                      │
│  - CORS, OpenAPI, Request/Response Handling                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Module Layer                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Auth    │ │ Products │ │   Cart   │ │  Orders  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Users   │ │  Brands  │ │Categories│ │ Invoices │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ Reports  │ │  Health  │                                 │
│  └──────────┘ └──────────┘                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  Service Layer                              │
│  - Business Logic                                           │
│  - Error Handling (neverthrow Result types)                 │
│  - Transaction Management                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│               Data Access Layer (Drizzle ORM)               │
│  - Type-safe SQL queries                                    │
│  - Schema definitions                                       │
│  - Migrations                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                PostgreSQL Database                          │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Core Modules

**Authentication Module** (`/auth`)
- User registration with bcrypt password hashing
- JWT-based login (HS256, 2-hour expiration)
- Token generation and verification
- Role-based access control (customer, admin)

**Users Module** (`/users`)
- User CRUD operations
- Profile management (address, phone, billing info)
- Admin user management
- Self-service profile updates

**Products Module** (`/products`)
- Product catalog management
- Barcode-based product lookup
- Nutritional information storage
- Brand and category relationships

**Brands Module** (`/brands`)
- Brand CRUD operations
- Cascade deletion handling

**Categories Module** (`/categories`)
- Category CRUD operations
- Product categorization

**Cart Module** (`/cart`)
- Shopping cart management
- Quantity updates with upsert logic
- Cart totaling with price calculations
- User-specific cart isolation

**Orders Module** (`/orders`)
- PayPal integration for payment processing
- Order creation from cart
- Invoice generation
- Cart clearing post-purchase

**Invoices Module** (`/invoices`)
- Invoice tracking (pending/completed)
- Line item management
- User-specific invoice retrieval
- Admin invoice oversight

**Reports Module** (`/reports`)
- Revenue analytics
- Order statistics (completed/pending)
- Customer metrics
- Top-selling products analysis

**Health Module** (`/health`)
- API status endpoint
- Database connectivity checks
- System monitoring

#### 2. Cross-Cutting Concerns

**Authentication Middleware** (`authGuard`)
- Bearer token extraction from Authorization header
- JWT verification
- Role-based access enforcement (admin/customer)
- Request context injection (`userId`, `role`)

**Database Plugin**
- Singleton database connection management
- Transaction support
- Elysia plugin integration
- Schema-aware query builder

**Error Handling**
- Structured error types per module
- `neverthrow` Result monad pattern
- Database constraint error mapping (unique violations, foreign key violations)
- HTTP status code consistency

**Environment Configuration**
- Type-safe environment variables with `@t3-oss/env-core`
- Zod schema validation
- Required variables: `DATABASE_URL`, `JWT_SECRET`, PayPal credentials

### Technological Choices

#### Runtime & Framework
- **Bun**: Ultra-fast JavaScript runtime with native TypeScript support
  - **Rationale**: 3x faster than Node.js, built-in bundler, native TS execution
- **Elysia.js**: High-performance web framework optimized for Bun
  - **Rationale**: Best-in-class type safety, ~20x faster than Express, plugin architecture

#### Database Stack
- **PostgreSQL**: Relational database
  - **Rationale**: ACID compliance, robust constraints, proven scalability
- **Drizzle ORM**: TypeScript-first ORM
  - **Rationale**: Compile-time type safety, zero runtime overhead, SQL-like syntax
- **Bun SQL Driver**: Native PostgreSQL adapter
  - **Rationale**: Optimized for Bun runtime, connection pooling

#### Language & Type Safety
- **TypeScript**: Strict mode enabled
  - **Rationale**: Compile-time error detection, IDE support, refactoring safety
- **Zod**: Runtime schema validation
  - **Rationale**: Type inference, OpenAPI integration, input sanitization
- **neverthrow**: Result type implementation
  - **Rationale**: Railway-oriented programming, explicit error handling, no exceptions

#### Security
- **bcryptjs**: Password hashing (10 rounds)
  - **Rationale**: Industry standard, resistant to rainbow tables
- **jose**: JWT operations
  - **Rationale**: Standards-compliant, secure defaults, type-safe
- **CORS**: Cross-origin resource sharing
  - **Rationale**: Secure mobile app integration

#### External Integrations
- **PayPal REST API**: Payment processing
  - **Rationale**: Trusted payment gateway, international support, sandbox testing

#### API Design
- **OpenAPI/Swagger**: Automatic documentation generation
  - **Rationale**: Interactive testing, client code generation, API contracts
- **RESTful conventions**: Resource-based URLs, HTTP verbs
  - **Rationale**: Predictable API surface, caching support

### Data Flow

#### 1. Request Lifecycle

```
Client Request
     │
     ▼
┌─────────────────────┐
│  HTTP Entry Point   │
│  (Elysia Routing)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   CORS Validation   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Auth Middleware    │◄──── Bearer Token
│  (if protected)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Input Validation   │◄──── Zod Schema
│  (body/params)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Module Handler     │
│  (Route Logic)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database           │◄──── Transaction
│  Transaction        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Service Layer      │
│  (Business Logic)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Drizzle ORM        │
│  SQL Execution      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    PostgreSQL       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Result Mapping     │◄──── neverthrow Result
│  (Ok/Err)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  HTTP Response      │
│  (JSON + Status)    │
└──────────┬──────────┘
           │
           ▼
      Client Response
```

#### 2. Authentication Flow

```
┌─────────────────┐         ┌─────────────────┐
│  Client Request │────────▶│  Auth Module    │
│  (POST /login)  │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  Validate Input │
                            │  (email/pwd)    │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  Query User DB  │
                            │  (by email)     │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  bcrypt.compare │
                            │  (password)     │
                            └────────┬────────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                    ┌────▼─────┐           ┌────▼─────┐
                    │  Match?  │           │  Match?  │
                    │   YES    │           │    NO    │
                    └────┬─────┘           └────┬─────┘
                         │                       │
                    ┌────▼─────┐           ┌────▼─────┐
                    │ Generate │           │  Return  │
                    │   JWT    │           │   401    │
                    │ (2h exp) │           └──────────┘
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  Return  │
                    │ Token +  │
                    │   User   │
                    └──────────┘
```

#### 3. Protected Endpoint Flow

```
Request with Authorization: Bearer <token>
     │
     ▼
┌─────────────────────┐
│  Extract Token      │
│  from Header        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  JWT Verification   │◄──── JWT_SECRET
│  (jose.jwtVerify)   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼─────┐ ┌──▼────────┐
│  Valid?  │ │  Invalid  │
│   YES    │ │    NO     │
└────┬─────┘ └──┬────────┘
     │          │
     │     ┌────▼─────┐
     │     │ Return   │
     │     │   401    │
     │     └──────────┘
     │
┌────▼─────────┐
│  Extract     │
│  userId,role │
└────┬─────────┘
     │
┌────▼─────────┐
│  Role Check  │
│  (if needed) │
└────┬─────────┘
     │
┌────┴─────┐
│          │
▼          ▼
Authorized  403 Forbidden
```

#### 4. Database Interaction Pattern

Every database operation follows this pattern:

```typescript
// Transaction wrapper ensures ACID properties
database.transaction(async (tx) => {
  // Service function returns Result<T, E>
  return await service.operation(tx, params);
})
.match(
  // Success path
  (data) => status(200, data),
  // Error path with typed errors
  (error) => {
    switch (error.type) {
      case "specific_error":
        return status(404, "Resource not found");
      case "another_error":
        return status(500, "Internal error");
    }
  }
)
```

**Key characteristics**:
- All DB operations wrapped in transactions
- Railway-oriented programming (Result monad)
- Type-safe error handling
- Automatic rollback on errors
- No exceptions thrown

#### 5. Error Propagation

```
Database Error (PostgreSQL)
     │
     ▼
┌─────────────────────┐
│  SQL Error          │
│  (23505, 23503...)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Drizzle catches    │
│  DrizzleQueryError  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  errorMapper()      │
│  Maps to domain err │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Result.err()       │
│  Typed error object │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Route Handler      │
│  Pattern matches    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  HTTP Error         │
│  (appropriate code) │
└─────────────────────┘
```

## UML Diagrams

### 1. User Registration Workflow

```mermaid
stateDiagram-v2
    [*] --> SubmitRegistration: POST /auth/register
    
    SubmitRegistration --> ValidateInput: Receive request
    ValidateInput --> CheckEmailExists: Input valid
    ValidateInput --> Return400: Input invalid
    
    CheckEmailExists --> HashPassword: Email available
    CheckEmailExists --> Return409: Email exists
    
    HashPassword --> CreateUserRecord: bcrypt hash
    CreateUserRecord --> GenerateJWT: User created
    CreateUserRecord --> Return500: DB error
    
    GenerateJWT --> Return201: Token + User data
    
    Return400 --> [*]
    Return409 --> [*]
    Return500 --> [*]
    Return201 --> [*]
```

### 2. Shopping Cart to Order Workflow

```mermaid
sequenceDiagram
    actor Customer
    participant API
    participant CartService
    participant ProductService
    participant OrderService
    participant PayPal
    participant InvoiceService
    participant Database

    Note over Customer,Database: Phase 1: Add Products to Cart
    Customer->>API: POST /cart/items {productId, quantity}
    API->>CartService: addItemToCart()
    CartService->>ProductService: Verify product exists
    ProductService->>Database: SELECT from products
    Database-->>ProductService: Product data
    ProductService-->>CartService: Product valid
    CartService->>Database: INSERT/UPDATE cart_items (upsert)
    Database-->>CartService: Cart item created
    CartService-->>API: Result<CartItem>
    API-->>Customer: 201 Created

    Note over Customer,Database: Phase 2: View Cart
    Customer->>API: GET /cart/items
    API->>CartService: getCartItems()
    CartService->>Database: SELECT cart + products (JOIN)
    Database-->>CartService: Cart items with product details
    CartService->>CartService: Calculate total price
    CartService-->>API: Result<CartWithTotal>
    API-->>Customer: 200 OK {items, total}

    Note over Customer,Database: Phase 3: Checkout
    Customer->>API: POST /orders
    API->>OrderService: createCartPaypalOrder()
    OrderService->>CartService: getCartItems()
    CartService->>Database: SELECT cart items
    Database-->>CartService: Cart data
    CartService-->>OrderService: Cart items + total
    
    alt Cart is empty
        OrderService-->>API: Err(empty_cart)
        API-->>Customer: 400 Cart is empty
    end

    OrderService->>PayPal: POST /v1/oauth2/token
    PayPal-->>OrderService: Access token
    OrderService->>PayPal: POST /v2/checkout/orders
    Note right of PayPal: Create PayPal order<br/>with cart total
    PayPal-->>OrderService: {id: "paypal_order_id"}

    OrderService->>InvoiceService: createInvoice()
    InvoiceService->>Database: BEGIN TRANSACTION
    InvoiceService->>Database: INSERT INTO invoices
    Database-->>InvoiceService: Invoice created
    InvoiceService->>Database: INSERT INTO invoice_items
    Database-->>InvoiceService: Line items created
    InvoiceService->>CartService: clearCart()
    CartService->>Database: DELETE FROM cart_items
    Database-->>CartService: Cart cleared
    InvoiceService->>Database: COMMIT TRANSACTION
    InvoiceService-->>OrderService: Invoice created
    
    OrderService-->>API: Result<{orderId}>
    API-->>Customer: 200 OK {orderId: "paypal_order_id"}

    Note over Customer,PayPal: Customer completes<br/>payment on PayPal
```

### 3. Product Management Workflow (Admin)

```mermaid
flowchart TD
    Start([Admin wants to add product]) --> Login[POST /auth/login]
    Login --> AuthCheck{Valid credentials?}
    AuthCheck -->|No| AuthFail[401 Unauthorized]
    AuthCheck -->|Yes| GetToken[Receive JWT with role=admin]
    
    GetToken --> CreateProduct[POST /products<br/>Authorization: Bearer token]
    CreateProduct --> ValidateToken{Token valid?}
    ValidateToken -->|No| Unauth[401 Unauthorized]
    ValidateToken -->|Yes| CheckRole{Role = admin?}
    CheckRole -->|No| Forbidden[403 Forbidden]
    CheckRole -->|Yes| ValidateInput{Input valid?}
    
    ValidateInput -->|No| BadRequest[400 Bad Request]
    ValidateInput -->|Yes| CheckBrand{Brand exists?}
    CheckBrand -->|No| BrandNotFound[404 Brand not found]
    CheckBrand -->|Yes| CheckCategory{Category exists?}
    CheckCategory -->|No| CategoryNotFound[404 Category not found]
    CheckCategory -->|Yes| CheckBarcode{Barcode unique?}
    
    CheckBarcode -->|No| Conflict[409 Product already exists]
    CheckBarcode -->|Yes| InsertProduct[INSERT INTO products]
    InsertProduct --> Success[201 Created<br/>Return product data]
    
    Success --> End([Product created])
    AuthFail --> End
    Unauth --> End
    Forbidden --> End
    BadRequest --> End
    BrandNotFound --> End
    CategoryNotFound --> End
    Conflict --> End
    
    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style End fill:#e3f2fd
    style AuthFail fill:#ffcdd2
    style Unauth fill:#ffcdd2
    style Forbidden fill:#ffcdd2
    style BadRequest fill:#ffcdd2
    style BrandNotFound fill:#ffcdd2
    style CategoryNotFound fill:#ffcdd2
    style Conflict fill:#ffcdd2
```

### 4. Admin Reports Generation Workflow

```mermaid
flowchart LR
    subgraph Input
        A[Admin requests reports<br/>GET /reports]
    end
    
    subgraph Authentication
        B[Verify JWT token]
        C{Role = admin?}
        B --> C
        C -->|No| D[403 Forbidden]
        C -->|Yes| E[Proceed]
    end
    
    subgraph "Data Aggregation (Parallel Queries)"
        E --> F[Query 1:<br/>Order Statistics]
        E --> G[Query 2:<br/>Customer Count]
        E --> H[Query 3:<br/>Top Products]
        
        F --> I[SELECT SUM, COUNT<br/>FROM invoices<br/>GROUP BY status]
        G --> J[SELECT COUNT<br/>FROM users<br/>WHERE role='customer']
        H --> K[SELECT product, SUM<br/>FROM invoice_items<br/>JOIN invoices<br/>GROUP BY product<br/>LIMIT 10]
    end
    
    subgraph "Data Processing"
        I --> L[Calculate:<br/>- Total revenue<br/>- Completed orders<br/>- Pending orders]
        J --> M[Total customers]
        K --> N[Top 10 products<br/>by quantity sold]
        
        L --> O[Compute average<br/>order value]
        M --> O
        N --> O
    end
    
    subgraph Output
        O --> P[Aggregate results]
        P --> Q[Return JSON:<br/>- totalRevenue<br/>- totalOrders<br/>- completedOrders<br/>- pendingOrders<br/>- totalCustomers<br/>- averageOrderValue<br/>- topProducts]
    end
    
    A --> B
    D --> R[End]
    Q --> R
    
    style A fill:#e3f2fd
    style Q fill:#c8e6c9
    style D fill:#ffcdd2
    style R fill:#e3f2fd
```

### 5. Data Model Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ CART_ITEMS : "has"
    USERS ||--o{ INVOICES : "creates"
    PRODUCTS ||--o{ CART_ITEMS : "contains"
    PRODUCTS ||--o{ INVOICE_ITEMS : "included in"
    PRODUCTS }o--|| BRANDS : "belongs to"
    PRODUCTS }o--|| CATEGORIES : "belongs to"
    INVOICES ||--o{ INVOICE_ITEMS : "contains"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar phone_number
        text address
        varchar zip_code
        varchar city
        varchar country
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    BRANDS {
        uuid id PK
        varchar name UK
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        varchar name UK
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        uuid id PK
        varchar barcode UK
        varchar name
        text description
        text image_url
        uuid brand_id FK
        uuid category_id FK
        numeric price
        integer energy_kcal
        real fat
        real carbs
        real protein
        real salt
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        integer quantity
        timestamp created_at
        timestamp updated_at
    }

    INVOICES {
        uuid id PK
        uuid user_id FK
        varchar paypal_order_id
        enum status
        numeric total_amount
        timestamp created_at
        timestamp updated_at
    }

    INVOICE_ITEMS {
        uuid id PK
        uuid invoice_id FK
        uuid product_id FK
        varchar product_name
        numeric unit_price
        integer quantity
        timestamp created_at
    }
```

### 6. Complete System Activity Diagram

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> Authenticated: Login/Register
    Authenticated --> Unauthenticated: Token expires (2h)
    
    state Authenticated {
        [*] --> BrowseProducts
        
        BrowseProducts --> ViewProduct: Select product
        ViewProduct --> AddToCart: Add to cart
        ViewProduct --> BrowseProducts: Back
        
        AddToCart --> CartManagement: Item added
        
        state CartManagement {
            [*] --> ViewCart
            ViewCart --> UpdateQuantity: Change quantity
            ViewCart --> RemoveItem: Remove item
            ViewCart --> Checkout: Proceed to checkout
            UpdateQuantity --> ViewCart
            RemoveItem --> ViewCart
        }
        
        CartManagement --> CreateOrder: Checkout confirmed
        
        state CreateOrder {
            [*] --> ValidateCart
            ValidateCart --> CalculateTotal: Cart not empty
            ValidateCart --> [*]: Cart empty (400)
            CalculateTotal --> CreatePayPalOrder: Total calculated
            CreatePayPalOrder --> GenerateInvoice: PayPal order created
            GenerateInvoice --> ClearCart: Invoice saved
            ClearCart --> [*]: Order complete
        }
        
        CreateOrder --> ViewHistory: Order placed
        ViewHistory --> ViewInvoice: Select invoice
        ViewInvoice --> ViewHistory: Back
        
        state if_admin <<choice>>
        BrowseProducts --> if_admin: Admin actions
        if_admin --> AdminPanel: role = admin
        if_admin --> BrowseProducts: role = customer
        
        state AdminPanel {
            [*] --> ManageProducts
            ManageProducts --> CreateProduct
            ManageProducts --> UpdateProduct
            ManageProducts --> DeleteProduct
            ManageProducts --> ManageBrands
            ManageProducts --> ManageCategories
            ManageProducts --> ViewReports
            
            CreateProduct --> ManageProducts
            UpdateProduct --> ManageProducts
            DeleteProduct --> ManageProducts
            ManageBrands --> ManageProducts
            ManageCategories --> ManageProducts
            
            ViewReports --> AnalyzeSales: Generate reports
            AnalyzeSales --> ViewReports
        }
        
        AdminPanel --> BrowseProducts: Exit admin
    }
    
    Authenticated --> [*]: Logout
    Unauthenticated --> [*]: Exit
```

## API Endpoints Summary

### Public Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check with database status
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication

### Customer Endpoints (requires `role=customer`)
- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `GET /products/barcode/:barcode` - Get product by barcode scan
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/:productId` - Update cart item quantity
- `DELETE /cart/items/:productId` - Remove item from cart
- `GET /cart/items` - Get user's cart
- `DELETE /cart/items` - Clear cart
- `POST /orders` - Create order (checkout)
- `GET /invoices/users/:id` - Get user's invoices
- `GET /invoices/:id` - Get invoice details
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `GET /brands` - List brands
- `GET /categories` - List categories

### Admin Endpoints (requires `role=admin`)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `POST /brands` - Create brand
- `PUT /brands/:id` - Update brand
- `DELETE /brands/:id` - Delete brand
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /invoices` - List all invoices
- `GET /reports` - Generate business reports

## Performance Considerations

**Transaction Scope**: All database operations wrapped in transactions for ACID guarantees

**Query Optimization**:
- Indexed columns: email, barcode, user-product combinations
- JOIN operations minimized through service layer composition
- Aggregate queries use native SQL for reports

**Caching Strategy**: None implemented (stateless architecture suitable for serverless)

**Concurrency**: 
- Upsert pattern for cart operations (handles concurrent updates)
- Optimistic locking not required (no long-running transactions)

## Security Considerations

**Authentication**: JWT with 2-hour expiration, HS256 signing
**Authorization**: Role-based middleware guards all protected routes
**Password Storage**: bcrypt with default cost factor (10 rounds)
**Input Validation**: All inputs validated via Zod schemas
**SQL Injection Prevention**: Parameterized queries via Drizzle ORM
**CORS**: Configured to accept credentials, requires client origin validation
**Environment Secrets**: Never committed, validated at startup

## Testing Strategy

**Unit Tests**: Service layer functions tested with Testcontainers
- Isolated PostgreSQL instances per test suite
- Transaction rollback after each test
- Coverage reporting enabled

**Integration Tests**: Full module testing via HTTP requests
- Database state setup and teardown
- Authentication flow testing
- Error condition validation

**Test Environment**: `.env.test` configuration with ephemeral database

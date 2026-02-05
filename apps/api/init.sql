-- Create the roles enum
CREATE TYPE roles AS ENUM ('customer', 'admin');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    address TEXT,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100),
    role roles NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email ON users(email);

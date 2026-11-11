CREATE TABLE users (
 id UUID PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL,
 email VARCHAR(180) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE accounts (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id),
 account_number VARCHAR(8) NOT NULL UNIQUE,
 sort_code VARCHAR(8) NOT NULL,
 name VARCHAR(80) NOT NULL,
 account_type VARCHAR(20) NOT NULL,
 balance NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
 version BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE TABLE transfers (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id),
 request_id UUID NOT NULL,
 from_account_id UUID NOT NULL REFERENCES accounts(id),
 to_account_id UUID NOT NULL REFERENCES accounts(id),
 amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
 reference VARCHAR(120) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT uq_transfer_request UNIQUE (user_id, request_id),
 CONSTRAINT chk_accounts_distinct CHECK (from_account_id <> to_account_id)
);
CREATE TABLE transactions (
 id UUID PRIMARY KEY,
 account_id UUID NOT NULL REFERENCES accounts(id),
 transfer_id UUID REFERENCES transfers(id),
 kind VARCHAR(10) NOT NULL,
 description VARCHAR(160) NOT NULL,
 amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
 balance_after NUMERIC(19,2) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, created_at DESC);

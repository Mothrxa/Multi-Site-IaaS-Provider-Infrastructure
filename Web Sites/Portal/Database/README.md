# STRATA Portal Database

Data models, schemas, and migrations for the STRATA Portal.

## Overview

This folder contains:
- Database schema definitions
- Data migrations
- Seed data for development
- SQL queries / indexes
- Entity relationship diagrams

## Architecture

```
Database/
├── migrations/           # Version-controlled schema changes
├── seeds/               # Dev/test data fixtures
├── schemas/             # Schema definitions
├── indexes/             # Performance optimization
├── erd.md               # Entity relationship diagram
└── README.md
```

## Data Model Overview

### Core Entities

#### Users
```sql
users
  id: UUID
  email: VARCHAR
  password_hash: VARCHAR
  department: ENUM (IT, HR, BizOps)
  role: VARCHAR
  name: VARCHAR
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
```

#### Authentication
```sql
sessions
  id: UUID
  user_id: FOREIGN KEY
  token: VARCHAR (JWT)
  expires_at: TIMESTAMP

audit_logs
  id: UUID
  user_id: FOREIGN KEY
  action: VARCHAR
  resource: VARCHAR
  changes: JSON
  created_at: TIMESTAMP
```

### IT Department

#### Infrastructure
```sql
hosts
  id: UUID
  name: VARCHAR
  datacenter: VARCHAR
  cpu_cores: INT
  memory_gb: INT
  status: ENUM (online, offline, maintenance)

workloads (VMs / Containers)
  id: UUID
  customer_id: FOREIGN KEY
  name: VARCHAR
  type: ENUM (vm, container)
  os: VARCHAR
  host_id: FOREIGN KEY
  status: ENUM (running, stopped, error)
  created_at: TIMESTAMP

tickets
  id: UUID
  number: INT
  customer_id: FOREIGN KEY
  title: VARCHAR
  description: TEXT
  priority: ENUM (P1, P2, P3, P4)
  status: ENUM (new, in_progress, resolved)
  assignee_id: FOREIGN KEY (user)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
```

### HR Department

#### People Management
```sql
employees
  id: UUID
  user_id: FOREIGN KEY
  name: VARCHAR
  email: VARCHAR
  department: VARCHAR
  role: VARCHAR
  manager_id: FOREIGN KEY
  tenure_months: INT
  status: ENUM (active, on_leave, inactive)

leave_requests
  id: UUID
  employee_id: FOREIGN KEY
  type: ENUM (annual, sick, personal, parental)
  start_date: DATE
  end_date: DATE
  status: ENUM (pending, approved, rejected)
  approver_id: FOREIGN KEY (user)

payroll
  id: UUID
  employee_id: FOREIGN KEY
  period: VARCHAR (e.g., "May 2026")
  gross: DECIMAL
  net: DECIMAL
  status: ENUM (draft, ready, paid)

documents
  id: UUID
  name: VARCHAR
  type: VARCHAR
  owner_id: FOREIGN KEY (user)
  department: ENUM
  created_at: TIMESTAMP
```

### BizOps Department

#### Customer Management
```sql
customers
  id: UUID
  name: VARCHAR
  industry: VARCHAR
  plan: ENUM (Starter, Business, Enterprise)
  monthly_revenue: DECIMAL
  annual_revenue: DECIMAL
  status: ENUM (trial, active, at_risk, churned)
  renewal_date: DATE
  created_at: TIMESTAMP

billing
  id: UUID
  customer_id: FOREIGN KEY
  period: VARCHAR
  vm_hours: INT
  container_hours: INT
  storage_gb: INT
  egress_gb: INT
  total_amount: DECIMAL
  status: ENUM (draft, issued, paid, overdue)

invoices
  id: UUID
  number: VARCHAR (e.g., INV-2026-0481)
  customer_id: FOREIGN KEY
  billing_id: FOREIGN KEY
  amount: DECIMAL
  issue_date: DATE
  due_date: DATE
  status: ENUM (sent, paid, overdue)

deals (Pipeline)
  id: UUID
  name: VARCHAR
  customer_id: FOREIGN KEY
  amount: DECIMAL
  stage: ENUM (Discovery, Qualified, Proposal, Negotiation, Closed Won)
  owner_id: FOREIGN KEY (user)
```

### Shared Services

#### Communication
```sql
mail
  id: UUID
  from_user_id: FOREIGN KEY
  to_user_id: FOREIGN KEY
  subject: VARCHAR
  body: TEXT
  read: BOOLEAN
  created_at: TIMESTAMP

announcements
  id: UUID
  author_id: FOREIGN KEY
  scope: ENUM (Company, IT, HR, BizOps)
  title: VARCHAR
  body: TEXT
  pinned: BOOLEAN
  created_at: TIMESTAMP

announcements_reactions
  id: UUID
  announcement_id: FOREIGN KEY
  user_id: FOREIGN KEY
  reaction: VARCHAR
```

#### File Sharing
```sql
files
  id: UUID
  name: VARCHAR
  path: VARCHAR
  owner_id: FOREIGN KEY
  department: ENUM
  acl: ENUM (Everyone, IT_only, HR_only, Mgmt_only)
  size_bytes: BIGINT
  uploaded_at: TIMESTAMP
```

## Database Choice

**PostgreSQL** (Recommended)
- Structured data with clear relationships
- ACID guarantees for financial/HR data
- JSONB for flexible annotation fields
- Native support for enums, arrays

**MongoDB** (Alternative)
- More flexible schema evolution
- Easier horizontal scaling
- Better for unstructured docs/files

## Setup

### PostgreSQL

```bash
# Initialize database
createdb strata_portal

# Run migrations
psql strata_portal < migrations/001_init.sql

# Seed development data
psql strata_portal < seeds/dev_data.sql
```

### Connection String
```
postgresql://user:password@localhost:5432/strata_portal
```

## Migrations

Name format: `YYYYMMDD_description.sql`

Example:
```sql
-- 20260101_create_users_table.sql
BEGIN;
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  ...
);
COMMIT;
```

## Indexing Strategy

Indexes on:
- Foreign keys (customer_id, user_id, etc.)
- Search fields (name, email, title)
- Time-series queries (created_at, updated_at)
- Department filters

## Data Privacy & Access Control

- Never store plain-text passwords
- Implement row-level security (RLS) for multi-tenant isolation
- Audit all user data modifications
- Retention policy for logs (90 days)
- GDPR compliance: right to deletion

## Development Workflow

1. Design schema changes in `schemas/`
2. Write migration in `migrations/`
3. Update seed data in `seeds/`
4. Test with backend integration
5. Document in this README

## Backup & Recovery

- Daily backups to cloud storage
- Point-in-time recovery supported
- Test restores monthly

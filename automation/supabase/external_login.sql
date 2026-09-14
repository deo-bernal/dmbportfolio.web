-- Social logins (Google / LinkedIn / Facebook) and SSO-only password flag.
-- Applied automatically on API startup as well; safe to run in the Supabase SQL editor.

alter table "User"
    add column if not exists "PasswordSet" boolean not null default true;

create table if not exists "ExternalLogin" (
  "ExternalLoginId"  integer generated always as identity primary key,
  "UserId"           integer      not null references "User" ("UserId") on delete cascade,
  "Provider"         varchar(32)  not null,
  "ProviderUserId"   varchar(128) not null,
  "CreatedAt"        timestamptz  not null default now()
);

create unique index if not exists "UX_ExternalLogin_Provider_ProviderUserId"
  on "ExternalLogin" ("Provider", "ProviderUserId");

create unique index if not exists "UX_ExternalLogin_UserId_Provider"
  on "ExternalLogin" ("UserId", "Provider");

create index if not exists "IX_ExternalLogin_UserId"
  on "ExternalLogin" ("UserId");

create table if not exists "PendingExternalLogin" (
  "PendingExternalLoginId" integer generated always as identity primary key,
  "Ticket"                 varchar(128) not null,
  "Provider"               varchar(32)  not null,
  "ProviderUserId"         varchar(128) not null,
  "FirstName"              varchar(100) not null,
  "LastName"               varchar(100) not null,
  "Phone"                  varchar(30),
  "Client"                 varchar(16)  not null,
  "ReturnPath"             varchar(500),
  "Email"                  varchar(255),
  "CodeHash"               varchar(128),
  "CodeExpiresAt"          timestamptz,
  "ExpiresAt"              timestamptz  not null,
  "CreatedAt"              timestamptz  not null default now()
);

create unique index if not exists "UX_PendingExternalLogin_Ticket"
  on "PendingExternalLogin" ("Ticket");

create index if not exists "IX_PendingExternalLogin_ExpiresAt"
  on "PendingExternalLogin" ("ExpiresAt");

-- Render env (do not commit secrets):
-- Authentication__Google__ClientId / Authentication__Google__ClientSecret
-- Authentication__LinkedIn__ClientId / Authentication__LinkedIn__ClientSecret
-- Authentication__Facebook__ClientId / Authentication__Facebook__ClientSecret
-- Provider callback: https://dmbportfolio-api.onrender.com/api/auth/external/{google|linkedin|facebook}/callback
-- App__FrontendUrl=https://www.dmbwebsolutions.com
-- App__PublicApiUrl=https://dmbportfolio-api.onrender.com/api

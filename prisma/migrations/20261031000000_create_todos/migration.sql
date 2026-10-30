CREATE TABLE "public"."todos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "todos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "todos_title_not_blank" CHECK (length(trim("title")) > 0)
);

CREATE INDEX "todos_user_id_created_at_idx" ON "public"."todos"("user_id", "created_at");

-- Only the authenticated Next.js API accesses this table through Prisma.
ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."todos" FROM anon, authenticated;

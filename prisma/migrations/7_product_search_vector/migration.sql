-- Full-text search for the shopping assistant's retrieval step.
-- A stored generated column keeps the vector in sync with the row automatically, so
-- the seed and any later product edits need no extra write path.
ALTER TABLE "Product"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("brand", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'C')
  ) STORED;

CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- Category names live on the joined table, so rank them with their own index.
CREATE INDEX "Category_name_fts_idx" ON "Category" USING GIN (to_tsvector('english', "name"));

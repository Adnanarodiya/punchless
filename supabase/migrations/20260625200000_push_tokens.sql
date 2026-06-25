-- Phase 8: Expo push notification tokens (mobile employees)

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown'
    CHECK (platform IN ('ios', 'android', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_company_id ON push_tokens(company_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own" ON push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_tokens_insert_own" ON push_tokens
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND company_id = get_my_company_id()
  );

CREATE POLICY "push_tokens_update_own" ON push_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = get_my_company_id()
  );

CREATE POLICY "push_tokens_delete_own" ON push_tokens
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
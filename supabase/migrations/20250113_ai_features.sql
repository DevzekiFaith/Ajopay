-- AI Features Migration
-- Create tables for analytics tracking and smart notifications

-- User Analytics Table
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  page TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Notifications Table
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_smart_notifications_user_id ON smart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_type ON smart_notifications(type);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_scheduled_for ON smart_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_sent ON smart_notifications(sent);

-- RLS Policies for user_analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for smart_notifications
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON smart_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON smart_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all analytics and notifications
CREATE POLICY "Service role can manage all analytics" ON user_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all notifications" ON smart_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old analytics data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM user_analytics 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old sent notifications (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM smart_notifications 
  WHERE sent = TRUE AND sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_analytics TO anon, authenticated;
GRANT ALL ON smart_notifications TO anon, authenticated;





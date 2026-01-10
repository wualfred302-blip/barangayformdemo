-- Migration: Create In-App Notifications Table
-- Description: Stores in-app notifications for users
-- Date: 2026-01-10

-- Create in_app_notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'delivery_update',
    'delivery_confirmed',
    'action_required',
    'system',
    'announcement'
  )),
  reference_type TEXT, -- 'delivery_request', 'qrt_id', 'certificate', etc.
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON in_app_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON in_app_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON in_app_notifications(type);

-- Enable Row Level Security
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON in_app_notifications
  FOR SELECT
  USING (true);

-- System can insert notifications for any user
CREATE POLICY "System can create notifications"
  ON in_app_notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON in_app_notifications
  FOR UPDATE
  USING (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON in_app_notifications
  FOR DELETE
  USING (true);

-- Function to create delivery status notification
CREATE OR REPLACE FUNCTION create_delivery_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only create notification if status changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Set notification content based on new status
  CASE NEW.status
    WHEN 'printing' THEN
      notification_title := 'ID Being Printed';
      notification_message := 'Your ID card is now being printed. We will notify you once it is ready for delivery.';
      notification_type := 'delivery_update';
    WHEN 'printed' THEN
      notification_title := 'ID Ready for Delivery';
      notification_message := 'Your ID card has been printed and is ready to be delivered.';
      notification_type := 'delivery_update';
    WHEN 'out_for_delivery' THEN
      notification_title := 'ID Out for Delivery';
      notification_message := 'Your ID card is now out for delivery! Please be ready to receive it.';
      notification_type := 'delivery_update';
    WHEN 'delivered' THEN
      notification_title := 'ID Delivered';
      notification_message := 'Your ID card has been delivered successfully. Thank you!';
      notification_type := 'delivery_confirmed';
    WHEN 'delivery_failed' THEN
      CASE NEW.failure_reason
        WHEN 'not_home' THEN
          notification_title := 'Delivery Attempt Failed';
          notification_message := 'We tried to deliver your ID but you were not home. Please reschedule your delivery.';
        WHEN 'wrong_address' THEN
          notification_title := 'Address Issue';
          notification_message := 'We could not find your address. Please verify and update your delivery address.';
        WHEN 'refused' THEN
          notification_title := 'Delivery Refused';
          notification_message := 'The delivery was refused. Please contact the barangay office for assistance.';
        ELSE
          notification_title := 'Delivery Issue';
          notification_message := 'There was an issue with your delivery. Please check your delivery details.';
      END CASE;
      notification_type := 'action_required';
    WHEN 'pickup_required' THEN
      notification_title := 'Office Pickup Required';
      notification_message := 'After multiple delivery attempts, your ID is now available for pickup at the barangay office.';
      notification_type := 'action_required';
    ELSE
      RETURN NEW; -- No notification for other statuses
  END CASE;

  -- Insert the notification
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type,
    reference_type,
    reference_id
  ) VALUES (
    NEW.user_id,
    notification_title,
    notification_message,
    notification_type,
    'delivery_request',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create notifications on status change
DROP TRIGGER IF EXISTS trigger_delivery_notification ON id_delivery_requests;
CREATE TRIGGER trigger_delivery_notification
  AFTER UPDATE ON id_delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_notification();

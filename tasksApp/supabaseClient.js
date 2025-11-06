// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bcwygofpcdzzohnoxpbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3lnb2ZwY2R6em9obm94cGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjE5NTgsImV4cCI6MjA3Njc5Nzk1OH0.RzKVt_w5trYrfZI7mhZW5B8Lcm2xfWQ4boCfUpuYv3s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

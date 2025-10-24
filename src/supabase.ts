import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zysmdwslmkcznhibyctl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c21kd3NsbWtjem5oaWJ5Y3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTIyMzEsImV4cCI6MjA3Njc2ODIzMX0.a2yxZD-BbGhinWjxVqzCzBMwx3Mwib80QB8miUyDDU0'  // from Supabase -> Project Settings -> API -> anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  // Create a simple Supabase client for middleware
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // For this app, we use WhatsApp-based auth stored in localStorage (client-side)
  // The middleware simply passes through requests
  // Auth validation happens in the client components

  return supabaseResponse
}

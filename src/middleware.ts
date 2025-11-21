// middleware.ts (at the root of your project)
import { type NextRequest } from 'next/server'
// Update the path below to match your file structure:
import { updateSession } from '../utils/supabase/middleware'
export async function middleware(request: NextRequest) {
  // Call the function that handles authentication and redirects
  return await updateSession(request) 
}

// Your existing matcher is mostly correct, but we only need to match where we check auth.
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/profile/:path*', 
    '/login',
  ],
}
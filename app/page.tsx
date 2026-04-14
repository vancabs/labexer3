import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">
          Student Portal Demo
        </h1>
        
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          A simple integrated web app using Supabase and Vercel.
        </p>
        
        <div>
          <Link
            href="/auth"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
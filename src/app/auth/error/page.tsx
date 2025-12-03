import Link from "next/link"

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    AccessDenied:
      "Access denied. Only @wisc.edu email addresses are allowed to sign in.",
    Configuration: "There is a problem with the server configuration.",
    Verification: "The verification link has expired or has already been used.",
    Default: "An error occurred during authentication.",
  }

  const error = searchParams.error || "Default"
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-center text-slate-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-slate-600 text-center mb-6">{message}</p>

          <Link
            href="/auth/signin"
            className="block w-full text-center bg-[#c5050c] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#9b0000] transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}

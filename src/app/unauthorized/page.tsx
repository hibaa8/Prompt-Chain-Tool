import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You do not have permission to access this page. Only superadmins and matrix admins can access this tool.
        </p>
        <Link
          href="/auth/logout"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}

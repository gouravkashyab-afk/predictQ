// Export the proxy function as Next.js middleware
export { proxy as middleware } from "./src/proxy";

// Config must be defined directly in middleware.ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};

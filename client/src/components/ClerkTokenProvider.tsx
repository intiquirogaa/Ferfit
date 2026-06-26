import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

export function ClerkTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const storeToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          localStorage.setItem("clerk-session", token);
        }
      } catch (error) {
        console.error("Error storing Clerk token:", error);
      }
    };

    storeToken();

    // Refresh token every 5 minutes
    const interval = setInterval(storeToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded]);

  return <>{children}</>;
}

import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export function useClerkToken() {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const clerkToken = await getToken();
        setToken(clerkToken);
      } catch (error) {
        console.error("Error fetching Clerk token:", error);
      }
    };

    fetchToken();
  }, [getToken]);

  return token;
}

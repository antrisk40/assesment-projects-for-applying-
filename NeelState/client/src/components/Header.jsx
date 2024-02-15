import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if the user is logged in (JWT token exists)
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch user information from the server
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch("/api/user-info", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Handle error
      }
    } catch (error) {
      console.error("Error fetching user info:", error.message);
      // Handle error
    }
  };

  const handleSignOut = () => {
    // Clear user data from state and local storage
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <header className="bg-blue-200 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto p-3">
        <Link to="/">
          <h1 className="font-bold text-sm sm:max-xl flex flex-wrap">
            <span className="text-blue-600">Neel</span>
            <span className="text-blue-950">State</span>
          </h1>
        </Link>
        <ul className="flex gap-4">
          <Link to="/">
            <li className="hidden sm:inline text-slate-700 hover:underline">
              Home
            </li>
          </Link>

          {user ? (
            <>
              <li className="hidden sm:inline text-slate-700 hover:underline">
                {user.username} {/* Display user's name if logged in */}
              </li>
              <li
                className="hidden sm:inline text-slate-700 hover:underline"
                onClick={handleSignOut}
              >
                Sign out
              </li>
            </>
          ) : (
            <Link to="/sign-in">
              <li className="hidden sm:inline text-slate-700 hover:underline">
                Sign in
              </li>
            </Link>
          )}
        </ul>
      </div>
    </header>
  );
}

export default Header;

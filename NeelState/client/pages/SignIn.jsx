import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignIn() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userImages, setUserImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const requestOptions = {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          };

          const response = await fetch("/api/user-info", requestOptions);
          const data = await response.json();
          console.log(data);

          // Fetch user images after successful login
          const imageResponse = await fetch("/api/user-images", requestOptions);
          const imageData = await imageResponse.json();
          setUserImages(imageData.images); // Assuming images is an array of image URLs
        } catch (error) {
          console.error("Error:", error);
        }
      } else {
        console.error("Token is undefined or not found");
      }
    };

    checkToken();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Include user information in the request body
      });
      const data = await res.json();
      if (data.success === false) {
        setLoading(false);
        setError(null);
        return;
      }
      localStorage.setItem("token", data.token);
      console.log(data.token);
      navigate("/");
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center my-7">Sign In</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded-lg"
          id="email"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-3 rounded-lg"
          id="password"
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Sign In"}
        </button>
      </form>
      <div className="flex gap-2 mt-5">
        <p>Don't have an account?</p>
        <Link to={"/sign-up"}>
          <span className="text-blue-700">Sign Up</span>
        </Link>
      </div>
      {error && <p className="text-red-500 mt-5">{error}</p>}
      <div className="mt-5">
        {userImages.map((image, index) => (
          <img key={index} src={image} alt={`User Image ${index}`} />
        ))}
      </div>
    </div>
  );
}

export default SignIn;

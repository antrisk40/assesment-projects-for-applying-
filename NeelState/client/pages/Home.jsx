import React, { useState, useEffect } from "react";

function Home() {
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [userImage, setUserImage] = useState("");

  useEffect(() => {
    // Fetch user image if user is logged in and image is present
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserImage(token);
    }
  }, []);

  const fetchUserImage = async (token) => {
    try {
      const response = await fetch("/api/user-image", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userImageData = await response.json();
        setUserImage(userImageData.imagePath);
      } else {
        // Handle error
        console.error("Error fetching user image:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching user image:", error.message);
      // Handle error
    }
  };

  const handleFileSelect = (event) => {
    setImage(event.target.files[0]);
    setErrorMessage("");
    setUploadSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!image) {
      setErrorMessage("Please select an image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", image);

      const token = localStorage.getItem("token");

      if (!token) {
        console.error("JWT token is missing");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      setUploading(true);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      if (response.ok) {
        console.log("Image uploaded successfully");
        setErrorMessage("");
        setUploadSuccess(true);
        // Refresh user image after upload
        fetchUserImage(token);
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error uploading image:", error.message);
      setErrorMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4 text-blue-800">
          Upload Image
        </h1>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        {uploadSuccess && (
          <div className="text-green-500 mb-4">Image uploaded successfully</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center bg-gray-100 py-12 px-4 rounded-lg">
            <label
              htmlFor="fileInput"
              className="flex items-center justify-center w-full h-full border-2 border-blue-400 rounded-lg cursor-pointer"
            >
              <input
                id="fileInput"
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <span className="text-blue-500">Select an image</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
      {userImage ? (
  <div className="max-w-md mx-auto mt-8">
    <img src={`/uploads/${userImage}`} alt="User Image" className="rounded-lg" />
  </div>
) : (
        <div className="max-w-md mx-auto mt-8">
          <img
            src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?size=626&ext=jpg" // Replace "default-image-url.jpg" with the URL of your default image
            alt="Default User Image"
            className="rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default Home;

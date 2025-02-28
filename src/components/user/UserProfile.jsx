import React, { useState } from "react";
import "./UserProfile.css";

const UserProfile = () => {
  // Стан профілю користувача (можна замінити на дані з API)
  const [user, setUser] = useState({
    username: "Іван Іванов",
    email: "ivan.ivanov@example.com",
    phone: "+380123456789",
    bio: "Це моя біографія. Я люблю програмування і займаюсь розробкою сайтів.",
    image: "https://via.placeholder.com/150", // Тестове зображення
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={user.image} alt="User Avatar" className="profile-avatar" />
        <h2>{user.username}</h2>
        <p>{user.email}</p>
      </div>

      <div className="profile-body">
        <h3>Телефон:</h3>
        <p>{user.phone}</p>
        <h3>Біографія:</h3>
        <p>{user.bio}</p>
      </div>
    </div>
  );
};

export default UserProfile;

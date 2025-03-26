import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import Header from "./components/common/header/Header";
import HeroSection from "./components/HeroSection";
import FundraisingList from "./components/fundraising/FundraisingList";
import ContactForm from "./components/ContactForm";
import CategoryPage from "./components/CategoryPage";
import CreateFundraiser from "./components/fundraising/CreateFundraiser"; 
import FundraiserDetail from "./components/fundraising/FundraiserDetail";
import UserProfile from "./components/user/UserProfile";
import EditUserProfile from "./components/user/EditUserProfile";
import VolunteerAuth from "./components/user/VolunteerAuth";

import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="container">
            <Header />
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <HeroSection />
                    <FundraisingList />
                    <ContactForm />
                  </>
                }
              />
              <Route path="/category" element={<CategoryPage />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/fundraiser/:id" element={<FundraiserDetail />} />
              <Route path="/create-fundraiser" element={<CreateFundraiser />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/edit" element={<EditUserProfile />} />
              <Route path="/login" element={<VolunteerAuth />} />
              <Route path="/register" element={<VolunteerAuth />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
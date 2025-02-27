import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/common/header/header";
import HeroSection from "./components/HeroSection";
import FundraisingList from "./components/fundraising/FundraisingList";
import ContactForm from "./components/ContactForm";
import CategoryPage from "./components/CategoryPage";
import CreateFundraiser from "./components/fundraising/CreateFundraiser"; 
import FundraiserDetail from "./components/fundraising/FundraiserDetail";
import "./App.css";

function App() {
  return (
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
          <Route path="/create-fundraiser" element={<CreateFundraiser />}/> 
           
        </Routes>
      </div>
    </Router>
  );
}

export default App;

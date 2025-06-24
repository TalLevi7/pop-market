// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import './styles/index.css';

// Pages
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import Collection from "./pages/Collection";
import ContactUs from "./pages/ContactUs";
import Home from "./pages/Home"; // formerly index.html
import Login from "./pages/Login";
import Market from "./pages/Market";
import Signup from "./pages/Signup";
import Wishlist from "./pages/Wishlist";
import NewListing from './pages/NewListing';
import ManageListings from './pages/ManageListings';
import UserPanel from './pages/UserPanel';
import PopSuggestions from './pages/PopSuggestions';
import NewFeedback from './pages/NewFeedback';
import SellerReviews from './pages/SellerReviews';
import AiSuggestions  from './pages/AiSuggestions';

// Admin routes
import AdminPanel from './pages/adminpages/AdminPanel';    
import AdminMarket  from './pages/adminpages/AdminMarket';
import AdminApproveListings from './pages/adminpages/AdminApproveListings';
import AdminEditCatalog from './pages/adminpages/AdminEditCatalog';
import AdminManageUsers from './pages/adminpages/AdminManageUsers';
import AdminContactMessages from './pages/adminpages/AdminContactMessages';
import AdminPopSuggestions from './pages/adminpages/AdminPopSuggestions';
import AdminReviewFeedback   from './pages/adminpages/AdminReviewFeedback';

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Import PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="market" element={<Market />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="about" element={<About />} />
        <Route path="suggest" element={<PopSuggestions />} />
        <Route path="seller/:sellerId/reviews" element={<SellerReviews />} />

        {/* Protect routes with PrivateRoute */}
        <Route 
          path="collection" 
          element={<PrivateRoute element={<Collection />} />} 
        />
        <Route 
          path="wishlist" 
          element={<PrivateRoute element={<Wishlist />} />} 
        />
        <Route 
          path="newlisting" 
          element={<PrivateRoute element={<NewListing />} />} 
        />
        <Route 
          path="managelistings" 
          element={<PrivateRoute element={<ManageListings />} />} 
        />
        <Route
          path="userpanel"
          element={<PrivateRoute element={<UserPanel />} />}
        />
        <Route
          path="feedback/new"
          element={<PrivateRoute element={<NewFeedback />} />}
        />
        <Route 
           path="catalog/ai-suggestions" 
           element={<PrivateRoute element={<AiSuggestions />} />} 
        />
        {/* Admin panel (also protected by PrivateRoute + in-component admin check) */}
        <Route 
          path="admin" 
          element={<PrivateRoute element={<AdminPanel />} />} 
        />
        <Route
          path="admin/market"
          element={<PrivateRoute element={<AdminMarket />} />}
        />
        <Route
          path="admin/approvals"
          element={<PrivateRoute element={<AdminApproveListings />} />}
        />
        <Route
          path="admin/catalog"
          element={<PrivateRoute element={<AdminEditCatalog />} />}
        />
         <Route
          path="admin/users"
          element={<PrivateRoute element={<AdminManageUsers />} />}
        />       
        <Route 
          path="admin/contact-messages" 
          element={<PrivateRoute element={<AdminContactMessages />} />} 
        />
        <Route 
          path="admin/suggestions" 
          element={<PrivateRoute element={<AdminPopSuggestions />} />} 
        />
        <Route
          path="/admin/feedbacks"
          element={<AdminReviewFeedback />}      
        />

        <Route path="contactus" element={<ContactUs />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}

export default App;

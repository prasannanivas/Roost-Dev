import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { auth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSignInDropdown, setShowSignInDropdown] = useState(false);
  const [showSignUpDropdown, setShowSignUpDropdown] = useState(false);

  const toggleSignInDropdown = () => {
    setShowSignInDropdown(!showSignInDropdown);
    setShowSignUpDropdown(false);
  };

  const toggleSignUpDropdown = () => {
    setShowSignUpDropdown(!showSignUpDropdown);
    setShowSignInDropdown(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            Roost Realestate
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            <Link to="/" className="nav-link">
              Home
              <div className="nav-indicator"></div>
            </Link>
          </div>

          {/* Auth Buttons with Dropdowns */}
          <div className="auth-buttons">
            {auth ? (
              <div className="dropdown">
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <div className="dropdown">
                  <button
                    onClick={toggleSignInDropdown}
                    className="btn-secondary"
                  >
                    Sign In{" "}
                    <ChevronDownIcon
                      className={`chevron ${
                        showSignInDropdown ? "rotate" : ""
                      }`}
                    />
                  </button>
                  {showSignInDropdown && (
                    <div className="dropdown-menu">
                      <Link to="/realtor-login" className="dropdown-item">
                        Realtor Sign In
                      </Link>
                      <Link to="/client-login" className="dropdown-item">
                        Client Sign In
                      </Link>
                    </div>
                  )}
                </div>

                <div className="dropdown">
                  <button
                    onClick={toggleSignUpDropdown}
                    className="btn-primary"
                  >
                    Sign Up{" "}
                    <ChevronDownIcon
                      className={`chevron ${
                        showSignUpDropdown ? "rotate" : ""
                      }`}
                    />
                  </button>
                  {showSignUpDropdown && (
                    <div className="dropdown-menu">
                      <Link to="/realtor-register" className="dropdown-item">
                        Realtor Sign Up
                      </Link>
                      <Link to="/client-register" className="dropdown-item">
                        Client Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <XMarkIcon className="mobile-menu-icon" />
            ) : (
              <Bars3Icon className="mobile-menu-icon" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <Link to="/" className="mobile-nav-item">
              <span className="flex items-center">Home</span>
            </Link>

            <div className="mobile-dropdown-section">
              <h3 className="mobile-section-title">Sign In Options</h3>
              <Link to="/realtor-login" className="mobile-nav-item">
                Realtor Sign In
              </Link>
              <Link to="/client-login" className="mobile-nav-item">
                Client Sign In
              </Link>
            </div>

            <div className="mobile-dropdown-section">
              <h3 className="mobile-section-title">Sign Up Options</h3>
              <Link to="/realtor-register" className="mobile-nav-item">
                Realtor Sign Up
              </Link>
              <Link to="/client-register" className="mobile-nav-item">
                Client Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

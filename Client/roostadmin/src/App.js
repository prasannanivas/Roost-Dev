// App.js
import React from "react";
import { HashRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import ClientsDashboard from "./components/ClientDashboard.jsx";
import RewardsPage from "./RewardsPage.jsx";
import ActivityPage from "./Activity.jsx";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="dashboard-container">
        <div className="sidebar">
          <h1 className="logo">Roost</h1>
          <div className="sidebar-menu">
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                isActive ? "menu-button active" : "menu-button"
              }
            >
              Activity
            </NavLink>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "menu-button active" : "menu-button"
              }
            >
              Clients
            </NavLink>
            <NavLink
              to="/rewards"
              className={({ isActive }) =>
                isActive ? "menu-button active" : "menu-button"
              }
            >
              Rewards
            </NavLink>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<ClientsDashboard />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

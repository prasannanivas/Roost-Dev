import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import RealtorLogin from "./components/auth/RealtorLogin";
import ClientLogin from "./components/auth/ClientLogin";
import RealtorRegister from "./components/auth/RealtorRegister";
import ClientRegister from "./components/auth/ClientRegister";
import Home from "./components/Home";
import { AuthProvider } from "./context/AuthContext";
import { ClientProvider } from "./context/ClientContext";
import ClientDetails from "./components/ClientDetails";
import { RealtorProvider } from "./context/RealtorContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/realtor-login" element={<RealtorLogin />} />
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/realtor-register" element={<RealtorRegister />} />
            <Route path="/client-register" element={<ClientRegister />} />
            <Route
              path="/client/:clientId"
              element={
                <RealtorProvider>
                  <ClientDetails />
                </RealtorProvider>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

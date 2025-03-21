import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ClientHome from "./ClientHome";
import RealtorHome from "./RealtorHome";
import PublicHome from "./PublicHome";
import { ClientProvider } from "../context/ClientContext";
import { RealtorProvider } from "../context/RealtorContext";

const Home = () => {
  const { auth } = useAuth();

  useEffect(() => {}, [auth]);

  if (!auth) {
    return <PublicHome />;
  }

  return auth.client ? (
    <ClientProvider>
      <ClientHome />
    </ClientProvider>
  ) : (
    <RealtorProvider>
      <RealtorHome />
    </RealtorProvider>
  );
};

export default Home;

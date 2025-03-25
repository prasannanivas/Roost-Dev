import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ClientHome from "./ClientHome";
import RealtorHome from "./RealtorHome";
import PublicHome from "./PublicHome";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "../context/ClientContext";
import { RealtorProvider } from "../context/RealtorContext";

const Home = () => {
  const { auth } = useAuth();

  const [clientQuestionaire, setClientQuestionaire] = useState({});

  useEffect(() => {
    if (auth.client) {
      const getClientInfo = async () => {
        await fetch(`http://localhost:5000/client/${auth.client.id}`)
          .then((response) => response.json())
          .then((data) => {
            setClientQuestionaire({
              applyingbehalf: data.applyingbehalf,
              employmentStatus: data.employmentStatus,
              ownAnotherProperty: data.ownAnotherProperty,
            });
          });
      };

      getClientInfo();
    }
  }, [auth]);

  if (!auth) {
    return <PublicHome />;
  }

  return auth.client ? (
    <ClientProvider>
      {clientQuestionaire.applyingbehalf &&
      clientQuestionaire.employmentStatus &&
      clientQuestionaire.ownAnotherProperty ? (
        <ClientHome />
      ) : (
        <ClientQuestionaire />
      )}
    </ClientProvider>
  ) : auth.realtor ? (
    <RealtorProvider>
      <RealtorHome />
    </RealtorProvider>
  ) : (
    <PublicHome />
  );
};

export default Home;

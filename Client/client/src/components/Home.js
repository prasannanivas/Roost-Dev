import React, { useEffect, useState, useTransition } from "react";
import { useAuth } from "../context/AuthContext";
import ClientHome from "./ClientHome";
import RealtorHome from "./RealtorHome";
import PublicHome from "./PublicHome";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "../context/ClientContext";
import { RealtorProvider } from "../context/RealtorContext";

const Home = () => {
  const { auth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  useEffect(() => {
    if (auth?.client) {
      startTransition(() => {
        const getClientInfo = async () => {
          await fetch(`http://54.89.183.155:5000/client/${auth.client.id}`)
            .then((response) => response.json())
            .then((data) => {
              setClientQuestionaire({
                applyingbehalf: data.applyingbehalf,
                employmentStatus: data.employmentStatus,
                ownAnotherProperty: data.ownAnotherProperty,
              });
              setShowQuestionnaire(
                !data.applyingbehalf ||
                  !data.employmentStatus ||
                  !data.ownAnotherProperty
              );
            });
        };
        getClientInfo();
      });
    }
  }, [auth]);

  if (!auth) {
    return <PublicHome />;
  }

  return auth.client ? (
    <ClientProvider>
      {showQuestionnaire ? <ClientQuestionaire /> : <ClientHome />}
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

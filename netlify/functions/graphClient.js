import { DeviceCodeCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

let clientInstance = null;

export function getGraphClient() {
  if (clientInstance) return clientInstance;

  const credential = new DeviceCodeCredential({
    tenantId: process.env.GRAPH_TENANT_ID || "consumers",
    clientId: process.env.GRAPH_CLIENT_ID,
    userPromptCallback: (info) => {
      console.log("======== MICROSOFT GRAPH DEVICE LOGIN REQUIRED ========");
      console.log(info.message);
      console.log("========================================================");
    }
  });

  clientInstance = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken("https://graph.microsoft.com/.default");
        return token.token;
      }
    }
  });

  return clientInstance;
}

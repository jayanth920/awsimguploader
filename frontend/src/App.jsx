// App.js

import { useAuth } from "react-oidc-context";
import ImageUpload from "./imageUpload";

// import HelloWorld from "./HelloWorld";


function App() {
  let CLIENT_ID = import.meta.env.CLIENT_ID
  let LOGOUT_URI = import.meta.env.LOGOUT_URI
  let COGNITO_DOMAIN = import.meta.env.COGNITO_DOMAIN

  const auth = useAuth();

  const signOutRedirect = () => {
    window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
  };

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  if (auth.isAuthenticated) {
    return (
      <div>
        <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre>
        {/* <HelloWorld />  */}
        <ImageUpload />


        <button onClick={() => auth.removeUser()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <button onClick={() => signOutRedirect()}>Sign out</button>
    </div>
  );
}

export default App;
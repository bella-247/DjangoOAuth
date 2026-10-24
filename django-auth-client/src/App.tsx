
import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import LoginErrorPage from "./pages/LoginErrorPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route
          path="/account/provider/callback"
          element={<OAuthCallbackPage />}
        />
        <Route
          path="/account/social/login/error"
          element={<LoginErrorPage />}
        />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

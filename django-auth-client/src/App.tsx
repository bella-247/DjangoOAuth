
import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import LoginErrorPage from "./pages/LoginErrorPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

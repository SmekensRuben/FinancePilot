import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./components/pages/LandingPage.jsx";
import LoginPage from "./components/pages/LoginPage.jsx";
import DashboardPage from "./components/pages/DashboardPage.jsx";
import ProtectedRoute from "./components/shared/ProtectedRoute.jsx";
import GeneralSettingsPage from "./components/pages/GeneralSettingsPage.jsx";
import PurchaseRequestsPage from "./components/pages/PurchaseRequestsPage.jsx";
import PurchaseRequestNewPage from "./components/pages/PurchaseRequestNewPage.jsx";
import PurchaseRequestPreviewPage from "./components/pages/PurchaseRequestPreviewPage.jsx";
import PurchaseRequestEditPage from "./components/pages/PurchaseRequestEditPage.jsx";
import PurchaseRequestListsPage from "./components/pages/PurchaseRequestListsPage.jsx";
import PurchaseRequestListNewPage from "./components/pages/PurchaseRequestListNewPage.jsx";
import PurchaseRequestListPreviewPage from "./components/pages/PurchaseRequestListPreviewPage.jsx";
import PurchaseRequestListEditPage from "./components/pages/PurchaseRequestListEditPage.jsx";
import UserConfigurationPage from "./components/pages/UserConfigurationPage.jsx";
import UserConfigurationEditPage from "./components/pages/UserConfigurationEditPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/general"
        element={
          <ProtectedRoute>
            <GeneralSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/user-configuration"
        element={
          <ProtectedRoute>
            <UserConfigurationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/user-configuration/:userId/edit"
        element={
          <ProtectedRoute>
            <UserConfigurationEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-requests"
        element={
          <ProtectedRoute>
            <PurchaseRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-requests/new"
        element={
          <ProtectedRoute>
            <PurchaseRequestNewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-requests/:requestId"
        element={
          <ProtectedRoute>
            <PurchaseRequestPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-requests/:requestId/edit"
        element={
          <ProtectedRoute>
            <PurchaseRequestEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-request-lists"
        element={
          <ProtectedRoute>
            <PurchaseRequestListsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-request-lists/new"
        element={
          <ProtectedRoute>
            <PurchaseRequestListNewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-request-lists/:listId"
        element={
          <ProtectedRoute>
            <PurchaseRequestListPreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-request-lists/:listId/edit"
        element={
          <ProtectedRoute>
            <PurchaseRequestListEditPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

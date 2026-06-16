import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/crm/Companies";
import Contacts from "./pages/crm/Contacts";
import Leads from "./pages/crm/Leads";
import Projects from "./pages/projects/Projects";
import KanbanBoard from "./pages/projects/KanbanBoard";
import Orders from "./pages/billing/Orders";
import Invoices from "./pages/billing/Invoices";
import Coupons from "./pages/billing/Coupons";
import ClientDashboard from "./pages/client/ClientDashboard";
import {
  ClientBillingPage,
  ClientDocumentsPage,
  ClientPurchasesPage,
  ClientSettingsPage,
  ClientSupportPage,
  ClientTimelinePage
} from "./pages/client/ClientPages";
import { ForgotPasswordPage, LoginPage, SetPasswordPage } from "./pages/auth/AuthPages";
import {
  DealsPage,
  EmailTemplatesPage,
  ReportsPage,
  SettingsPage,
  TasksPage,
  WhatsAppPage
} from "./pages/admin/AdminWorkflows";
import { AnalyticsPage, DatabaseTablesPage, FoldersPage, ProposalGeneratorPage, ServicesPage } from "./pages/admin/AdminTabs";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/client-secure-onboarding/access-setup" element={<SetPasswordPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute role="superadmin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="companies" element={<Companies />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="leads" element={<Leads />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="projects" element={<Projects />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="orders" element={<Orders />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="email-templates" element={<EmailTemplatesPage />} />
              <Route path="whatsapp" element={<WhatsAppPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="services" element={<Navigate to="/admin/services/coupon-generator" replace />} />
              <Route path="services/coupon-generator" element={<ServicesPage />} />
              <Route path="services/proposal-generator" element={<ProposalGeneratorPage />} />
              <Route path="proposal-generator" element={<Navigate to="/admin/services/proposal-generator" replace />} />
              <Route path="folders" element={<FoldersPage />} />
              <Route path="database" element={<DatabaseTablesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Client Portal */}
          <Route element={<ProtectedRoute role="user" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="purchases" element={<ClientPurchasesPage />} />
              <Route path="projects" element={<ClientTimelinePage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="invoices" element={<ClientBillingPage />} />
              <Route path="support" element={<ClientSupportPage />} />
              <Route path="profile" element={<ClientSettingsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

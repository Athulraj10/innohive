import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageCompetitions } from './pages/ManageCompetitions';
import { Participants } from './pages/Participants';
import { Users } from './pages/Users';
import { AdminTransactions } from './pages/AdminTransactions';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/competitions"
            element={
              <AdminProtectedRoute>
                <ManageCompetitions />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/competitions/new"
            element={
              <AdminProtectedRoute>
                <ManageCompetitions />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/competitions/:id/edit"
            element={
              <AdminProtectedRoute>
                <ManageCompetitions />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/competitions/:id/participants"
            element={
              <AdminProtectedRoute>
                <Participants />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <Users />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminProtectedRoute>
                <AdminTransactions />
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="bg-dark-card border border-dark-border text-gray-100"
          progressClassName="bg-primary-500"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


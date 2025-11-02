import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/AuthContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { DashboardProvider } from '@/context/DashboardContext'
import { ToastProvider, Toaster } from '@/components/ui/toast'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/MainLayout'
import { N8nChatWidget } from '@/components/N8nChatWidget'

// Pages
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { IncomePage } from '@/pages/IncomePage'
import ExpensePage from '@/pages/ExpensePage'
import { CategoryPage } from '@/pages/CategoryPage'
import { SavingsPage } from '@/pages/SavingsPage'
import { AccountPage } from '@/pages/AccountPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <DashboardProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />

                  {/* Onboarding Route (Protected) */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Routes with Layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/income" element={<IncomePage />} />
                    <Route path="/expenses" element={<ExpensePage />} />
                    <Route path="/categories" element={<CategoryPage />} />
                    <Route path="/savings" element={<SavingsPage />} />
                    <Route path="/accounts" element={<AccountPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <N8nChatWidget />
                <Toaster />
              </BrowserRouter>
            </DashboardProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App

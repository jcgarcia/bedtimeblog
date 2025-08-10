import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Single from "./pages/single/Single";
import TopBar from "./components/topbar/TopBar";
import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import Write from "./pages/write/Write";
import EditPage from "./pages/editPage/EditPage";
import Ops from "./pages/ops/Ops";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import UserLogin from "./pages/userLogin/UserLogin";
import Register from "./pages/register/Register";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Contact from "./pages/contact/Contact";
import Privacy from "./pages/privacy/Privacy";
import Terms from "./pages/terms/Terms";
import AdminLogin from "./pages/adminlogin/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { AdminProvider } from "./contexts/AdminContext";
import { UserProvider } from "./contexts/UserContext";

function App() {
  return (
    <div className="App">
      <UserProvider>
        <AdminProvider>
          <Router>
            <ScrollToTop />
            <TopBar />
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/category/:categoryName" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/userlogin" element={<UserLogin />} />
              <Route path="/write" element={<Write />} />
              <Route path="/edit-page" element={
                <ProtectedRoute requireAdmin={true}>
                  <EditPage />
                </ProtectedRoute>
              } />
              <Route path="/ops" element={
                <ProtectedRoute requireAdmin={true}>
                  <Ops />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={<Settings />} />
              <Route path="/post/:postId" element={<Single />} />
              <Route path="/adminlogin" element={<AdminLogin />} />
            </Routes>
            <Footer />
          </Router>
        </AdminProvider>
      </UserProvider>
    </div>
  );
}

export default App;

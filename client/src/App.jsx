import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Single from "./pages/single/Single";
import TopBar from "./components/topbar/TopBar";
import Write from "./pages/write/Write";
import Ops from "./pages/ops/Ops";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import UserLogin from "./pages/userLogin/UserLogin";
import Register from "./pages/register/Register";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Contact from "./pages/contact/Contact";
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
            <TopBar />
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/category/:categoryName" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/userlogin" element={<UserLogin />} />
              <Route path="/write" element={
                <ProtectedRoute allowRegularUsers={true}>
                  <Write />
                </ProtectedRoute>
              } />
              <Route path="/edit/:postId" element={
                <ProtectedRoute allowRegularUsers={true}>
                  <Write />
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
          </Router>
        </AdminProvider>
      </UserProvider>
    </div>
  );
}

export default App;

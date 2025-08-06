import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Single from "./pages/single/Single";
import TopBar from "./components/topbar/TopBar";
import Write from "./pages/write/Write";
import Ops from "./pages/ops/Ops";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import AdminLogin from "./pages/adminlogin/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { AdminProvider } from "./contexts/AdminContext";

function App() {
  const user = false;
  return (
    <div className="App">
      <AdminProvider>
        <Router>
          <TopBar />
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/category/:categoryName" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/register" element={user ? <Home /> : <Register />} />
            <Route path="/login" element={user ? <Home /> : <Login />} />
            <Route path="/write" element={user ? <Write /> : <Register />} />
            <Route path="/ops" element={
              <ProtectedRoute requireAdmin={true}>
                <Ops />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={user ? <Settings /> : <Register />} />
            <Route path="/post/:postId" element={<Single />} />
            <Route path="/adminlogin" element={<AdminLogin />} />
          </Routes>
        </Router>
      </AdminProvider>
    </div>
  );
}

export default App;

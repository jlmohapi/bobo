import React,{useState,useEffect} from 'react';
import {BrowserRouter,Routes,Route,Link,Navigate} from 'react-router-dom';
import './styles.css';
import Login from './components/Login';
import LecturerForm from './components/LecturerForm';
import ReportsList from './components/ReportsList';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CoursesList from './components/CoursesList';
import ClassesList from './components/ClassesList';
import Monitoring from './components/Monitoring';
import Rating from './components/Rating';

function ProtectedRoute({children, role}){
  const token=localStorage.getItem('token');
  if(!token) return <Navigate to="/login"/>;
  const user=JSON.parse(atob(token.split('.')[1]));
  if(role && user.role !== role) return <Navigate to="/dashboard"/>;
  return children;
}

function App(){
  const [user,setUser]=useState(null);
  useEffect(()=>{
    const token=localStorage.getItem('token');
    if(token){
      try{
        const decoded=JSON.parse(atob(token.split('.')[1]));
        setUser(decoded);
      }catch(e){localStorage.removeItem('token');}
    }
  },[]);

  const logout=()=>{
    localStorage.removeItem('token');
    setUser(null);
  };

  return(
    <BrowserRouter>
    <div className="container py-3">
      <h1>LUCT Faculty Reporting</h1>
      <nav className="mb-3">
        {!user ? (
          <>
            <Link to="/login" className="me-2">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="me-2">Dashboard</Link>
            {user.role==='lecturer' && <Link to="/lecturer" className="me-2">Submit Report</Link>}
            <Link to="/reports" className="me-2">Reports</Link>
            {(user.role==='pl' || user.role==='prl') && <Link to="/courses" className="me-2">Courses</Link>}
            {user.role==='pl' && <Link to="/classes" className="me-2">Classes</Link>}
            <Link to="/monitoring" className="me-2">Monitoring</Link>
            <Link to="/rating" className="me-2">Rating</Link>
            <button onClick={logout} className="btn btn-link">Logout</button>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"}/>}/>
        <Route path="/login" element={<Login setUser={setUser}/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user}/></ProtectedRoute>}/>
        <Route path="/lecturer" element={<ProtectedRoute role="lecturer"><LecturerForm/></ProtectedRoute>}/>
        <Route path="/reports" element={<ProtectedRoute><ReportsList user={user}/></ProtectedRoute>}/>
        <Route path="/courses" element={<ProtectedRoute role="pl"><CoursesList/></ProtectedRoute>}/>
        <Route path="/classes" element={<ProtectedRoute role="pl"><ClassesList/></ProtectedRoute>}/>
        <Route path="/monitoring" element={<ProtectedRoute><Monitoring/></ProtectedRoute>}/>
        <Route path="/rating" element={<ProtectedRoute><Rating user={user}/></ProtectedRoute>}/>
      </Routes>
    </div>
    </BrowserRouter>
  );
}
export default App;

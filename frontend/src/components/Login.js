import React,{useState} from 'react';
import { Link } from 'react-router-dom';

export default function Login({ setUser }){
 const [username,setUsername]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 async function submit(e){
  e.preventDefault();
  const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const data=await res.json();
  if(res.ok){
    localStorage.setItem('token',data.token);
    setUser(JSON.parse(atob(data.token.split('.')[1])));
    setMessage('Logged in as '+data.role);
  } else setMessage('Invalid login');
 }
 return(
  <form onSubmit={submit} className="card p-3">
    <h5>Login</h5>
    <input className="form-control mb-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required/>
    <input type="password" className="form-control mb-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
    <button className="btn btn-primary mb-2">Login</button>
    <div className="text-success">{message}</div>
    <p>Don't have an account? <Link to="/register">Register here</Link></p>
  </form>
 );
}

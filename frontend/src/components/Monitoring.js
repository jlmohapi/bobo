import React,{useState,useEffect} from 'react';

export default function Monitoring(){
 const [stats,setStats]=useState({});

 useEffect(()=>{
  loadStats();
 },[]);

 async function loadStats(){
  const token=localStorage.getItem('token');
  const res=await fetch('/api/monitoring',{headers:{'Authorization':'Bearer '+token}});
  if(res.ok) setStats(await res.json());
 }

 return(
  <div className="card p-3">
    <h5>Monitoring & Statistics</h5>
    <p>Average Attendance: {stats.avg_attendance ? stats.avg_attendance.toFixed(2) + '%' : 'N/A'}</p>
    <p>Average Rating: {stats.avg_rating ? stats.avg_rating.toFixed(2) : 'N/A'}</p>
  </div>
 );
}

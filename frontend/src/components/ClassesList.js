import React,{useState,useEffect} from 'react';

export default function ClassesList(){
 const [classes,setClasses]=useState([]);
 const [q,setQ]=useState('');
 const [showAdd,setShowAdd]=useState(false);
 const [form,setForm]=useState({course_id:'',name:'',venue:'',scheduled_time:'',total_registered:0});
 const [courses,setCourses]=useState([]);

 useEffect(()=>{
  loadData();
 },[]);

 async function loadData(){
  const token=localStorage.getItem('token');
  const config={headers:{'Authorization':'Bearer '+token}};
  const [cRes,coRes]=await Promise.all([
    fetch('/api/classes?q='+encodeURIComponent(q),config),
    fetch('/api/courses',config)
  ]);
  if(cRes.ok) setClasses(await cRes.json());
  if(coRes.ok) setCourses(await coRes.json());
 }

 function search(e){e.preventDefault();loadData();}

 async function addClass(e){
  e.preventDefault();
  const token=localStorage.getItem('token');
  const res=await fetch('/api/classes',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(form)});
  if(res.ok){
    setForm({course_id:'',name:'',venue:'',scheduled_time:'',total_registered:0});
    setShowAdd(false);
    loadData();
  }else alert('Error adding class');
 }

 return(
  <div className="card p-3">
    <h5>Classes</h5>
    <form onSubmit={search} className="mb-2 d-flex">
      <input className="form-control me-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search classes"/>
      <button className="btn btn-secondary">Search</button>
    </form>
    <button className="btn btn-primary mb-2" onClick={()=>setShowAdd(!showAdd)}>Add Class</button>
    {showAdd && (
      <form onSubmit={addClass} className="mb-3 border p-2">
        <select className="form-control mb-2" value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value})} required>
          <option value="">Select Course</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
        <input className="form-control mb-2" placeholder="Class Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <input className="form-control mb-2" placeholder="Venue" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/>
        <input className="form-control mb-2" placeholder="Scheduled Time" value={form.scheduled_time} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/>
        <input className="form-control mb-2" type="number" placeholder="Total Registered" value={form.total_registered} onChange={e=>setForm({...form,total_registered:e.target.value})}/>
        <button className="btn btn-success">Add</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={()=>setShowAdd(false)}>Cancel</button>
      </form>
    )}
    {classes.map(c=><div key={c.id} className="border p-2 mb-2"><b>{c.name}</b> - {c.course_name} | Venue: {c.venue} | Time: {c.scheduled_time} | Registered: {c.total_registered}</div>)}
  </div>
 );
}

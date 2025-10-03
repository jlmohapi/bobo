import React,{useState,useEffect} from 'react';

export default function CoursesList(){
 const [courses,setCourses]=useState([]);
 const [q,setQ]=useState('');
 const [showAdd,setShowAdd]=useState(false);
 const [form,setForm]=useState({faculty_id:'',name:'',code:'',stream:''});
 const [faculties,setFaculties]=useState([]);

 useEffect(()=>{
  loadData();
 },[]);

 async function loadData(){
  const token=localStorage.getItem('token');
  const config={headers:{'Authorization':'Bearer '+token}};
  const [cRes,fRes]=await Promise.all([
    fetch('/api/courses?q='+encodeURIComponent(q),config),
    fetch('/api/faculties',config)
  ]);
  if(cRes.ok) setCourses(await cRes.json());
  if(fRes.ok) setFaculties(await fRes.json());
 }

 function search(e){e.preventDefault();loadData();}

 async function addCourse(e){
  e.preventDefault();
  const token=localStorage.getItem('token');
  const res=await fetch('/api/courses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(form)});
  if(res.ok){
    setForm({faculty_id:'',name:'',code:'',stream:''});
    setShowAdd(false);
    loadData();
  }else alert('Error adding course');
 }

 return(
  <div className="card p-3">
    <h5>Courses</h5>
    <form onSubmit={search} className="mb-2 d-flex">
      <input className="form-control me-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses"/>
      <button className="btn btn-secondary">Search</button>
    </form>
    <button className="btn btn-primary mb-2" onClick={()=>setShowAdd(!showAdd)}>Add Course</button>
    {showAdd && (
      <form onSubmit={addCourse} className="mb-3 border p-2">
        <select className="form-control mb-2" value={form.faculty_id} onChange={e=>setForm({...form,faculty_id:e.target.value})} required>
          <option value="">Select Faculty</option>
          {faculties.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input className="form-control mb-2" placeholder="Course Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <input className="form-control mb-2" placeholder="Course Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} required/>
        <input className="form-control mb-2" placeholder="Stream" value={form.stream} onChange={e=>setForm({...form,stream:e.target.value})}/>
        <button className="btn btn-success">Add</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={()=>setShowAdd(false)}>Cancel</button>
      </form>
    )}
    {courses.map(c=><div key={c.id} className="border p-2 mb-2"><b>{c.name} ({c.code})</b> - {c.faculty_name} | Stream: {c.stream}</div>)}
  </div>
 );
}

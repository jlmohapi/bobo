import React,{useState,useEffect} from 'react';
export default function ReportsList({user}){
 const [reports,setReports]=useState([]);
 const [q,setQ]=useState('');
 const [feedbacks,setFeedbacks]=useState({});

 async function load(){
  const token=localStorage.getItem('token');
  const res=await fetch('/api/reports?q='+encodeURIComponent(q),{headers:{'Authorization':'Bearer '+token}});
  if(res.ok){setReports(await res.json());}
 }
 useEffect(()=>{load();},[]);
 function search(e){e.preventDefault();load();}
 function exportCSV(){window.open('/api/reports/export?q='+encodeURIComponent(q));}
 function exportExcel(){window.open('/api/reports/export?format=excel&q='+encodeURIComponent(q));}

 async function submitFeedback(id){
  const token=localStorage.getItem('token');
  const res=await fetch(`/api/reports/${id}/feedback`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({feedback:feedbacks[id]})});
  if(res.ok){alert('Feedback submitted');load();}else alert('Error');
 }

 return(
  <div className="card p-3">
    <h5>Reports</h5>
    <form onSubmit={search} className="mb-2 d-flex">
      <input className="form-control me-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses, lecturers, topics"/>
      <button className="btn btn-secondary">Search</button>
    </form>
    <div className="mb-2">
      <button className="btn btn-outline-success me-2" onClick={exportCSV}>Download CSV</button>
      <button className="btn btn-outline-success" onClick={exportExcel}>Download Excel</button>
    </div>
    {reports.map(r=>
      <div key={r.id} className="border p-2 mb-2">
        <b>{r.course_name} ({r.course_code})</b> - {r.topic_taught}<br/>
        Lecturer: {r.lecturer_name} | Class: {r.class_name} | Date: {r.lecture_date}<br/>
        Week: {r.week_of_reporting} | Present: {r.actual_students_present}/{r.total_registered}<br/>
        Outcomes: {r.learning_outcomes}<br/>
        Recommendations: {r.recommendations}<br/>
        {r.feedback && <div><b>Feedback:</b> {r.feedback}</div>}
        {user && user.role==='prl' && (
          <div className="mt-2">
            <textarea className="form-control mb-1" placeholder="Add feedback" value={feedbacks[r.id]||''} onChange={e=>setFeedbacks({...feedbacks,[r.id]:e.target.value})}/>
            <button className="btn btn-sm btn-primary" onClick={()=>submitFeedback(r.id)}>Submit Feedback</button>
          </div>
        )}
      </div>
    )}
  </div>
 );
}

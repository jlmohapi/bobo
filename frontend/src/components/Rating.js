import React,{useState} from 'react';

export default function Rating({user}){
 const [form,setForm]=useState({target_id:'',target_type:'lecturer',rating:5,comment:''});
 const [message,setMessage]=useState('');

 async function submit(e){
  e.preventDefault();
  const token=localStorage.getItem('token');
  const res=await fetch('/api/ratings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(form)});
  if(res.ok){
    setMessage('Rating submitted');
    setForm({target_id:'',target_type:'lecturer',rating:5,comment:''});
  }else setMessage('Error');
 }

 return(
  <form onSubmit={submit} className="card p-3">
    <h5>Submit Rating</h5>
    <select className="form-control mb-2" value={form.target_type} onChange={e=>setForm({...form,target_type:e.target.value})}>
      <option value="lecturer">Lecturer</option>
      <option value="course">Course</option>
      <option value="class">Class</option>
    </select>
    <input className="form-control mb-2" placeholder="Target ID" value={form.target_id} onChange={e=>setForm({...form,target_id:e.target.value})} required/>
    <input className="form-control mb-2" type="number" min="1" max="5" placeholder="Rating (1-5)" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/>
    <textarea className="form-control mb-2" placeholder="Comment" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})}/>
    <button className="btn btn-primary">Submit Rating</button>
    <div className="text-success">{message}</div>
  </form>
 );
}

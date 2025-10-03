import React,{useState,useEffect} from 'react';
export default function LecturerForm(){
 const [form,setForm]=useState({class_id:'',course_id:'',week_of_reporting:'',lecture_date:'',topic_taught:'',learning_outcomes:'',recommendations:'',actual_students_present:0});
 const [message,setMessage]=useState('');
 const [classes,setClasses]=useState([]);
 const [courses,setCourses]=useState([]);
 const [faculties,setFaculties]=useState([]);
 const [errors,setErrors]=useState({});

 useEffect(()=>{
  loadData();
 },[]);

 async function loadData(){
  const token=localStorage.getItem('token');
  const config={headers:{'Authorization':'Bearer '+token}};
  const [cRes,coRes,fRes]=await Promise.all([
    fetch('/api/user/classes',config),
    fetch('/api/courses',config),
    fetch('/api/faculties',config)
  ]);
  if(cRes.ok) setClasses(await cRes.json());
  if(coRes.ok) setCourses(await coRes.json());
  if(fRes.ok) setFaculties(await fRes.json());
 }

 function update(e){
  const {name,value}=e.target;
  setForm({...form,[name]:value});
  if(errors[name]) setErrors({...errors,[name]:''});
 }

 function validate(){
  const errs={};
  if(!form.class_id) errs.class_id='Class is required';
  if(!form.course_id) errs.course_id='Course is required';
  if(!form.week_of_reporting) errs.week_of_reporting='Week is required';
  if(!form.lecture_date) errs.lecture_date='Date is required';
  if(!form.topic_taught) errs.topic_taught='Topic is required';
  if(!form.learning_outcomes) errs.learning_outcomes='Outcomes are required';
  if(form.actual_students_present < 0) errs.actual_students_present='Must be non-negative';
  setErrors(errs);
  return Object.keys(errs).length===0;
 }

 async function submit(e){
  e.preventDefault();
  if(!validate()) return;
  const token=localStorage.getItem('token');
  const res=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(form)});
  if(res.ok){
    setMessage('Report submitted');
    setForm({class_id:'',course_id:'',week_of_reporting:'',lecture_date:'',topic_taught:'',learning_outcomes:'',recommendations:'',actual_students_present:0});
  }else setMessage('Error');
 }

 return(
  <form onSubmit={submit} className="card p-3">
    <h5>Lecturer Reporting</h5>
    <select className="form-control mb-2" name="class_id" value={form.class_id} onChange={update}>
      <option value="">Select Class</option>
      {classes.map(c=><option key={c.id} value={c.id}>{c.name} - {c.course_name}</option>)}
    </select>
    {errors.class_id && <div className="text-danger">{errors.class_id}</div>}
    <select className="form-control mb-2" name="course_id" value={form.course_id} onChange={update}>
      <option value="">Select Course</option>
      {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
    </select>
    {errors.course_id && <div className="text-danger">{errors.course_id}</div>}
    <input className="form-control mb-2" name="week_of_reporting" placeholder="Week of Reporting" value={form.week_of_reporting} onChange={update}/>
    {errors.week_of_reporting && <div className="text-danger">{errors.week_of_reporting}</div>}
    <input className="form-control mb-2" type="date" name="lecture_date" value={form.lecture_date} onChange={update}/>
    {errors.lecture_date && <div className="text-danger">{errors.lecture_date}</div>}
    <input className="form-control mb-2" name="topic_taught" placeholder="Topic Taught" value={form.topic_taught} onChange={update}/>
    {errors.topic_taught && <div className="text-danger">{errors.topic_taught}</div>}
    <textarea className="form-control mb-2" name="learning_outcomes" placeholder="Learning Outcomes" value={form.learning_outcomes} onChange={update}/>
    {errors.learning_outcomes && <div className="text-danger">{errors.learning_outcomes}</div>}
    <textarea className="form-control mb-2" name="recommendations" placeholder="Recommendations" value={form.recommendations} onChange={update}/>
    <input className="form-control mb-2" type="number" name="actual_students_present" placeholder="Actual Present" value={form.actual_students_present} onChange={update}/>
    {errors.actual_students_present && <div className="text-danger">{errors.actual_students_present}</div>}
    <button className="btn btn-primary">Submit</button>
    <div className="text-success">{message}</div>
  </form>
 );
}

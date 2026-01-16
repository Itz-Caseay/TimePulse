const teachers = [
  {id:1,name:'Alice Johnson',role:'Math'},
  {id:2,name:'Brian Smith',role:'Science'},
  {id:3,name:'Carla Gomez',role:'English'}
];

let entries = [
  {teacherId:1,date:'2026-01-05',hours:4, note:'Prep'},
  {teacherId:2,date:'2026-01-06',hours:3.5, note:'Lab'},
  {teacherId:3,date:'2026-01-07',hours:2, note:'Cover'}
];

const el = id => document.getElementById(id);
const tbody = document.querySelector('#entries-table tbody');
let currentFilter = {teacher:'all', week:''};

function init(){
  populateTeacherSelectors();
  render();
  setupListeners();
}

function populateTeacherSelectors(){
  const sel = el('teacher-select');
  const filter = el('filter-teacher');
  teachers.forEach(t=>{
    const o=document.createElement('option');o.value=t.id;o.textContent=t.name;o.selected=false;sel.appendChild(o);
    const o2=document.createElement('option');o2.value=t.id;o2.textContent=t.name;filter.appendChild(o2);
  });
}

function setupListeners(){
  document.getElementById('log-form').addEventListener('submit',e=>{e.preventDefault();addEntry();});
  el('filter-teacher').addEventListener('change',e=>{currentFilter.teacher=e.target.value;render();});
  el('filter-week').addEventListener('change',e=>{currentFilter.week=e.target.value;render();});
  el('export').addEventListener('click',exportCSV);
}

function addEntry(){
  const teacherId = Number(el('teacher-select').value);
  const date = el('date').value;
  const hours = parseFloat(el('hours').value) || 0;
  const note = el('note').value || '';
  if(!teacherId || !date || hours<=0) return alert('Please complete teacher, date and hours');
  entries.unshift({teacherId,date,hours,note});
  document.getElementById('log-form').reset();
  render();
}

function getTeacherName(id){
  const t = teachers.find(x=>x.id===id);return t? t.name : '—';
}

function entryMatchesFilter(entry){
  if(currentFilter.teacher!=='all' && Number(currentFilter.teacher)!==entry.teacherId) return false;
  if(currentFilter.week){
    const yw = dateToWeek(entry.date);
    return yw===currentFilter.week;
  }
  return true;
}

function dateToWeek(dateStr){
  // returns YYYY-Www matching input[type=week] format
  const d = new Date(dateStr+'T00:00:00');
  const year = d.getFullYear();
  const week = getISOWeek(d);
  return `${year}-W${String(week).padStart(2,'0')}`;
}

function getISOWeek(date){
  const tmp = new Date(date.valueOf());
  tmp.setHours(0,0,0,0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay()||7));
  const yearStart = new Date(tmp.getFullYear(),0,1);
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

function render(){
  // entries
  tbody.innerHTML = '';
  const visible = entries.filter(entryMatchesFilter);
  visible.forEach((e,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(getTeacherName(e.teacherId))}</td><td>${e.date}</td><td>${e.hours}</td><td>${escapeHtml(e.note)}</td><td><button class="small-btn" data-i="${i}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  // delete handlers
  tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',ev=>{
    const idx = Number(ev.currentTarget.dataset.i);
    const globalIndex = entries.indexOf(visible[idx]);
    if(globalIndex>=0){ entries.splice(globalIndex,1); render(); }
  }));

  // stats
  el('total-teachers').textContent = teachers.length;
  const totalHours = visible.reduce((s,x)=>s + Number(x.hours),0);
  el('total-hours').textContent = totalHours.toFixed(2);
  el('avg-hours').textContent = (teachers.length? (totalHours/teachers.length).toFixed(2) : '0');
}

function exportCSV(){
  const visible = entries.filter(entryMatchesFilter);
  const rows = [['Teacher','Date','Hours','Note']].concat(visible.map(e=>[getTeacherName(e.teacherId),e.date,String(e.hours),e.note]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='teacher-hours.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]});}

document.addEventListener('DOMContentLoaded',init);

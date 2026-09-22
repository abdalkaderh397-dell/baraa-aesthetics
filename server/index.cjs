const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 8000;
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "baraa_aesthetics",
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10
});

app.use(cors({origin:true, credentials:true}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "baraa-dev-secret",
  resave:false, saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:false,maxAge:1000*60*60*8}
}));

const slots = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
const defaultDays = {0:false,1:true,2:true,3:true,4:true,5:true,6:true}; // JS: Sun=0, Fri=5

function workingSlots(startTime,endTime){
  const startParts=String(startTime || "").slice(0,5).split(":").map(Number);
  const endParts=String(endTime || "").slice(0,5).split(":").map(Number);
  if(startParts.length!==2 || endParts.length!==2 || startParts.some(Number.isNaN) || endParts.some(Number.isNaN)) return [];
  const startMinutes=startParts[0]*60+startParts[1];
  const endMinutes=endParts[0]*60+endParts[1];
  const result=[];
  for(let minutes=startMinutes; minutes<endMinutes; minutes+=60){
    result.push(`${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`);
  }
  return result;
}

function validScheduleTime(time){
  if(!/^\d{2}:\d{2}(:\d{2})?$/.test(String(time || ""))) return false;
  const minutes=timeMinutes(time);
  return Number.isFinite(minutes) && minutes>=0 && minutes<24*60;
}
function timeMinutes(time){
  const parts=String(time || "").slice(0,5).split(":").map(Number);
  return parts.length===2 && parts.every(Number.isFinite)
    ? parts[0]*60+parts[1]
    : NaN;
}
function isClosedSlot(time,periods){
  const minutes=timeMinutes(time);
  return periods.some(period => {
    const start=timeMinutes(period.start_time);
    const end=timeMinutes(period.end_time);
    return minutes>=start && minutes<end;
  });
}

async function initDb(){
  await pool.query(`CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS settings (
    day_of_week TINYINT PRIMARY KEY,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00'
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS closed_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    INDEX idx_closed_periods_day (day_of_week)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(180) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    notes TEXT,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_approved_slot (booking_date, booking_time, status)
  )`);
  await pool.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending'");
  const [bookingColumns] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='bookings'"
  );
  const bookingColumnNames = new Set(bookingColumns.map((column) => column.COLUMN_NAME));
  if (!bookingColumnNames.has("cancelled_at")) {
    await pool.query("ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL");
  }
  if (!bookingColumnNames.has("cancellation_note")) {
    await pool.query("ALTER TABLE bookings ADD COLUMN cancellation_note TEXT NULL");
  }
  for(const [day,open] of Object.entries(defaultDays)){
    await pool.query(`INSERT IGNORE INTO settings(day_of_week,is_open,start_time,end_time) VALUES (?,?,?,?)`,
      [Number(day),open,"09:00:00","17:00:00"]);
  }
  await pool.query("UPDATE settings SET is_open=FALSE WHERE day_of_week=5");
  const [admins] = await pool.query("SELECT id FROM admins LIMIT 1");
  if(!admins.length){
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const hash = await bcrypt.hash(password,12);
    await pool.query("INSERT INTO admins(username,password_hash) VALUES (?,?)",[username,hash]);
    console.log(`Admin created: ${username} / ${password}`);
  }
}

function auth(req,res,next){
  if(!req.session.adminId) return res.status(401).json({message:"Unauthorized"});
  next();
}
function validDate(d){ return /^\d{4}-\d{2}-\d{2}$/.test(d); } 
function validTime(t){ return /^\d{2}:\d{2}$/.test(String(t || "")); }
function normalizePhone(phone){
  return String(phone || "")
    .trim()
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d+]/g, "");
}

app.get("/api/health", async (req,res)=>{
  try { await pool.query("SELECT 1"); res.json({ok:true}); }
  catch(e){ res.status(500).json({ok:false,message:e.message}); }
});

app.get("/api/settings", async (req,res)=>{
  const [rows] = await pool.query("SELECT * FROM settings ORDER BY day_of_week");
  const [periods] = await pool.query("SELECT id,day_of_week,start_time,end_time FROM closed_periods ORDER BY day_of_week,start_time,id");
  const periodsByDay=new Map();
  for(const period of periods){
    const day=Number(period.day_of_week);
    if(!periodsByDay.has(day)) periodsByDay.set(day,[]);
    periodsByDay.get(day).push(period);
  }
  res.json(rows.map(row => ({
    ...row,
    is_open: row.day_of_week === 5 ? 0 : row.is_open,
    closed_periods: periodsByDay.get(Number(row.day_of_week)) || []
  })));
});

app.get("/api/availability", async (req,res)=>{
  const {date} = req.query;
  if(!validDate(date)) return res.status(400).json({message:"Invalid date"});
  const [settings] = await pool.query("SELECT * FROM settings WHERE day_of_week = DAYOFWEEK(?) - 1",[date]);
  if(!settings.length || settings[0].day_of_week === 5 || !settings[0].is_open) return res.json({available:[]});
  const [closedPeriods] = await pool.query(
    "SELECT start_time,end_time FROM closed_periods WHERE day_of_week=?",
    [settings[0].day_of_week]
  );
  const [booked] = await pool.query(
    "SELECT DATE_FORMAT(booking_time,'%H:%i') time FROM bookings WHERE booking_date=? AND status='approved'",
    [date]
  );
  const taken = new Set(booked.map(x=>x.time));
  res.json({available:workingSlots(settings[0].start_time,settings[0].end_time).filter(s=>!taken.has(s) && !isClosedSlot(s,closedPeriods))});
});
app.get("/api/my-bookings", async (req,res)=>{
  try{
    const phone = normalizePhone(req.query.phone);

    if(!phone){
      return res.status(400).json({
        message:"يرجى إدخال رقم الهاتف."
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        service,
        booking_date,
        booking_time,
        name,
        phone,
        notes,
        status,
        cancelled_at,
        cancellation_note,
        created_at
       FROM bookings
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '')=?
       ORDER BY booking_date DESC, booking_time DESC`,
      [phone]
    );

    res.json(rows);
  }catch(e){
    console.error("MY BOOKINGS ERROR:",e);
    res.status(500).json({
      message:"حدث خطأ أثناء جلب الحجوزات."
    });
  }
});

app.patch("/api/my-bookings/:id/cancel", async (req,res)=>{
  try{
    const id=Number(req.params.id);
    const phone=normalizePhone(req.body?.phone);
    const cancellationNote=String(req.body?.cancellationNote || "").trim();

    if(!Number.isInteger(id) || id<1 || !phone)
      return res.status(400).json({message:"رقم الحجز ورقم الهاتف مطلوبان."});

    const [result]=await pool.query(
      `UPDATE bookings
       SET status='cancelled', cancelled_at=CURRENT_TIMESTAMP, cancellation_note=?
      WHERE id=? AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '')=? AND status IN ('pending','approved')`,
      [cancellationNote || null,id,phone]
    );

    if(!result.affectedRows){
      const [rows]=await pool.query("SELECT id,status FROM bookings WHERE id=? AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '')=? LIMIT 1",[id,phone]);
      if(!rows.length) return res.status(404).json({message:"لم يتم العثور على الحجز."});
      if(rows[0].status === "cancelled") return res.status(409).json({message:"تم إلغاء هذا الحجز مسبقاً."});
      return res.status(409).json({message:"لا يمكن إلغاء هذا الحجز."});
    }

    res.json({ok:true});
  }catch(e){
    console.error("CANCEL BOOKING ERROR:",e);
    res.status(500).json({message:"حدث خطأ أثناء إلغاء الحجز."});
  }
});

app.post("/api/bookings", async (req,res)=>{
  const {service,date,time,name,phone,notes=""} = req.body || {};
  const normalizedPhone = normalizePhone(phone);
  if(!service || !validDate(date) || !validTime(time) || !name || !normalizedPhone)
    return res.status(400).json({message:"Please complete all required fields."});
  const [settings] = await pool.query("SELECT * FROM settings WHERE day_of_week=DAYOFWEEK(?) - 1",[date]);
  if(!settings.length || settings[0].day_of_week === 5)
    return res.status(400).json({message:"Friday is the clinic's weekly day off."});
  if(!settings[0].is_open) return res.status(400).json({message:"This day is closed."});
  const [closedPeriods] = await pool.query(
    "SELECT start_time,end_time FROM closed_periods WHERE day_of_week=?",
    [settings[0].day_of_week]
  );
  if(!workingSlots(settings[0].start_time,settings[0].end_time).includes(time) || isClosedSlot(time,closedPeriods))
    return res.status(400).json({message:"This time is outside working hours."});
  const [existing] = await pool.query(
    "SELECT id FROM bookings WHERE booking_date=? AND booking_time=? AND status IN ('pending','approved') LIMIT 1",
    [date,time]
  );
  if(existing.length) return res.status(409).json({message:"This time slot is already requested or booked."});
  const [result] = await pool.query(
    "INSERT INTO bookings(service,booking_date,booking_time,name,phone,notes) VALUES (?,?,?,?,?,?)",
    [service,date,time,name,normalizedPhone,notes]
  );
  res.status(201).json({ok:true,id:result.insertId});
});

app.post("/api/admin/login", async (req,res)=>{
  const {username,password} = req.body || {};
  const [rows] = await pool.query("SELECT * FROM admins WHERE username=? LIMIT 1",[username]);
  if(!rows.length || !(await bcrypt.compare(password || "", rows[0].password_hash)))
    return res.status(401).json({message:"اسم المستخدم أو كلمة المرور غير صحيحة"});
  req.session.adminId = rows[0].id;
  req.session.adminUsername = rows[0].username;
  res.json({ok:true,username:rows[0].username});
});
app.post("/api/admin/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/me",auth,(req,res)=>res.json({ok:true,username:req.session.adminUsername}));
app.get("/api/admin/bookings",auth,async(req,res)=>{

  const [rows] = await pool.query(
    "SELECT id,service,DATE_FORMAT(booking_date,'%Y-%m-%d') AS booking_date,booking_time,name,phone,notes,status,created_at,cancelled_at,cancellation_note FROM bookings ORDER BY booking_date DESC, booking_time DESC, id DESC"
  );


  res.json(rows);

});
app.patch("/api/admin/bookings/:id",auth,async(req,res)=>{
  const {status}=req.body||{};
  if(!["approved","rejected","pending"].includes(status)) return res.status(400).json({message:"Invalid status"});
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [rows]=await conn.query("SELECT * FROM bookings WHERE id=? FOR UPDATE",[req.params.id]);
    if(!rows.length){await conn.rollback();return res.status(404).json({message:"Booking not found"});}
    const b=rows[0];
    if(status==="approved"){
      const [conflict]=await conn.query(
        "SELECT id FROM bookings WHERE booking_date=? AND booking_time=? AND status='approved' AND id<>? LIMIT 1",
        [b.booking_date,b.booking_time,b.id]
      );
      if(conflict.length){await conn.rollback();return res.status(409).json({message:"الموعد محجوز مسبقاً"});}
    }
    await conn.query("UPDATE bookings SET status=? WHERE id=?",[status,b.id]);
    await conn.commit();
    res.json({ok:true});
  }catch(e){await conn.rollback();res.status(500).json({message:e.message});}
  finally{conn.release();}
});

app.patch("/api/admin/settings/:day",auth,async(req,res)=>{
  const day=Number(req.params.day), {is_open,start_time,end_time,closed_periods=[]}=req.body||{};
  if(day<0||day>6) return res.status(400).json({message:"Invalid day"});
  if(day===5) return res.status(400).json({message:"Friday is a fixed weekly day off."});
  if(!validScheduleTime(start_time) || !validScheduleTime(end_time) || String(start_time).slice(0,5)>=String(end_time).slice(0,5))
    return res.status(400).json({message:"Invalid working hours."});
  if(!Array.isArray(closed_periods)) return res.status(400).json({message:"Invalid closed periods."});
  const dayStart=timeMinutes(start_time);
  const dayEnd=timeMinutes(end_time);
  const normalized=closed_periods.map(period => ({
    start_time:String(period.start_time || ""),
    end_time:String(period.end_time || "")
  }));
  const sorted=normalized
    .map(period => ({...period,start:timeMinutes(period.start_time),end:timeMinutes(period.end_time)}))
    .sort((a,b)=>a.start-b.start);
  for(let index=0; index<sorted.length; index++){
    const period=sorted[index];
    if(!validScheduleTime(period.start_time) || !validScheduleTime(period.end_time) || period.start>=period.end || period.start<dayStart || period.end>dayEnd)
      return res.status(400).json({message:"Invalid closed period."});
    if(index>0 && period.start<sorted[index-1].end)
      return res.status(400).json({message:"Closed periods cannot overlap."});
  }
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    await conn.query("UPDATE settings SET is_open=?,start_time=?,end_time=? WHERE day_of_week=?",[!!is_open,start_time,end_time,day]);
    await conn.query("DELETE FROM closed_periods WHERE day_of_week=?",[day]);
    for(const period of normalized){
      await conn.query(
        "INSERT INTO closed_periods(day_of_week,start_time,end_time) VALUES (?,?,?)",
        [day,period.start_time,period.end_time]
      );
    }
    await conn.commit();
    res.json({ok:true});
  }catch(error){
    await conn.rollback();
    res.status(500).json({message:error.message});
  }finally{
    conn.release();
  }
});

app.get("/api/admin/stats",auth,async(req,res)=>{
  const [[all]]=await pool.query("SELECT COUNT(*) count FROM bookings");
  const [[pending]]=await pool.query("SELECT COUNT(*) count FROM bookings WHERE status='pending'");
  const [[approved]]=await pool.query("SELECT COUNT(*) count FROM bookings WHERE status='approved'");
  const [[rejected]]=await pool.query("SELECT COUNT(*) count FROM bookings WHERE status='rejected'");
  res.json({all:all.count,pending:pending.count,approved:approved.count,rejected:rejected.count});
});

initDb().then(()=>{
  app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
}).catch(err=>{
  console.error("Database initialization failed:",err.message);
  console.error("Create the database first if needed: CREATE DATABASE baraa_aesthetics;");
});
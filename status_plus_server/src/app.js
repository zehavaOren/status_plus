const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();


app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 
app.use(fileUpload());

const authRoutes = require('./routes/AuthenticationRoutes');
const employeeRoutes=require('./routes/EmployeeRoutes');
// const managementRoutes = require('./routes/AdminRoutes');
const student = './routes/StudentRoutes';
const studentRoutes=require(student);
// const studentRoutes = require('./routes/StudentRoutes');
const studentStatus = './routes/StudentStatusRoutes';
const studentStatusRoutes = require(studentStatus);
const fileRoutes = require('./routes/FileRoutes');
const commonRoutes= require('./routes/CommonRoutes');

const PORT = process.env.PORT || 4000;


app.use('/auth', authRoutes);
app.use('/employee', employeeRoutes);
// app.use('/management', managementRoutes);
app.use('/student', studentRoutes);
app.use('/studentStatus', studentStatusRoutes);
app.use('/file', fileRoutes);
app.use('/common', commonRoutes)

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



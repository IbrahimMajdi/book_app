'use static'
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const ejs = require('ejs');


const PORT = process.env.PORT || 3030;
const app = express();
app.use(express.static('./public'));

app.get('/hello',(req,res)=>{
    // res.status(200).send(req.query)
    res.render('pages/index')
    
})


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
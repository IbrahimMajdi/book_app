'use static'
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const ejs = require('ejs');


const PORT = process.env.PORT || 3030;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


//test
app.get('/hello', (req, res) => {
    // res.status(200).send(req.query)
    res.render('pages/index')

})


//search books
app.get('/searches/new', (req, res) => {
    // res.status(200).send(req.query)
    res.render('pages/searches/new.ejs');



})

//get api books
app.post('/searches', (req, res) => {

    let url = `GET https://www.googleapis.com/books/v1/volumes?q=${'flowers'}&orderBy=newest`;

    superagent.get(url).then(book => {

        let bookDetails = book.body.items.map(item => {
            let newBook = new Book(item);
            return newBook;
        })
        return bookDetails;
    }).then(

        app.get('/searches/show', (req, res) => {
            // res.status(200).send(req.query)
            res.render('pages/searches/show.ejs', {
                booksData: bookDetails
            });
        }))

})

//Render the newly constructed array of objects in a new view


function Book(item) {

    let thumbCheck = item.volumeInfo.thumbnail;
    thumbCheck = thumbCheck.replace(/^http:\/\//i, 'https://');
    this.title = item.volumeInfo.title;
    this.authorName = item.volumeInfo.authors[0];
    this.description = item.volumeInfo.description;
    this.thumbnail = check(thumbCheck);
}


var check = thumb => {
    let res = thumb ? thumb : 'https://i.imgur.com/J5LVHEL.jpg'
    return res;
}


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
'use static'
require('dotenv').config();

const express = require('express');
const {
    response
} = require('express');
const superagent = require('superagent');
const ejs = require('ejs');
const pg = require('pg');

const PORT = process.env.PORT || 3030;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL)

app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


//Routs////////////////////

//main page
app.get('/', mainHandler)

//search books page
app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new.ejs');
})

//get books from api and store them in DB 
app.post('/searches', apiHandler)

//get book details page
app.get('/books/:book_id', bookInfo)

// add a new book to DB.
app.post('/book', addBook);




////routs handlers

//main page function to render saved books from DB.
function mainHandler(req, res) {
    let SQL = 'SELECT * FROM books;';
    client.query(SQL).then(results => {
        console.log("main handler", results.rowCount);
        res.render('pages/index', {
            results: results.rows,
            booksNum: results.rowCount
        })

    })
}


// get book details after being inserted on the database
//use the view details button on the index.ejs to get the values 
//render the specific book details from the DB.

function bookInfo(req, res) {
    let SQL = `SELECT * FROM books WHERE id=$1`;
    let values = [req.params.book_id]

    client.query(SQL, values).then(result => {

        console.log("bookInfo", result.rows);
        res.render('pages/bookInfo', {
            bookInfo: result.rows[0]
        })
    })

}

function apiHandler(req, res) {

    let searchbox = req.body.searchbox;
    console.log("searchbox", searchbox);
    let search = req.body.search;
    console.log("search", search);

    let url = "";

    console.log("get query", searchbox);

    if (search === 'title') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+intitle:${searchbox}`
    }
    if (search === 'author') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+inauthor:${searchbox}`
    }
    console.log(url);
    superagent.get(url).then(book => {

        let bookDetails = book.body.items.map(item => {
            return new Book(item);
        })

        return bookDetails;

    }).then(results => res.render('pages/searches/show.ejs', {
        booksData: results
    }))
}


function addBook(req, res) {
    let info = req.body
    // console.log(info);
    let SQL = `INSERT INTO books (title,authorname,description,thumbnail,shelfName,identifier) VALUES ($1,$2,$3,$4,$5,$6);`
    let values = [info.title, info.authorname, info.description, info.thumbnail, info.shelfName, info.identifier];

    client.query(SQL, values).then(() => {
        let SQL2 = `SELECT * FROM books WHERE identifier=$1;`
        let values = [info.identifier]

        client.query(SQL2, values).then(result => {
            res.redirect(`/books/${result.rows[0].id}`)
        })
    })

}


function Book(item) {

    let thumbCheck = item.volumeInfo.imageLinks.thumbnail;
    thumbCheck = thumbCheck.replace(/^http:\/\//i, 'https://');

    this.title = item.volumeInfo.title ? item.volumeInfo.title : 'not avilable';
    this.authorname = item.volumeInfo.authors ? item.volumeInfo.authors : 'not avilable';
    this.description = item.volumeInfo.description ? item.volumeInfo.description : 'not avilable';
    this.thumbnail = thumbCheck ? thumbCheck : 'not avilable';
    this.identifier = item.volumeInfo.industryIdentifiers[0].identifier ? item.volumeInfo.industryIdentifiers[0].identifier : 'not avilable';
}


// var checkImg = thumbCheck => {
//     let res = thumbCheck ? thumbCheck : 'https://i.imgur.com/J5LVHEL.jpg'
//     return res;
// }

// var checkTitle = title => {
//     let res = title ? title : 'not avilable'
//     return res;
// }
// var checkAuthor = authorname => {
//     let res = authorname ? authorname : 'not avilable'
//     return res;
// }

// var checkDescription = description => {
//     let res = description ? description : 'not avilable'
//     return res;
// }

app.get('*', (req, res) => {
    res.render('pages/error.ejs');
})

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`connected and listening on port ${PORT}`)
        })

    })
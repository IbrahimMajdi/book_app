'use static'
require('dotenv').config();

const express = require('express');
const {
    response
} = require('express');
const superagent = require('superagent');
const ejs = require('ejs');
const pg = require('pg');
const method_or = require('method-override');
const PORT = process.env.PORT || 3030;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');
app.set("views", ["views/pages", "views/pages/searches"])


app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(method_or('_method'));


//Routs////////////////////

//main page
app.get('/', mainHandler)

//search books page
app.get('/searches/new', (req, res) => {
    res.render('new');
})

//get books from api and store them in DB 
app.post('/searches', apiHandler)

//get book details page
app.get('/books/:book_id', bookInfo)

// add a new book to DB.
app.post('/book', addBook);

//update book info
app.put('/updatebook/:book_id',updateBook)

//delete book
app.delete('/deletebook/:book_id',deleteBook);
////routs handlers

//main page function to render saved books from DB.
function mainHandler(req, res) {
    let SQL = 'SELECT * FROM books;';
    client.query(SQL).then(books => {
        res.render('index', {
            books: books.rows,
            booksNum: books.rowCount
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
        res.render('bookInfo', {
            books: result.rows[0]
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

        let bookDetails = book.body.items.map( item => {
                    return new Book(item);
                })

        return bookDetails;

    }).then(results => res.render('show', {
        books: results
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


function updateBook (req,res) { 
    let {title,authorname,description,thumbnail,shelfName,identifier} = req.body;
    let SQL = ` UPDATE books SET title=$1,authorname=$2,description=$3,thumbnail=$4,shelfName=$5,identifier=$6 WHERE id=$7;`
    let id= req.params.book_id;
    let values=[title,authorname,description,thumbnail,shelfName,identifier,id];

    client.query(SQL,values).then(()=>{
        res.redirect(`/books/${id}`)
    })
 }


function deleteBook (req,res){
    let SQL = `DELETE FROM books WHERE id=$1;`
    let values=[req.params.book_id];
    client.query(SQL,values).then(()=>{
        res.redirect('/')
    })

}

function Book(item) {

    let thumbCheck = item.volumeInfo.imageLinks;
    // thumbCheck = thumbCheck.replace(/^http:\/\//i, 'https://');

    this.title = (item.volumeInfo.title) ? item.volumeInfo.title : 'not avilable';
    this.authorname = (item.volumeInfo.authors) ? item.volumeInfo.authors[0] : 'not avilable';
    this.description = (item.volumeInfo.description) ? item.volumeInfo.description : 'not avilable';
    this.thumbnail = (thumbCheck) ? thumbCheck.thumbnail : 'not avilable';
    this.identifier = item.volumeInfo.industryIdentifiers ? item.volumeInfo.industryIdentifiers[0].identifierr : 'not avilable';
}


app.get('*', (req, res) => {
    res.render('error');
})

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`connected and listening on port ${PORT}`)
        })

    })
'use static'
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const ejs = require('ejs');
const pg = require('pg');
const {
    response
} = require('express');

const PORT = process.env.PORT || 3030;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL)

app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


//test
app.get('/', (req, res) => {
    // res.status(200).send(req.query)
    let SQL = 'SELECT * FROM books;';
    client.query(SQL).then(results => {

        res.render('pages/index', {
            results: results.rows,
            booksNum: results.rowCount
        })

    })

})

// get book details after being inserted on the database
//use the view details button on the index.ejs to get the values 
//render the specific book details from the DB.

app.get('/books/:book_id', bookInfo)


function bookInfo(req, res) {
    let SQL = `SELECT * FROM books WHERE id=$1`;
    let values = [req.params.book_id]

    client.query(SQL, values).then(result => {

        res.render('pages/bookInfo', {
            bookInfo: result.rows[0]
        })
    })

}




//search books
app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new.ejs');
})

//get api books
app.post('/searches', (req, res) => {

    let searchbox = req.body.searchbox;
    let search = req.body.search;
    let url = "";
    console.log("get query", searchbox);

    if (search === 'title') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+intitle:${searchbox}`
    }
    if (search === 'author') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+inauthor:${searchbox}`
    }

    superagent.get(url).then(book => {

        let bookDetails = book.body.items.map(item => {
            return new Book(item);
        })

        return bookDetails;

    }).then(results => res.render('pages/searches/show.ejs', {
        booksData: results
    }))
})

// function errorHandler(error, request, response) {
//     response.send(error)
// }


app.post('/book', addBook);

function addBook(req, res) {
    let info = req.body
    console.log(info);
    let SQL = `INSERT INTO books (title,authorName,description,thumbnail,shelfName,identifier) VALUES ($1,$2,$3,$4,$5,$6);`
    let values = [info.title, info.authorName, info.description, info.thumbnail, info.shelfName, info.identifier];
    
    client.query(SQL, values).then(result => {

        res.render('pages/bookInfo', {
            bookInfo: result.rows
        })
    })
}




function Book(item) {

    let title = item.volumeInfo.title;
    let authorName = item.volumeInfo.authors[0];
    let description = item.volumeInfo.description;

    let thumbCheck = item.volumeInfo.imageLinks.thumbnail;
    thumbCheck = thumbCheck.replace(/^http:\/\//i, 'https://');

    this.title = checkTitle(title);
    this.authorName = checkAuthor(authorName);
    this.description = checkDescription(description);
    this.thumbnail = checkImg(thumbCheck);
    this.identifier = item.volumeInfo.industryIdentifiers[0].identifier;
}


var checkImg = thumbCheck => {
    let res = thumbCheck ? thumbCheck : 'https://i.imgur.com/J5LVHEL.jpg'
    return res;
}

var checkTitle = title => {
    let res = title ? title : 'not avilable'
    return res;
}
var checkAuthor = authorName => {
    let res = authorName ? authorName : 'not avilable'
    return res;
}

var checkDescription = description => {
    let res = description ? description : 'not avilable'
    return res;
}

app.get('*', (req, res) => {
    res.render('pages/error.ejs');
})

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`connected and listening on port ${PORT}`)
        })

    })
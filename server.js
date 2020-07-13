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
app.get('/', (req, res) => {
    // res.status(200).send(req.query)
    res.render('pages/index')

})


//search books
app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new.ejs');
})

//get api books
app.post('/searches', (req, res) => {

    let searchbox = req.body.searchbox;
    let search = req.body.search;
    let url ="";
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
    })).catch()
})

app.get('*', (req, res) => {
    res.render('pages/error.ejs');
})


// res.send("sooo")




function Book(item) {

    let title=item.volumeInfo.title;
    let authorName= item.volumeInfo.authors;
    let description = item.volumeInfo.description;

    let thumbCheck = item.volumeInfo.imageLinks.thumbnail;
    thumbCheck = thumbCheck.replace(/^http:\/\//i, 'https://');

    this.title = checkTitle(title)
    this.authorName = checkAuthor(authorName)
    this.description = checkDescription(description)
    this.thumbnail = checkImg(thumbCheck);
}


var checkTitle = thumb => {
    let res = thumb ? thumb : 'https://i.imgur.com/J5LVHEL.jpg'
    return res;
}

var checkImg = title => {
    let res = title ? title : 'no title name'
    return res;
}
var checkAuthor = authorName => {
    let res = authorName ? authorName : 'no author name'
    return res;
}

var checkDescription = description => {
    let res = description ? description : 'no discrption'
    return res;
}


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
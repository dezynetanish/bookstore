const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";


const express = require('express');
const app = express()
const port = 3000

const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
const session = require('express-session');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage });

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yadav2005tanish@gmail.com',
        pass: 'bkdz mcsv vmyl bavv'
    }
    
});

async function main() {
    await mongoose.connect('mongodb://tanish:1Euoiut8IkhAWNme@ac-pzuboav-shard-00-00.w7bm3u1.mongodb.net:27017,ac-pzuboav-shard-00-01.w7bm3u1.mongodb.net:27017,ac-pzuboav-shard-00-02.w7bm3u1.mongodb.net:27017/?ssl=true&replicaSet=atlas-ds24cx-shard-0&authSource=admin&appName=Cluster0');
}
main()
.then(() => {console.log('Connected to MongoDB')})
.catch(err => console.log(err));

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,

    price: Number,
    category: String,
    image: String
})


app.use(session({
    secret: 'bookstoresecret',
    resave: false,
    saveUninitialized: false,
}))
app.use(express.urlencoded({ extended: true }))

function isAdmin(req, res, next) {
    if(req.session.isAdmin) {
        next();
    } else {
        res.send('Access Denied');
    }
}

app.get('/admin/login', (req, res) => {
    res.render('adminlogin.ejs');
})
app.post('/admin/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/books');
    } else {
        res.send("Invalid Username or Password");
    }
});
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

const Book = mongoose.model('Book', bookSchema);



app.set("view engine", "ejs")
app.use(express.static('public'))


app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.get('/about', (req, res) => {
    res.render('about.ejs')
})

app.get('/books', async (req, res) => {
    const books = await Book.find();
    res.render('books.ejs', { books, isAdmin: req.session.isAdmin});
})

app.get('/books/new', isAdmin, (req, res) => {
    res.render('newbook');
});

// app.post('/books',upload.single('img'),(req,res)=>{
//     console.log(req.body)
//     console.log(req.file)
// })


app.post('/books', isAdmin, upload.single('img'), async (req, res) => {
    try {
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            price: req.body.price,
            category: req.body.category,
            image: req.file
                ? '/uploads/' + req.file.filename
                : ''
        });

        await book.save();
        res.redirect('/books');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding book');
    }
});


app.post('/books/delete/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    await Book.findByIdAndDelete(id);
    res.redirect('/books');
});

app.get('/books/edit/:id',isAdmin, async (req, res) => {
    const Id = req.params.id;
    const book = await Book.findById(Id);
    res.render('editbook', { book });
});
app.post('/books/edit/:id', isAdmin, upload.single('img'), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).send('Book not found');
        }

        book.title = req.body.title;
        book.author = req.body.author;
        book.price = req.body.price;
        book.category = req.body.category;
        if (req.file) {
            book.image = '/uploads/' + req.file.filename;
        }

        await book.save();

        res.redirect('/books');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating book');
    }
});


app.get('/categories', async (req, res) => {
    const books = await Book.find();
    const categories = [...new Set(books.map(book => book.category))];
    res.render('categories.ejs', { books, categories });
});

app.get('/categories/:category', async (req, res) => {
    const category = req.params.category;
    const books = await Book.find({ category: category });

    const allBooks = await Book.find();
    const categories = [...new Set(allBooks.map(book => book.category))];
    res.render('categories.ejs', { books, categories });
});


app.get('/contact',(req, res) => {
    res.render('contact.ejs')
})

app.post('/contact', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const message = req.body.message;

    transport.sendMail({
        from: 'yadav2005tanish@gmail.com',
        to: 'yadav2005tanish@gmail.com',
        subject: "new message",
        text: `Name: ${name} Email: ${email} Mobile: ${mobile} Message: ${message}`
    }, (error) => {
        if (error) {
            console.log(error)
            res.send("Email Not Sent")
        }else{
            res.send(`<script>
                alert("Message sent successfully");
                window.location.href("/contact");
            </script>`)
        }
    });

    
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


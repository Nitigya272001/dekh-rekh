const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
const app = express();
var path = require('path');
let ejs = require('ejs');
const bcrypt = require('bcrypt-nodejs');
const models = require('./models/model.js');
// const { concatSeries } = require("async");
const env = require('dotenv').config()
const User = models.user;
const Customer = models.customer;
const Work = models.work;
const saltRounds = 10;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, './templates/views'));


app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './l-s_customer')));
app.use(express.static(path.join(__dirname, './l-s_user')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/////////////////////mongoose////////////
mongoose.connect(`${process.env.MONGO}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: true
    }).then(() => console.log("Conn success!!"))
    .catch((err) => console.log(err));
///////////////////////////////////////////

app.route("/customer")
    .get((req, res) => {
        res.sendFile(path.join(__dirname, './l-s_customer/l-s.html'));
    })

app.route("/customer-register")
    .post(async(req, res) => {
        try {
            const password = req.body.password
            const cpassword = req.body.cpassword
            if (password === cpassword) {
                let newCustomer;
                var hash = bcrypt.hashSync(password);
                    newCustomer = new Customer({
                        name: req.body.name,
                        phone: req.body.phone,
                        password:hash,
                        cpassword:hash,
                        city: req.body.city,
                        address: req.body.address,
                    });

                const cust = await newCustomer.save();
                res.status(201).redirect("/customer-profile/" + cust._id);


                //console.log("Chl gyaaaa....")
                //console.log(cust.name);

            } else {
                console.log("Password not matching...")
                res.redirect("/customer");
            }

        } catch (error) {
            console.log("Kyu Nahi Chl rhaaaa....")
            res.status(400).send(error);
        }
    })

app.route("/customer-login")
    .post(async(req, res) => {
        const phone = req.body.phone;
        const password = req.body.password;
    
        const customeritem = await Customer.find({phone});
        bcrypt.compare(password,customeritem[0].password, (err,result) => {
            if(err) console.log(err);
            
            else if(result) {
                const id = customeritem[0]._id;
                res.redirect('/customer-profile/' + id);
            } else {
                console.log("password not matching...")
                res.redirect("/customer");
            }
        })
    })

app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, './l-s_user/l-s.html'))
})

app.route("/user-register")
    .post(async(req, res) => {
        try {
            const password = req.body.password
            const cpassword = req.body.cpassword
            if (password === cpassword) {
                var hash = bcrypt.hashSync(password);
                const newUser = new User({
                            name: req.body.name,
                            phone: req.body.phone,
                            password:hash,
                            cpassword:hash,
                            city: req.body.city,
                            address: req.body.address,
                            works:[],
                });

                const cust = await newUser.save();
                res.status(201).redirect("/user-profile/" + cust._id);
                //console.logs("Chl gyaaaa....")
                //console.log(cust.name);

            } else {
                console.log("Nahi Chl rhaaaa....")
                res.redirect("/user");
            }
        
        } catch (error) {
            console.log("Kyu Nahi Chl rhaaaa....")
            res.status(400).send(error);
        }
    })

app.route("/user-login")
    .post(async(req, res) => {
        try {
            const phone = req.body.phone;
            const password = req.body.password;
            const cust = await User.find({ phone});

            bcrypt.compareSync(password,cust[0].password, (err,result) => {
                if(err) console.log(err);
            
                else if(result) {
                    const id = cust[0]._id;
                    res.redirect('/user-profile/' + id);
                } else {
                    console.log("password not matching...")
                    res.redirect("/user");
                }
            })

        } catch (error) {
            console.log("user login ni chl rha");
            res.redirect("/user");
        }
    })


app.route("/customer-profile/:id")
    .get(async(req, res) => {
        try {
            let s = [];
            let emp = false;
            let w = [];
            res.render("pcustomer", {
                searchResults: s,
                userOfWork: w,
                emp: emp
            })
        } catch (error) {
            console.log(error);
        }
    })

app.route("/user-profile/:id")
    .get(async(req, res) => {
        try {
            const user = await User.find({ _id: req.params.id })
            //console.log(user);
            let a = [...user[0].works];
            //console.log(a);
            let b = [];

            for(let i = 0; i <a.length; i++)
            {
                const wo = await Work.findOne({_id: a[i]});
                b.push(wo);
            }

            //console.log(b);
            res.render("puser", {
                id: req.params.id,
                arr: b
            });
        } catch (error) {
            console.log("user profile ni chl rha")
            console.log(error);
            res.redirect("/user")
        }
    })

app.route("/add-new/:id")
    .post(async(req, res) => {
        try {
            res.render("new-work", {
                id: req.params.id
            });
        } catch (error) {
            console.log(error);
        }
    })

app.route("/new-user-work/:id")
    .post(async(req, res) => {
        try {
            const newwork = new Work({
                typwork: req.body.typwork,
                duration: req.body.duration,
                price: req.body.price,
                userId: req.params.id
            })
            User.findOne({ _id: req.params.id }, (err, fitem) => {
                if (!err) {
                    newwork.save();
                    fitem.works.push(newwork);
                    fitem.save();
                    console.log("done");
                    res.redirect("/user-profile/" + req.params.id);
                }
            })

            //console.log("heyyyyyyy")
            //console.log(newwork);
        } catch {
            console.log("new user ni chl rhaa");
            res.redirect("/user-profile/" + req.params.id)
        }
    })

app.route("/update/:id")
    .post(async(req, res) => {
        res.render("update-wok", {
            id: req.params.id,
            workid: req.body.workid
        })
    })

app.route("/update-work/:id")
    .post(async(req, res) => {
        var newtypwork = req.body.typwork;
        var newduration = req.body.duration;
        var newprice = req.body.price;

        Work.findOneAndUpdate({ _id: req.body.wid }, {$set: {"duration": newduration, "typwork": newtypwork, "price": newprice} } , {upsert: false}, (err, item) => {
            if (!err) {
                console.log("Updated");
            } else {
                console.log("update wala error");
                console.log(err);
            }
        })

        res.redirect("/user-profile/" + req.params.id);
    })

app.route("/delete-work/:id")
    .post(async(req, res) => {

        User.findOneAndUpdate({ _id: req.params.id }, { $pull: { works: req.body.workid } }, function(err, item) {
            if (!err) {
                console.log("works mei se delete hogyi");
            } else {
                console.log("error h delete mei");
                console.log(err);
            }
        });

        Work.findByIdAndDelete({ _id: req.body.workid }, (err, item) => {
            if (!err) {
                console.log("successfully deleted.");
            } else {
                console.log("delete wala error");
                console.log(err);
            }
        })

        res.redirect("/user-profile/" + req.params.id);
    })

app.route("/search-result")
    .post(async(req, res) => {
        try {
            async function func(userIdOfWork) {
                async function func2(userIdOfWork) {
                    let u = {};
                    let userOfWork = [];
                    for (let index = 0; index < userIdOfWork.length; index++) {
                        const ui = userIdOfWork[index];
                        u = await User.findOne({ _id: ui });
                        //console.log("PPPPPPPPPPPPPPPPPP") 
                        userOfWork.push(u);
                    }
                    //console.log(userOfWork);
                    return userOfWork;
                }

                return await func2(userIdOfWork);
            }

            const typwork = req.body.reqwork;
            console.log(typwork);
            const searchResults = await Work.find({ typwork })
            console.log("searchResults");
            console.log(searchResults);

            const userIdOfWork = searchResults.map((work) => {
                return work.userId;
            });
            console.log(userIdOfWork); 
            let emp = true;
            let fun = func(userIdOfWork);
            fun.then((data) => {
                //console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")
                const userOfWork = data;
                console.log(userOfWork);
                res.render('pcustomer', {
                    searchResults: searchResults,
                    userOfWork: userOfWork,
                    emp: emp
                })

            }).catch((err) => {
                console.log(err);
            });
            //console.log("XXXXXXXXXXXXXXXXX")
        } catch (error) {
            console.log(error);
        }
    });



let port = process.env.PORT || 3000;
app.listen(port, () => { console.log("Server is running."); })
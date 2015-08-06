
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send('respond with a resource');
};


/*
 * GET login page.
 */

exports.login = function(req, res, next) {
  res.render('login', { user : req.user });
};

/*
 * GET logout route.
 */

exports.logout = function(req, res, next) {
    req.session.destroy();
    req.logout();
    res.redirect('/');
};


exports.registerView = function (req, res) {
    res.render('register', {});
};


exports.register = function (req, res, next) {
    res.render('login', { user : req.user });
};

exports.authenticate = function (req, res, next) {
    if (req.user != undefined) {
        req.session.user = req.user;
        req.session.admin = req.user.admin;
    }
    res.redirect('/');
}
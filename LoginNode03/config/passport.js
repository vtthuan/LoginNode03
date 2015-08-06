// load all the things we need
var LocalStrategy = require('passport-local').Strategy,
    bCrypt = require('bcrypt-nodejs'),
    User = require('../models/user');

// passport config
module.exports = function (passport) {
    passport.use('local-signin', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
    }, function (username, password, done) {
        User.findOne({ 'email' : username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            // User exists but wrong password, log the error 
            if (!isValidPassword(user, password)) {
                console.log('Invalid Password');
                return done(null, false, 
              req.flash('message', 'Invalid Password'));
            }
            return done(null, user);
        });
    }
    ));
    
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true,
    },
  function (req, username, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function () {
            
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'email' : username }, function (err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
                
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    
                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    
                    // set the user's local credentials
                    newUser.email = username;
                    newUser.password = generateHash(password);
                    
                    // save the user
                    newUser.save(function (err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });

        });

    })); 
    
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}

// checking if password is valid
var isValidPassword = function (user, password) {
    return bCrypt.compareSync(password, user.password);
}

// Generates hash using bCrypt
var generateHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

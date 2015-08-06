var TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || 'ABC'
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || 'XYZXYZ'

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    io = require("socket.io"),      // web socket external module
    easyrtc = require("easyrtc"),          // EasyRTC external module
    flash = require('connect-flash'),
    models = require('./models'),    

    dbUrl = process.env.MONGOHQ_URL || 'mongodb://@localhost:27017/blog',
    db = mongoose.connect(dbUrl, { safe: true }),
    
    session = require('express-session'),
    logger = require('morgan'),
    errorHandler = require('errorhandler'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');


var app = express();
app.locals.appTitle = "language";

require('./config/passport')(passport); // pass passport for configuration

// All environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: '2C44774A-D649-4D44-9535-46E296EF984F' }))
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res, next) {
    if (!models.Article || !models.User) return next(new Error("No models."))
    req.models = models;
    return next();
});

app.use(function (req, res, next) {
    if (req.session && req.session.user) {
        res.locals.isAuthenticated = true;
        if (req.session.user.admin) {
            res.locals.admin = true;
        }
    }
        
    next();
});

// Authorization
var authorize = function (req, res, next) {
    if (req.session && req.session.user)
        return next();
    else
        return res.send(401);
};

// Development only
if ('development' === app.get('env')) {
    app.use(errorHandler());
}

// Pages and routes
app.get('/', routes.index);
app.get('/login', routes.user.login);
app.post('/login', passport.authenticate('local-signin'), routes.user.authenticate);
app.get('/logout', routes.user.logout); //if you use everyauth, this /logout route is overwriting by everyauth automatically, therefore we use custom/additional handleLogout
app.get('/admin', authorize, routes.article.admin);
app.get('/post', authorize, routes.article.post);
app.post('/post', authorize, routes.article.postArticle);
app.get('/register', routes.user.registerView);
app.post('/register', passport.authenticate('local-signup'), routes.user.authenticate);
app.get('/room', authorize, routes.room.connect );
app.get('/articles/:slug', routes.article.show);

// REST API routes
app.all('/api', authorize);
app.get('/api/articles', routes.article.list);
app.post('/api/articles', routes.article.add);
app.put('/api/articles/:id', routes.article.edit);
app.del('/api/articles/:id', routes.article.del);

app.all('*', function (req, res) {
    res.send(404);
})

var server = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(server, { "log level": 1 });
easyrtc.listen(app, socketServer, null);

var boot = function () {
    server.listen(app.get('port'), function () {
        console.info('Express server listening on port ' + app.get('port'));
    });
}
var shutdown = function () {
    server.close();
}
if (require.main === module) {
    boot();
} else {
    console.info('Running app as a module')
    exports.boot = boot;
    exports.shutdown = shutdown;
    exports.port = app.get('port');
}

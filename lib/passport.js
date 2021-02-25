var db = require('../lib/db')
module.exports = function (app) {

    var passport = require('passport'),
        LocalStrategy = require('passport-local').Strategy;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        console.log('serialize:',user);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        var user = db.get('users').find({id:id}).value();
        console.log('deserialize:',id,user);
        done(null, user);
    });

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'pwd'
        },
        function (username, password, done) {
            if (username === db.get('users').find({email:username}).value().email) {
                if (password === db.get('users').find({password:password}).value().password) {
                    return done(null, db.get('users').find({email:username}).value(), {
                        message: 'Welcome.'
                    });
                } else {
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }
            } else {
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
        }
    ));
    return passport;
}
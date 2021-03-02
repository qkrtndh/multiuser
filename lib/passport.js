var db = require('../lib/db')
var bcrypt = require('bcrypt');//모듈을 불러온다
module.exports = function (app) {

    var passport = require('passport'),
        LocalStrategy = require('passport-local').Strategy;
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        console.log('serialize:', user);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        var user = db.get('users').find({ id: id }).value();
        console.log('deserialize:', id, user);
        done(null, user);
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pwd'
    },
        function (email, password, done) {
            var user = db.get('users').find({
                email: email
            }).value();
            if (user) {
                bcrypt.compare(password, user.password, function (err, result) {
                    if (result) {
                        return done(null, user, {
                            message: `어서어오세요 ${user.nickname}님`
                        });
                    }
                    else {
                        return done(null, false, {
                            message: '비밀번호가 틀렸습니다.'
                        });
                    }
                })
            }
            else {
                return done(null, false, {
                    message: '아이디가 틀렸습니다.'
                });
            }
        }
    ));
    var googleCredentials = require('../config/google.json');
    passport.use(new GoogleStrategy({
        clientID: googleCredentials.web.client_id,
        clientSecret: googleCredentials.web.client_secret,
        callbackURL: googleCredentials.web.redirect_uris[0]
    },
        function (accessToken, refreshToken, profile, done) {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return done(err, user);
            });
        }
    ));
    app.get('/auth/google',
        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login']
        }));
    return passport;
}
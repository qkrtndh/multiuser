var db = require('../lib/db')
var bcrypt = require('bcrypt');//모듈을 불러온다
var shortid = require('shortid');
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
            console.log("googlestartage", accessToken, refreshToken, profile);
            var email = profile.emails[0].value;//이메일을 프로파일로 부터 가져온다
            var user = db.get('users').find({ email: email }).value();//유저정보에서 같은 이메일 값을 갖는 유저를 찾는다
            if (user) {//유저가 있는 경우
                user.googoleId = profile.id;//해당 유저의 정보에 구글 아이디를 추가한다.
                db.get('users').find({ id: user.id }).assign(user).write();//해당 정보를 덮어 씌운다
            }
            else {//없는 경우 새로 유저를 등록한다.
                user = {
                    id:shortid.generate(),
                    email:email,
                    nickname:profile.displayName,
                    googoleId:profile.id
                }
                db.get('users').push(user).write();
            }

            done(null, user);//해당 유저정보를 넘긴다. 그 후 로그인된다.
        }
    ));
    app.get('/auth/google',
        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login', 'email']
        }));

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/auth/login'//로그인 실패시 직접 로그인
        }),
        function (req, res) {
            res.redirect('/');//성공시 홈으로
        });
    return passport;
}
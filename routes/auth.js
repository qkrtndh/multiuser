var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var sanitizeHtml = require('sanitize-html');
var template = require('../lib/template.js');
var shortid = require('shortid');

var db = require('../lib/db');


module.exports = function (passport) {
  router.get('/login', function (request, response) {
    var fmsg = request.flash();
    var feedback = '';
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }
    var title = 'WEB - login';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
      <div style="color:red;">${feedback}</div>
      <form action="/auth/login_process" method="post">
        <p><input type="text" name="email" placeholder="email"></p>
        <p><input type="password" name="pwd" placeholder="password"></p>
        <p>
          <input type="submit" value="login">
        </p>
      </form>
    `, '');
    response.send(html);
  });

  router.post('/login_process',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/auth/login',
      failureFlash: true,
      successFlash: true
    }));

  router.get('/register', function (request, response) {
    var fmsg = request.flash();
    var feedback = '';
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }
    var title = 'WEB - register';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
        <div style="color:red;">${feedback}</div>
        <form action="/auth/register_process" method="post">
          <p><input type="text" name="email" placeholder="email"></p>
          <p><input type="password" name="pwd" placeholder="password"></p>
          <p><input type="password" name="pwd2" placeholder="password"></p>
          <p><input type="text" name="nickname" placeholder="nickname"></p>
          <p>
            <input type="submit" value="register">
          </p>
        </form>
      `, '');
    response.send(html);
  });

  router.post('/register_process', function (request, response) {//정보를 받아온다.
    var post = request.body;
    var email = post.email;
    var pwd = post.pwd;
    var pwd2 = post.pwd2;
    var nickname = post.nickname;
    if (db.get('users').find({ email: email }).value()) {
      request.flash('error', 'email already exist');
      response.redirect('/auth/register');
    }

    else {
      if (pwd != pwd2) {
        request.flash('error', 'password not match');
        response.redirect('/auth/register');
      }
      else {
        var user = { id: shortid.generate(), email: email, password: pwd, nickname: nickname };
        db.get('users').push(user).write();
        //response.redirect('/auth/login');수동 로그인
        //자동로그인
        request.login(user,function(err){
          console.log('redirect')
          return response.redirect('/');
        })
      }
    }
  });


  router.get('/logout', function (request, response) {
    request.logout();
    request.session.save(function () {
      response.redirect('/');
    });
  });

  return router;
}
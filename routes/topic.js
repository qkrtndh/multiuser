var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var sanitizeHtml = require('sanitize-html');
var template = require('../lib/template.js');
var auth = require('../lib/auth');
var db = require('../lib/db')
var shortid = require('shortid')
router.get('/create', function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect('/auth/login');
    return false;
  }
  var title = 'WEB - create';
  var list = template.list(request.list);
  var html = template.HTML(title, list, `
      <form action="/topic/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `, '', auth.statusUI(request, response));
  response.send(html);
});

router.post('/create_process', function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect('/auth/login');
    return false;
  }
  var post = request.body;
  var title = post.title;
  var description = post.description;
  var id = shortid.generate();
  db.get('topics').push({
    id: id,
    title: title,
    description: description,
    user_id: request.user.id
  }).write();
  response.redirect(`/topic/${id}`);
});

router.get('/update/:pageId', function (request, response) {
  if(!auth.isOwner(request,response)){
    request.flash('error','로그인이 필요합니다.');
    response.redirect('/');
    return false;
  }
  var topic = db.get('topics').find({ id: request.params.pageId }).value();
  
  if (topic.user_id != request.user.id) {
    request.flash('error', '작성자가 아닙니다!');
    return response.redirect(`/topic/${topic.id}`);
  }
  var title = topic.title;
  var description = topic.description;
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `
         <form action="/topic/update_process" method="post">
          <input type="hidden" name="id" value="${topic.id}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
    `<a href="/topic/create">create</a> <a href="/topic/update/${topic.id}">update</a>`,
    auth.statusUI(request, response)
  );
  response.send(html);
});

router.post('/update_process', function (request, response) {
  if(!auth.isOwner(request,response)){
    request.flash('error','로그인이 필요합니다.');
    response.redirect('/');
    return false;
  }
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  var topic = db.get('topics').find({ id: id }).value();
  if (topic.user_id != request.user.id) {
    request.flash('error', '작성자가 아닙니다!');
  }
  else {
    db.get('topics').find({ id: id }).assign({
      title: title, description: description
    }).write();
  }
  request.flash('success', '수정되었습니다');
  response.redirect(`/topic/${topic.id}`);
});

router.post('/delete_process', function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect('/auth/login');
    return false;
  }
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    response.redirect('/');
  });
});

router.get('/:pageId', function (request, response, next) {
  var fmsg = request.flash();
  var feedback = '';
  if(fmsg.success){
    feedback = fmsg.success[0];
  }
  else if(fmsg.error){
    feedback = fmsg.error[0];
  }
  var topic = db.get('topics').find({ id: request.params.pageId }).value();
  var user = db.get('users').find({ id: topic.user_id }).value();
  var sanitizedTitle = sanitizeHtml(topic.title);
  var sanitizedDescription = sanitizeHtml(topic.description, {
    allowedTags: ['h1']
  });
  var list = template.list(request.list);
  var html = template.HTML(sanitizedTitle, list,
    `<div style="color:blue;">${feedback}</div>
    <h2>${sanitizedTitle}</h2>${sanitizedDescription}
    <p>by ${user.nickname}</p>`,
    ` <a href="/topic/create">create</a>
            <a href="/topic/update/${topic.id}">update</a>
            <form action="/topic/delete_process" method="post" onsubmit="return confirm('정말로 삭제하시겠습니까?')">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`,
    auth.statusUI(request, response)
  );
  response.send(html);

});
module.exports = router;
var bcrypt = require('bcrypt');//모듈을 불러온다
const saltRounds = 10;//알아보지 못하게 하는 노이즈
const myPlaintextPassword = '1234';//예시용 실제 비밀번호
const someOtherPlaintextPassword = '1111';//다른 예시 비밀번호
bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
    //hash가 변형된 비밀번호이다.
    bcrypt.compare(myPlaintextPassword, hash, function (err, result) {
        //비교결과가 true, false로 result에 저장됨
        console.log("correct password: ", result);
    });
    bcrypt.compare(someOtherPlaintextPassword, hash, function (err, result) {
        console.log("incorrect password: ", result);
    });

});
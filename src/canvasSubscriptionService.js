import request from 'request';
import config from 'config-heroku';

const FB_ACCESS_TOKEN = config.fb.pageAccessToken;

function sendFBTextMessage(sender, text) {
  const messageData = { text };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: messageData,
    },
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending messages: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

module.exports = (storage) => {
  console.log('students');

  // @TODO Uncomment setInterval when ready to test
  // setInterval(() => {
    storage.students.all((err, students) => {
      if (err) {
        console.log('Error accessing students in DB');
        console.log(err);
      } else if (!students) {
        console.log('No students found...');
      } else {
        students.forEach((student) => {
          console.log(student);

          if (student.canvas && student.canvas.subscribedCourses &&
              student.canvas.subscribedCourses.length > 0) {
            console.log('Student\'s subscribed courses are:');
            console.log(student.canvas.subscribedCourses);
          }

          if (student.fb) {
            const fbData = student.fb;
            const { senderID } = fbData;
            // sendFBTextMessage(senderID, 'Sup!');
          } else {
            console.log('no fb data for student');
          }
        });
      }
    });
  // }, 5000);
};

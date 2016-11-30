import axios from 'axios';
import request from 'request';
import config from 'config-heroku';

import sendUtils from './fbbot/sendUtils';

const FB_ACCESS_TOKEN = config.fb.pageAccessToken;
const CANVAS_API = config.CANVAS_API;
const SERVER_URL = config.SERVER_URL;

function getStudentUpcomingCanvasEvents(userCanvasToken) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}users/self/upcoming_events`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
      params: {
        enrollment_state: 'active',
      },
    };

    axios.request(axiosOptions)
      .then((res) => {
        const courses = res.data;
        resolve(courses);
      })
      .catch((err) => {
        console.log('Error retrieving courses');
        console.log(err);
        reject(err);
      });
  });
}

function callSendAPI(messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_ACCESS_TOKEN },
    method: 'POST',
    json: messageData,
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending messages: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

function sendTemplatedMessage(id, elements) {
  const messageData = {
    recipient: { id },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements,
        },
      },
    },
  };

  callSendAPI(messageData);
}

function sendFBTextMessage(id, text) {
  const messageData = {
    recipient: { id },
    message: {
      text,
    },
  };

  callSendAPI(messageData);
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

          console.log('student canvas?');
          console.log(student.canvas);
          if (student.canvas && student.canvas.subscribedCourses &&
              student.canvas.subscribedCourses.length > 0) {

            const subscribedCourses = student.canvas.subscribedCourses;
            let messagePayload = []

            getStudentUpcomingCanvasEvents(student.canvas.token)
              .then((canvasEvents) => {
                canvasEvents.forEach((event) => {
                  const eventCourseCode = event.context_code.split('_')[1];
                  console.log('searching for ');
                  console.log(eventCourseCode);
                  const indexOfCourse = sendUtils.arrayObjectIndexOf(subscribedCourses, eventCourseCode, 'id');

                  console.log('INDEX OF COURSE?!!');
                  console.log(indexOfCourse);
                  if (indexOfCourse > -1) {
                    const trimmedEvent = {
                      title: event.title,
                      image_url: `${SERVER_URL}assets/thumbsup.png`,
                      buttons: [
                        {
                          title: 'View Event',
                          type: 'web_url',
                          url: event.url,
                        },
                      ],
                    };

                    messagePayload.events.push(trimmedEvent);
                  }
                });

                console.log('~~~~~~~~~~~~~~~~~~~');
                console.log('sending!!');
                // sendTemplatedMessage(messagePayload);
              })
              .catch((canvasEventsError) => {
                console.log('Error retreiving user upcoming events');
                console.log(canvasEventsError);
              })


            // subscribedCourses.forEach((course) => {
            //
            // });

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

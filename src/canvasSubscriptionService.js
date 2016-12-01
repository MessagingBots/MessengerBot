import axios from 'axios';
import request from 'request';
import config from 'config-heroku';

const FB_ACCESS_TOKEN = config.fb.pageAccessToken;
const CANVAS_API = config.CANVAS_API;
const SERVER_URL = config.SERVER_URL;

function getDataFromCanvas(canvasAxiosOptions) {
  return axios.request(canvasAxiosOptions);
}

function getStudentCanvasUpcomingEvents(userCanvasToken) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}users/self/upcoming_events`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
    };

    getDataFromCanvas(axiosOptions)
      .then((res) => {
        const events = res.data;
        resolve(events);
      })
      .catch((err) => {
        console.log('Error retrieving events');
        console.log(err);
        reject(err);
      });
  });
}

function getStudentCanvasTodos(userCanvasToken) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}users/self/todo`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
    };

    getDataFromCanvas(axiosOptions)
      .then((res) => {
        const data = res.data;
        resolve(data);
      })
      .catch((err) => {
        console.log('Error retrieving events');
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


/**
 * createDueDateString - Takes a date string and returns it in the forms
 *  'Due on Mon, 04 Dec at 7:50:00 PM'
 *
 * @param  {type} initialDateString description
 * @return {type}                   description
 */
function createDueDateString(initialDateString) {
  let dueDate = new Date(`${initialDateString}`);
  const dueTime = dueDate.toLocaleTimeString();
  dueDate = dueDate.toDateString().split(' ').slice(0, 3).join(' ');
  return `Due on ${dueDate} at ${dueTime}`;
}

/**
 * getAndSendTodoList - Retrieve and send a student's todolist from Canvas
 *
 * @param  {type} storage description
 * @return {type}         description
 */
function getAndSendTodoList(storage) {
  storage.students.all((err, students) => {
    if (err) {
      console.log('Error accessing students in DB');
      console.log(err);
    } else if (!students) {
      console.log('No students found...');
    } else {
      students.forEach((student) => {
        const messages = [];

        // Retrieve the student's upcoming canvas events and send it to them
        getStudentCanvasTodos(student.canvas.token)
          .then((canvasTodos) => {
            canvasTodos.forEach((todo) => {
              let subtitle = '';
              const { assignment } = todo;
              if (assignment && assignment.due_at) {
                subtitle = createDueDateString(assignment.due_at);

                const trimmedTodo = {
                  title: assignment.name,
                  subtitle,
                  item_url: todo.html_url,
                };

                messages.push(trimmedTodo);
              }
            });

            if (student.fb) {
              const fbData = student.fb;
              const { senderID } = fbData;
              sendFBTextMessage(senderID, 'You have upcoming todos!');
              messages.forEach((message) => {
                sendTemplatedMessage(senderID, [message]);
              });
            } else {
              console.log('no fb data for student');
            }
          })
          .catch((canvasEventsError) => {
            console.log('Error retreiving user upcoming events');
            console.log(canvasEventsError);
          });
      // }
      }); // End of students.forEach(...)
    }
  }); // End of storage.students.all(...)
}


/**
 * getAndSendUpcomingEvents - For each student, will retrieve their upcoming
 *  events from Canvas and send them a message
 * @param  {type} storage DB storage object
 * @return {type}         none
 */
function getAndSendUpcomingEvents(storage) {
  storage.students.all((err, students) => {
    if (err) {
      console.log('Error accessing students in DB');
      console.log(err);
    } else if (!students) {
      console.log('No students found...');
    } else {
      students.forEach((student) => {
        // if (student.canvas && student.canvas.subscribedCourses &&
        //     student.canvas.subscribedCourses.length > 0) {

          // const subscribedCourses = student.canvas.subscribedCourses;
        const messages = [];

        // Retrieve the student's upcoming canvas events and send it to them
        getStudentCanvasUpcomingEvents(student.canvas.token)
          .then((canvasEvents) => {
            canvasEvents.forEach((event) => {
              // const eventCourseCode = parseInt(event.context_code.split('_')[1]);
              // const indexOfCourse = sendUtils.arrayObjectIndexOf(subscribedCourses, eventCourseCode, 'id');
              let subtitle = '';
              if (event.assignment && event.assignment.due_at) {
                subtitle = createDueDateString(event.assignment.due_at);
              }
              const trimmedEvent = {
                title: event.title,
                subtitle,
                item_url: event.html_url,
              };

              messages.push(trimmedEvent);
            });

            if (student.fb) {
              const fbData = student.fb;
              const { senderID } = fbData;
              sendFBTextMessage(senderID, 'You have upcoming events!');
              messages.forEach((message) => {
                sendTemplatedMessage(senderID, [message]);
              });
            } else {
              console.log('no fb data for student');
            }
          })
          .catch((canvasEventsError) => {
            console.log('Error retreiving user upcoming events');
            console.log(canvasEventsError);
          });
      // }
      }); // End of students.forEach(...)
    }
  }); // End of storage.students.all(...)
}

module.exports = (storage) => {
  console.log('students');

  const dayInMilliSeconds = 1000 * 60 * 60 * 24;
  const halfDay = dayInMilliSeconds / 2;

  // Call once, then set the interval
  getAndSendUpcomingEvents(storage);
  // @TODO Uncomment setInterval when ready to test
  setInterval(() => {
    getAndSendUpcomingEvents(storage);
  }, halfDay);

  setTimeout(() => {
    getAndSendTodoList(storage);
    // @TODO Uncomment setInterval when ready to test
    setInterval(() => {
      getAndSendTodoList(storage);
    }, halfDay);
  }, 5000);
};

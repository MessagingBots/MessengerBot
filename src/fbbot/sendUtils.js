import request from 'request';
import config from 'config-heroku';
import axios from 'axios';

const Student = require('../db/models/Student');

const API_URL = config.API_URL;
const CANVAS_API = config.CANVAS_API;
const SERVER_URL = config.SERVER_URL;
const fbConfig = config.fb;

/*
* Return on the prommise for assignments
*
*/
exports.getCourseAssignments = function (userCanvasToken, courseID) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}courses/${courseID}/assignments`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
      params: {},
    };

    axios.request(axiosOptions)
      .then((res) => {
        const assignments = res.data;
        resolve(assignments);
      })
      .catch((err) => {
        console.log('Error retrieving assignments for course with id = ' + courseID);
        console.log(err);
        reject(err);
      });
  });
};

/*
* Return on the prommise for announcments
*
*/
exports.getCourseAnnouncements = function (userCanvasToken, courseID) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}announcements`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
      params: {
        context_codes: 'course_' + courseID,
        start_date: '2015-11-30',
        end_date: '2016-11-30',
      },
    };

    axios.request(axiosOptions)
      .then((res) => {
        const announcements = res.data;
        resolve(announcements);
      })
      .catch((err) => {
        console.log('Error retrieving announcments for course with id = ' + courseID);
        console.log(err);
        reject(err);
      });
  });
};

/*
* Return on the prommise for grades
*
*/
exports.getCourseGrades = function (userCanvasToken, courseID) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}courses/${courseID}/students/submissions`,
      headers: {
        Authorization: `Bearer ${userCanvasToken}`,
      },
      params: {
        include: ['assignment', 'total_scores'],
        grouped: 'true',
      },
    };

    axios.request(axiosOptions)
      .then((res) => {
        const announcements = res.data;
        resolve(announcements);
      })
      .catch((err) => {
        console.log('Error retrieving grades for course with id = ' + courseID);
        console.log(err);
        reject(err);
      });
  });
};

/*
* Return on the prommise for courses
*
*/
exports.getUserCanvasCourses = function (userCanvasToken) {
  return new Promise((resolve, reject) => {
    const axiosOptions = {
      url: `${CANVAS_API}courses?include=sections`,
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
};

exports.arrayObjectIndexOf = function (array, searchTerm, prop) {
  return array.map(element =>
    element[prop]
  ).indexOf(searchTerm);
};

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: fbConfig.pageAccessToken },
    method: 'POST',
    json: messageData,

  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;

      if (messageId) {
        console.log('Successfully sent message with id %s to recipient %s',
          messageId, recipientId);
      } else {
      console.log('Successfully called Send API for recipient %s',
        recipientId);
      }
    } else {
      console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
    }
  });
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~``');
  console.log(`${SERVER_URL}assets/thumbsup.png`);
  const messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Welcome. Link your account.',
            image_url: `${SERVER_URL}assets/thumbsup.png`,
            buttons: [{
              type: 'account_link',
              url: `${API_URL}auth/facebook?senderId=${recipientId}&pat=${fbConfig.pageAccessToken}`,
            }],
          }],
        },
      },
    },
  };

  callSendAPI(messageData);
}

function sendCourses(recipientId) {
  const messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [],
        },
      },
    },
  };
  Student.findOne({ 'fb.senderID': recipientId }, (err, user) => {
    if (err) {
      console.log('Error');
      console.log(err);
    }
    // check to see if theres already a user with that email
    if (user) {
      console.log('user found');
      console.log(user);

      if (user.canvas) {
        const axiosOptions = {
          url: `${CANVAS_API}courses`,
          headers: {
            Authorization: `Bearer ${user.canvas.token}`,
          },
          params: {
            enrollment_state: 'active',
          },
        };
        console.log('optiopns');
        console.log(axiosOptions);
        axios.request(axiosOptions)
          .then((succ) => {
            const courses = succ.data;
            courses.forEach((course) => {
              if (!course.name) {
                course.name = ' ';
              }
              const courseURL = `${CANVAS_API}courses/${course.id}`;
              messageData.message.attachment.payload.elements.push({
                title: course.name,
                image_url: `${SERVER_URL}assets/thumbsup.png`,
                buttons: [
                  {
                    title: 'Open Course',
                    type: 'web_url',
                    url: courseURL,
                  },
                  {
                    title: 'View Assignments',
                    type: 'web_url',
                    url: `${courseURL}/assignments`,
                  },
                ],
              });
            });
            callSendAPI(messageData);
          })
          .catch((error) => {
            console.log('ERROR receiving courses');
            console.log(error);
            messageData.message.attachment.payload.elements.push({
              title: 'You have no courses!',
              image_url: `${SERVER_URL}assets/thumbsdown.png`,
            });
          });
      } else {
        messageData.message.attachment.payload.elements.push({
          title: 'You have no courses!',
          image_url: `${SERVER_URL}assets/thumbsdown.png`,
        });
        callSendAPI(messageData);
      }
    } else {
      messageData.message.attachment.payload.elements.push({
        title: 'You have no courses!',
        image_url: `${SERVER_URL}assets/thumbsdown.png`,
      });
      callSendAPI(messageData);
    }
  });
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: `${SERVER_URL}assets/test.txt`
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPED_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}


// export {
//   callSendAPI, sendAccountLinking, sendTextMessage,
//   sendFileMessage, sendButtonMessage, sendQuickReply, sendTypingOn,
//   sendReadReceipt, sendTypingOff, sendCourses,
// };

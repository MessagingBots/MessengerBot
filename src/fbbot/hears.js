import axios from 'axios';
import config from 'config-heroku';
import request from 'request';

import sendUtils from './sendUtils';

const access_token = config.fb.pageAccessToken;
const verify_token = config.fb.verifyToken;
const API_URL = config.API_URL;
const CANVAS_URL = config.CANVAS_URL;
const CANVAS_API = config.CANVAS_API;
const SERVER_URL = config.SERVER_URL;

const course_colors = ['light_blue.png', 'red.png', 'purple.png', 'green.png', 'pink.png', 'orange.png', 'grey.png', 'cyan.png', 'yellow.jpg', 'blue.jpg'];

// Take in the Botkit controller and attach hears to it
module.exports = (controller) => {
  // user said hello
  controller.hears(['hello'], 'message_received', (bot, message) => {
    console.log('HEARD HELLO!');
    bot.reply(message, 'Hey there.');
  });

  // Send user Account Linking button
  controller.hears(['linking'], 'message_received', (bot, message) => {
    console.log('HEARD LINKING!');
    const id = message.user;
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'Welcome. Link your account.',
          image_url: `${SERVER_URL}assets/thumbsup.png`,
          buttons: [{
            type: 'account_link',
            url: `${API_URL}auth/facebook?fromBot=${true}&senderId=${id}&pat=${access_token}`,
          }],
        }],
      },
    };
    bot.reply(message, { attachment });
  });

  // Send user their current courses
  controller.hears('^courses$', 'message_received', (bot, message) => {
    console.log('HEARD COURSES!');
    const id = message.user;
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [],
      },
    };

    // Find the matching user, if successful get their Canvas courses
    controller.storage.students.getByFBSenderID(id, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        bot.reply(message, 'I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        bot.reply(message, 'We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        sendUtils.getUserCanvasCourses(user.canvas.token)
        .then((courses) => {
          let newCourseElement = {};
          let index = 0;

          courses.forEach((course) => {
            console.log(course);

            if (!course.name) {
              course.name = 'No name for course';
            }
            const courseURL = `${CANVAS_URL}courses/${course.id}`;
            const courseImage = `${SERVER_URL}assets/` + course_colors[index];

            newCourseElement = {
              title: course.name,
              subtitle : 'Time: T: 10:40 AM - 11:30 AM, R: 10:40 AM - 12:35 PM, Location: CSE E119',
              image_url: courseImage,
              item_url: courseURL,
              buttons: [
                {
                  type: 'postback',
                  title: 'Announcements',
                  payload: JSON.stringify({
                    action: 'getAnnouncements',
                    data: {
                      course_id: course.id,
                      course_name: course.name
                    }
                  }),
                },
                {
                  type: 'postback',
                  title: 'Upcomming HW',
                  payload: JSON.stringify({
                    action: 'getUpcomingHw',
                    data: {
                      course_id: course.id,
                      course_name: course.name
                    }
                  }),
                },
                {
                  type: 'postback',
                  title: 'Grades',
                  payload: JSON.stringify({
                    action: 'getGrades',
                    data: {
                      course_id: course.id,
                      course_name: course.name
                    }
                  }),
                },
              ],
            };

            // Note: elements is limited to 10. So tere can only a max of 10 courses.
            attachment.payload.elements.push(newCourseElement);
            index++;
          }); // End of courses.forEach(...)

          // Send courses to user
          bot.reply(message, { attachment });
        })
        .catch((canvasErr) => {
          console.log('Error receiving courses from canvas');
          console.log(canvasErr);
          bot.reply(message, 'I\'m sorry, I\'m having trouble retrieving ' +
          'your courses from canvas at the moment.');
        });
      } else {
        // No Canvas access token associated with the account
        console.log('We couldn\'t find a canvas token for this account, please link canvas');
        bot.reply(message, 'We couldn\'t find a Canvas token for this account, please link Canvas');
      }
    });
  });

  // Course subscriptions
  controller.hears('^subscriptions$', 'message_received', (bot, message) => {
    const id = message.user;
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [],
      },
    };

    // Find the matching user, if successful get their Canvas courses
    controller.storage.students.getByFBSenderID(id, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        bot.reply(message, 'I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        bot.reply(message, 'We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        sendUtils.getUserCanvasCourses(user.canvas.token)
        .then((courses) => {
          // Will store the element we are adding to the message attachment payload
          let newCourseElement = {};
          courses.forEach((course) => {
            if (user.canvas.subscribedCourses &&
              user.canvas.subscribedCourses.includes(course.id)) {
                if (!course.name) {
                  course.name = 'No name for course';
                }
                const courseURL = `${CANVAS_URL}courses/${course.id}`;
                newCourseElement = {
                  title: course.name,
                  image_url: `${SERVER_URL}assets/thumbsup.png`,
                  buttons: [
                    {
                      title: 'Open Course',
                      type: 'web_url',
                      url: courseURL,
                    },
                    {
                      title: 'Remove Course',
                      type: 'postback',
                      payload: JSON.stringify({
                        action: 'removeCourse',
                        data: {
                          course: course.id,
                        },
                      }),
                    },
                  ],
                };

                attachment.payload.elements.push(newCourseElement);
              }
            }); // End of courses.forEach(...)

            // Send courses to user
            if (attachment.payload.elements.length <= 0) {
              bot.reply(message, 'You haven\'t subscribed to any courses ');
            } else {
              bot.reply(message, 'You\'re subscribed courses are: ');
              bot.reply(message, { attachment }, (botErr) => {
                if (botErr) {
                  console.log('ERROR');
                  console.log(botErr);
                }
              });
            }
          })
          .catch((canvasErr) => {
            console.log('Error receiving courses from canvas');
            console.log(canvasErr);
            bot.reply(message, 'I\'m sorry, I\'m having trouble retrieving ' +
            'your courses from canvas at the moment.');
          });
        } else {
          // No Canvas access token associated with the account
          console.log('We couldn\'t find a canvas token for this account, please link canvas');
          bot.reply(message, 'We couldn\'t find a Canvas token for this account, please link Canvas');
        }
      });
    });

  // Course subscribe
  controller.hears('^subscribe$', 'message_received', (bot, message) => {
    const id = message.user;
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [],
      },
    };

    // Find the matching user, if successful get their Canvas courses
    controller.storage.students.getByFBSenderID(id, (err, user) => {
      if (err) {
        console.log('Error finding user');
        console.log(err);
        bot.reply(message, 'I\'m sorry there was an error.');
      } else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        bot.reply(message, 'We couldn\'t find a user for this account, please link your account');
      } else if (user.canvas.token) {
        sendUtils.getUserCanvasCourses(user.canvas.token)
        .then((courses) => {
          // Will store the element we are adding to the message attachment payload
          let newCourseElement = {};
          courses.forEach((course) => {
            if (!course.name) {
              course.name = 'No name for course';
            }
            newCourseElement = {
              title: course.name,
              image_url: `${SERVER_URL}assets/thumbsup.png`,
              buttons: [
                {
                  title: 'Watch Course',
                  type: 'postback',
                  payload: JSON.stringify({
                    action: 'watchCourse',
                    data: {
                      course: course.id,
                    },
                  }),
                },
              ],
            };
            attachment.payload.elements.push(newCourseElement);
          }); // End of courses.forEach(...)

          // Send courses to user
          console.log('replying!');
          bot.reply(message, { attachment }, (botErr) => {
            if (botErr) {
              console.log('ERROR');
              console.log(botErr);
            }
          });
        })
        .catch((canvasErr) => {
          console.log('Error receiving courses from canvas');
          console.log(canvasErr);
          bot.reply(message, 'I\'m sorry, I\'m having trouble retrieving ' +
          'your courses from canvas at the moment.');
        });
      } else {
        // No Canvas access token associated with the account
        console.log('We couldn\'t find a canvas token for this account, please link canvas');
        bot.reply(message, 'We couldn\'t find a Canvas token for this account, please link Canvas');
      }
    });
  });


  // Grades
  // controller.hears(['grades'], 'message_received', (bot, message) => {
  //   console.log('+++++++++hehehehehehe++++++++');
  //
  //   console.log(message.attachments);
  //   if(message.attachments === undefined )
  //     bot.reply(message, 'Grades here');
  // });


    // Grades
  controller.hears(['test'], 'message_received', (bot, message) => {
    console.log('+++++++++TESTSTST++++++++');
    const attachment = {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: [
          {
            title: 'Classic White T-Shirt',
            subtitle: '100% Cotton, 200% Comfortable'
          },
          {
            title: 'Classic Blue T-Shirt',
            subtitle: '100% Cotton, 200% Comfortable'
          }
        ]
      }
    };
    bot.reply(message, {attachment});
  });

  // user says anything else
  // controller.hears('(.*)', 'message_received', (bot, message) => {
  //   bot.reply(message, `You said ${message.match[1]}`);
  // });

  return controller;
};

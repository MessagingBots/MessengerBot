import axios from 'axios';
import config from 'config-heroku';
import request from 'request';

const access_token = config.fb.pageAccessToken;
const verify_token = config.fb.verifyToken;
const API_URL = config.API_URL;
const CANVAS_URL = config.CANVAS_URL;
const CANVAS_API = config.CANVAS_API;
const SERVER_URL = config.SERVER_URL;

// Take in the Botkit controller and attach hears to it
module.exports = (controller) => {

  // user said hello
  controller.hears(['hello'], 'message_received', (bot, message) => {
    bot.reply(message, 'Hey there.');
  });

  // user said hello
  controller.hears(['add menu'], 'message_received', (bot, message) => {
    console.log('Adding persistent menu');
    request({
      url: 'https://graph.facebook.com/v2.6/me/thread_settings',
      qs: { access_token },
      method: 'POST',
      json: {
        setting_type: 'call_to_actions',
        thread_state: 'existing_thread',
        call_to_actions: [
          {
            type: 'postback',
            title: 'Home',
            payload: 'home',
          },
          {
            type: 'postback',
            title: 'Empty',
            payload: 'Empty',
          },
        ],
      },
    }, (err, res, body) => {
      if (err) {
        console.log('Error adding menu');
        console.log(err);
      } else if (res.body.error) {
        console.log('Error');
        console.log(res.body.console.error);
      }
    });
  });

  controller.hears(['remove menu'], 'message_received', (bot, message) => {
    console.log('Removing persistent menu');
    request({
      url: 'https://graph.facebook.com/v2.6/me/thread_settings',
      qs: { access_token },
      method: 'POST',
      json: {
        setting_type: 'call_to_actions',
        thread_state: 'existing_thread',
        call_to_actions: [],
      },
    }, (err, res, body) => {
      if (err) {
        console.log('Error removing menu');
        console.log(err);
      } else if (res.body.error) {
        console.log('Error');
        console.log(res.body.console.error);
      }
    });
  });

  // Send user Account Linking button
  controller.hears(['linking'], 'message_received', (bot, message) => {
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
            url: `${API_URL}auth/facebook?senderId=${id}&pat=${access_token}`,
          }],
        }],
      },
    };
    bot.reply(message, { attachment });
  });

  // Send user their current courses
  controller.hears(['courses'], 'message_received', (bot, message) => {
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
      }
      else if (!user) {
        console.log('We couldn\'t find a user for this account, please link your account');
        bot.reply(message, 'We couldn\'t find a user for this account, please link your account');
      } else {
        console.log('User found');
        console.log(user);

        if (user.canvas.token) {
          const axiosOptions = {
            url: `${CANVAS_API}courses`,
            headers: {
              Authorization: `Bearer ${user.canvas.token}`,
            },
            params: {
              enrollment_state: 'active',
            },
          };

          axios.request(axiosOptions)
            .then((res) => {
              // Will store the element we are adding to the message attachment payload
              let newCourseElement = {};
              const courses = res.data;
              courses.forEach((course) => {
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
                      title: 'View Assignments',
                      type: 'web_url',
                      url: `${courseURL}/assignments`,
                    },
                  ],
                };
                attachment.payload.elements.push(newCourseElement)
              }); // End of courses.forEach(...)

              // Send courses to user
              bot.reply(message, { attachment });
            })
            .catch((err) => {
              console.log('Error receiving courses from canvas');
              console.log(err);
              bot.reply(message, 'I\'m sorry, I\'m having trouble retrieving ' +
                'your courses from canvas at the moment.');
            })
        } else {
        // No Canvas access token associated with the account
          console.log('We couldn\'t find a canvas token for this account, please link canvas');
          bot.reply(message, 'We couldn\'t find a Canvas token for this account, please link Canvas');
        }
      }
    });
  });

  // user says anything else
  controller.hears('(.*)', 'message_received', (bot, message) => {
    bot.reply(message, `you said ${message.match[1]}`);
  });

  return controller;
};

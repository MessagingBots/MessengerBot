import config from 'config-heroku';
import request from 'request';

const access_token = config.fb.pageAccessToken;
const verify_token = config.fb.verifyToken;
const SERVER_URL = config.SERVER_URL;
const API_URL = config.API_URL;

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

  // user said hello
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

  // user says anything else
  controller.hears('(.*)', 'message_received', (bot, message) => {
    bot.reply(message, `you said ${message.match[1]}`);
  });

  return controller;
};

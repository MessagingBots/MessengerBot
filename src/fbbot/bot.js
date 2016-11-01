/* eslint-disable brace-style */
/* eslint-disable camelcase */
import Botkit from 'botkit';
import config from 'config-heroku';
import request from 'request';

const access_token = config.fb.pageAccessToken;
const verify_token = config.fb.verifyToken;
const DB_URL = config.dbURL;
const SERVER_URL = config.SERVER_URL;
const API_URL = config.API_URL;

const storage = require('../db/config')({ dbURL: DB_URL });

let controller = Botkit.facebookbot({
  access_token,
  verify_token,
  storage,
});

const fbBot = controller.spawn({});

// Subscribe to page events
request.post(`https://graph.facebook.com/me/subscribed_apps?access_token=${access_token}`,
  (err, res, body) => {
    if (err) {
      controller.log('Could not subscribe to page messages');
    }
    else {
      controller.log('Successfully subscribed to Facebook events:', body);
      console.log('Botkit activated');

      // Start ticking to send conversation messages
      controller.startTicking();
    }
  }
);

// Attach our events to the controller
controller = require('./events')(controller);


// user said hello
controller.hears(['hello'], 'message_received', (bot, message) => {
  bot.reply(message, 'Hey there.');
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

const create_user_if_new = (id, ts) => {
  controller.storage.students.get(id, (err, user) => {
    if (err) {
      console.log('creating new user');
      console.log(err);
    }
    else if (!user) {
      controller.storage.students.save({ id, created_at: ts });
    }
  });
};

// this function processes the POST request to the webhook
const handler = (obj) => {
  controller.debug('GOT A MESSAGE HOOK');
  let message;

  if (obj.entry) {
    obj.entry.forEach((entry) => {
      entry.messaging.forEach((m) => {
        const facebook_message = m;

        // Normal message
        if (facebook_message.message) {
          message = {
            text: facebook_message.message.text,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
            seq: facebook_message.message.seq,
            mid: facebook_message.message.mid,
            attachments: facebook_message.message.attachments,
          };

          if (!facebook_message.message.is_echo) {
            // Save if a new user, and not if an echo
            create_user_if_new(facebook_message.sender.id, facebook_message.timestamp);
          }

          controller.receiveMessage(fbBot, message);
        }

        // Clicks on a postback action in an attachment
        else if (facebook_message.postback) {
          // trigger BOTH a facebook_postback event
          //  and a normal message received event.
          //  this allows developers to receive postbacks as part of a conversation.
          message = {
            payload: facebook_message.postback.payload,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
          };

          controller.trigger('facebook_postback', [fbBot, message]);

          message = {
            text: facebook_message.postback.payload,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
          };

          controller.receiveMessage(fbBot, message);
        }

        // When a user clicks on "Send to Messenger"
        else if (facebook_message.optin) {
          message = {
            optin: facebook_message.optin,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
          };

            // save if user comes from "Send to Messenger"
          create_user_if_new(facebook_message.sender.id, facebook_message.timestamp);

          controller.trigger('facebook_optin', [fbBot, message]);
        }

        // Message delivered callback
        else if (facebook_message.delivery) {
          message = {
            delivery: facebook_message.delivery,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
          };

          controller.trigger('message_delivered', [fbBot, message]);
        }

        // Message was read by user
        else if (facebook_message.read) {
          message = {
            delivery: facebook_message.delivery,
            user: facebook_message.sender.id,
            channel: facebook_message.sender.id,
            timestamp: facebook_message.timestamp,
          };

          controller.trigger('message_read', [fbBot, message]);
        }

        else {
          console.log('Uh oh');
          console.log(facebook_message);
          controller.log('Got an unexpected message from Facebook: ', facebook_message);
        }
      });
    });
  }
};

exports.handler = handler;

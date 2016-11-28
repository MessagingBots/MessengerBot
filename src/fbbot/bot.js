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

// Create greeting message
request({
  url: 'https://graph.facebook.com/v2.6/me/thread_settings',
  qs: { access_token },
  method: 'POST',
  json: {
    setting_type: 'greeting',
    greeting: {
      text: 'Welcome! I\'m looking forward to helping you keep track of Canvas',
    },
  },
}, (err, res) => {
  if (err) {
    console.log('Error setting greeting menu');
    console.log(err);
  } else if (res.body.error) {
    console.log('Error');
    console.log(res.body.console.error);
  }
});

// Attach our events to the controller
controller = require('./events')(controller);
// Attach 'hears' to the controller
controller = require('./hears')(controller);

// Store a new user (senderID) in the DB if they don't exist already
const createUserIfNew = (id, ts) => {
  controller.storage.students.getByFBSenderID(id, (err, user) => {
    if (err) {
      console.log('Error creating new user');
      console.log(err);
    }
    else if (!user) {
      console.log('Creating new user!');
      console.log(user);
      controller.storage.students.save({ 'fb.senderID': id, created_at: ts });
    } else {
      console.log('User found');
      console.log(user);
    }
  });
};

// This function processes the POST request to the webhook
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
            console.log('Creating new user');
            createUserIfNew(facebook_message.sender.id, facebook_message.timestamp);
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

          // Save if user comes from "Send to Messenger"
          createUserIfNew(facebook_message.sender.id, facebook_message.timestamp);

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

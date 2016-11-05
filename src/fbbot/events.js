// Take in the Botkit controller and attach events to it
module.exports = (controller) => {
  // This is triggered when a user clicks the send-to-messenger plugin
  controller.on('facebook_optin', (bot, message) => {
    bot.reply(message, 'Welcome, friend');
  });

  // this is triggered when a user clicks the send-to-messenger plugin
  controller.on('message_delivered', (bot, message) => {
    console.log(message);
    console.log('message delivered');
  });

  // this is triggered when a user clicks the send-to-messenger plugin
  controller.on('facebook_postback', (bot, message) => {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('facebook postback occured!');
    console.log(message);
  });

  return controller;
};

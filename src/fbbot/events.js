
function alterUserCourseSubscriptions(userId, course, controller, subscribe) {
  controller.storage.students.getByFBSenderID(userId, (err, foundUser) => {
    if (err) {
      console.log('Error finding user');
      console.log(err);
    } else if (!foundUser) {
      console.log('No user found...');
    } else {
      let subscribedCourses = foundUser.canvas.subscribedCourses;
      if (!subscribedCourses) {
        subscribedCourses = [];
      }

      // Is the user subscribing or removing a course?
      if (subscribe) {
        if (subscribedCourses.includes(course)) {
          return;
        }
        subscribedCourses.push(course);
      } else {
        const indexOfCourse = subscribedCourses.indexOf(course);
        if (indexOfCourse > -1) {
          subscribedCourses.splice(indexOfCourse, 1);
        }
      }

      controller.storage.students.findOneByFBSenderIDAndUpdate(userId,
        { $set: { 'canvas.subscribedCourses': subscribedCourses } },
        (innerErr, innerUser) => {
          if (innerErr) {
            console.log('Error adding subscribed courses');
            console.log(innerErr);
          } else if (!innerUser) {
            console.log('No user found...');
          } else {
            console.log('User with courses is');
            console.log(innerUser);
          }
        });
    }
  });
}

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
  // payload comes in the JSON form: { action: String, data: Object }
  controller.on('facebook_postback', (bot, message) => {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('facebook postback occured!');
    console.log('message');
    console.log(message);
    const payload = JSON.parse(message.payload);
    const { action, data } = payload;

    switch (action) {
      case 'watchCourse':
        alterUserCourseSubscriptions(message.user, data.course, controller, true);
        break;
      case 'removeCourse':
        alterUserCourseSubscriptions(message.user, payload.data.course, controller, false);
        break;
      case 'getSchedule':
        // retrieveUserSchedule
        // sendMsg(userSchedule)
        break;
      case 'getUpcomingHw':
        // retrieveUpcomingHw
        // sendMsg(UpcomingHw)
        break;
      case 'getAnnouncements':
        // retrieveAnnouncemnets
        // sendMsg(announcements)
        break;
      case 'help':
        // sendMsg(help)
        break;
      default:
    }
  });

  return controller;
};

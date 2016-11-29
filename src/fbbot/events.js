
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

function sendStudentSchedule (){

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
  controller.on('facebook_postback', (bot, message) => {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('Facebook Postback Occured!');

    const payload = message.payload;
    const course = payload.course;

    //console.log(message);
    console.log(payload);

    if (payload && payload.action === 'watchCourse') {
      alterUserCourseSubscriptions(message.user, course, controller, true);

    } else if (payload && payload.action === 'removeCourse') {
      alterUserCourseSubscriptions(message.user, course, controller, false);

    }else if (payload && payload === 'student_schedule'){
      console.log('Student Schedule Postback!');
      bot.reply(message, 'Here are your courses for this semester.');

    }else if (payload && payload === 'upcomming_hw'){
      console.log('Upcomming HW Postback!');
      bot.reply(message, 'Here are your upcomming HW from your classes.');

    }else if (payload && payload === ' class_announcements'){
      console.log('Class Announcements Postback!');
      bot.reply(message, 'Here are the announcements from your classes.');

    }else if (payload && payload === 'help'){
        console.log('Help Postback!');
        bot.reply(message, 'Here are some of the things you can use me for.');
    }
    });

  return controller;
};
